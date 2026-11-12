import { db } from '@/db';
import { taskActivitiesTable } from '@/db/schema';
import { logger } from '@/lib/logger';
import type { ActivityAutomationRef, TaskActivityEntry } from '@/types';

/** A change to a task: what its history, rules and webhooks all hear about. */
export type TaskChange = { taskId: string; entry: TaskActivityEntry };

/**
 * Appends history entries: by a person, or by a rule (then `automation`
 * says which and there is no actor). History is a side record: a failure
 * here is logged and never fails the change that produced it.
 */
export async function insertTaskActivities(
  actorId: string | null,
  items: TaskChange[],
  automation: ActivityAutomationRef | null = null,
): Promise<void> {
  if (items.length === 0) return;
  try {
    await db.insert(taskActivitiesTable).values(
      items.map(({ taskId, entry }) => ({
        taskId,
        actorId,
        automation,
        type: entry.type,
        data: entry.data,
      })),
    );
  } catch (err) {
    logger.error(
      { err, count: items.length },
      'Failed to record task activity',
    );
  }
}
