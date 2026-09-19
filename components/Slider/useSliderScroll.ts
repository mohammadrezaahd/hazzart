'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { clamp, damp, prefersReducedMotion } from '@/utils/motion';
import { edgeAt, nearestSlideIndex, projectMomentum } from '@/utils/slider';

export type SliderDirection = 'previous' | 'next';
export type SliderEdge = SliderDirection | null;

export interface SliderRange {
  /** 0..1 — how far the visible window has travelled inside the scrollable range. */
  position: number;
  /** 0..1 — how much of the scrollable range the visible window covers. */
  size: number;
  /** Maximum scrollable distance in pixels (0 while the track fits the viewport). */
  max: number;
  /** Set while the window rests on one of the two ends of a bounded slider. */
  edge: SliderEdge;
  /** False until the first measurement after mount. */
  ready: boolean;
}

export interface SliderEdgeState {
  direction: SliderDirection;
  /** 0..1 — how far the visitor pushed past the end. */
  progress: number;
  /** True for the very first push of a charge session (drives the entrance animation). */
  armed: boolean;
  /** True while the release animation plays. */
  popping: boolean;
}

export interface SliderEdgeChargeConfig {
  enabled?: boolean;
  /** Wheel distance (px) that fills the ring completely. */
  distance?: number;
  /** Quiet period (ms) before an untouched charge releases by itself. */
  releaseDelay?: number;
  onCommit?: (payload: { direction: SliderDirection; progress: number }) => void;
}

export interface SliderScrollOptions {
  itemCount: number;
  infinite?: boolean;
  edgeCharge?: SliderEdgeChargeConfig;
  /** Wheel is listened for on this element instead of the scrolling viewport. */
  wheelRoot?: RefObject<HTMLElement | null>;
}

type ScrollMode = 'idle' | 'follow' | 'scrub' | 'snap' | 'drag';

const EDGE_EPSILON = 0.75;
const SETTLED_EPSILON = 0.4;
const FOLLOW_SMOOTHING = 15;
const SCRUB_SMOOTHING = 24;
const SNAP_SMOOTHING = 8.5;
const FLING_FACTOR = 0.32;
const POP_DURATION = 320;
const DEFAULT_RELEASE_DELAY = 1200;
const MAX_FRAME_SECONDS = 0.05;

/**
 * Smooth, bounded or looping scroll engine for a slider track.
 *
 * Pointer drags and touch flicks stay native — the browser owns the gesture and the
 * engine only settles the track afterwards. Everything else (wheel, keyboard, the
 * range control) is damped frame by frame so movement never jumps.
 *
 * The 60fps loop writes to the DOM and never sets React state, except for the active
 * slide index, which only changes when a slide boundary is crossed.
 */
export function useSliderScroll({
  itemCount,
  infinite = false,
  edgeCharge,
  wheelRoot,
}: SliderScrollOptions) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [edgeState, setEdgeState] = useState<SliderEdgeState | null>(null);

  const valueRef = useRef(0);
  const targetRef = useRef(0);
  const modeRef = useRef<ScrollMode>('idle');
  const loopWidthRef = useRef(0);
  const maxRef = useRef(0);
  const fractionRef = useRef<number[]>([0]);
  const destinationRef = useRef<number[]>([0]);
  const rangeRef = useRef<SliderRange>({ position: 0, size: 1, max: 0, edge: null, ready: false });
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const writingRef = useRef(false);
  const sampleRef = useRef({ value: 0, time: 0, velocity: 0 });
  const chargeRef = useRef({ direction: null as SliderDirection | null, progress: 0 });
  const popTimerRef = useRef<number | null>(null);
  const releaseTimerRef = useRef<number | null>(null);
  const listenersRef = useRef(new Set<(range: SliderRange) => void>());
  const configRef = useRef({ itemCount, infinite, edgeCharge });

  configRef.current = { itemCount, infinite, edgeCharge };

  const hasLoop = infinite && itemCount > 1;
  const canCharge = !hasLoop && itemCount > 1 && !!edgeCharge?.enabled;

  /* ------------------------------------------------------------------ *
   * Measuring
   * ------------------------------------------------------------------ */

  const measure = useCallback(() => {
    const element = scrollerRef.current;
    const track = trackRef.current;
    const count = Math.max(configRef.current.itemCount, 0);
    if (!element || !track || count === 0) {
      maxRef.current = 0;
      fractionRef.current = [0];
      destinationRef.current = [0];
      return;
    }
    const slides = Array.from(track.querySelectorAll<HTMLElement>('.reusable-slider__slide'));
    const offsets = slides.map(slide => slide.offsetLeft);

    const maximum = Math.max(0, element.scrollWidth - element.clientWidth);
    const loopWidth = hasLoop ? track.scrollWidth / 3 : 0;

    maxRef.current = maximum;
    loopWidthRef.current = loopWidth;
    fractionRef.current = Array.from({ length: count }, (_, index) => {
      if (hasLoop && loopWidth > 0) {
        const offset = offsets[count + index];
        return offset === undefined ? 0 : clamp((offset - loopWidth * 0.5) / loopWidth, 0, 1);
      }
      return maximum > 0 ? clamp((offsets[index] ?? 0) / maximum, 0, 1) : 0;
    });
    destinationRef.current = Array.from({ length: count }, (_, index) => {
      if (hasLoop && loopWidth > 0) {
        const offset = offsets[count + index];
        return offset === undefined ? loopWidth : clamp(offset, 0, maximum);
      }
      return maximum > 0 ? clamp((offsets[index] ?? 0), 0, maximum) : 0;
    });
  }, [hasLoop]);

  const nearestIndex = useCallback((position: number) => nearestSlideIndex(fractionRef.current, position), []);

  /** Keep the looping track inside its middle copy so both directions stay open. */
  const normalizeLoop = useCallback(() => {
    const width = loopWidthRef.current;
    if (!hasLoop || width <= 0) return;
    if (valueRef.current < width * 0.5) {
      valueRef.current += width;
      targetRef.current += width;
    } else if (valueRef.current > width * 1.5) {
      valueRef.current -= width;
      targetRef.current -= width;
    }
  }, [hasLoop]);

  /* ------------------------------------------------------------------ *
   * Range reporting — imperative, so the frame loop never re-renders React
   * ------------------------------------------------------------------ */

  const emitRange = useCallback(() => {
    const element = scrollerRef.current;
    if (!element) return;
    const maximum = maxRef.current;
    const width = loopWidthRef.current;
    const looping = hasLoop && width > 0;
    const span = looping ? width : maximum;
    const origin = looping ? width * 0.5 : 0;
    const next: SliderRange = !element || span <= 0
      ? { position: 0, size: 1, max: 0, edge: null, ready: true }
      : {
        position: clamp((element.scrollLeft - origin) / span, 0, 1),
        size: clamp(element.clientWidth / (looping ? element.scrollWidth / 3 : element.scrollWidth), 0.06, 1),
        max: maximum,
        edge: edgeAt(targetRef.current, maximum, EDGE_EPSILON),
        ready: true,
      };
    const previous = rangeRef.current;
    rangeRef.current = next;
    if (
      previous.ready !== next.ready
      || previous.edge !== next.edge
      || Math.abs(previous.position - next.position) > 0.0004
      || Math.abs(previous.size - next.size) > 0.0004
      || Math.abs(previous.max - next.max) > 0.5
    ) {
      listenersRef.current.forEach(listener => listener(next));
    }
  }, [hasLoop]);

  const subscribeRange = useCallback((listener: (range: SliderRange) => void) => {
    listenersRef.current.add(listener);
    listener(rangeRef.current);
    return () => { listenersRef.current.delete(listener); };
  }, []);

  const getRange = useCallback(() => rangeRef.current, []);

  /* ------------------------------------------------------------------ *
   * Writing scroll positions
   * ------------------------------------------------------------------ */

  const write = useCallback((value: number) => {
    const element = scrollerRef.current;
    if (!element) return;
    writingRef.current = true;
    element.scrollLeft = value;
    writingRef.current = false;
  }, []);

  /* ------------------------------------------------------------------ *
   * The animation loop
   * ------------------------------------------------------------------ */

  const stopFrame = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const reportIndex = useCallback((value: number) => {
    if (configRef.current.itemCount <= 0) return;
    const maximum = maxRef.current;
    const position = maximum > 0 ? clamp(value / maximum, 0, 1) : 0;
    const index = nearestIndex(position);
    setActiveIndex(previous => (previous === index ? previous : index));
  }, [nearestIndex]);

  const frame = useCallback((time: number) => {
    const element = scrollerRef.current;
    if (!element) { frameRef.current = null; return; }
    const deltaSeconds = clamp((time - (lastFrameRef.current || time)) / 1000, 0.001, MAX_FRAME_SECONDS);
    lastFrameRef.current = time;
    const mode = modeRef.current;

    if (mode === 'follow' || mode === 'scrub' || mode === 'snap') {
      const smoothing = mode === 'snap' ? SNAP_SMOOTHING : mode === 'scrub' ? SCRUB_SMOOTHING : FOLLOW_SMOOTHING;
      const next = damp(valueRef.current, targetRef.current, smoothing, deltaSeconds);
      valueRef.current = Math.abs(targetRef.current - next) < SETTLED_EPSILON ? targetRef.current : next;
      normalizeLoop();
      write(valueRef.current);
      emitRange();
      reportIndex(valueRef.current);
      if (Math.abs(targetRef.current - valueRef.current) > SETTLED_EPSILON) {
        frameRef.current = requestAnimationFrame(frame);
        return;
      }
    }

    frameRef.current = null;
    if (mode !== 'drag') modeRef.current = 'idle';
    emitRange();
    reportIndex(mode === 'drag' ? element.scrollLeft : valueRef.current);
  }, [emitRange, normalizeLoop, reportIndex, write]);

  const startFrame = useCallback(() => {
    if (frameRef.current !== null) return;
    lastFrameRef.current = 0;
    frameRef.current = requestAnimationFrame(frame);
  }, [frame]);

  /* ------------------------------------------------------------------ *
   * Navigating
   * ------------------------------------------------------------------ */

  const applyImmediate = useCallback((destination: number) => {
    valueRef.current = destination;
    targetRef.current = destination;
    normalizeLoop();
    write(valueRef.current);
    emitRange();
    reportIndex(valueRef.current);
  }, [emitRange, normalizeLoop, reportIndex, write]);

  const scrollToIndex = useCallback((index: number, immediate = false) => {
    const count = Math.max(configRef.current.itemCount, 0);
    if (count === 0) return;
    const safeIndex = clamp(Math.round(index), 0, count - 1);
    const destination = destinationRef.current[safeIndex] ?? 0;
    if (prefersReducedMotion() || maxRef.current <= 0) {
      modeRef.current = 'idle';
      applyImmediate(destination);
      setActiveIndex(safeIndex);
      return;
    }
    targetRef.current = destination;
    if (immediate) {
      valueRef.current = destination;
      write(valueRef.current);
    }
    modeRef.current = 'snap';
    startFrame();
  }, [applyImmediate, startFrame, write]);

  /** Follow a continuous position (0..1) — used while the range control is dragged. */
  const scrollToPosition = useCallback((position: number, immediate = false) => {
    const destination = clamp(position, 0, 1) * maxRef.current;
    if (prefersReducedMotion() || immediate || maxRef.current <= 0) {
      modeRef.current = 'idle';
      applyImmediate(destination);
      return;
    }
    targetRef.current = destination;
    modeRef.current = 'scrub';
    startFrame();
  }, [applyImmediate, startFrame]);

  /** Snap to the slide closest to a position (0..1, defaults to where the visitor aimed). */
  const settle = useCallback((position?: number) => {
    if (maxRef.current <= 0) return;
    const maximum = maxRef.current;
    const reference = position === undefined ? targetRef.current / maximum : clamp(position, 0, 1);
    scrollToIndex(nearestIndex(reference));
  }, [nearestIndex, scrollToIndex]);

  /** Move one or more slides from the position the visitor last aimed at. */
  const nudge = useCallback((direction: SliderDirection, slides = 1) => {
    if (maxRef.current <= 0 || configRef.current.itemCount === 0) return;
    const count = configRef.current.itemCount;
    const fractions = fractionRef.current;
    const reference = clamp(targetRef.current / maxRef.current, 0, 1);
    const current = nearestIndex(reference);
    const atFirst = reference <= (fractions[0] ?? 0) + 1e-6;
    const atLast = reference >= (fractions[count - 1] ?? 1) - 1e-6;
    let next = current + (direction === 'next' ? slides : -slides);
    if (direction === 'previous' && atFirst) next = hasLoop ? count - 1 : 0;
    if (direction === 'next' && atLast) next = hasLoop ? 0 : count - 1;
    scrollToIndex(clamp(next, 0, count - 1));
  }, [hasLoop, nearestIndex, scrollToIndex]);

  /* ------------------------------------------------------------------ *
   * Edge charge — pushing past an end of a bounded slider opens the space
   * ------------------------------------------------------------------ */

  const clearTimers = useCallback(() => {
    if (popTimerRef.current !== null) { window.clearTimeout(popTimerRef.current); popTimerRef.current = null; }
    if (releaseTimerRef.current !== null) { window.clearTimeout(releaseTimerRef.current); releaseTimerRef.current = null; }
  }, []);

  const resetCharge = useCallback(() => {
    clearTimers();
    chargeRef.current = { direction: null, progress: 0 };
    setEdgeState(previous => (previous === null ? previous : null));
  }, [clearTimers]);

  /** Play the release animation, then close the space and re-anchor on the last slide. */
  const releaseCharge = useCallback((direction: SliderDirection) => {
    clearTimers();
    const progress = chargeRef.current.progress;
    configRef.current.edgeCharge?.onCommit?.({ direction, progress });
    setEdgeState({ direction, progress: 1, armed: false, popping: true });
    popTimerRef.current = window.setTimeout(() => {
      popTimerRef.current = null;
      chargeRef.current = { direction: null, progress: 0 };
      setEdgeState(null);
      const maximum = maxRef.current;
      if (maximum > 0) {
        const destination = direction === 'next' ? maximum : 0;
        targetRef.current = destination;
        valueRef.current = clamp(valueRef.current, 0, maximum);
        modeRef.current = 'snap';
        startFrame();
      }
    }, POP_DURATION);
  }, [clearTimers, startFrame]);

  const scheduleRelease = useCallback((direction: SliderDirection) => {
    const delay = Math.max(120, configRef.current.edgeCharge?.releaseDelay ?? DEFAULT_RELEASE_DELAY);
    if (releaseTimerRef.current !== null) window.clearTimeout(releaseTimerRef.current);
    releaseTimerRef.current = window.setTimeout(() => {
      releaseTimerRef.current = null;
      if (chargeRef.current.direction === direction && chargeRef.current.progress > 0) releaseCharge(direction);
    }, delay);
  }, [releaseCharge]);

  const chargeEdge = useCallback((direction: SliderDirection, magnitude: number) => {
    clearTimers();
    const distance = Math.max(80, configRef.current.edgeCharge?.distance ?? 720);
    const sameDirection = chargeRef.current.direction === direction;
    const progress = clamp((sameDirection ? chargeRef.current.progress : 0) + magnitude / distance, 0, 1);
    const armed = !sameDirection || chargeRef.current.progress <= 0;
    chargeRef.current = { direction, progress };
    setEdgeState({ direction, progress, armed, popping: false });
    if (progress >= 1) releaseCharge(direction);
    else scheduleRelease(direction);
  }, [clearTimers, releaseCharge, scheduleRelease]);

  /** A new gesture drops any charge without the release animation. */
  const dropCharge = useCallback(() => {
    if (chargeRef.current.direction === null) return;
    resetCharge();
  }, [resetCharge]);

  /** Keep the space open while the visitor is aiming at the arrow. */
  const holdCharge = useCallback(() => {
    if (releaseTimerRef.current !== null) { window.clearTimeout(releaseTimerRef.current); releaseTimerRef.current = null; }
  }, []);

  const resumeCharge = useCallback(() => {
    const direction = chargeRef.current.direction;
    if (!direction || chargeRef.current.progress <= 0) return;
    scheduleRelease(direction);
  }, [scheduleRelease]);

  /* ------------------------------------------------------------------ *
   * Native gesture + wheel integration
   * ------------------------------------------------------------------ */

  useEffect(() => {
    const element = scrollerRef.current;
    if (!element || itemCount === 0) return;
    const wheelTarget: HTMLElement = wheelRoot?.current ?? element;

    let pointerActive = false;

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      const maximum = maxRef.current;
      if (maximum <= 0) return;
      const dominant = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!dominant) return;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1;
      const delta = dominant * unit;

      stopFrame();
      if (hasLoop) {
        event.preventDefault();
        targetRef.current += delta;
        normalizeLoop();
      } else {
        const next = clamp(targetRef.current + delta, 0, maximum);
        if (next === targetRef.current) {
          const direction: SliderDirection = delta > 0 ? 'next' : 'previous';
          const atEnd = direction === 'next'
            ? targetRef.current >= maximum - EDGE_EPSILON
            : targetRef.current <= EDGE_EPSILON;
          if (canCharge && atEnd) {
            event.preventDefault();
            chargeEdge(direction, Math.abs(delta));
          }
          return;
        }
        dropCharge();
        event.preventDefault();
        targetRef.current = next;
      }

      if (prefersReducedMotion()) {
        applyImmediate(targetRef.current);
        return;
      }
      modeRef.current = 'follow';
      startFrame();
    };

    const onPointerDown = () => {
      pointerActive = true;
      stopFrame();
      dropCharge();
      modeRef.current = 'drag';
      const now = performance.now();
      sampleRef.current = { value: element.scrollLeft, time: now, velocity: 0 };
      valueRef.current = element.scrollLeft;
      targetRef.current = element.scrollLeft;
    };

    const onPointerUp = () => {
      if (!pointerActive) return;
      pointerActive = false;
      const velocity = sampleRef.current.velocity;
      const maximum = maxRef.current;
      if (prefersReducedMotion() || maximum <= 0) {
        modeRef.current = 'idle';
        applyImmediate(clamp(element.scrollLeft, 0, Math.max(maximum, 0)));
        return;
      }
      const projected = projectMomentum(element.scrollLeft, velocity, maximum, FLING_FACTOR);
      targetRef.current = destinationRef.current[nearestIndex(maximum > 0 ? projected / maximum : 0)] ?? 0;
      modeRef.current = 'snap';
      startFrame();
    };

    const onScroll = () => {
      if (writingRef.current) return;
      if (modeRef.current === 'drag') {
        const now = performance.now();
        const value = element.scrollLeft;
        const elapsed = Math.max((now - sampleRef.current.time) / 1000, 0.008);
        const instant = (value - sampleRef.current.value) / elapsed;
        sampleRef.current = { value, time: now, velocity: sampleRef.current.velocity * 0.55 + instant * 0.45 };
        valueRef.current = value;
        targetRef.current = value;
        normalizeLoop();
        emitRange();
        reportIndex(value);
        return;
      }
      if (modeRef.current !== 'idle') return;
      // Scroll the engine did not start (browser find, keyboard scroll, touch flick).
      valueRef.current = element.scrollLeft;
      targetRef.current = valueRef.current;
      normalizeLoop();
      emitRange();
      reportIndex(valueRef.current);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      nudge(event.key === 'ArrowLeft' ? 'previous' : 'next');
    };

    wheelTarget.addEventListener('wheel', onWheel, { passive: false });
    element.addEventListener('pointerdown', onPointerDown);
    element.addEventListener('pointerup', onPointerUp);
    element.addEventListener('pointercancel', onPointerUp);
    element.addEventListener('scroll', onScroll, { passive: true });
    element.addEventListener('keydown', onKeyDown);
    return () => {
      wheelTarget.removeEventListener('wheel', onWheel);
      element.removeEventListener('pointerdown', onPointerDown);
      element.removeEventListener('pointerup', onPointerUp);
      element.removeEventListener('pointercancel', onPointerUp);
      element.removeEventListener('scroll', onScroll);
      element.removeEventListener('keydown', onKeyDown);
    };
  }, [
    applyImmediate,
    canCharge,
    chargeEdge,
    dropCharge,
    emitRange,
    hasLoop,
    itemCount,
    nearestIndex,
    normalizeLoop,
    nudge,
    reportIndex,
    startFrame,
    stopFrame,
    wheelRoot,
  ]);

  /* ------------------------------------------------------------------ *
   * Setup, resize and cleanup
   * ------------------------------------------------------------------ */

  const reinit = useCallback(() => {
    const element = scrollerRef.current;
    const track = trackRef.current;
    if (!element || !track) return;
    const previousLoopWidth = loopWidthRef.current;
    measure();
    if (hasLoop && loopWidthRef.current > 0) {
      const width = loopWidthRef.current;
      const position = previousLoopWidth > 0 ? valueRef.current - previousLoopWidth : valueRef.current;
      valueRef.current = width + clamp(position, -width * 0.5, width * 0.5);
      targetRef.current = valueRef.current;
      write(valueRef.current);
    } else {
      valueRef.current = clamp(element.scrollLeft, 0, maxRef.current);
      targetRef.current = clamp(targetRef.current, 0, maxRef.current);
    }
    emitRange();
    reportIndex(valueRef.current);
  }, [emitRange, hasLoop, measure, reportIndex, write]);

  useEffect(() => {
    reinit();
    const element = scrollerRef.current;
    const track = trackRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => { reinit(); });
    observer.observe(element);
    if (track) observer.observe(track);
    const onLoad = () => reinit();
    window.addEventListener('load', onLoad);
    return () => {
      observer.disconnect();
      window.removeEventListener('load', onLoad);
    };
  }, [itemCount, reinit]);

  useEffect(() => () => {
    stopFrame();
    clearTimers();
    listenersRef.current.clear();
  }, [clearTimers, stopFrame]);

  useEffect(() => {
    if (activeIndex <= itemCount - 1) return;
    setActiveIndex(Math.max(0, itemCount - 1));
  }, [activeIndex, itemCount]);

  const popEdge = useCallback((direction: SliderDirection) => {
    if (!canCharge) return;
    releaseCharge(direction);
  }, [canCharge, releaseCharge]);

  return {
    scrollerRef,
    trackRef,
    activeIndex,
    edgeState,
    canCharge,
    hasLoop,
    getRange,
    subscribeRange,
    scrollToIndex,
    scrollToPosition,
    settle,
    nudge,
    nearestIndex,
    popEdge,
    dropCharge,
    holdCharge,
    resumeCharge,
  };
}
