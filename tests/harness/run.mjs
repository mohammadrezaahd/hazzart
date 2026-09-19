/**
 * Headless integration check for the slider engine.
 *
 * jsdom has no layout, so the element metrics are stubbed on the prototype before the
 * component mounts. Everything else — the React component, the engine, the range dot —
 * is the real code from the repo, bundled with esbuild.
 */
import { JSDOM } from 'jsdom';

const VIEWPORT_WIDTH = 800;
const TRACK_WIDTH = 2400; // three slides of 800

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: 'http://localhost/projects',
});

const { window } = dom;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const problems = [];
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) problems.push(label);
};

for (const key of [
  'window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'WheelEvent',
  'PointerEvent', 'KeyboardEvent', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame',
  'CSS', 'DOMRect',
]) {
  if (window[key] !== undefined) globalThis[key] = window[key];
}
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = false;
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });

Object.defineProperties(window.HTMLElement.prototype, {
  clientWidth: { configurable: true, get() { return VIEWPORT_WIDTH; } },
  scrollWidth: {
    configurable: true,
    get() { return this.classList?.contains('reusable-slider__viewport') ? TRACK_WIDTH : VIEWPORT_WIDTH; },
  },
  offsetLeft: {
    configurable: true,
    get() {
      const index = this.getAttribute?.('data-base-index');
      return index === null || index === undefined ? 0 : Number(index) * VIEWPORT_WIDTH;
    },
  },
  offsetWidth: {
    configurable: true,
    get() {
      const index = this.getAttribute?.('data-base-index');
      return index === null || index === undefined ? TRACK_WIDTH : VIEWPORT_WIDTH;
    },
  },
  scrollLeft: {
    configurable: true,
    get() { return this.__scrollLeft ?? 0; },
    set(value) { this.__scrollLeft = value; },
  },
  getBoundingClientRect: {
    configurable: true,
    value() {
      const width = this.classList?.contains('slider-pagination__rail') ? 400 : VIEWPORT_WIDTH;
      return { left: 0, top: 0, right: width, bottom: 24, width, height: 24, x: 0, y: 0, toJSON() {} };
    },
  },
});

const { mount } = await import('./harness.mjs');
mount(document.getElementById('root'));
await sleep(120);

const main = document.querySelector('.projects-experience');
const viewport = document.querySelector('.reusable-slider__viewport');
const rail = document.querySelector('.slider-pagination__rail');
const dot = document.querySelector('.slider-pagination__dot');

check('the slider rendered three slides', document.querySelectorAll('.reusable-slider__slide').length === 3,
  `${document.querySelectorAll('.reusable-slider__slide').length} slides`);
check('the range rail exists and is subscribed', rail?.dataset.ready === 'true', `ready=${rail?.dataset.ready}`);
check('the dot is a slider role', dot?.getAttribute('role') === 'slider');
check('a bounded strip reserves no trailing room', !document.querySelector('.reusable-slider__tail'));

Object.defineProperty(viewport, 'scrollLeft', {
  configurable: true,
  get() { return this.__scrollLeft ?? 0; },
  set(value) { this.__scrollLeft = value; },
});
const wheel = deltaY => {
  const event = new window.WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true });
  main.dispatchEvent(event);
  return event;
};

viewport.__scrollLeft = 0;
const forward = wheel(160);
await sleep(420);
const afterForward = viewport.__scrollLeft;
check('a wheel gesture over the page moves the strip', forward.defaultPrevented && afterForward > 0,
  `scrollLeft=${Math.round(afterForward)} prevented=${forward.defaultPrevented}`);

const railPosition = () => Number(rail.style.getPropertyValue('--range-position') || 0);
check('the range dot tracks the strip', railPosition() > 0, `--range-position=${railPosition()}`);

wheel(160);
await sleep(420);
check('a second wheel gesture moves it further', viewport.__scrollLeft > afterForward,
  `scrollLeft=${Math.round(viewport.__scrollLeft)}`);

wheel(-3000);
await sleep(500);
check('scrolling back returns to the start', viewport.__scrollLeft === 0, `scrollLeft=${Math.round(viewport.__scrollLeft)}`);
check('the dot returns with it', railPosition() === 0, `--range-position=${railPosition()}`);

// Pushing further past the start charges the previous arrow instead of moving the strip.
for (let index = 0; index < 3; index++) wheel(-200);
await sleep(60);
const edge = document.querySelector('.projects-slider')?.dataset.edge;
check('pushing past the start opens the previous arrow', edge === 'previous', `data-edge=${edge}`);
check('the strip stays at the start while charging', viewport.__scrollLeft === 0);

// Scroll to the end and check the other side.
viewport.__scrollLeft = 0;
for (let index = 0; index < 12; index++) {
  wheel(400);
  await sleep(20);
}
await sleep(600);
check('the strip travels towards the end', viewport.__scrollLeft > 1000, `scrollLeft=${Math.round(viewport.__scrollLeft)}`);
for (let index = 0; index < 6; index++) wheel(200);
await sleep(60);
const endEdge = document.querySelector('.projects-slider')?.dataset.edge;
check('pushing past the end opens the next arrow', endEdge === 'next', `data-edge=${endEdge}`);

console.log(problems.length === 0 ? '\nALL CHECKS PASSED' : `\nFAILURES: ${problems.join(', ')}`);
process.exit(problems.length === 0 ? 0 : 1);
