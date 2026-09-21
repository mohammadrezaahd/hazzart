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

const EDGE_EPSILON = 2;
/** Below this a scroll offset counts as applied: the element rounds to device pixels. */
const CLAMP_EPSILON = 0.75;
/** Listeners are told about any change above this — one style write per frame. */
const RANGE_EPSILON = 0.00002;
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
  /** The offset the element last accepted — it rounds to whole pixels. */
  const appliedRef = useRef(0);
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

    // The travel is read from the layout boxes rather than `scrollWidth`: a slide
    // translated by the entrance animation inflates the scrollable area for a moment,
    // and a measurement taken then would leave the end of the strip unreachable.
    const last = slides[slides.length - 1];
    const laidOutEnd = last ? last.offsetLeft + last.offsetWidth : 0;
    const contentWidth = laidOutEnd > 0 ? laidOutEnd : element.scrollWidth;
    // The element's own travel is the honest limit, but a transformed slide inflates
    // scrollWidth for the length of the entrance animation, so the layout boxes decide
    // the width and the element can only ever take away from it, never add.
    const layoutMax = Math.max(0, Math.round(contentWidth) - element.clientWidth);
    const scrollMax = Math.max(0, element.scrollWidth - element.clientWidth);
    const maximum = Math.min(layoutMax, scrollMax);
    const loopWidth = hasLoop ? Math.max((offsets[count] ?? 0) - (offsets[0] ?? 0), 1) : 0;

    maxRef.current = hasLoop ? Math.max(maximum, loopWidth) : maximum;
    loopWidthRef.current = loopWidth;
    fractionRef.current = Array.from({ length: count }, (_, index) => {
      if (hasLoop && loopWidth > 0) {
        const offset = offsets[count + index];
        return offset === undefined ? 0 : clamp((offset - loopWidth) / loopWidth, 0, 1);
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

  // Pagination, active-index reporting and snapping must use the same coordinates.
  // A loop's range is one copy, not the entire three-copy scrollable track.
  const rangePosition = useCallback((value: number) => {
    const width = hasLoop ? loopWidthRef.current : 0;
    const span = width || maxRef.current;
    return span > 0 ? clamp((value - width) / span, 0, 1) : 0;
  }, [hasLoop]);

  /** Keep the looping track inside its middle copy so both directions stay open. */
  const normalizeLoop = useCallback(() => {
    const width = loopWidthRef.current;
    if (!hasLoop || width <= 0) return;
    if (valueRef.current < width || valueRef.current > width * 2) {
      const shift = Math.floor((valueRef.current - width) / width) * width;
      valueRef.current -= shift;
      targetRef.current -= shift;
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
    const next: SliderRange = !element || span <= 0
      ? { position: 0, size: 1, max: 0, edge: null, ready: true }
      : {
        position: rangePosition(element.scrollLeft),
        size: clamp(element.clientWidth / (looping ? element.scrollWidth / 3 : element.scrollWidth), 0.06, 1),
        max: maximum,
        edge: looping ? null : edgeAt(element.scrollLeft, maximum, EDGE_EPSILON),
        ready: true,
      };
    const previous = rangeRef.current;
    rangeRef.current = next;
    if (
      previous.ready !== next.ready
      || previous.edge !== next.edge
      || Math.abs(previous.position - next.position) > RANGE_EPSILON
      || Math.abs(previous.size - next.size) > RANGE_EPSILON
      || Math.abs(previous.max - next.max) > 0.5
    ) {
      listenersRef.current.forEach(listener => listener(next));
    }
  }, [hasLoop, rangePosition]);

  const subscribeRange = useCallback((listener: (range: SliderRange) => void) => {
    listenersRef.current.add(listener);
    listener(rangeRef.current);
    return () => { listenersRef.current.delete(listener); };
  }, []);

  const getRange = useCallback(() => rangeRef.current, []);

  /* ------------------------------------------------------------------ *
   * Writing scroll positions
   * ------------------------------------------------------------------ */

  /**
   * Writes a scroll position and returns the one the element actually took.
   *
   * The element clamps to the range it really has, which can be shorter than the engine
   * assumes (fonts and images settle after the first measurement), so the value that
   * comes back — not the one requested — is the truth the caller should keep.
   */
  const write = useCallback((value: number) => {
    const element = scrollerRef.current;
    if (!element) return value;
    writingRef.current = true;
    element.scrollLeft = value;
    writingRef.current = false;
    return element.scrollLeft;
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
    const index = nearestIndex(rangePosition(value));
    setActiveIndex(previous => (previous === index ? previous : index));
  }, [nearestIndex, rangePosition]);

  const frame = useCallback((time: number) => {
    const element = scrollerRef.current;
    if (!element) { frameRef.current = null; return; }
    const deltaSeconds = clamp((time - (lastFrameRef.current || time)) / 1000, 0.001, MAX_FRAME_SECONDS);
    lastFrameRef.current = time;
    const mode = modeRef.current;

    if (mode === 'follow' || mode === 'scrub' || mode === 'snap') {
      const smoothing = mode === 'snap' ? SNAP_SMOOTHING : mode === 'scrub' ? SCRUB_SMOOTHING : FOLLOW_SMOOTHING;
      const next = damp(valueRef.current, targetRef.current, smoothing, deltaSeconds);
      const wanted = Math.abs(targetRef.current - next) < SETTLED_EPSILON ? targetRef.current : next;
      valueRef.current = wanted;
      normalizeLoop();
      const normalized = valueRef.current;
      const applied = write(normalized);
      // A whole frame of movement that changed nothing means the element has run out of
      // room — it rounds offsets to whole pixels and stops at its own end. Only then is
      // the target pulled back; sub-pixel rounding must never stall the approach.
      const outOfRoom = Math.abs(applied - normalized) > CLAMP_EPSILON
        && Math.abs(applied - appliedRef.current) < 0.01;
      if (outOfRoom) {
        valueRef.current = applied;
        targetRef.current = applied;
      }
      appliedRef.current = applied;
      emitRange();
      reportIndex(applied);
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

  const clearTimers = useCallback(() => {
    if (popTimerRef.current !== null) { window.clearTimeout(popTimerRef.current); popTimerRef.current = null; }
    if (releaseTimerRef.current !== null) { window.clearTimeout(releaseTimerRef.current); releaseTimerRef.current = null; }
  }, []);

  const resetCharge = useCallback(() => {
    clearTimers();
    chargeRef.current = { direction: null, progress: 0 };
    setEdgeState(previous => (previous === null ? previous : null));
  }, [clearTimers]);

  /* ------------------------------------------------------------------ *
   * Navigating
   * ------------------------------------------------------------------ */

  const applyImmediate = useCallback((destination: number) => {
    valueRef.current = destination;
    targetRef.current = destination;
    normalizeLoop();
    appliedRef.current = write(valueRef.current);
    if (Math.abs(appliedRef.current - valueRef.current) > CLAMP_EPSILON) {
      valueRef.current = appliedRef.current;
      targetRef.current = appliedRef.current;
    }
    emitRange();
    reportIndex(valueRef.current);
  }, [emitRange, normalizeLoop, reportIndex, write]);

  const scrollToIndex = useCallback((index: number, immediate = false) => {
    const count = Math.max(configRef.current.itemCount, 0);
    if (count === 0) return;
    resetCharge();
    const safeIndex = clamp(Math.round(index), 0, count - 1);
    const destination = destinationRef.current[safeIndex] ?? 0;
    if (prefersReducedMotion() || immediate || (!hasLoop && maxRef.current <= 0)) {
      stopFrame();
      modeRef.current = 'idle';
      applyImmediate(destination);
      setActiveIndex(safeIndex);
      return;
    }
    targetRef.current = destination;
    modeRef.current = 'snap';
    startFrame();
  }, [applyImmediate, hasLoop, resetCharge, startFrame, stopFrame]);

  /** Follow a continuous position (0..1) — used while the range control is dragged. */
  const scrollToPosition = useCallback((position: number, immediate = false) => {
    resetCharge();
    const width = hasLoop ? loopWidthRef.current : 0;
    const destination = width + clamp(position, 0, 1) * (width || maxRef.current);
    if (prefersReducedMotion() || immediate || (!hasLoop && maxRef.current <= 0)) {
      stopFrame();
      modeRef.current = 'idle';
      applyImmediate(destination);
      return;
    }
    targetRef.current = destination;
    modeRef.current = 'scrub';
    startFrame();
  }, [applyImmediate, hasLoop, resetCharge, startFrame, stopFrame]);

  /** Snap to the slide closest to a position (0..1, defaults to where the visitor aimed). */
  const settle = useCallback((position?: number) => {
    if (!hasLoop && maxRef.current <= 0) return;
    const reference = position === undefined ? rangePosition(targetRef.current) : clamp(position, 0, 1);
    scrollToIndex(nearestIndex(reference));
  }, [hasLoop, nearestIndex, rangePosition, scrollToIndex]);

  /** Move one or more slides from the position the visitor last aimed at. */
  const nudge = useCallback((direction: SliderDirection, slides = 1) => {
    if (configRef.current.itemCount === 0) return;
    if (!hasLoop && maxRef.current <= 0) return;
    const count = configRef.current.itemCount;
    const reference = rangePosition(targetRef.current);
    const current = nearestIndex(reference);

    if (hasLoop) {
      const delta = direction === 'next' ? slides : -slides;
      const next = (current + delta + count) % count;
      scrollToIndex(next);
      return;
    }

    const fractions = fractionRef.current;
    const atFirst = reference <= (fractions[0] ?? 0) + 1e-6;
    const atLast = reference >= (fractions[count - 1] ?? 1) - 1e-6;
    let next = current + (direction === 'next' ? slides : -slides);
    if (direction === 'previous' && atFirst) next = 0;
    if (direction === 'next' && atLast) next = count - 1;
    scrollToIndex(clamp(next, 0, count - 1));
  }, [hasLoop, nearestIndex, rangePosition, scrollToIndex]);

  /* ------------------------------------------------------------------ *
   * Edge charge — pushing past an end of a bounded slider opens the space
   * ------------------------------------------------------------------ */

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
    let isTouchGesture = false;
    let lastTouchX = 0;
    let scrollEndTimer: number | null = null;

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      const maximum = maxRef.current;
      if (!hasLoop && maximum <= 0) return;
      const dominant = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!dominant) return;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1;
      const delta = dominant * unit;

      if (hasLoop) {
        event.preventDefault();
        targetRef.current += delta;
        normalizeLoop();
      } else {
        const direction: SliderDirection = delta > 0 ? 'next' : 'previous';
        const limit = direction === 'next' ? maximum : 0;
        if (Math.abs(limit - element.scrollLeft) <= EDGE_EPSILON
          && Math.abs(limit - targetRef.current) <= EDGE_EPSILON) {
          // No room left in this direction: open the space for the matching arrow.
          if (canCharge) {
            event.preventDefault();
            chargeEdge(direction, Math.abs(delta));
          }
          return;
        }
        dropCharge();
        event.preventDefault();
        targetRef.current = clamp(targetRef.current + delta, 0, maximum);
      }

      if (prefersReducedMotion()) {
        stopFrame();
        modeRef.current = 'idle';
        applyImmediate(targetRef.current);
        return;
      }
      modeRef.current = 'follow';
      startFrame();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!event.isPrimary) return;
      isTouchGesture = event.pointerType === 'touch';
      if (scrollEndTimer !== null) { window.clearTimeout(scrollEndTimer); scrollEndTimer = null; }
      pointerActive = true;
      stopFrame();
      dropCharge();
      modeRef.current = 'drag';
      const now = performance.now();
      sampleRef.current = { value: element.scrollLeft, time: now, velocity: 0 };
      valueRef.current = element.scrollLeft;
      targetRef.current = element.scrollLeft;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      lastTouchX = e.touches[0].clientX;
    };

    // touchmove fires even after the browser issues pointercancel for a native
    // scroll gesture — the only reliable edge-charge source on mobile.
    const onTouchMove = (e: TouchEvent) => {
      if (!canCharge || hasLoop || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - lastTouchX;
      lastTouchX = e.touches[0].clientX;
      if (Math.abs(deltaX) < 0.5) return;
      const maximum = maxRef.current;
      if (maximum <= 0) return;
      const direction: SliderDirection = deltaX < 0 ? 'next' : 'previous';
      const limit = direction === 'next' ? maximum : 0;
      if (Math.abs(limit - element.scrollLeft) <= EDGE_EPSILON) {
        chargeEdge(direction, Math.abs(deltaX) * 4);
      }
    };

    const onPointerUp = () => {
      if (!pointerActive) return;
      pointerActive = false;
      if (isTouchGesture) {
        // Mobile touch is browser-owned. Do not start a JS snap here; Chrome/Safari
        // may still have inertial scroll in flight and a competing tween causes the
        // visible flicker at the ends.
        modeRef.current = 'idle';
        isTouchGesture = false;
        return;
      }
      const velocity = sampleRef.current.velocity;
      const maximum = maxRef.current;
      if (prefersReducedMotion() || (!hasLoop && maximum <= 0)) {
        modeRef.current = 'idle';
        applyImmediate(clamp(element.scrollLeft, 0, Math.max(maximum, 0)));
        return;
      }
      const projected = projectMomentum(element.scrollLeft, velocity, maximum, FLING_FACTOR);
      targetRef.current = destinationRef.current[nearestIndex(rangePosition(projected))] ?? 0;
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
        // Don't write normalizeLoop during native touch scroll — it cancels momentum.
        if (!isTouchGesture) {
          normalizeLoop();
          if (valueRef.current !== value) {
            appliedRef.current = write(valueRef.current);
            sampleRef.current.value = appliedRef.current;
          }
        }
        emitRange();
        reportIndex(element.scrollLeft);
        return;
      }
      if (modeRef.current !== 'idle') return;
      valueRef.current = element.scrollLeft;
      targetRef.current = valueRef.current;
      emitRange();
      reportIndex(valueRef.current);
      // After touch momentum settles, snap or re-anchor.
      if (isTouchGesture) {
        if (scrollEndTimer !== null) window.clearTimeout(scrollEndTimer);
        scrollEndTimer = window.setTimeout(() => {
          scrollEndTimer = null;
          if (hasLoop) {
            const width = loopWidthRef.current;
            if (width <= 0) return;
            const raw = element.scrollLeft;
            const normalized = width + ((raw - width) % width + width) % width;
            // Re-anchor only when we are actually outside the middle copy. This is a
            // single atomic write after momentum, so the user never sees a tween jump.
            if (raw < width - EDGE_EPSILON || raw > width * 2 + EDGE_EPSILON) {
              applyImmediate(normalized);
            }
            valueRef.current = element.scrollLeft;
            targetRef.current = element.scrollLeft;
          } else {
            // Keep the final finger position; snapping is only needed when the browser
            // has genuinely stopped between items, not while the user is still settling.
            valueRef.current = element.scrollLeft;
            targetRef.current = element.scrollLeft;
            emitRange();
            reportIndex(valueRef.current);
          }
        }, 120);
      }
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
    element.addEventListener('touchstart', onTouchStart, { passive: true });
    element.addEventListener('touchmove', onTouchMove, { passive: true });
    element.addEventListener('scroll', onScroll, { passive: true });
    element.addEventListener('keydown', onKeyDown);
    return () => {
      if (scrollEndTimer !== null) window.clearTimeout(scrollEndTimer);
      wheelTarget.removeEventListener('wheel', onWheel);
      element.removeEventListener('pointerdown', onPointerDown);
      element.removeEventListener('pointerup', onPointerUp);
      element.removeEventListener('pointercancel', onPointerUp);
      element.removeEventListener('touchstart', onTouchStart);
      element.removeEventListener('touchmove', onTouchMove);
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
    rangePosition,
    reportIndex,
    startFrame,
    stopFrame,
    wheelRoot,
    write,
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
      valueRef.current = width + clamp(position, 0, width);
      targetRef.current = valueRef.current;
      appliedRef.current = write(valueRef.current);
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
