interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

const globalForRateLimit = globalThis as typeof globalThis & {
  adminLoginRateLimit?: Map<string, RateLimitEntry>;
};

const store =
  globalForRateLimit.adminLoginRateLimit ??
  new Map<string, RateLimitEntry>();

if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.adminLoginRateLimit = store;
}

export function isLoginRateLimited(key: string) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 0, resetAt: now + WINDOW_MS });
    return false;
  }

  return entry.count >= MAX_ATTEMPTS;
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  entry.count += 1;
}

export function clearLoginFailures(key: string) {
  store.delete(key);
}
