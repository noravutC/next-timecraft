import { DAY_MS } from '@/lib/api/quotas';
export { dayAgo } from '@/lib/api/quotas';

// Limits apply only when the request runs on the server's ANTHROPIC_API_KEY;
// a user's own key is just rate limited per minute.
export const SERVER_KEY_DAILY_LIMIT = {
  user: { limit: 20, windowMs: DAY_MS },
  // per IP, since all guests share one account
  guest: { limit: 5, windowMs: DAY_MS },
} as const;

// Hard ceiling across everyone, counted from ai_usage_logs so it survives
// restarts. Counts every call (own keys too), so it errs on the safe side.
export const SERVER_KEY_GLOBAL_DAILY_LIMIT = 200;
