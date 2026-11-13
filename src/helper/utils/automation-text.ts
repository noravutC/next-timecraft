import { PRIORITY_STYLES } from '@/lib/task-priority';
import type {
  RuleAction,
  RuleCondition,
  RuleTrigger,
  TaskPriority,
} from '@/types';
import { ACTOR } from './automation';
import { formatScheduleTime, WEEKDAYS } from './automation-schedule';
import { countOf } from './insights';
import { shortName } from './person-name';
import { joinNames } from './task-activity-view';

/** The board's names for the ids a rule holds. */
export type RuleNames = {
  columns: Record<string, { name: string; color: string | null }>;
  people: Record<string, string>;
  templates: Record<string, string>;
};

/** One piece of a rule in words: plain text, or a value drawn as a chip. */
export type RulePart =
  | { kind: 'text'; text: string }
  | { kind: 'column'; text: string; color: string | null }
  | { kind: 'person'; text: string; userId: string }
  | { kind: 'label'; text: string }
  | { kind: 'priority'; text: string; level: TaskPriority }
  | { kind: 'value'; text: string };

const text = (value: string): RulePart => ({ kind: 'text', text: value });
const value = (v: string): RulePart => ({ kind: 'value', text: v });

// a rule still being written has blanks: they read as "…"
const BLANK = '…';

const column = (id: string, names: RuleNames): RulePart => {
  const found = names.columns[id];
  return found
    ? { kind: 'column', text: found.name, color: found.color }
    : value(id ? 'a deleted column' : BLANK);
};

const person = (id: string, names: RuleNames): RulePart =>
  names.people[id]
    ? { kind: 'person', text: shortName(names.people[id]), userId: id }
    : value(id ? 'someone who left' : BLANK);

const priority = (level: TaskPriority): RulePart => ({
  kind: 'priority',
  text: PRIORITY_STYLES[level].label,
  level,
});

const label = (name: string): RulePart =>
  name ? { kind: 'label', text: name } : value(BLANK);

const days = (n: number) => value(countOf(n, 'day'));

const triggerParts = (trigger: RuleTrigger, names: RuleNames): RulePart[] => {
  switch (trigger.type) {
    case 'task_created':
      return trigger.columnId
        ? [text('When a task is created in'), column(trigger.columnId, names)]
        : [text('When a task is created')];
    case 'task_moved':
      if (trigger.fromColumnId && trigger.toColumnId) {
        return [
          text('When a task moves from'),
          column(trigger.fromColumnId, names),
          text('to'),
          column(trigger.toColumnId, names),
        ];
      }
      if (trigger.toColumnId) {
        return [
          text('When a task moves to'),
          column(trigger.toColumnId, names),
        ];
      }
      return trigger.fromColumnId
        ? [text('When a task leaves'), column(trigger.fromColumnId, names)]
        : [text('When a task moves to another column')];
    case 'task_finished':
      return [text('When a task is finished')];
    case 'task_assigned':
      return trigger.userId
        ? [
            text('When'),
            person(trigger.userId, names),
            text('is assigned to a task'),
          ]
        : [text('When someone is assigned to a task')];
    case 'label_added':
      return trigger.label
        ? [text('When the label'), label(trigger.label), text('is added')]
        : [text('When a label is added')];
    case 'subtasks_done':
      return [text('When all subtasks of a task are done')];
    case 'due_soon':
      return [text('When a due date is'), days(trigger.days), text('away')];
    case 'due_passed':
      return [text('When a due date has passed')];
    case 'task_idle':
      return [
        text('When a task has not moved for'),
        days(trigger.days),
        ...(trigger.columnId
          ? [text('in'), column(trigger.columnId, names)]
          : []),
      ];
    case 'schedule': {
      const time = value(formatScheduleTime(trigger.time));
      if (trigger.every === 'month') {
        return [
          text('On day'),
          value(String(trigger.monthDay ?? 1)),
          text('of every month at'),
          time,
        ];
      }
      if (trigger.every === 'day') return [text('Every day at'), time];
      const picked = [...(trigger.weekdays ?? [])].sort(
        (a, b) => ((a + 6) % 7) - ((b + 6) % 7),
      );
      return [
        text('Every'),
        ...picked.flatMap((d, i) => [
          ...(i > 0 ? [text(i === picked.length - 1 ? 'and' : ',')] : []),
          value(WEEKDAYS[d]),
        ]),
        text('at'),
        time,
      ];
    }
  }
};

const conditionParts = (c: RuleCondition, names: RuleNames): RulePart[] => {
  switch (c.field) {
    case 'assignee':
      return [
        text(
          c.op === 'is_empty' ? 'nobody is assigned' : 'someone is assigned',
        ),
      ];
    case 'priority':
      return [
        text(c.op === 'is' ? 'the priority is' : 'the priority is not'),
        priority(c.value),
      ];
    case 'label':
      return [
        text(
          c.op === 'has' ? 'it has the label' : 'it does not have the label',
        ),
        label(c.value),
      ];
    case 'column':
      return [
        text(c.op === 'is' ? 'it is in' : 'it is not in'),
        column(c.value, names),
      ];
  }
};

const actionParts = (action: RuleAction, names: RuleNames): RulePart[] => {
  switch (action.type) {
    case 'move':
      return [text('move it to'), column(action.columnId, names)];
    case 'assign':
      return action.userId === ACTOR
        ? [text('assign whoever made the change')]
        : [text('assign'), person(action.userId, names)];
    case 'set_priority':
      return [text('set the priority to'), priority(action.priority)];
    case 'set_due':
      return action.days === 0
        ? [text('make it due that day')]
        : [text('make it due in'), days(action.days)];
    case 'add_label':
      return [text('add the label'), label(action.label)];
    case 'remove_label':
      return [text('remove the label'), label(action.label)];
    case 'comment':
      return [text('add a comment')];
    case 'notify':
      if (action.to === 'creator') {
        return [text('notify the person who created it')];
      }
      return action.to === 'assignees'
        ? [text('notify the assignees')]
        : [text('notify'), person(action.to, names)];
    case 'create_task':
      return [
        text('create'),
        value(
          names.templates[action.templateId] ??
            (action.templateId ? 'a deleted template' : BLANK),
        ),
        text('in'),
        column(action.columnId, names),
      ];
    case 'archive':
      return [text('archive it')];
  }
};

const capitalized = (parts: RulePart[]): RulePart[] => {
  const [first, ...rest] = parts;
  return first?.kind === 'text'
    ? [text(first.text.charAt(0).toUpperCase() + first.text.slice(1)), ...rest]
    : parts;
};

/** "When a task moves to [Review] and nobody is assigned" */
export const whenParts = (
  rule: { trigger: RuleTrigger; conditions: RuleCondition[] },
  names: RuleNames,
): RulePart[] => [
  ...triggerParts(rule.trigger, names),
  ...rule.conditions.flatMap((c) => [text('and'), ...conditionParts(c, names)]),
];

/** "Assign [Ploy S.] and add the label [Needs review]" */
export const thenParts = (
  actions: RuleAction[],
  names: RuleNames,
): RulePart[] =>
  capitalized(
    actions.flatMap((action, i) => [
      ...(i > 0 ? [text(i === actions.length - 1 ? 'and' : ',')] : []),
      ...actionParts(action, names),
    ]),
  );

/** Parts as one line of text: a comma hugs the word before it. */
export const partsText = (parts: RulePart[]): string =>
  parts
    .map((p) => p.text)
    .join(' ')
    .replace(/ ,/g, ',');

/** A rule's trigger and conditions in words, as History names it. */
export const whenText = (
  rule: { trigger: RuleTrigger; conditions: RuleCondition[] },
  names: RuleNames,
): string => partsText(whenParts(rule, names));

/** The whole rule as one sentence, for "In plain words". */
export const ruleSentence = (
  rule: {
    trigger: RuleTrigger;
    conditions: RuleCondition[];
    actions: RuleAction[];
  },
  names: RuleNames,
): string => {
  const then = partsText(thenParts(rule.actions, names));
  const sentence = then
    ? `${whenText(rule, names)}, ${then.charAt(0).toLowerCase()}${then.slice(1)}`
    : whenText(rule, names);
  // a name like "Ploy S." already ends the sentence
  return sentence.endsWith('.') ? sentence : `${sentence}.`;
};

/** "Assigned Ploy S., added Needs review": what a run did, for History. */
export const runDetail = (did: string[]): string => {
  const line = did.join(', ');
  return line.charAt(0).toUpperCase() + line.slice(1);
};

/** "A rule assigned Ploy S. and added Needs review": the note on the board. */
export const runNote = (did: string[]): string =>
  `A rule ${did.length > 0 ? joinNames(did) : 'ran'}`;
