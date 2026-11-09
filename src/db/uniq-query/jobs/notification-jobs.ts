import { randomUUID } from 'crypto';
import { db } from '@/db';
import { jobQueueTable, usersTable } from '@/db/schema';
import type { NotificationPayload, NotificationRow } from '@/types';
import { and, eq, inArray, lt, sql } from 'drizzle-orm';

type JobRow = typeof jobQueueTable.$inferSelect;

// a job older than this is news nobody needs any more: it's dropped
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const RETRY_AFTER_MS = 10 * 60 * 1000;

/** Invitations send their own email where they happen. */
const MAILED_ELSEWHERE: ReadonlySet<NotificationRow['type']> = new Set([
  'board_invite',
  'workspace_invite',
]);

/**
 * Queues the email side of a notification for each recipient. Whether it
 * goes out is decided when it's sent, from their settings at that time.
 */
export async function queueNotificationEmails(args: {
  recipientIds: string[];
  type: NotificationRow['type'];
  payload: NotificationPayload;
  /** what makes it unique, e.g. the comment id; random when omitted */
  key?: string;
}): Promise<void> {
  if (args.recipientIds.length === 0 || MAILED_ELSEWHERE.has(args.type)) return;
  const key = args.key ?? randomUUID();
  await db
    .insert(jobQueueTable)
    .values(
      args.recipientIds.map((recipientId) => ({
        jobType: 'send_notification' as const,
        payload: { kind: args.type, recipientId, ...args.payload },
        idempotencyKey: `${args.type}:${key}:${recipientId}`,
        priority: 5,
        scheduledAt: new Date(),
      })),
    )
    .onConflictDoNothing();
}

/**
 * Takes the next notification emails to send (others running at the same
 * time skip them), after dropping ones too old to matter.
 */
export async function claimNotificationJobs(
  limit: number,
  now: Date,
): Promise<JobRow[]> {
  await db
    .update(jobQueueTable)
    .set({ status: 'cancelled', lastError: 'too old to send', updatedAt: now })
    .where(
      and(
        eq(jobQueueTable.jobType, 'send_notification'),
        eq(jobQueueTable.status, 'pending'),
        lt(jobQueueTable.createdAt, new Date(now.getTime() - MAX_AGE_MS)),
      ),
    );
  return db
    .update(jobQueueTable)
    .set({
      status: 'processing',
      startedAt: now,
      attempts: sql`${jobQueueTable.attempts} + 1`,
      updatedAt: now,
    })
    .where(
      inArray(
        jobQueueTable.id,
        sql`(select id from ${jobQueueTable}
             where ${jobQueueTable.jobType} = 'send_notification'
               and ${jobQueueTable.status} = 'pending'
               and ${jobQueueTable.scheduledAt} <= ${now.toISOString()}::timestamptz
               and ${jobQueueTable.attempts} < ${jobQueueTable.maxAttempts}
             order by ${jobQueueTable.priority} desc, ${jobQueueTable.createdAt}
             limit ${limit}
             for update skip locked)`,
      ),
    )
    .returning();
}

/** Done; or back in line for a later try, until it runs out of attempts. */
export async function finishJob(
  job: JobRow,
  outcome: { ok: true; note?: string } | { ok: false; error: string },
  now: Date,
): Promise<void> {
  await db
    .update(jobQueueTable)
    .set(
      outcome.ok
        ? {
            status: 'completed',
            completedAt: now,
            lastError: outcome.note ?? null,
            updatedAt: now,
          }
        : {
            status: job.attempts >= job.maxAttempts ? 'failed' : 'pending',
            lastError: outcome.error,
            scheduledAt: new Date(now.getTime() + RETRY_AFTER_MS),
            updatedAt: now,
          },
    )
    .where(eq(jobQueueTable.id, job.id));
}

/** Who the emails go to: address and settings (deleted accounts get none). */
export async function emailRecipients(userIds: string[]) {
  if (userIds.length === 0)
    return new Map<string, { email: string; prefs: unknown }>();
  const rows = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      prefs: usersTable.notificationPrefs,
      deletedAt: usersTable.deletedAt,
      provider: usersTable.provider,
    })
    .from(usersTable)
    .where(inArray(usersTable.id, userIds));
  return new Map(
    rows
      // the shared guest account has no inbox
      .filter((r) => !r.deletedAt && r.provider !== 'guest')
      .map((r) => [r.id, { email: r.email, prefs: r.prefs }]),
  );
}
