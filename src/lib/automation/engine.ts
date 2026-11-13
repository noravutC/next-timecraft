import { after } from 'next/server';
import {
  getAutomationBoard,
  ruleNamesOf,
  type AutomationBoard,
} from '@/db/uniq-query/automation/board-utils';
import { recordRun } from '@/db/uniq-query/automation/history-utils';
import {
  listChangeRules,
  markRuleBroken,
} from '@/db/uniq-query/automation/rule-utils';
import {
  allSubtasksDone,
  assigneesOf,
  boardsOfTasks,
} from '@/db/uniq-query/automation/task-action-utils';
import {
  insertDeliveries,
  listSubscribers,
} from '@/db/uniq-query/automation/webhook-utils';
import {
  insertTaskActivities,
  type TaskChange,
} from '@/db/uniq-query/task/activity-insert';
import { getTasksByIds } from '@/db/uniq-query/task/task-utils';
import { getPublicUsersByIds } from '@/db/uniq-query/user/user-utils';
import { MAX_RULE_DEPTH } from '@/helper/utils/automation';
import {
  conditionsHold,
  ruleEventsOf,
  triggerMatches,
  webhookEventsOf,
} from '@/helper/utils/automation-match';
import { runDetail, runNote, whenText } from '@/helper/utils/automation-text';
import { changeText, taskPayload } from '@/helper/utils/webhook';
import { appUrl } from '@/lib/app-url';
import { logger } from '@/lib/logger';
import { triggerAll } from '@/lib/pusher-server';
import { recordRuleRun } from '@/lib/telemetry/metrics';
import type {
  AutomationRuleRow,
  TaskRow,
  WebhookDeliveryRow,
  WebhookEvent,
} from '@/types';
import { runAction } from './actions';
import { deliverWebhooks } from './deliver';

/** Where a change came from, carried along a chain of rules. */
export type Origin = {
  /** who made the first change; null for dates and the clock */
  actorId: string | null;
  /** how many rules led to this change */
  depth?: number;
  /** rule and task pairs that already ran in this chain */
  seen?: Set<string>;
  /** set when a rule made the change, for webhooks to say so */
  byRule?: boolean;
};

type Subscriber = Awaited<ReturnType<typeof listSubscribers>>[number];

/**
 * Sends freshly written webhook messages once the response is out. In a
 * scheduled job there is no response to wait for: the job's own delivery
 * step picks them up.
 */
const sendSoon = (ids: string[]) => {
  if (ids.length === 0) return;
  try {
    after(() =>
      deliverWebhooks(new Date(), ids).catch((err) =>
        logger.error({ err }, 'webhook delivery failed'),
      ),
    );
  } catch {
    // not in a request: left for the next delivery run
  }
};

/** Writes one message per webhook that asked for this kind of change. */
async function queueWebhooks(args: {
  board: AutomationBoard;
  hooks: Subscriber[];
  change: TaskChange;
  task: TaskRow;
  actorName: string | null;
  now: Date;
}): Promise<string[]> {
  const { board, change, task, now } = args;
  const events = webhookEventsOf(change.entry, board.doneColumnId);
  const rows: Pick<
    WebhookDeliveryRow,
    'webhookId' | 'event' | 'taskId' | 'taskTitle' | 'payload'
  >[] = [];
  for (const hook of args.hooks) {
    for (const event of events.filter((e) => hook.events.includes(e))) {
      rows.push({
        webhookId: hook.id,
        event,
        taskId: task.id,
        taskTitle: task.title,
        payload: taskPayload({
          event,
          board: { id: board.id, name: board.name },
          task,
          columnName:
            board.columns.find((c) => c.id === task.columnId)?.name ?? null,
          change: changeText(change.entry, now),
          actorName: args.actorName,
          baseUrl: appUrl(),
          now,
        }),
      });
    }
  }
  return insertDeliveries(rows);
}

/**
 * Tells a board's webhooks about something that is not in a task's
 * history: a comment, or a task deleted for good.
 */
export async function announceTaskEvent(args: {
  projectId: string;
  event: Extract<WebhookEvent, 'comment.added' | 'task.removed'>;
  tasks: (Pick<TaskRow, 'id' | 'title' | 'priority' | 'dueDate' | 'tags'> & {
    columnId?: string;
  })[];
  change: string;
  actorName: string | null;
}): Promise<void> {
  try {
    const hooks = (await listSubscribers([args.projectId])).filter((h) =>
      h.events.includes(args.event),
    );
    if (hooks.length === 0 || args.tasks.length === 0) return;
    const board = await getAutomationBoard(args.projectId);
    if (!board) return;
    const now = new Date();
    sendSoon(
      await insertDeliveries(
        args.tasks.flatMap((task) => {
          const payload = taskPayload({
            event: args.event,
            board: { id: board.id, name: board.name },
            task,
            columnName:
              board.columns.find((c) => c.id === task.columnId)?.name ?? null,
            change: args.change,
            actorName: args.actorName,
            baseUrl: appUrl(),
            now,
          });
          return hooks.map((hook) => ({
            webhookId: hook.id,
            event: args.event,
            taskId: task.id,
            taskTitle: task.title,
            payload,
          }));
        }),
      ),
    );
  } catch (err) {
    logger.error({ err, event: args.event }, 'webhook announce failed');
  }
}

/** Tells a board's webhooks that someone commented on a task. */
export async function announceComment(
  projectId: string,
  taskId: string,
  actorName: string | null,
): Promise<void> {
  const [task] = await getTasksByIds([taskId]).catch(() => []);
  if (!task) return;
  await announceTaskEvent({
    projectId,
    event: 'comment.added',
    tasks: [task],
    change: 'commented on this',
    actorName,
  });
}

/** Whether the task passes a rule's conditions, as it is right now. */
export async function conditionsMet(
  rule: Pick<AutomationRuleRow, 'conditions'>,
  task: TaskRow,
): Promise<boolean> {
  if (rule.conditions.length === 0) return true;
  // only asked for when a condition is about who is on the task
  const assigneeIds = rule.conditions.some((c) => c.field === 'assignee')
    ? (await assigneesOf(task.id)).map((a) => a.userId)
    : [];
  return conditionsHold(rule.conditions, { ...task, assigneeIds });
}

/**
 * Runs one rule: its steps in order, then its line in History, then the
 * rules and webhooks that its own changes start. Returns the ids of the
 * tasks it changed, and whether the rule turned out to be broken.
 */
export async function executeRule(args: {
  board: AutomationBoard;
  rule: AutomationRuleRow;
  task: TaskRow | null;
  origin: Origin;
  now?: Date;
}): Promise<{ changed: string[]; broken: boolean }> {
  const { board, rule, origin } = args;
  const now = args.now ?? new Date();
  const ruleText = whenText(rule, ruleNamesOf(board));
  const did: string[] = [];
  const changes: TaskChange[] = [];
  let task = args.task;
  let problem: { status: 'needs_fix' | 'failed'; detail: string } | null = null;
  let commented = false;

  try {
    for (const action of rule.actions) {
      const result = await runAction(
        { board, rule, ruleText, task, actorId: origin.actorId, now },
        action,
      );
      if (result.kind === 'broken') {
        problem = { status: 'needs_fix', detail: result.reason };
        await markRuleBroken(rule.id, result.reason);
        break;
      }
      if (result.kind === 'skipped') continue;
      did.push(result.did);
      changes.push(...result.changes);
      if (result.task) task = result.task;
      commented ||= !!result.commented;
    }
  } catch (err) {
    logger.error({ err, ruleId: rule.id }, 'rule failed');
    problem = { status: 'failed', detail: 'Something went wrong' };
  }
  if (did.length === 0 && !problem) return { changed: [], broken: false };

  await insertTaskActivities(null, changes, {
    ruleId: rule.id,
    rule: ruleText,
  });
  const status = problem?.status ?? 'done';
  recordRuleRun(status, rule.trigger.type);
  await recordRun({
    projectId: board.id,
    ruleId: rule.id,
    rule: ruleText,
    trigger: rule.trigger.type,
    taskId: task?.id ?? null,
    taskTitle: task?.title ?? '',
    status,
    detail: problem?.detail ?? runDetail(did),
  }).catch((err) => logger.error({ err }, 'Failed to record a rule run'));

  // a short note for whoever's change started it
  if (did.length > 0 && origin.actorId) {
    void triggerAll(`project-${board.id}`, 'automation-ran', {
      actorId: origin.actorId,
      taskId: task?.id ?? null,
      ruleId: rule.id,
      text: runNote(did),
    });
  }
  if (commented && task) {
    await announceComment(board.id, task.id, 'Automation');
  }

  const chained = await announceTaskChanges(changes, {
    actorId: origin.actorId,
    depth: (origin.depth ?? 0) + 1,
    seen: new Set([...(origin.seen ?? []), `${rule.id}:${task?.id ?? ''}`]),
    byRule: true,
  });
  return {
    changed: [...new Set([...changes.map((c) => c.taskId), ...chained])],
    broken: problem?.status === 'needs_fix',
  };
}

/**
 * What every change to a task goes through after it is saved: the board's
 * webhooks are handed it, and the rules that wait for it run. Never
 * throws: automation going wrong must not fail the change itself. Returns
 * the ids of tasks that rules went on to change.
 */
export async function announceTaskChanges(
  changes: TaskChange[],
  origin: Origin,
): Promise<string[]> {
  if (changes.length === 0) return [];
  try {
    const boardOf = await boardsOfTasks(changes.map((c) => c.taskId));
    const projectIds = [...new Set(boardOf.values())];
    const [rules, hooks] = await Promise.all([
      listChangeRules(projectIds),
      listSubscribers(projectIds),
    ]);
    // most boards have neither: this is all they pay
    if (rules.length === 0 && hooks.length === 0) return [];

    const boards = new Map<string, AutomationBoard | null>();
    const boardFor = async (projectId: string) => {
      if (!boards.has(projectId)) {
        boards.set(projectId, await getAutomationBoard(projectId));
      }
      return boards.get(projectId) ?? null;
    };
    const actorName = origin.byRule
      ? 'Automation'
      : origin.actorId && hooks.length > 0
        ? ((await getPublicUsersByIds([origin.actorId]))[0]?.fullName ?? null)
        : null;
    const depth = origin.depth ?? 0;
    const now = new Date();
    const queued: string[] = [];
    const changed = new Set<string>();

    for (const change of changes) {
      const projectId = boardOf.get(change.taskId);
      const board = projectId ? await boardFor(projectId) : null;
      if (!board) continue;

      const boardHooks = hooks.filter((h) => h.projectId === board.id);
      if (boardHooks.length > 0) {
        const [task] = await getTasksByIds([change.taskId]);
        if (task) {
          queued.push(
            ...(await queueWebhooks({
              board,
              hooks: boardHooks,
              change,
              task,
              actorName,
              now,
            })),
          );
        }
      }

      const events = ruleEventsOf(change.entry, board.doneColumnId);
      for (const rule of rules.filter((r) => r.projectId === board.id)) {
        const event = events.find((e) => triggerMatches(rule.trigger, e));
        if (!event) continue;
        if (origin.seen?.has(`${rule.id}:${change.taskId}`)) continue;
        if (
          event.type === 'subtasks_done' &&
          !(await allSubtasksDone(change.taskId))
        ) {
          continue;
        }
        const [task] = await getTasksByIds([change.taskId]);
        if (!task) continue;
        if (!(await conditionsMet(rule, task))) continue;

        if (depth >= MAX_RULE_DEPTH) {
          // rules that keep starting each other are stopped here
          await recordRun({
            projectId: board.id,
            ruleId: rule.id,
            rule: whenText(rule, ruleNamesOf(board)),
            trigger: rule.trigger.type,
            taskId: task.id,
            taskTitle: task.title,
            status: 'failed',
            detail: 'Stopped: too many rules ran one after another',
          });
          continue;
        }
        const ran = await executeRule({ board, rule, task, origin, now });
        ran.changed.forEach((id) => changed.add(id));
      }
    }
    sendSoon(queued);
    return [...changed];
  } catch (err) {
    logger.error({ err }, 'automation failed');
    return [];
  }
}
