import type {
  RuleAction,
  RuleActionType,
  RuleCondition,
  RuleDraft,
  RuleTrigger,
  RuleTriggerType,
  SaveTemplatePayload,
  TaskRow,
  WebhookEvent,
} from '@/types';

/** Ceilings per board: enough for real use, small enough to stay readable. */
export const MAX_RULES = 30;
export const MAX_TEMPLATES = 50;
export const MAX_WEBHOOKS = 5;
export const MAX_RULE_ACTIONS = 5;
export const MAX_RULE_CONDITIONS = 3;
export const MAX_TEMPLATE_SUBTASKS = 20;

/**
 * A rule's actions can start other rules. This is how many may follow one
 * another from a single change before the chain is stopped.
 */
export const MAX_RULE_DEPTH = 3;

/** History is kept this long, then removed by the scheduled jobs. */
export const HISTORY_DAYS = 30;

/** In an "assign" action: whoever made the change that started the rule. */
export const ACTOR = 'actor';

export type TriggerGroup = 'task' | 'date' | 'time';

/** Every trigger, in the order the "New rule" sheet lists them. */
export const TRIGGERS: {
  type: RuleTriggerType;
  group: TriggerGroup;
  title: string;
  hint: string;
}[] = [
  {
    type: 'task_created',
    group: 'task',
    title: 'A task is created',
    hint: 'In any column, or one you pick',
  },
  {
    type: 'task_moved',
    group: 'task',
    title: 'A task moves to a column',
    hint: 'From anywhere, or between two',
  },
  {
    type: 'task_finished',
    group: 'task',
    title: 'A task is finished',
    hint: 'It lands in the Done column',
  },
  {
    type: 'task_assigned',
    group: 'task',
    title: 'Someone is assigned',
    hint: 'Anyone, or one person',
  },
  {
    type: 'label_added',
    group: 'task',
    title: 'A label is added',
    hint: 'Any label, or one you pick',
  },
  {
    type: 'subtasks_done',
    group: 'task',
    title: 'All subtasks are done',
    hint: 'The last one gets ticked',
  },
  {
    type: 'due_soon',
    group: 'date',
    title: 'A due date is coming up',
    hint: 'A number of days before',
  },
  {
    type: 'due_passed',
    group: 'date',
    title: 'A due date has passed',
    hint: 'The day after it was due',
  },
  {
    type: 'task_idle',
    group: 'date',
    title: 'A task has not moved',
    hint: 'For a number of days',
  },
  {
    type: 'schedule',
    group: 'time',
    title: 'At a set time',
    hint: 'Every day, week or month',
  },
];

export const TRIGGER_GROUP_CAPTIONS: Record<TriggerGroup, string> = {
  task: 'Something changes on a task',
  date: 'A date comes around',
  time: 'The clock, with no task involved',
};

/** Every action, in the order the "New rule" sheet lists them. */
export const ACTIONS: { type: RuleActionType; title: string }[] = [
  { type: 'move', title: 'Move it to a column' },
  { type: 'assign', title: 'Assign someone' },
  { type: 'set_priority', title: 'Set the priority' },
  { type: 'set_due', title: 'Set the due date' },
  { type: 'add_label', title: 'Add a label' },
  { type: 'remove_label', title: 'Remove a label' },
  { type: 'comment', title: 'Add a comment' },
  { type: 'notify', title: 'Notify someone' },
  { type: 'create_task', title: 'Create a task from a template' },
  { type: 'archive', title: 'Archive it' },
];

export const triggerTitle = (type: RuleTriggerType): string =>
  TRIGGERS.find((t) => t.type === type)?.title ?? type;

/** A rule on a schedule has no task to act on: it can only make one. */
export const isScheduleRule = (trigger: RuleTrigger): boolean =>
  trigger.type === 'schedule';

/** Triggers that the scheduled jobs look for, not a change someone made. */
export const isDateTrigger = (type: RuleTriggerType): boolean =>
  type === 'due_soon' || type === 'due_passed' || type === 'task_idle';

/** The actions a trigger can be followed by. */
export const actionsFor = (trigger: RuleTrigger): RuleActionType[] =>
  isScheduleRule(trigger) ? ['create_task'] : ACTIONS.map((a) => a.type);

/**
 * Whether someone made the change that starts the rule. Dates and the
 * clock have nobody, so "whoever made the change" is not on offer there.
 */
export const triggerHasActor = (type: RuleTriggerType): boolean =>
  !isDateTrigger(type) && type !== 'schedule';

/** A new trigger of this kind, with the values the editor starts from. */
export const defaultTrigger = (type: RuleTriggerType): RuleTrigger => {
  switch (type) {
    case 'due_soon':
      return { type, days: 1 };
    case 'task_idle':
      return { type, days: 7 };
    case 'schedule':
      return { type, every: 'week', weekdays: [1], time: '09:00' };
    default:
      return { type };
  }
};

/** Everything on the board a rule points at. */
export type RuleRefs = {
  columnIds: string[];
  userIds: string[];
  labels: string[];
  templateIds: string[];
};

const isUserId = (value: string) =>
  value !== ACTOR && value !== 'creator' && value !== 'assignees';

/** What a rule needs to still exist for it to run. */
export const ruleRefs = (rule: {
  trigger: RuleTrigger;
  conditions: RuleCondition[];
  actions: RuleAction[];
}): RuleRefs => {
  const refs: RuleRefs = {
    columnIds: [],
    userIds: [],
    labels: [],
    templateIds: [],
  };
  const { trigger } = rule;
  if (trigger.type === 'task_created' || trigger.type === 'task_idle') {
    if (trigger.columnId) refs.columnIds.push(trigger.columnId);
  }
  if (trigger.type === 'task_moved') {
    if (trigger.fromColumnId) refs.columnIds.push(trigger.fromColumnId);
    if (trigger.toColumnId) refs.columnIds.push(trigger.toColumnId);
  }
  if (trigger.type === 'task_assigned' && trigger.userId) {
    refs.userIds.push(trigger.userId);
  }
  if (trigger.type === 'label_added' && trigger.label) {
    refs.labels.push(trigger.label);
  }
  for (const c of rule.conditions) {
    if (c.field === 'label') refs.labels.push(c.value);
    if (c.field === 'column') refs.columnIds.push(c.value);
  }
  for (const a of rule.actions) {
    if (a.type === 'move') refs.columnIds.push(a.columnId);
    if (a.type === 'assign' && isUserId(a.userId)) refs.userIds.push(a.userId);
    if (a.type === 'add_label') refs.labels.push(a.label);
    if (a.type === 'notify' && isUserId(a.to)) refs.userIds.push(a.to);
    if (a.type === 'create_task') {
      refs.templateIds.push(a.templateId);
      refs.columnIds.push(a.columnId);
    }
  }
  return {
    columnIds: [...new Set(refs.columnIds)],
    userIds: [...new Set(refs.userIds)],
    labels: [...new Set(refs.labels)],
    templateIds: [...new Set(refs.templateIds)],
  };
};

/** What the board has, to check a rule's refs against. */
export type BoardRefs = {
  columnIds: Set<string>;
  memberIds: Set<string>;
  labels: Set<string>;
  templateIds: Set<string>;
};

/**
 * The first thing a rule points at that the board no longer has, in words;
 * null when everything is still there.
 */
export const missingRef = (refs: RuleRefs, board: BoardRefs): string | null => {
  if (refs.columnIds.some((id) => !board.columnIds.has(id))) {
    return 'A column this rule uses was deleted';
  }
  if (refs.userIds.some((id) => !board.memberIds.has(id))) {
    return 'Someone this rule uses is no longer on the board';
  }
  const label = refs.labels.find((l) => !board.labels.has(l));
  if (label) return `The label ${label} was deleted`;
  if (refs.templateIds.some((id) => !board.templateIds.has(id))) {
    return 'The template this rule uses was deleted';
  }
  return null;
};

/** Every event a webhook can ask for, with the words on its checkbox. */
export const WEBHOOK_EVENTS: { event: WebhookEvent; label: string }[] = [
  { event: 'task.created', label: 'A task is created' },
  { event: 'task.moved', label: 'A task moves' },
  { event: 'task.finished', label: 'A task is finished' },
  { event: 'task.updated', label: 'A task is edited' },
  { event: 'task.removed', label: 'A task is archived or deleted' },
  { event: 'comment.added', label: 'A comment is added' },
];

const EVENT_NAMES: Record<WebhookEvent | 'ping', string> = {
  'task.created': 'Task created',
  'task.moved': 'Task moved',
  'task.finished': 'Task finished',
  'task.updated': 'Task edited',
  'task.removed': 'Task removed',
  'comment.added': 'Comment added',
  ping: 'Test',
};

/** "Task finished": an event as a chip and in History. */
export const webhookEventName = (event: WebhookEvent | 'ping'): string =>
  EVENT_NAMES[event] ?? event;

/** A task as a template: what it has now, without its dates or history. */
export const templateFromTask = (
  task: Pick<TaskRow, 'title' | 'description' | 'priority' | 'tags'>,
  subtasks: string[],
  assigneeIds: string[],
): SaveTemplatePayload => ({
  title: task.title,
  description: task.description,
  priority: task.priority,
  tags: task.tags,
  subtasks: subtasks.slice(0, MAX_TEMPLATE_SUBTASKS),
  assigneeIds,
  dueInDays: null,
});

/**
 * What "Repeat" on a task opens: a rule that makes the task again every
 * week on this weekday (0 = Sunday), at 9:00, in the column it is in.
 */
export const repeatRule = (
  templateId: string,
  columnId: string,
  weekday: number,
): RuleDraft => ({
  trigger: {
    type: 'schedule',
    every: 'week',
    weekdays: [weekday],
    time: '09:00',
  },
  conditions: [],
  actions: [{ type: 'create_task', templateId, columnId }],
  enabled: true,
});
