import type { RateLimitConfig } from './rate-limit';

export const DAY_MS = 24 * 60 * 60 * 1000;

// Daily caps per identity (user, or IP for guests) on actions that cost
// storage or send email. Use with enforceQuota() from ./handle.
export const DAILY_QUOTAS = {
  invite: { limit: 50, windowMs: DAY_MS },
  projectCreate: { limit: 30, windowMs: DAY_MS },
} satisfies Record<string, RateLimitConfig>;
