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

/** Which end of a bounded slider the visible window rests on. */
export function edgeAt(position: number, max: number, epsilon = 0.75): 'previous' | 'next' | null {
  if (max <= 0) return null;
  if (position <= epsilon) return 'previous';
  if (position >= max - epsilon) return 'next';
  return null;
}

/**
 * The range control is a dot on a line: the dot marks `position` (0..1) and the visitor
 * can drag it. This maps a pointer to that position — `offset` keeps the dot under the
 * finger when the drag did not start on its centre.
 */
export function rangePositionFromPointer(
  clientX: number,
  rect: { left: number; width: number },
  offset = 0,
): number {
  if (rect.width <= 0) return 0;
  return clamp((clientX - rect.left) / rect.width + offset, 0, 1);
}
