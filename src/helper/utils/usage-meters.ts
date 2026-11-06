export type UsageKind = 'ai' | 'boards' | 'invites' | 'uploads';

/** One daily limit: how much of it the last 24 hours used. */
export type UsageMeter = { kind: UsageKind; used: number; limit: number };

export type DailyUsage = {
  guest: boolean;
  /** AI Breakdown runs on the person's own key, outside the daily limit */
  ownAiKey: boolean;
  meters: UsageMeter[];
};

/** From this share of a limit on, the meter turns amber and says so. */
export const NEAR_LIMIT_SHARE = 0.8;

export const usagePercent = ({ used, limit }: UsageMeter): number =>
  limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

export const isNearLimit = ({ used, limit }: UsageMeter): boolean =>
  limit > 0 && used / limit >= NEAR_LIMIT_SHARE;
