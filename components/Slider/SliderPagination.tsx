'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { clamp, damp, prefersReducedMotion } from '@/utils/motion';
import { thumbGeometry } from '@/utils/slider';
import type { SliderRange } from './useSliderScroll';

export interface SliderPaginationProps {
  /** Number of slides — one page cell per slide. */
  itemCount: number;
  activeIndex: number;
  /** Follows the scroll position frame by frame without re-rendering React. */
  subscribeRange: (listener: (range: SliderRange) => void) => () => void;
  /** Continuous position (0..1) while the visitor drags the control. */
  onScrub: (position: number) => void;
  /** Final position (0..1) when the visitor lets go — the slider settles on a slide. */
  onScrubEnd: (position: number) => void;
  /** Discrete move, used by the keyboard. */
  onSelect: (index: number) => void;
  getItemLabel?: (index: number) => string;
  ariaLabel: string;
}

const FOLLOWER_SMOOTHING = 18;
const FOLLOWER_EPSILON = 0.0004;

/**
 * The range control under the slider: one cell per slide, plus a thumb whose width
 * mirrors how much of the track is visible. It is the slider's pagination, so it
 * follows the scroll position on every frame and can be dragged to move the track.
 *
 * The thumb is painted from a rAF follower instead of React state, which keeps the
 * 60fps loop out of the render cycle and gives the control a soft, continuous feel.
 */
export function SliderPagination({
  itemCount,
  activeIndex,
  subscribeRange,
  onScrub,
  onScrubEnd,
  onSelect,
  getItemLabel,
  ariaLabel,
}: SliderPaginationProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; offset: number; last: number } | null>(null);
  const thumbCenterRef = useRef(0);
  const targetRef = useRef({ start: 0, size: 1 });
  const currentRef = useRef({ start: 0, size: 1 });
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const startedRef = useRef(false);
  const [scrubbing, setScrubbing] = useState(false);

  const paint = useCallback((values: { start: number; size: number }) => {
    const rail = railRef.current;
    if (!rail) return;
    const { start, size } = thumbGeometry(values.start, values.size);
    rail.style.setProperty('--thumb-size', `${(size * 100).toFixed(4)}%`);
    rail.style.setProperty('--thumb-start', `${(start * 100).toFixed(4)}%`);
    thumbCenterRef.current = start + size / 2;
  }, []);

  const step = useCallback((time: number) => {
    const target = targetRef.current;
    const current = currentRef.current;
    const deltaSeconds = clamp((time - (lastFrameRef.current || time)) / 1000, 0.001, 0.05);
    lastFrameRef.current = time;
    current.start = damp(current.start, target.start, FOLLOWER_SMOOTHING, deltaSeconds);
    current.size = damp(current.size, target.size, FOLLOWER_SMOOTHING, deltaSeconds);
    const settled = Math.abs(target.start - current.start) < FOLLOWER_EPSILON
      && Math.abs(target.size - current.size) < FOLLOWER_EPSILON;
    if (settled) {
      current.start = target.start;
      current.size = target.size;
    }
    paint(current);
    if (settled) { frameRef.current = null; return; }
    frameRef.current = requestAnimationFrame(step);
  }, [paint]);

  const writeRange = useCallback((range: SliderRange) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.dataset.ready = range.ready ? 'true' : 'false';
    targetRef.current = thumbGeometry(range.start, range.size);
    if (!startedRef.current || prefersReducedMotion()) {
      startedRef.current = true;
      currentRef.current = { ...targetRef.current };
      paint(currentRef.current);
      return;
    }
    if (frameRef.current === null) {
      lastFrameRef.current = 0;
      frameRef.current = requestAnimationFrame(step);
    }
  }, [paint, step]);

  // Callback ref: subscribe for the whole lifetime of the rail. Positions are written
  // as percentages, so a resize needs no extra bookkeeping here.
  const subscribeRef = useCallback((node: HTMLDivElement | null) => {
    railRef.current = node;
    if (!node) return undefined;
    return subscribeRange(writeRange);
  }, [subscribeRange, writeRange]);

  useEffect(() => () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }, []);

  const positionFromClientX = useCallback((clientX: number) => {
    const rail = railRef.current;
    if (!rail) return 0;
    const rect = rail.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    return clamp((clientX - rect.left) / rect.width, 0, 1);
  }, []);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail || event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    const pointer = positionFromClientX(event.clientX);
    // Pressing the thumb keeps the grab offset; pressing the rail jumps there.
    const onThumb = Boolean(target?.closest('[data-slider-thumb]'));
    const offset = onThumb ? thumbCenterRef.current - pointer : 0;
    dragRef.current = { pointerId: event.pointerId, offset, last: clamp(pointer + offset, 0, 1) };
    rail.setPointerCapture(event.pointerId);
    setScrubbing(true);
    onScrub(dragRef.current.last);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.last = clamp(positionFromClientX(event.clientX) + drag.offset, 0, 1);
    onScrub(drag.last);
  };

  const endScrub = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setScrubbing(false);
    if (railRef.current?.hasPointerCapture(event.pointerId)) railRef.current.releasePointerCapture(event.pointerId);
    onScrubEnd(drag.last);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = Math.max(itemCount - 1, 0);
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
      case 'PageUp':
        event.preventDefault();
        onSelect(clamp(activeIndex + 1, 0, last));
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
      case 'PageDown':
        event.preventDefault();
        onSelect(clamp(activeIndex - 1, 0, last));
        break;
      case 'Home':
        event.preventDefault();
        onSelect(0);
        break;
      case 'End':
        event.preventDefault();
        onSelect(last);
        break;
      default:
        break;
    }
  };

  const label = getItemLabel?.(activeIndex) ?? `Item ${activeIndex + 1}`;

  return (
    <div className="slider-pagination" data-scrubbing={scrubbing} style={{ '--page-count': itemCount } as CSSProperties}>
      <div
        className="slider-pagination__rail"
        ref={subscribeRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endScrub}
        onPointerCancel={endScrub}
      >
        <div className="slider-pagination__pages" aria-hidden="true">
          {Array.from({ length: itemCount }, (_, index) => (
            <span key={index} className="slider-pagination__page" data-active={index === activeIndex} />
          ))}
        </div>
        <div
          className="slider-pagination__thumb"
          data-slider-thumb=""
          role="slider"
          tabIndex={0}
          aria-label={ariaLabel}
          aria-orientation="horizontal"
          aria-valuemin={1}
          aria-valuemax={itemCount}
          aria-valuenow={activeIndex + 1}
          aria-valuetext={`${label} (${activeIndex + 1} of ${itemCount})`}
          onKeyDown={handleKeyDown}
        >
          <span className="slider-pagination__handle" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
