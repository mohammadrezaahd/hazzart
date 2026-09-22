import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import * as motion from '../utils/motion.ts';
import * as slider from '../utils/slider.ts';
import type { SliderScrollOptions, SliderEdgeState } from '../components/Slider/useSliderScroll.ts';

type SliderHook = typeof import('../components/Slider/useSliderScroll.ts').useSliderScroll;

// Run the actual hook with deterministic layout, animation frames and effect setup.
// No browser or additional test dependencies are needed for these engine regressions.
const hookSource = ts.transpileModule(
  readFileSync(new URL('../components/Slider/useSliderScroll.ts', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
).outputText;

const paginationSource = ts.transpileModule(
  readFileSync(new URL('../components/Slider/SliderPagination.tsx', import.meta.url), 'utf8'),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } },
).outputText;

function connectPagination(engine: ReturnType<typeof createSlider>) {
  type Pointer = { pointerId: number; button: number; clientX: number; target: { closest: () => null } };
  interface RailProps {
    ref: (node: unknown) => () => void;
    onPointerDown: (event: Pointer) => void;
    onPointerMove: (event: Pointer) => void;
    onPointerUp: (event: Pointer) => void;
    onLostPointerCapture: (event: Pointer) => void;
  }
  const moduleExports: {
    SliderPagination?: (props: unknown) => { props: { children: { props: RailProps } } };
  } = {};
  runInNewContext(paginationSource, {
    exports: moduleExports,
    require(name: string) {
      if (name === '@/utils/motion') return motion;
      if (name === '@/utils/slider') return slider;
      if (name === 'react') return {
        useRef: (current: unknown) => ({ current }),
        useCallback: (callback: unknown) => callback,
        useState: (initial: unknown) => [initial, () => {}],
      };
      if (name === 'react/jsx-runtime') {
        const jsx = (type: unknown, props: unknown) => ({ type, props });
        return { jsx, jsxs: jsx };
      }
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  let releases = 0;
  let position = 0;
  const captures = new Set<number>();
  const tree = moduleExports.SliderPagination!({
    itemCount: 4,
    activeIndex: 0,
    ariaLabel: 'Test slider',
    subscribeRange: engine.api.subscribeRange,
    onScrub: (value: number) => engine.api.scrollToPosition(value, true),
    onScrubEnd: (value: number) => { releases++; engine.api.settle(value); },
    onSelect: engine.api.scrollToIndex,
  });
  const props = tree.props.children.props;
  const pointer = (clientX: number, pointerId = 1): Pointer => ({
    pointerId, clientX, button: 0, target: { closest: () => null },
  });
  const unsubscribe = props.ref({
    dataset: {},
    style: { setProperty: (_name: string, value: string) => { position = Number(value); } },
    getBoundingClientRect: () => ({ left: 0, width: 1000 }),
    setPointerCapture: (id: number) => captures.add(id),
    hasPointerCapture: (id: number) => captures.has(id),
    releasePointerCapture: (id: number) => {
      captures.delete(id);
      props.onLostPointerCapture(pointer(0, id));
    },
  });
  return { props, pointer, unsubscribe, get position() { return position; }, get releases() { return releases; } };
}

function createSlider(options: Partial<SliderScrollOptions> = {}, reducedMotion = false) {
  const effects: Array<() => void | (() => void)> = [];
  const states: unknown[] = [];
  const frames = new Map<number, FrameRequestCallback>();
  const timers = new Map<number, { at: number; callback: () => void }>();
  let nextId = 1;
  let time = 100;
  let pendingScroll = false;
  let resize = () => {};
  const config = { itemCount: 4, edgeCharge: { enabled: true }, ...options };
  const slideCount = config.itemCount * (config.infinite ? 3 : 1);
  const slides = Array.from({ length: slideCount }, (_, index) => ({ offsetLeft: index * 400, offsetWidth: 400 }));

  class Viewport extends EventTarget {
    clientWidth = 400;
    scrollWidth = slideCount * 400;
    private left = 0;
    get scrollLeft() { return this.left; }
    set scrollLeft(value: number) {
      const applied = Math.round(motion.clamp(value, 0, this.scrollWidth - this.clientWidth));
      if (this.left !== applied) pendingScroll = true;
      this.left = applied;
    }
  }
  const viewport = new Viewport();
  const mockWindow = Object.assign(new EventTarget(), {
    setTimeout(callback: () => void, delay: number) {
      const id = nextId++;
      timers.set(id, { at: time + delay, callback });
      return id;
    },
    clearTimeout(id: number) { timers.delete(id); },
  });
  const moduleExports: { useSliderScroll?: SliderHook } = {};
  runInNewContext(hookSource, {
    exports: moduleExports,
    require(name: string) {
      if (name === '@/utils/motion') return { ...motion, prefersReducedMotion: () => reducedMotion };
      if (name === '@/utils/slider') return slider;
      if (name === 'react') return {
        useRef: (current: unknown) => ({ current }),
        useCallback: (callback: unknown) => callback,
        useEffect: (effect: () => void | (() => void)) => effects.push(effect),
        useState(initial: unknown) {
          const index = states.push(initial) - 1;
          return [initial, (update: unknown) => {
            states[index] = typeof update === 'function' ? update(states[index]) : update;
          }];
        },
      };
      throw new Error(`Unexpected import: ${name}`);
    },
    window: mockWindow,
    performance: { now: () => time },
    requestAnimationFrame(callback: FrameRequestCallback) {
      const id = nextId++;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id: number) { frames.delete(id); },
    ResizeObserver: class {
      constructor(callback: () => void) { resize = callback; }
      observe() {}
      disconnect() {}
    },
  });
  const api = moduleExports.useSliderScroll!(config);
  api.scrollerRef.current = viewport as unknown as HTMLDivElement;
  api.trackRef.current = { querySelectorAll: () => slides } as unknown as HTMLDivElement;
  const cleanups = effects.map(effect => effect());

  const step = () => {
    time += 1000 / 60;
    if (pendingScroll) {
      pendingScroll = false;
      viewport.dispatchEvent(new Event('scroll'));
    }
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach(callback => callback(time));
    for (const [id, timer] of timers) {
      if (timer.at <= time) {
        timers.delete(id);
        timer.callback();
      }
    }
  };
  return {
    api, viewport, step,
    get activeIndex() { return states[0] as number; },
    get edge() { return states[1] as SliderEdgeState | null; },
    get pendingFrames() { return frames.size; },
    get pendingTimers() { return timers.size; },
    resize() { resize(); },
    wheel(deltaY: number) {
      const event = Object.assign(new Event('wheel', { cancelable: true }), {
        deltaY, deltaX: 0, deltaMode: 0, ctrlKey: false, metaKey: false,
      });
      viewport.dispatchEvent(event);
      return event;
    },
    flush() {
      let remaining = 1000;
      while ((frames.size || pendingScroll) && remaining-- > 0) step();
      assert.ok(remaining > 0, 'the animation must settle');
    },
    cleanup() { cleanups.forEach(cleanup => cleanup?.()); },
  };
}

test('scrubbing interrupts an animation and reports the accepted position immediately', () => {
  const engine = createSlider();
  engine.api.scrollToIndex(3);
  engine.step();
  engine.api.scrollToPosition(0.9, true);
  assert.equal(engine.viewport.scrollLeft, 1080);
  assert.equal(engine.api.getRange().position, 0.9);
  assert.equal(engine.pendingFrames, 0);

  const positions: number[] = [];
  engine.api.subscribeRange(range => positions.push(range.position));
  engine.api.settle(0.9);
  engine.flush();
  assert.equal(engine.viewport.scrollLeft, 1200);
  assert.ok(positions.every((position, index) => index === 0 || position >= positions[index - 1]),
    'release must not jump back to the position before the scrub');
  engine.cleanup();
});

test('the pagination dot stays in sync through dragging, release and snap frames', () => {
  const engine = createSlider();
  const pagination = connectPagination(engine);
  pagination.props.onPointerDown(pagination.pointer(100));
  pagination.props.onPointerMove(pagination.pointer(900));
  assert.equal(pagination.position, 0.9);
  assert.equal(pagination.position, engine.api.getRange().position);
  pagination.props.onPointerUp(pagination.pointer(900));
  assert.equal(pagination.releases, 1, 'releasing capture must not settle twice');
  for (let index = 0; index < 90; index++) {
    engine.step();
    assert.ok(Math.abs(pagination.position - engine.api.getRange().position) < 0.00002);
    assert.ok(pagination.position >= 0.9, 'the dot must not flicker back on release');
  }
  assert.equal(pagination.position, 1);
  pagination.unsubscribe();
  engine.cleanup();
});

test('lost pointer capture settles once and a second pointer cannot steal a scrub', () => {
  const engine = createSlider();
  const pagination = connectPagination(engine);
  pagination.props.onPointerDown(pagination.pointer(300));
  pagination.props.onPointerDown(pagination.pointer(900, 2));
  assert.equal(pagination.position, 0.3);
  pagination.props.onLostPointerCapture(pagination.pointer(300));
  pagination.props.onPointerUp(pagination.pointer(300));
  assert.equal(pagination.releases, 1);
  engine.flush();
  assert.equal(engine.viewport.scrollLeft, 400);
  pagination.unsubscribe();
  engine.cleanup();
});

test('range reporting uses the visible edge, not a pending destination', () => {
  const engine = createSlider();
  engine.api.scrollToIndex(3);
  engine.step();
  engine.step();
  assert.ok(engine.viewport.scrollLeft > 0 && engine.viewport.scrollLeft < 1198);
  assert.equal(engine.api.getRange().edge, null);
  engine.flush();
  assert.equal(engine.api.getRange().edge, 'next');
  engine.cleanup();
});

for (const direction of ['next', 'previous'] as const) {
  test(`repeated wheel input reaches ${direction} before charging the arrow`, () => {
    const engine = createSlider();
    if (direction === 'previous') engine.api.scrollToPosition(1, true);
    const delta = direction === 'next' ? 2400 : -2400;
    const destination = direction === 'next' ? 1200 : 0;
    engine.wheel(delta);
    engine.step();
    engine.wheel(delta);
    assert.equal(engine.edge, null, 'the target reaching the end must not arm the arrow');
    assert.equal(engine.pendingFrames, 1, 'wheel input must keep the animation running');
    engine.flush();
    assert.equal(engine.viewport.scrollLeft, destination);
    engine.wheel(direction === 'next' ? 30 : -30);
    assert.equal((engine.edge as SliderEdgeState | null)?.direction, direction);
    engine.cleanup();
  });
}

test('a burst of wheel events preserves the frame clock instead of restarting every frame', () => {
  const engine = createSlider();
  for (let index = 0; index < 30; index++) {
    engine.wheel(100);
    engine.step();
  }
  assert.ok(engine.viewport.scrollLeft > 1150, 'the visible track should catch up during the gesture');
  engine.cleanup();
});

test('pagination clears charge timers so an old arrow cannot pull the slider back', () => {
  const engine = createSlider();
  engine.api.scrollToPosition(1, true);
  engine.wheel(100);
  assert.equal(engine.edge?.direction, 'next');
  assert.equal(engine.pendingTimers, 1);
  engine.api.scrollToPosition(0.3, true);
  assert.equal(engine.edge, null);
  assert.equal(engine.pendingTimers, 0);
  engine.flush();
  assert.equal(engine.viewport.scrollLeft, 360);

  engine.api.scrollToPosition(1, true);
  engine.wheel(100);
  engine.api.scrollToIndex(1);
  assert.equal(engine.edge, null);
  assert.equal(engine.pendingTimers, 0);
  engine.flush();
  assert.equal(engine.viewport.scrollLeft, 400);
  engine.cleanup();
});

test('immediate index navigation updates the engine as well as the DOM', () => {
  const engine = createSlider();
  engine.api.scrollToIndex(3, true);
  assert.equal(engine.pendingFrames, 0);
  engine.flush();
  assert.equal(engine.viewport.scrollLeft, 1200);
  assert.equal(engine.activeIndex, 3);
  engine.cleanup();
});

test('reduced motion and tracks with no travel stay synchronous', () => {
  const engine = createSlider({}, true);
  engine.api.scrollToPosition(0.5);
  assert.equal(engine.viewport.scrollLeft, 600);
  assert.equal(engine.pendingFrames, 0);
  engine.cleanup();

  const fitting = createSlider({ itemCount: 1 });
  fitting.api.scrollToPosition(1, true);
  assert.equal(fitting.api.getRange().position, 0);
  assert.equal(fitting.api.getRange().edge, null);
  fitting.cleanup();
});

test('layout measurements ignore entrance-transform overflow and refresh on resize', () => {
  const engine = createSlider();
  engine.viewport.scrollWidth += 46;
  engine.resize();
  assert.equal(engine.api.getRange().max, 1200);
  engine.viewport.clientWidth = 600;
  engine.resize();
  engine.api.scrollToPosition(1, true);
  assert.equal(engine.viewport.scrollLeft, 1000);
  assert.equal(engine.api.getRange().position, 1);
  engine.cleanup();
});

test('loop pagination, snapping and active index all use the middle copy', () => {
  const engine = createSlider({ infinite: true });
  assert.equal(engine.viewport.scrollLeft, 1600);
  assert.equal(engine.api.getRange().position, 0);
  assert.equal(engine.activeIndex, 0);
  engine.api.scrollToPosition(0.5, true);
  assert.equal(engine.viewport.scrollLeft, 2400);
  assert.equal(engine.activeIndex, 2);
  assert.equal(engine.api.getRange().position, 0.5);
  assert.equal(engine.api.getRange().edge, null);
  engine.api.settle(0.75);
  engine.flush();
  assert.equal(engine.viewport.scrollLeft, 2800);
  assert.equal(engine.activeIndex, 3);
  engine.cleanup();
});

test('loop normalization moves the current position and destination together', () => {
  const engine = createSlider({ infinite: true });
  engine.wheel(-200);
  engine.flush();
  assert.equal(engine.viewport.scrollLeft, 3000);
  engine.wheel(400);
  engine.flush();
  assert.equal(engine.viewport.scrollLeft, 1800);
  assert.equal(engine.api.getRange().edge, null);
  engine.cleanup();
});


test('touch end does not start a competing snap animation', () => {
  const engine = createSlider({ infinite: true });
  engine.wheel(320);
  engine.flush();
  assert.equal(engine.pendingFrames, 0);

  const element = engine.viewport;
  element.dispatchEvent(Object.assign(new Event('pointerdown'), {
    isPrimary: true,
    pointerType: 'touch',
  }));
  element.scrollLeft = 0;
  element.dispatchEvent(new Event('scroll'));
  element.dispatchEvent(new Event('pointerup'));

  assert.equal(engine.pendingFrames, 0);
  engine.step();
  assert.equal(engine.pendingFrames, 0);
  engine.cleanup();
});

test('touch scrolling remains inside the browser-owned path until the delayed loop re-anchor', () => {
  const engine = createSlider({ infinite: true });
  engine.api.scrollToPosition(0.95, true);
  assert.equal(engine.viewport.scrollLeft, 3120);

  const element = engine.viewport;
  element.dispatchEvent(Object.assign(new Event('pointerdown'), {
    isPrimary: true,
    pointerType: 'touch',
  }));
  element.scrollLeft = 3180;
  element.dispatchEvent(new Event('scroll'));
  assert.equal(engine.viewport.scrollLeft, 3180);
  assert.equal(engine.pendingFrames, 0);

  element.dispatchEvent(new Event('pointerup'));
  engine.step();
  assert.equal(engine.pendingFrames, 0);
  engine.cleanup();
});
