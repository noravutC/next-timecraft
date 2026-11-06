// In-memory sliding-window rate limiter.
//
// Deliberate trade-off: the app runs as a single container (EC2), so an
// in-process Map is correct and adds zero infrastructure. If the app ever
// scales horizontally, swap this module for a shared store (e.g. Upstash
// Redis @upstash/ratelimit) — the call-site contract below stays the same.

export type RateLimitConfig = {
  /** max requests allowed within the window */
  limit: number;
  /** window length in ms */
  windowMs: number;
};

type Result = { ok: true } | { ok: false; retryAfterSec: number };

const hits = new Map<string, number[]>();

// prevent unbounded growth from one-off keys
const MAX_KEYS = 10_000;

export function checkRateLimit(key: string, config: RateLimitConfig): Result {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= config.limit) {
    const oldest = timestamps[0];
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((oldest + config.windowMs - now) / 1000)),
    };
  }

  timestamps.push(now);
  // re-insert so Map order is least-recently-used first
  hits.delete(key);
  hits.set(key, timestamps);

  if (hits.size > MAX_KEYS) {
    const oldest = hits.keys().next().value;
    if (oldest !== undefined) hits.delete(oldest);
  }

  return { ok: true };
}

/** test hook: number of tracked keys */
export function rateLimitKeyCount() {
  return hits.size;
}

/** test hook — clears all counters */
export function resetRateLimits() {
  hits.clear();
}
