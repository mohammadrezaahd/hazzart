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

/** Thumb geometry (0..1) for the range control: keeps the thumb inside its rail. */
export function thumbGeometry(start: number, size: number): { start: number; size: number } {
  const clampedSize = clamp(size, 0.06, 1);
  return { size: clampedSize, start: clamp(start, 0, 1 - clampedSize) };
}

/** Which end of a bounded slider the visible window rests on. */
export function edgeAt(position: number, max: number, epsilon = 0.75): 'previous' | 'next' | null {
  if (max <= 0) return null;
  if (position <= epsilon) return 'previous';
  if (position >= max - epsilon) return 'next';
  return null;
}
