import {
  ACTIONS,
  ACTOR,
  actionsFor,
  defaultTrigger,
  missingRef,
  ruleRefs,
  triggerHasActor,
  TRIGGERS,
} from '@/helper/utils/automation';
import {
  formatRunDay,
  formatScheduleTime,
  MAX_MONTH_DAY,
  SCHEDULE_TIMES,
  upcomingRuns,
  WEEKDAY_ORDER,
  WEEKDAYS,
} from '@/helper/utils/automation-schedule';
import { countOf } from '@/helper/utils/insights';
import { shortName } from '@/helper/utils/person-name';
import { joinNames } from '@/helper/utils/task-activity-view';
import { PRIORITY_ORDER, PRIORITY_STYLES } from '@/lib/task-priority';
import type {
  RuleAction,
  RuleActionType,
  RuleCondition,
  RuleTrigger,
  RuleTriggerType,
  ScheduleTrigger,
  TaskPriority,
  TaskTemplate,
} from '@/types';
import type { BoardContext, RuleDraft } from './automation-operations';

/** A rule while it is being written: nothing has to be picked yet. */
export type EditorDraft = Omit<RuleDraft, 'trigger'> & {
  trigger: RuleTrigger | null;
};

export type PickerOption = {
  value: string;
  label: string;
  /** a column's or label's color, drawn as a dot */
  color?: string | null;
  /** a person, drawn with their avatar */
  person?: { id: string; name: string; avatar: string | null };
};

/** One value of a trigger, condition or action, and what it can be set to. */
export type FieldSpec = {
  key: string;
  /** what it is, for screen readers */
  label: string;
  /** words before it: "From", "to", "in" */
  pre?: string;
  /** words after it: "before" */
  post?: string;
  value: string;
  options: PickerOption[];
  placeholder?: string;
  /** typed, not picked: a comment's words */
  text?: boolean;
};

/** Stands for "no filter" in a picker: any column, anyone, any label. */
const ANY = 'any';

const columnOptions = (board: BoardContext): PickerOption[] =>
  board.columns.map((c) => ({ value: c.id, label: c.name, color: c.color }));

const memberOptions = (board: BoardContext): PickerOption[] =>
  board.members.map((m) => ({
    value: m.id,
    label: shortName(m.name),
    person: m,
  }));

const labelOptions = (board: BoardContext): PickerOption[] =>
  board.labels.map((l) => ({
    value: l,
    label: l,
    color: board.labelColors[l] ?? null,
  }));

const priorityOptions: PickerOption[] = PRIORITY_ORDER.map((p) => ({
  value: p,
  label: PRIORITY_STYLES[p].label,
  color: PRIORITY_STYLES[p].dot,
}));

const dayOptions = (choices: number[]): PickerOption[] =>
  choices.map((n) => ({ value: String(n), label: countOf(n, 'day') }));

const withAny = (label: string, options: PickerOption[]): PickerOption[] => [
  { value: ANY, label },
  ...options,
];

export const triggerOptions: PickerOption[] = TRIGGERS.map((t) => ({
  value: t.type,
  label: t.title,
}));

/** The values a trigger has, in the order they read. */
export const triggerFields = (
  trigger: RuleTrigger,
  board: BoardContext,
): FieldSpec[] => {
  const anyColumn = withAny('Any column', columnOptions(board));
  switch (trigger.type) {
    case 'task_created':
      return [
        {
          key: 'columnId',
          label: 'Column',
          pre: 'In',
          value: trigger.columnId ?? ANY,
          options: anyColumn,
        },
      ];
    case 'task_moved':
      return [
        {
          key: 'fromColumnId',
          label: 'From column',
          pre: 'From',
          value: trigger.fromColumnId ?? ANY,
          options: anyColumn,
        },
        {
          key: 'toColumnId',
          label: 'To column',
          pre: 'to',
          value: trigger.toColumnId ?? ANY,
          options: anyColumn,
        },
      ];
    case 'task_assigned':
      return [
        {
          key: 'userId',
          label: 'Person',
          pre: 'Who',
          value: trigger.userId ?? ANY,
          options: withAny('Anyone', memberOptions(board)),
        },
      ];
    case 'label_added':
      return [
        {
          key: 'label',
          label: 'Label',
          pre: 'Which',
          value: trigger.label ?? ANY,
          options: withAny('Any label', labelOptions(board)),
        },
      ];
    case 'due_soon':
      return [
        {
          key: 'days',
          label: 'Days before',
          value: String(trigger.days),
          options: dayOptions([1, 2, 3, 5, 7, 14]),
          post: 'before',
        },
      ];
    case 'task_idle':
      return [
        {
          key: 'days',
          label: 'Days',
          pre: 'For',
          value: String(trigger.days),
          options: dayOptions([1, 2, 3, 5, 7, 14, 30]),
        },
        {
          key: 'columnId',
          label: 'Column',
          pre: 'in',
          value: trigger.columnId ?? ANY,
          options: withAny('Any column but Done', columnOptions(board)),
        },
      ];
    case 'schedule':
      return [
        {
          key: 'every',
          label: 'How often',
          pre: 'Every',
          value: trigger.every,
          options: [
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
          ],
        },
        ...(trigger.every === 'month'
          ? [
              {
                key: 'monthDay',
                label: 'Day of the month',
                pre: 'on day',
                value: String(trigger.monthDay ?? 1),
                options: Array.from({ length: MAX_MONTH_DAY }, (_, i) => ({
                  value: String(i + 1),
                  label: String(i + 1),
                })),
              },
            ]
          : []),
        {
          key: 'time',
          label: 'Time',
          pre: 'at',
          value: trigger.time,
          options: SCHEDULE_TIMES.map((t) => ({
            value: t,
            label: formatScheduleTime(t),
          })),
        },
      ];
    default:
      return [];
  }
};

const optional = (value: string) => (value === ANY ? undefined : value);

/** The trigger with one of its values changed. */
export const withTriggerField = (
  trigger: RuleTrigger,
  key: string,
  value: string,
): RuleTrigger => {
  if (key === 'days' && 'days' in trigger) {
    return { ...trigger, days: Number(value) };
  }
  if (trigger.type === 'schedule') {
    if (key === 'time') return { ...trigger, time: value };
    if (key === 'monthDay') return { ...trigger, monthDay: Number(value) };
    if (key === 'every') {
      const { type, time } = trigger;
      // each kind of schedule starts from its own first day
      if (value === 'week') return { type, time, every: 'week', weekdays: [1] };
      if (value === 'month') return { type, time, every: 'month', monthDay: 1 };
      return { type, time, every: 'day' };
    }
    return trigger;
  }
  return { ...trigger, [key]: optional(value) } as RuleTrigger;
};

/** The day pills of a weekly schedule, Monday first. */
export const weekdayPills = (
  trigger: ScheduleTrigger,
): { day: number; letter: string; name: string; on: boolean }[] =>
  WEEKDAY_ORDER.map((day) => ({
    day,
    letter: WEEKDAYS[day].charAt(0),
    name: WEEKDAYS[day],
    on: (trigger.weekdays ?? []).includes(day),
  }));

export const toggleWeekday = (
  trigger: ScheduleTrigger,
  day: number,
): ScheduleTrigger => {
  const picked = trigger.weekdays ?? [];
  return {
    ...trigger,
    weekdays: picked.includes(day)
      ? picked.filter((d) => d !== day)
      : [...picked, day],
  };
};

/** "Next: Mon, Nov 16 · Mon, Nov 23 · Mon, Nov 30. Times are in …" */
export const scheduleNote = (
  trigger: ScheduleTrigger,
  tz: string,
  now: Date,
): string => {
  const runs = upcomingRuns(trigger, tz, now, 3).map((r) =>
    formatRunDay(r, tz),
  );
  const zone = `Times are in ${tz}, the time zone of this workspace.`;
  return runs.length > 0 ? `Next: ${runs.join(' · ')}. ${zone}` : zone;
};

const CONDITION_FIELDS: PickerOption[] = [
  { value: 'assignee', label: 'Assignee' },
  { value: 'priority', label: 'Priority' },
  { value: 'label', label: 'Label' },
  { value: 'column', label: 'Column' },
];

const CONDITION_OPS: Record<RuleCondition['field'], PickerOption[]> = {
  assignee: [
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  priority: [
    { value: 'is', label: 'is' },
    { value: 'is_not', label: 'is not' },
  ],
  label: [
    { value: 'has', label: 'is on the task' },
    { value: 'has_not', label: 'is not on the task' },
  ],
  column: [
    { value: 'is', label: 'is' },
    { value: 'is_not', label: 'is not' },
  ],
};

/** A condition's field, how it is compared, and what with. */
export const conditionFields = (
  condition: RuleCondition,
  board: BoardContext,
): FieldSpec[] => {
  const field: FieldSpec = {
    key: 'field',
    label: 'What to check',
    value: condition.field,
    options: CONDITION_FIELDS,
  };
  const op: FieldSpec = {
    key: 'op',
    label: 'How',
    value: condition.op,
    options: CONDITION_OPS[condition.field],
  };
  if (condition.field === 'assignee') return [field, op];
  const value: FieldSpec = {
    key: 'value',
    label: 'Value',
    value: condition.value,
    placeholder: 'Choose',
    options:
      condition.field === 'priority'
        ? priorityOptions
        : condition.field === 'label'
          ? labelOptions(board)
          : columnOptions(board),
  };
  // a label reads "Label [Bug] is on the task"; the others "Priority is [High]"
  return condition.field === 'label' ? [field, value, op] : [field, op, value];
};

export const newCondition = (): RuleCondition => ({
  field: 'assignee',
  op: 'is_empty',
});

/** The condition with one part changed; a new field starts from its default. */
export const withConditionField = (
  condition: RuleCondition,
  key: string,
  value: string,
): RuleCondition => {
  if (key === 'field') {
    if (value === 'priority')
      return { field: 'priority', op: 'is', value: 'high' };
    if (value === 'label') return { field: 'label', op: 'has', value: '' };
    if (value === 'column') return { field: 'column', op: 'is', value: '' };
    return newCondition();
  }
  return { ...condition, [key]: value } as RuleCondition;
};

const ACTION_LABELS: Record<RuleActionType, string> = {
  move: 'Move it to',
  assign: 'Assign',
  set_priority: 'Set the priority to',
  set_due: 'Make it due',
  add_label: 'Add the label',
  remove_label: 'Remove the label',
  comment: 'Add a comment',
  notify: 'Notify',
  create_task: 'Create a task from',
  archive: 'Archive it',
};

export const actionLabel = (type: RuleActionType): string =>
  ACTION_LABELS[type];

/** The values an action has. `hasActor`: someone makes the change. */
export const actionFields = (
  action: RuleAction,
  board: BoardContext,
  hasActor: boolean,
): FieldSpec[] => {
  switch (action.type) {
    case 'move':
      return [
        {
          key: 'columnId',
          label: 'Column',
          value: action.columnId,
          options: columnOptions(board),
          placeholder: 'Choose a column',
        },
      ];
    case 'assign':
      return [
        {
          key: 'userId',
          label: 'Person',
          value: action.userId,
          options: [
            ...(hasActor
              ? [{ value: ACTOR, label: 'Whoever made the change' }]
              : []),
            ...memberOptions(board),
          ],
          placeholder: 'Choose someone',
        },
      ];
    case 'set_priority':
      return [
        {
          key: 'priority',
          label: 'Priority',
          value: action.priority,
          options: priorityOptions,
        },
      ];
    case 'set_due':
      return [
        {
          key: 'days',
          label: 'When',
          value: String(action.days),
          options: [0, 1, 2, 3, 7, 14, 30].map((n) => ({
            value: String(n),
            label: n === 0 ? 'That day' : `In ${countOf(n, 'day')}`,
          })),
        },
      ];
    case 'add_label':
    case 'remove_label':
      return [
        {
          key: 'label',
          label: 'Label',
          value: action.label,
          options: labelOptions(board),
          placeholder: 'Choose a label',
        },
      ];
    case 'comment':
      return [
        {
          key: 'body',
          label: 'Comment',
          value: action.body,
          options: [],
          placeholder: 'What should it say?',
          text: true,
        },
      ];
    case 'notify':
      return [
        {
          key: 'to',
          label: 'Who',
          value: action.to,
          options: [
            { value: 'creator', label: 'The person who created it' },
            { value: 'assignees', label: 'The assignees' },
            ...memberOptions(board),
          ],
        },
      ];
    case 'create_task':
      return [
        {
          key: 'templateId',
          label: 'Template',
          value: action.templateId,
          options: board.templates.map((t) => ({
            value: t.id,
            label: t.title,
          })),
          placeholder: 'Choose a template',
        },
        {
          key: 'columnId',
          label: 'Column',
          pre: 'in',
          value: action.columnId,
          options: columnOptions(board),
          placeholder: 'Choose a column',
        },
      ];
    case 'archive':
      return [];
  }
};

/** A new step of this kind, with nothing picked where there is no default. */
export const newAction = (type: RuleActionType): RuleAction => {
  switch (type) {
    case 'move':
      return { type, columnId: '' };
    case 'assign':
      return { type, userId: '' };
    case 'set_priority':
      return { type, priority: 'high' };
    case 'set_due':
      return { type, days: 1 };
    case 'add_label':
    case 'remove_label':
      return { type, label: '' };
    case 'comment':
      return { type, body: '' };
    case 'notify':
      return { type, to: 'assignees' };
    case 'create_task':
      return { type, templateId: '', columnId: '' };
    case 'archive':
      return { type };
  }
};

export const withActionField = (
  action: RuleAction,
  key: string,
  value: string,
): RuleAction => {
  if (action.type === 'set_due') return { ...action, days: Number(value) };
  if (action.type === 'set_priority') {
    return { ...action, priority: value as TaskPriority };
  }
  return { ...action, [key]: value } as RuleAction;
};

/** The steps that can still be added to this rule. */
export const addableActions = (
  draft: EditorDraft,
): { type: RuleActionType; title: string }[] => {
  // before a trigger is picked, everything a rule can do is on offer
  const allowed = draft.trigger
    ? actionsFor(draft.trigger)
    : ACTIONS.map((a) => a.type);
  const used = new Set(draft.actions.map((a) => a.type));
  // labels and people can be added more than once; the rest only once
  const repeatable = new Set<RuleActionType>([
    'add_label',
    'remove_label',
    'assign',
    'notify',
    'create_task',
  ]);
  return ACTIONS.filter(
    ({ type }) =>
      allowed.includes(type) && (repeatable.has(type) || !used.has(type)),
  );
};

/**
 * The draft with another trigger. A rule at a set time has no task, so it
 * keeps only steps that make one and drops its conditions; a trigger with
 * nobody behind it cannot assign "whoever made the change".
 */
export const withTrigger = (
  draft: EditorDraft,
  type: RuleTriggerType,
): EditorDraft => {
  const trigger = defaultTrigger(type);
  if (type === 'schedule') {
    const creates = draft.actions.filter((a) => a.type === 'create_task');
    return {
      ...draft,
      trigger,
      conditions: [],
      actions: creates.length > 0 ? creates : [newAction('create_task')],
    };
  }
  return {
    ...draft,
    trigger,
    actions: triggerHasActor(type)
      ? draft.actions
      : draft.actions.map((a) =>
          a.type === 'assign' && a.userId === ACTOR ? { ...a, userId: '' } : a,
        ),
  };
};

const blank = (action: RuleAction): boolean =>
  (action.type === 'move' && !action.columnId) ||
  (action.type === 'assign' && !action.userId) ||
  ((action.type === 'add_label' || action.type === 'remove_label') &&
    !action.label) ||
  (action.type === 'comment' && !action.body.trim()) ||
  (action.type === 'create_task' && (!action.templateId || !action.columnId));

/** Why the rule cannot be saved yet, in words; null when it can. */
export const draftProblem = (
  draft: EditorDraft,
  board: BoardContext,
): string | null => {
  const { trigger } = draft;
  if (!trigger) return 'Pick a When and a Then to save';
  if (draft.actions.length === 0) return 'Pick what the rule should do';
  if (trigger.type === 'schedule' && trigger.every === 'week') {
    if (!trigger.weekdays?.length) return 'Pick at least one day';
  }
  if (draft.conditions.some((c) => 'value' in c && !c.value)) {
    return 'Finish the condition';
  }
  if (draft.actions.some(blank)) return 'Something is not picked yet';
  return missingRef(ruleRefs({ ...draft, trigger }), {
    columnIds: new Set(board.columns.map((c) => c.id)),
    memberIds: new Set(board.members.map((m) => m.id)),
    labels: new Set(board.labels),
    templateIds: new Set(board.templates.map((t) => t.id)),
  });
};

/** "From the template: 3 subtasks, assigned to Noravut C., due in 2 days." */
export const templateNote = (
  template: TaskTemplate | undefined,
  board: BoardContext,
): string | null => {
  if (!template) return null;
  const people = template.assigneeIds.flatMap((id) => {
    const member = board.members.find((m) => m.id === id);
    return member ? [shortName(member.name)] : [];
  });
  const parts = [
    template.subtasks.length > 0
      ? countOf(template.subtasks.length, 'subtask')
      : null,
    people.length > 0 ? `assigned to ${joinNames(people)}` : null,
    template.dueInDays === null
      ? null
      : template.dueInDays === 0
        ? 'due the day it is created'
        : `due ${countOf(template.dueInDays, 'day')} after it is created`,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  const note = `From the template: ${parts.join(', ')}`;
  // a name like "Ploy S." already ends the sentence
  return note.endsWith('.') ? note : `${note}.`;
};

/** A rule that has nothing picked yet: what "New rule" opens with. */
export const emptyDraft: EditorDraft = {
  trigger: null,
  conditions: [],
  actions: [],
  enabled: true,
};

export const replaceAt = <T>(list: T[], index: number, item: T): T[] =>
  list.map((existing, i) => (i === index ? item : existing));

export const removeAt = <T>(list: T[], index: number): T[] =>
  list.filter((_, i) => i !== index);

/** What a comment step says under itself, so nobody is surprised by it. */
export const COMMENT_NOTE = 'Posted in the name of whoever saved this rule.';
