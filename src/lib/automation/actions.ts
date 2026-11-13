import { createNotifications } from '@/db/uniq-query/notification/notification-utils';
import type { AutomationBoard } from '@/db/uniq-query/automation/board-utils';
import {
  addAssignee,
  addComment,
  assigneesOf,
  creatorOf,
  endOfColumn,
  patchTask,
} from '@/db/uniq-query/automation/task-action-utils';
import {
  createTaskFromTemplate,
  getTemplate,
} from '@/db/uniq-query/automation/template-utils';
import type { TaskChange } from '@/db/uniq-query/task/activity-insert';
import { ACTOR } from '@/helper/utils/automation';
import { dueDateIn, formatRunDay } from '@/helper/utils/automation-schedule';
import { shortName } from '@/helper/utils/person-name';
import { joinNames } from '@/helper/utils/task-activity-view';
import { pushNotification, triggerAll } from '@/lib/pusher-server';
import { PRIORITY_STYLES } from '@/lib/task-priority';
import type {
  ActivityColumnRef,
  AutomationRuleRow,
  RuleAction,
  TaskRow,
} from '@/types';

export type ActionContext = {
  board: AutomationBoard;
  rule: AutomationRuleRow;
  /** the rule's trigger and conditions in words */
  ruleText: string;
  /** the task the rule runs on; null for a rule on a schedule */
  task: TaskRow | null;
  /** who made the change that started it; null for dates and the clock */
  actorId: string | null;
  now: Date;
};

export type ActionResult =
  /** it changed something: `did` says what, `changes` go into history */
  | {
      kind: 'done';
      did: string;
      changes: TaskChange[];
      task?: TaskRow;
      commented?: boolean;
    }
  /** nothing to change: the task was already that way */
  | { kind: 'skipped' }
  /** the rule points at something the board no longer has */
  | { kind: 'broken'; reason: string };

const skipped: ActionResult = { kind: 'skipped' };
const broken = (reason: string): ActionResult => ({ kind: 'broken', reason });

const columnRef = (
  board: AutomationBoard,
  columnId: string,
): ActivityColumnRef | null => {
  const found = board.columns.find((c) => c.id === columnId);
  return found ? { id: found.id, name: found.name, color: found.color } : null;
};

const boardChannel = (board: AutomationBoard) => `project-${board.id}`;

async function move(ctx: ActionContext, task: TaskRow, columnId: string) {
  const to = columnRef(ctx.board, columnId);
  if (!to) return broken('The column this rule moves tasks to was deleted');
  if (task.columnId === columnId) return skipped;
  const updated = await patchTask(task.id, {
    columnId,
    orderFraction: await endOfColumn(columnId),
  });
  if (!updated) return skipped;
  void triggerAll(boardChannel(ctx.board), 'tasks-updated', [updated]);
  return {
    kind: 'done',
    did: `moved it to ${to.name}`,
    task: updated,
    changes: [
      {
        taskId: task.id,
        entry: {
          type: 'moved',
          data: { from: columnRef(ctx.board, task.columnId), to },
        },
      },
    ],
  } satisfies ActionResult;
}

async function assign(ctx: ActionContext, task: TaskRow, who: string) {
  const userId = who === ACTOR ? ctx.actorId : who;
  if (!userId) return skipped;
  const member = ctx.board.members.find((m) => m.id === userId);
  if (!member) {
    return who === ACTOR
      ? skipped
      : broken('Someone this rule assigns is no longer on the board');
  }
  if (!(await addAssignee(task.id, userId))) return skipped;
  void triggerAll(boardChannel(ctx.board), 'task-assignees-updated', {
    taskId: task.id,
    assignees: await assigneesOf(task.id),
  });
  // told like anyone a person assigns, unless they started this themselves
  if (userId !== ctx.actorId) {
    const [notification] = await createNotifications({
      recipientIds: [userId],
      type: 'task_assigned',
      payload: {
        taskId: task.id,
        projectId: ctx.board.id,
        taskTitle: task.title,
        projectName: ctx.board.name,
        actorUserId: ctx.rule.id,
        actorName: 'A rule',
      },
    });
    void pushNotification(null, notification ?? null);
  }
  return {
    kind: 'done',
    did: `assigned ${shortName(member.name)}`,
    changes: [
      {
        taskId: task.id,
        entry: {
          type: 'assignees_changed',
          data: { added: [{ id: userId, name: member.name }], removed: [] },
        },
      },
    ],
  } satisfies ActionResult;
}

async function setFields(
  ctx: ActionContext,
  task: TaskRow,
  patch: Parameters<typeof patchTask>[1],
  did: string,
  entry: TaskChange['entry'],
) {
  const updated = await patchTask(task.id, patch);
  if (!updated) return skipped;
  void triggerAll(boardChannel(ctx.board), 'tasks-updated', [updated]);
  return {
    kind: 'done',
    did,
    task: updated,
    changes: [{ taskId: task.id, entry }],
  } satisfies ActionResult;
}

async function notify(ctx: ActionContext, task: TaskRow, to: string) {
  const members = new Map(ctx.board.members.map((m) => [m.id, m.name]));
  if (to !== 'creator' && to !== 'assignees' && !members.has(to)) {
    return broken('Someone this rule notifies is no longer on the board');
  }
  const wanted =
    to === 'creator'
      ? [await creatorOf(task.id)]
      : to === 'assignees'
        ? (await assigneesOf(task.id)).map((a) => a.userId)
        : [to];
  // nobody is told about what they just did themselves
  const recipientIds = wanted.filter(
    (id): id is string => !!id && members.has(id) && id !== ctx.actorId,
  );
  if (recipientIds.length === 0) return skipped;
  const notifications = await createNotifications({
    recipientIds,
    type: 'automation',
    payload: {
      taskId: task.id,
      taskTitle: task.title,
      projectId: ctx.board.id,
      projectName: ctx.board.name,
      rule: ctx.ruleText,
      actorUserId: ctx.rule.id,
      actorName: 'A rule',
    },
  });
  for (const n of notifications) void pushNotification(null, n);
  return {
    kind: 'done',
    did: `notified ${joinNames(recipientIds.map((id) => shortName(members.get(id))))}`,
    changes: [],
  } satisfies ActionResult;
}

async function comment(ctx: ActionContext, task: TaskRow, body: string) {
  const members = new Set(ctx.board.members.map((m) => m.id));
  // in the name of whoever set the rule up, or the board's owner
  const authorId =
    ctx.rule.createdBy && members.has(ctx.rule.createdBy)
      ? ctx.rule.createdBy
      : ctx.board.ownerId;
  const added = await addComment(task.id, authorId, body);
  void triggerAll(`task-${task.id}`, 'comment-added', {
    comment: added,
    clientId: added.clientId,
  });
  void triggerAll(boardChannel(ctx.board), 'task-comment-count', {
    taskId: task.id,
    delta: 1,
    authorId,
  });
  return {
    kind: 'done',
    did: 'added a comment',
    changes: [],
    commented: true,
  } satisfies ActionResult;
}

async function createTask(
  ctx: ActionContext,
  action: Extract<RuleAction, { type: 'create_task' }>,
) {
  const column = columnRef(ctx.board, action.columnId);
  if (!column)
    return broken('The column this rule creates tasks in was deleted');
  const template = await getTemplate(action.templateId, ctx.board.id);
  if (!template) return broken('The template this rule uses was deleted');
  const created = await createTaskFromTemplate({
    template,
    columnId: column.id,
    board: ctx.board,
    now: ctx.now,
    repeatRuleId: ctx.rule.trigger.type === 'schedule' ? ctx.rule.id : null,
  });
  const channel = boardChannel(ctx.board);
  void triggerAll(channel, 'tasks-created', [created.task]);
  if (created.assigneeIds.length > 0) {
    void triggerAll(channel, 'task-assignees-updated', {
      taskId: created.task.id,
      assignees: await assigneesOf(created.task.id),
    });
  }
  if (created.subtasks > 0) {
    void triggerAll(channel, 'subtask-progress', {
      taskId: created.task.id,
      done: 0,
      total: created.subtasks,
    });
  }
  return {
    kind: 'done',
    did: `created ${template.title} in ${column.name}`,
    // the new task is what the rest of this rule's history is about
    task: ctx.task ?? created.task,
    changes: [
      {
        taskId: created.task.id,
        entry: { type: 'created', data: { column } },
      },
    ],
  } satisfies ActionResult;
}

/**
 * Carries out one step of a rule. A step that finds the task already the
 * way it would leave it is skipped, so a rule never repeats itself.
 */
export async function runAction(
  ctx: ActionContext,
  action: RuleAction,
): Promise<ActionResult> {
  if (action.type === 'create_task') return createTask(ctx, action);
  const { task } = ctx;
  // every other step needs a task: a rule on a schedule has none
  if (!task) return skipped;

  switch (action.type) {
    case 'move':
      return move(ctx, task, action.columnId);
    case 'assign':
      return assign(ctx, task, action.userId);
    case 'set_priority':
      return task.priority === action.priority
        ? skipped
        : setFields(
            ctx,
            task,
            { priority: action.priority },
            `set the priority to ${PRIORITY_STYLES[action.priority].label}`,
            {
              type: 'priority_changed',
              data: { from: task.priority, to: action.priority },
            },
          );
    case 'set_due': {
      const due = dueDateIn(action.days, ctx.board.timeZone, ctx.now);
      return task.dueDate?.getTime() === due.getTime()
        ? skipped
        : setFields(
            ctx,
            task,
            // a new date sends a fresh reminder
            { dueDate: due, remindedAt: null },
            `made it due ${formatRunDay(due, ctx.board.timeZone)}`,
            {
              type: 'due_changed',
              data: {
                from: task.dueDate?.toISOString() ?? null,
                to: due.toISOString(),
              },
            },
          );
    }
    case 'add_label':
      if (!ctx.board.labels.includes(action.label)) {
        return broken(`The label ${action.label} was deleted`);
      }
      return task.tags.includes(action.label)
        ? skipped
        : setFields(
            ctx,
            task,
            { tags: [...task.tags, action.label] },
            `added ${action.label}`,
            {
              type: 'labels_changed',
              data: { added: [action.label], removed: [] },
            },
          );
    case 'remove_label':
      return task.tags.includes(action.label)
        ? setFields(
            ctx,
            task,
            { tags: task.tags.filter((tag) => tag !== action.label) },
            `removed ${action.label}`,
            {
              type: 'labels_changed',
              data: { added: [], removed: [action.label] },
            },
          )
        : skipped;
    case 'comment':
      return comment(ctx, task, action.body);
    case 'notify':
      return notify(ctx, task, action.to);
    case 'archive':
      return task.archived
        ? skipped
        : setFields(
            ctx,
            task,
            { archived: true, archivedAt: ctx.now },
            'archived it',
            { type: 'archived', data: {} },
          );
  }
}
