// Explicit .ts extension: the Node test runner loads this module directly.
import { clamp } from './motion.ts';

/**
 * Index of the slide whose resting position is closest to `position`.
 * Fractions are 0..1 positions inside the scrollable range, one per slide.
 */
export function nearestSlideIndex(fractions: number[], position: number): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < fractions.length; index++) {
    const distance = Math.abs((fractions[index] ?? 0) - position);
    if (distance < bestDistance - 1e-9) {
      bestDistance = distance;
      best = index;
    }
  }
  return best;
}

/**
 * Where a released drag should come to rest. The visible position is extended by the
 * velocity the visitor let go with, then the caller snaps to the closest slide.
 */
export function projectMomentum(value: number, velocity: number, max: number, factor = 0.32): number {
  return clamp(value + velocity * factor, 0, Math.max(max, 0));
}

/**
 * Thumb box (0..1) for the range control. The thumb is placed on
 * `position * (1 - size)`, which keeps both ends exact: at position 0 the thumb sits on
 * the first page and at position 1 it sits on the last one, whatever its width is.
 */
export function thumbGeometry(position: number, size: number): { start: number; size: number } {
  const clampedSize = clamp(size, 0.06, 1);
  const clampedPosition = clamp(position, 0, 1);
  return { size: clampedSize, start: clampedPosition * (1 - clampedSize) };
}

/**
 * Inverse of `thumbGeometry`: the slider position (0..1) that puts the thumb centre
 * under `railPosition` (0..1 across the rail). Used while the control is dragged.
 */
export function railPositionToSlider(railPosition: number, size: number): number {
  const clampedSize = clamp(size, 0.06, 1);
  if (clampedSize >= 1) return 0;
  return clamp((railPosition - clampedSize / 2) / (1 - clampedSize), 0, 1);
}

/** Which end of a bounded slider the visible window rests on. */
export function edgeAt(position: number, max: number, epsilon = 0.75): 'previous' | 'next' | null {
  if (max <= 0) return null;
  if (position <= epsilon) return 'previous';
  if (position >= max - epsilon) return 'next';
  return null;
}

/**
 * Paged wheels: a gesture keeps its own intent so one flick moves exactly one slide.
 * Returns the direction to move, or null while the gesture is still too small.
 */
export function pageWheelIntent(
  accumulator: number,
  delta: number,
  direction: -1 | 0 | 1,
  threshold = 42,
): { direction: -1 | 1 | 0; accumulator: number } {
  const sign = delta === 0 ? 0 : delta > 0 ? 1 : -1;
  const sameGesture = sign !== 0 && sign === direction;
  const next = (sameGesture ? accumulator : 0) + delta;
  if (Math.abs(next) < threshold) return { direction: 0, accumulator: next };
  return { direction: next > 0 ? 1 : -1, accumulator: 0 };
}
