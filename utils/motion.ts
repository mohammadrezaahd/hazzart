/** Shared motion helpers so every animated surface respects the same rules. */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Frame-rate independent damping step for value -> target smoothing. */
export function damp(value: number, target: number, smoothing: number, deltaSeconds: number): number {
  return value + (target - value) * (1 - Math.exp(-smoothing * deltaSeconds));
}
