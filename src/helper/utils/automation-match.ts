import type {
  RuleCondition,
  RuleTrigger,
  TaskActivityEntry,
  TaskRow,
  WebhookEvent,
} from '@/types';

/** A change to a task, in the terms rules are written in. */
export type RuleEvent =
  | { type: 'task_created'; columnId: string | null }
  | {
      type: 'task_moved';
      fromColumnId: string | null;
      toColumnId: string | null;
    }
  | { type: 'task_finished' }
  | { type: 'task_assigned'; userIds: string[] }
  | { type: 'label_added'; labels: string[] }
  /** one subtask was ticked: the engine checks the others */
  | { type: 'subtasks_done' };

/**
 * What a history entry means to rules. A task that lands in the Done
 * column is both moved (or created) and finished.
 */
export const ruleEventsOf = (
  entry: TaskActivityEntry,
  doneColumnId: string | null,
): RuleEvent[] => {
  switch (entry.type) {
    case 'created': {
      const columnId = entry.data.column?.id ?? null;
      return [
        { type: 'task_created', columnId },
        ...(columnId && columnId === doneColumnId
          ? [{ type: 'task_finished' } as const]
          : []),
      ];
    }
    case 'moved': {
      const fromColumnId = entry.data.from?.id ?? null;
      const toColumnId = entry.data.to?.id ?? null;
      return [
        { type: 'task_moved', fromColumnId, toColumnId },
        ...(toColumnId && toColumnId === doneColumnId
          ? [{ type: 'task_finished' } as const]
          : []),
      ];
    }
    case 'assignees_changed':
      return entry.data.added.length > 0
        ? [
            {
              type: 'task_assigned',
              userIds: entry.data.added.map((p) => p.id),
            },
          ]
        : [];
    case 'labels_changed':
      return entry.data.added.length > 0
        ? [{ type: 'label_added', labels: entry.data.added }]
        : [];
    case 'subtask_completed':
      return [{ type: 'subtasks_done' }];
    default:
      return [];
  }
};

/** Whether this change is what the rule waits for. */
export const triggerMatches = (
  trigger: RuleTrigger,
  event: RuleEvent,
): boolean => {
  if (trigger.type === 'task_created' && event.type === 'task_created') {
    return !trigger.columnId || trigger.columnId === event.columnId;
  }
  if (trigger.type === 'task_moved' && event.type === 'task_moved') {
    return (
      (!trigger.fromColumnId || trigger.fromColumnId === event.fromColumnId) &&
      (!trigger.toColumnId || trigger.toColumnId === event.toColumnId)
    );
  }
  if (trigger.type === 'task_assigned' && event.type === 'task_assigned') {
    return !trigger.userId || event.userIds.includes(trigger.userId);
  }
  if (trigger.type === 'label_added' && event.type === 'label_added') {
    return !trigger.label || event.labels.includes(trigger.label);
  }
  return (
    (trigger.type === 'task_finished' || trigger.type === 'subtasks_done') &&
    trigger.type === event.type
  );
};

/** The task as conditions see it. */
export type TaskFacts = Pick<TaskRow, 'columnId' | 'priority' | 'tags'> & {
  assigneeIds: string[];
};

const holds = (condition: RuleCondition, task: TaskFacts): boolean => {
  switch (condition.field) {
    case 'assignee':
      return (task.assigneeIds.length === 0) === (condition.op === 'is_empty');
    case 'priority':
      return (task.priority === condition.value) === (condition.op === 'is');
    case 'label':
      return task.tags.includes(condition.value) === (condition.op === 'has');
    case 'column':
      return (task.columnId === condition.value) === (condition.op === 'is');
  }
};

/** Every condition must hold; a rule without any always passes. */
export const conditionsHold = (
  conditions: RuleCondition[],
  task: TaskFacts,
): boolean => conditions.every((c) => holds(c, task));

/**
 * What a history entry means to webhooks. Subtasks and logged time are
 * not sent: they change the task's insides, not the task.
 */
export const webhookEventsOf = (
  entry: TaskActivityEntry,
  doneColumnId: string | null,
): WebhookEvent[] => {
  switch (entry.type) {
    case 'created':
      return entry.data.column?.id && entry.data.column.id === doneColumnId
        ? ['task.created', 'task.finished']
        : ['task.created'];
    case 'moved':
      return entry.data.to?.id && entry.data.to.id === doneColumnId
        ? ['task.moved', 'task.finished']
        : ['task.moved'];
    case 'archived':
      return ['task.removed'];
    case 'subtask_completed':
    case 'subtask_reopened':
    case 'time_logged':
      return [];
    default:
      return ['task.updated'];
  }
};
