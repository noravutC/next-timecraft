import { AppError } from './errors';
import type { RateLimitConfig } from './rate-limit';

export const DAY_MS = 24 * 60 * 60 * 1000;

// Daily caps per identity (user, or IP for guests) on actions that cost
// storage or send email. Use with enforceQuota() from ./handle.
export const DAILY_QUOTAS = {
  invite: { limit: 50, windowMs: DAY_MS },
  projectCreate: { limit: 30, windowMs: DAY_MS },
  commentUpload: { limit: 200, windowMs: DAY_MS },
} satisfies Record<string, RateLimitConfig>;

// Guests are counted per IP but share one account, so they get less.
export const GUEST_DAILY_QUOTAS = {
  commentUpload: { limit: 20, windowMs: DAY_MS },
} satisfies Record<string, RateLimitConfig>;

// The in-memory quotas above reset when the server restarts. These ceilings
// are counted from the database, so they hold across deploys: per user, and
// for the shared guest account as a whole.
export const GUEST_BOARDS_DAILY_CEILING = 100;

export const dayAgo = () => new Date(Date.now() - DAY_MS);

/** 429 once `count` (from the database) has reached the daily `limit`. */
export const assertUnderDailyLimit = (
  count: number,
  limit: number,
  message: string,
) => {
  if (count >= limit) throw new AppError(429, message);
};
