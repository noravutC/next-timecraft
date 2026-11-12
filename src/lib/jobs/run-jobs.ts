import { createNotifications } from '@/db/uniq-query/notification/notification-utils';
import { purgeExpiredColumns } from '@/db/uniq-query/jobs/column-purge';
import {
  claimDigest,
  listDigestSubscriptions,
  releaseDigest,
} from '@/db/uniq-query/project/digest-utils';
import {
  assigneesByTask,
  findReminderCandidates,
  markReminded,
} from '@/db/uniq-query/jobs/due-reminders';
import {
  claimNotificationJobs,
  emailRecipients,
  finishJob,
} from '@/db/uniq-query/jobs/notification-jobs';
import { reminderIsDue } from '@/helper/utils/due-reminder';
import { digestDueWeek } from '@/helper/utils/insights';
import { notificationEmailContent } from '@/helper/utils/notification-email';
import {
  wantsEmail,
  withPrefDefaults,
  type StoredNotificationPrefs,
} from '@/helper/utils/notification-prefs';
import { appUrl, sendEmail } from '@/lib/email/send-email';
import { NotificationEmail } from '@/lib/email/templates/notification-email';
import { buildWeeklyDigest } from '@/lib/email/weekly-digest';
import { logger } from '@/lib/logger';
import { pushNotification } from '@/lib/pusher-server';
import { removeStorageObjects } from '@/lib/supabase-storage';
import type { NotificationPayload, NotificationRow } from '@/types';

const EMAIL_BATCH = 50;

type EmailJobPayload = NotificationPayload & {
  kind: NotificationRow['type'];
  recipientId?: string;
  /** mention jobs queued before recipientId existed */
  mentionedUserId?: string;
};

/** Reminders whose 9:00 has come: a notification (and email) per assignee. */
async function sendDueReminders(now: Date): Promise<number> {
  const due = (await findReminderCandidates(now)).filter(
    (t) =>
      t.dueDate &&
      t.remindDaysBefore !== null &&
      reminderIsDue(t.dueDate, t.remindDaysBefore, t.timeZone, now),
  );
  const assignees = await assigneesByTask(due.map((t) => t.taskId));
  let sent = 0;
  for (const task of due) {
    const recipientIds = assignees.get(task.taskId) ?? [];
    if (
      !task.dueDate ||
      task.remindDaysBefore === null ||
      recipientIds.length === 0
    ) {
      continue;
    }
    const notifications = await createNotifications({
      recipientIds,
      type: 'due_reminder',
      payload: {
        taskId: task.taskId,
        taskTitle: task.title,
        projectId: task.projectId,
        projectName: task.projectName,
        dueDate: task.dueDate.toISOString(),
        daysBefore: task.remindDaysBefore,
        timeZone: task.timeZone,
        actorUserId: '',
        actorName: 'TimeCraft',
      },
      emailKey: `${task.taskId}:${task.dueDate.toISOString()}:${task.remindDaysBefore}`,
    });
    await Promise.all(notifications.map((n) => pushNotification(null, n)));
    sent += recipientIds.length;
  }
  await markReminded(
    due.map((t) => t.taskId),
    now,
  );
  return sent;
}

/** Sends queued notification emails to those whose settings allow it. */
async function deliverNotificationEmails(now: Date): Promise<number> {
  const jobs = await claimNotificationJobs(EMAIL_BATCH, now);
  const recipientOf = (job: (typeof jobs)[number]) => {
    const payload = job.payload as EmailJobPayload;
    return payload.recipientId ?? payload.mentionedUserId ?? '';
  };
  const recipients = await emailRecipients([...new Set(jobs.map(recipientOf))]);
  let sent = 0;

  for (const job of jobs) {
    const payload = job.payload as EmailJobPayload;
    const recipient = recipients.get(recipientOf(job));
    const prefs = withPrefDefaults(recipient?.prefs as StoredNotificationPrefs);
    if (!recipient || !wantsEmail(prefs, payload.kind)) {
      await finishJob(job, { ok: true, note: 'not wanted' }, now);
      continue;
    }
    const content = notificationEmailContent(payload.kind, payload, {
      baseUrl: appUrl(),
      timeZone: 'UTC',
    });
    if (!content) {
      await finishJob(job, { ok: true, note: 'sent elsewhere' }, now);
      continue;
    }
    const result = await sendEmail({
      to: recipient.email,
      subject: content.subject,
      email: NotificationEmail({
        ...content,
        settingsUrl: `${appUrl()}/settings/notifications`,
      }),
      kind: payload.kind,
    });
    if (result === 'failed') {
      await finishJob(job, { ok: false, error: 'email failed' }, now);
    } else {
      await finishJob(
        job,
        { ok: true, note: result === 'skipped' ? 'no email key' : undefined },
        now,
      );
      if (result === 'sent') sent += 1;
    }
  }
  return sent;
}

/**
 * Monday's digest, from 9:00 in each board's zone, to everyone who turned
 * it on. Each week is claimed before it is sent, so it goes out once.
 */
async function sendWeeklyDigests(now: Date): Promise<number> {
  const due = (await listDigestSubscriptions())
    .map((sub) => ({ ...sub, weekKey: digestDueWeek(now, sub.timeZone) }))
    .filter((sub) => sub.weekKey && sub.weekKey !== sub.lastSentWeek);
  // one email per board and week, built on first use
  const digests = new Map<string, ReturnType<typeof buildWeeklyDigest>>();
  let sent = 0;

  for (const sub of due) {
    const weekKey = sub.weekKey as string;
    if (!(await claimDigest(sub.id, weekKey))) continue;
    // "Email notifications" off silences this too
    if (!withPrefDefaults(sub.prefs).email) continue;
    const key = `${sub.projectId}:${weekKey}`;
    if (!digests.has(key)) {
      digests.set(key, buildWeeklyDigest(sub.projectId, weekKey));
    }
    try {
      const digest = await digests.get(key);
      if (!digest || digest.empty) continue;
      const result = await sendEmail({
        to: sub.email,
        subject: digest.subject,
        email: digest.email,
        kind: 'weekly_digest',
      });
      if (result === 'failed') throw new Error('email failed');
      if (result === 'sent') sent += 1;
    } catch (err) {
      // the claim goes back, so the next run tries this one again
      logger.error({ err, projectId: sub.projectId }, 'weekly digest failed');
      await releaseDigest(sub.id, sub.lastSentWeek);
    }
  }
  return sent;
}

/** Everything that runs on a schedule: see /api/cron/run. */
export async function runJobs(now: Date = new Date()) {
  const reminders = await sendDueReminders(now);
  const emails = await deliverNotificationEmails(now);
  const digests = await sendWeeklyDigests(now);
  const { purged, storagePaths } = await purgeExpiredColumns(now);
  await removeStorageObjects(storagePaths);
  return { reminders, emails, digests, purgedColumns: purged };
}
