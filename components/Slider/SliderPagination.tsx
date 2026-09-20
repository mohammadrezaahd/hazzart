'use client';

import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { clamp } from '@/utils/motion';
import { rangePositionFromPointer } from '@/utils/slider';
import type { SliderRange } from './useSliderScroll';

export interface SliderPaginationProps {
  itemCount: number;
  activeIndex: number;
  /** Follows the scroll position frame by frame without re-rendering React. */
  subscribeRange: (listener: (range: SliderRange) => void) => () => void;
  /** Continuous position (0..1) while the visitor drags the dot. */
  onScrub: (position: number) => void;
  /** Final position (0..1) when the visitor lets go. */
  onScrubEnd: (position: number) => void;
  /** Discrete move, used by the keyboard. */
  onSelect: (index: number) => void;
  getItemLabel?: (index: number) => string;
  ariaLabel: string;
}

/**
 * The range control under the slider: a line with a dot on it.
 *
 * The dot marks how far the visible window has travelled through the track, follows the
 * scroll position on every frame (imperatively, so the 60fps loop stays out of React),
 * can be dragged to move the track and answers the arrow keys.
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
  const dragRef = useRef<{ pointerId: number; offset: number; position: number } | null>(null);
  const positionRef = useRef(0);
  const [scrubbing, setScrubbing] = useState(false);

  /** Writes the dot position as a plain 0..1 number the stylesheet turns into a length. */
  const paint = useCallback((position: number) => {
    const value = clamp(position, 0, 1);
    positionRef.current = value;
    railRef.current?.style.setProperty('--range-position', value.toFixed(5));
  }, []);

  const writeRange = useCallback((range: SliderRange) => {
    const rail = railRef.current;
    if (!rail) return;
    if (rail.dataset.ready !== String(range.ready)) rail.dataset.ready = String(range.ready);
    // The accepted scroll position owns the dot, including during a scrub. Painting
    // the pointer's target separately makes the dot jump back when a drag ends.
    paint(range.position);
  }, [paint]);

  // Callback ref: subscribe for the whole lifetime of the rail. The position is written
  // as a fraction, so a resize needs no extra bookkeeping here.
  const subscribeRef = useCallback((node: HTMLDivElement | null) => {
    railRef.current = node;
    if (!node) return undefined;
    return subscribeRange(writeRange);
  }, [subscribeRange, writeRange]);

  /** Point that keeps the dot under the finger when it was not grabbed by its centre. */
  const offsetFromEvent = (event: PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail) return { rect: { left: 0, width: 0 }, offset: 0 };
    const rect = rail.getBoundingClientRect();
    const grabbedDot = Boolean((event.target as HTMLElement | null)?.closest('[data-range-dot]'));
    const pointer = rangePositionFromPointer(event.clientX, rect);
    return { rect, offset: grabbedDot ? positionRef.current - pointer : 0 };
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail || event.button !== 0 || dragRef.current) return;
    const { rect, offset } = offsetFromEvent(event);
    const position = rangePositionFromPointer(event.clientX, rect, offset);
    dragRef.current = { pointerId: event.pointerId, offset, position };
    rail.setPointerCapture(event.pointerId);
    setScrubbing(true);
    onScrub(position);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const rail = railRef.current;
    if (!rail) return;
    drag.position = rangePositionFromPointer(event.clientX, rail.getBoundingClientRect(), drag.offset);
    onScrub(drag.position);
  };

  const endScrub = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setScrubbing(false);
    const rail = railRef.current;
    if (rail?.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
    onScrubEnd(drag.position);
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
    <div className="slider-pagination" data-scrubbing={scrubbing}>
      <div
        className="slider-pagination__rail"
        ref={subscribeRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endScrub}
        onPointerCancel={endScrub}
        onLostPointerCapture={endScrub}
      >
        <span className="slider-pagination__line" aria-hidden="true" />
        <span className="slider-pagination__fill" aria-hidden="true" />
        <span
          className="slider-pagination__dot"
          data-range-dot=""
          role="slider"
          tabIndex={0}
          aria-label={ariaLabel}
          aria-orientation="horizontal"
          aria-valuemin={1}
          aria-valuemax={Math.max(itemCount, 1)}
          aria-valuenow={activeIndex + 1}
          aria-valuetext={`${label} (${activeIndex + 1} of ${itemCount})`}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
