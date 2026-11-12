import { getAutomationBoard } from '@/db/uniq-query/automation/board-utils';
import {
  findDuePassed,
  findDueSoon,
  findIdle,
} from '@/db/uniq-query/automation/date-rule-utils';
import {
  claimFired,
  pruneHistory,
} from '@/db/uniq-query/automation/history-utils';
import {
  claimSchedule,
  listDateRules,
  listDueSchedules,
} from '@/db/uniq-query/automation/rule-utils';
import { HISTORY_DAYS } from '@/helper/utils/automation';
import { nextRunAt } from '@/helper/utils/automation-schedule';
import { logger } from '@/lib/logger';
import type { AutomationRuleRow } from '@/types';
import { deliverWebhooks } from './deliver';
import { conditionsMet, executeRule } from './engine';

/** Rounds of sending in one run of the jobs: 100 messages at most. */
const DELIVERY_ROUNDS = 4;

/**
 * Rules on a schedule whose time has come. Moving a rule's next time
 * forward is what claims the run, so two job runs never both do it. A
 * schedule that was missed while the jobs were down runs once, not once
 * for every time it was missed.
 */
export async function runScheduledRules(now: Date): Promise<number> {
  let ran = 0;
  for (const { rule, timeZone } of await listDueSchedules(now)) {
    if (rule.trigger.type !== 'schedule') continue;
    const next = nextRunAt(rule.trigger, timeZone, now);
    if (!(await claimSchedule(rule.id, next, now))) continue;
    const board = await getAutomationBoard(rule.projectId);
    if (!board) continue;
    await executeRule({
      board,
      rule,
      task: null,
      origin: { actorId: null },
      now,
    });
    ran += 1;
  }
  return ran;
}

const candidatesFor = (rule: AutomationRuleRow, tz: string, now: Date) => {
  const { trigger } = rule;
  if (trigger.type === 'due_soon') {
    return findDueSoon(rule, trigger.days, tz, now);
  }
  if (trigger.type === 'due_passed') return findDuePassed(rule, tz, now);
  if (trigger.type === 'task_idle') {
    return findIdle(rule, trigger.days, trigger.columnId ?? null, now);
  }
  return [];
};

/**
 * Rules that wait for a date: a due date coming up or passed, a task that
 * has sat still. Each rule runs once for a task and a date: that pair is
 * claimed before the rule acts.
 */
export async function runDateRules(now: Date): Promise<number> {
  let ran = 0;
  for (const { rule, timeZone } of await listDateRules()) {
    const found = await candidatesFor(rule, timeZone, now);
    if (found.length === 0) continue;
    const board = await getAutomationBoard(rule.projectId);
    if (!board) continue;
    for (const { task, key } of found) {
      // checked first: a task that fails now can still pass another day
      if (!(await conditionsMet(rule, task))) continue;
      if (!(await claimFired(rule.id, task.id, key))) continue;
      const result = await executeRule({
        board,
        rule,
        task,
        origin: { actorId: null },
        now,
      });
      ran += 1;
      if (result.broken) break;
    }
  }
  return ran;
}

const step = async (name: string, run: () => Promise<number>) => {
  try {
    return await run();
  } catch (err) {
    // one part failing must not hold back the others
    logger.error({ err, step: name }, 'automation job failed');
    return 0;
  }
};

/** Everything automation does on a schedule: see /api/cron/run. */
export async function runAutomationJobs(now: Date) {
  const scheduledRules = await step('schedules', () => runScheduledRules(now));
  const dateRules = await step('dates', () => runDateRules(now));
  const webhooks = await step('webhooks', async () => {
    let sent = 0;
    for (let round = 0; round < DELIVERY_ROUNDS; round += 1) {
      const count = await deliverWebhooks(now);
      sent += count;
      if (count === 0) break;
    }
    return sent;
  });
  const prunedHistory = await step('prune', () =>
    pruneHistory(new Date(now.getTime() - HISTORY_DAYS * 86_400_000)),
  );
  return { scheduledRules, dateRules, webhooks, prunedHistory };
}
