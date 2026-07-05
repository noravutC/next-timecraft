import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { checkRateLimit, resetRateLimits } from "./rate-limit";

const CONFIG = { limit: 3, windowMs: 60_000 };

beforeEach(() => {
  resetRateLimits();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    expect(checkRateLimit("u1", CONFIG).ok).toBe(true);
    expect(checkRateLimit("u1", CONFIG).ok).toBe(true);
    expect(checkRateLimit("u1", CONFIG).ok).toBe(true);
  });

  it("blocks the request that exceeds the limit", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("u1", CONFIG);
    const result = checkRateLimit("u1", CONFIG);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.retryAfterSec).toBeGreaterThan(0);
      expect(result.retryAfterSec).toBeLessThanOrEqual(60);
    }
  });

  it("keys are independent", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("u1", CONFIG);
    expect(checkRateLimit("u1", CONFIG).ok).toBe(false);
    expect(checkRateLimit("u2", CONFIG).ok).toBe(true);
  });

  it("window slides — old hits expire", () => {
    for (let i = 0; i < 3; i++) checkRateLimit("u1", CONFIG);
    expect(checkRateLimit("u1", CONFIG).ok).toBe(false);

    vi.advanceTimersByTime(61_000);
    expect(checkRateLimit("u1", CONFIG).ok).toBe(true);
  });

  it("partial expiry frees exactly the expired slots", () => {
    checkRateLimit("u1", CONFIG); // t=0
    vi.advanceTimersByTime(30_000);
    checkRateLimit("u1", CONFIG); // t=30s
    checkRateLimit("u1", CONFIG); // t=30s
    expect(checkRateLimit("u1", CONFIG).ok).toBe(false);

    vi.advanceTimersByTime(31_000); // t=61s — first hit expired, 2 remain
    expect(checkRateLimit("u1", CONFIG).ok).toBe(true); // now 3 in window
    expect(checkRateLimit("u1", CONFIG).ok).toBe(false);
  });
});
