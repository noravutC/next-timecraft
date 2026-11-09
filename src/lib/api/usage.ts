import type { Session } from 'next-auth';
import { getAiSettings } from '@/db/uniq-query/ai/ai-utils';
import {
  countAiUsageByUserSince,
  countBoardsCreatedSince,
  countInvitesSentSince,
} from '@/db/uniq-query/quota/daily-usage';
import { SERVER_KEY_DAILY_LIMIT } from '@/lib/ai/quota';
import { isGuestSession } from '@/lib/guest';
import type { DailyUsage, UsageMeter } from '@/helper/utils/usage-meters';
import { quotaUsed } from './handle';
import { DAILY_QUOTAS, dayAgo, GUEST_DAILY_QUOTAS } from './quotas';

/**
 * What the caller used of each daily limit. Most limits are checked twice,
 * in memory (per person, or per network for guests) and from the database,
 * so each meter shows whichever count is closer to blocking.
 */
export async function getDailyUsage(ctx: {
  request: Request;
  session: Session;
  userId: string;
}): Promise<DailyUsage> {
  const guest = isGuestSession(ctx.session);
  const since = dayAgo();
  // the guest account is shared: its database counts are everyone's
  const [aiRuns, boards, invites, settings] = guest
    ? [0, 0, 0, null]
    : await Promise.all([
        countAiUsageByUserSince(ctx.userId, since),
        countBoardsCreatedSince(ctx.userId, since),
        countInvitesSentSince(ctx.userId, since),
        getAiSettings(ctx.userId),
      ]);
  const ai = guest ? SERVER_KEY_DAILY_LIMIT.guest : SERVER_KEY_DAILY_LIMIT.user;
  const uploads = guest
    ? GUEST_DAILY_QUOTAS.commentUpload
    : DAILY_QUOTAS.commentUpload;

  const meters: UsageMeter[] = [
    {
      kind: 'ai',
      used: Math.max(aiRuns, quotaUsed(ctx, 'ai-server-key', ai)),
      limit: ai.limit,
    },
    {
      kind: 'boards',
      used: Math.max(
        boards,
        quotaUsed(ctx, 'project-create', DAILY_QUOTAS.projectCreate),
      ),
      limit: DAILY_QUOTAS.projectCreate.limit,
    },
    // guests can't invite anyone
    ...(guest
      ? []
      : [
          {
            kind: 'invites' as const,
            used: Math.max(
              invites,
              quotaUsed(ctx, 'invite', DAILY_QUOTAS.invite),
            ),
            limit: DAILY_QUOTAS.invite.limit,
          },
        ]),
    {
      kind: 'uploads',
      used: quotaUsed(ctx, 'comment-upload', uploads),
      limit: uploads.limit,
    },
  ];

  const ownKey =
    settings?.provider === 'gemini'
      ? settings.geminiKeyEncrypted
      : settings?.claudeKeyEncrypted;
  return { guest, ownAiKey: Boolean(ownKey), meters };
}
