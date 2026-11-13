import { db } from '@/db';
import {
  automationFiredTable,
  automationRunsTable,
  webhookDeliveriesTable,
  webhooksTable,
} from '@/db/schema';
import type { AutomationRunRow, HistoryItem, HistoryPage } from '@/types';
import { and, desc, eq, gt, lt, ne, or } from 'drizzle-orm';

export const HISTORY_PAGE_SIZE = 50;

export type HistoryFilter = {
  kind: 'all' | 'rules' | 'webhooks';
  failedOnly: boolean;
  /** the createdAt of the last row already shown */
  cursor: Date | null;
  /** only this rule's runs: the editor's "Last runs" */
  ruleId?: string | null;
};

/** One line of History for a rule. A failure here never fails the rule. */
export async function recordRun(
  run: Pick<
    AutomationRunRow,
    | 'projectId'
    | 'ruleId'
    | 'rule'
    | 'trigger'
    | 'taskId'
    | 'taskTitle'
    | 'status'
    | 'detail'
  >,
): Promise<void> {
  await db.insert(automationRunsTable).values(run);
}

/**
 * Marks "this rule ran for this task and this date". False when it had
 * already: the rule must not run for it again.
 */
export async function claimFired(
  ruleId: string,
  taskId: string,
  key: string,
): Promise<boolean> {
  const claimed = await db
    .insert(automationFiredTable)
    .values({ ruleId, taskId, key })
    .onConflictDoNothing()
    .returning({ key: automationFiredTable.key });
  return claimed.length > 0;
}

async function listRuns(
  projectId: string,
  filter: HistoryFilter,
): Promise<HistoryItem[]> {
  const rows = await db
    .select({
      id: automationRunsTable.id,
      ruleId: automationRunsTable.ruleId,
      rule: automationRunsTable.rule,
      trigger: automationRunsTable.trigger,
      taskId: automationRunsTable.taskId,
      taskTitle: automationRunsTable.taskTitle,
      status: automationRunsTable.status,
      detail: automationRunsTable.detail,
      createdAt: automationRunsTable.createdAt,
    })
    .from(automationRunsTable)
    .where(
      and(
        eq(automationRunsTable.projectId, projectId),
        filter.ruleId
          ? eq(automationRunsTable.ruleId, filter.ruleId)
          : undefined,
        filter.failedOnly ? ne(automationRunsTable.status, 'done') : undefined,
        filter.cursor
          ? lt(automationRunsTable.createdAt, filter.cursor)
          : undefined,
      ),
    )
    .orderBy(desc(automationRunsTable.createdAt))
    .limit(HISTORY_PAGE_SIZE + 1);
  return rows.map((row) => ({ kind: 'run' as const, ...row }));
}

async function listDeliveries(
  projectId: string,
  filter: HistoryFilter,
): Promise<HistoryItem[]> {
  const rows = await db
    .select({
      id: webhookDeliveriesTable.id,
      webhookId: webhookDeliveriesTable.webhookId,
      webhookName: webhooksTable.name,
      url: webhooksTable.url,
      event: webhookDeliveriesTable.event,
      taskId: webhookDeliveriesTable.taskId,
      taskTitle: webhookDeliveriesTable.taskTitle,
      status: webhookDeliveriesTable.status,
      attempts: webhookDeliveriesTable.attempts,
      responseStatus: webhookDeliveriesTable.responseStatus,
      durationMs: webhookDeliveriesTable.durationMs,
      error: webhookDeliveriesTable.error,
      nextAttemptAt: webhookDeliveriesTable.nextAttemptAt,
      payload: webhookDeliveriesTable.payload,
      createdAt: webhookDeliveriesTable.createdAt,
    })
    .from(webhookDeliveriesTable)
    .innerJoin(
      webhooksTable,
      eq(webhooksTable.id, webhookDeliveriesTable.webhookId),
    )
    .where(
      and(
        eq(webhooksTable.projectId, projectId),
        filter.failedOnly
          ? or(
              eq(webhookDeliveriesTable.status, 'failed'),
              and(
                eq(webhookDeliveriesTable.status, 'pending'),
                gt(webhookDeliveriesTable.attempts, 0),
              ),
            )
          : undefined,
        filter.cursor
          ? lt(webhookDeliveriesTable.createdAt, filter.cursor)
          : undefined,
      ),
    )
    .orderBy(desc(webhookDeliveriesTable.createdAt))
    .limit(HISTORY_PAGE_SIZE + 1);
  return rows.map((row) => ({ kind: 'delivery' as const, ...row }));
}

/** Rule runs and webhook messages in one list, newest first, a page at a time. */
export async function listHistory(
  projectId: string,
  filter: HistoryFilter,
): Promise<HistoryPage> {
  const [runs, deliveries] = await Promise.all([
    filter.kind === 'webhooks' ? [] : listRuns(projectId, filter),
    filter.kind === 'rules' ? [] : listDeliveries(projectId, filter),
  ]);
  const merged = [...runs, ...deliveries].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
  const items = merged.slice(0, HISTORY_PAGE_SIZE);
  const last = items[items.length - 1];
  return {
    items,
    nextCursor:
      merged.length > HISTORY_PAGE_SIZE && last
        ? last.createdAt.toISOString()
        : null,
  };
}

/** Removes history older than `before`: rule runs and finished messages. */
export async function pruneHistory(before: Date): Promise<number> {
  const [runs, deliveries] = await Promise.all([
    db
      .delete(automationRunsTable)
      .where(lt(automationRunsTable.createdAt, before))
      .returning({ id: automationRunsTable.id }),
    db
      .delete(webhookDeliveriesTable)
      .where(
        and(
          lt(webhookDeliveriesTable.createdAt, before),
          ne(webhookDeliveriesTable.status, 'pending'),
        ),
      )
      .returning({ id: webhookDeliveriesTable.id }),
  ]);
  return runs.length + deliveries.length;
}
