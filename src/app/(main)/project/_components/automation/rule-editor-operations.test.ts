import { describe, expect, it } from 'vitest';
import type { ScheduleTrigger, TaskTemplate } from '@/types';
import type { BoardContext } from './automation-operations';
import {
  actionFields,
  actionLabel,
  addableActions,
  conditionFields,
  draftProblem,
  emptyDraft,
  newAction,
  newCondition,
  removeAt,
  replaceAt,
  scheduleNote,
  templateNote,
  toggleWeekday,
  triggerFields,
  weekdayPills,
  withActionField,
  withConditionField,
  withTrigger,
  withTriggerField,
  type EditorDraft,
} from './rule-editor-operations';

const board: BoardContext = {
  columns: [
    { id: 'todo', name: 'To do', color: '#00f', isDone: false },
    { id: 'done', name: 'Done', color: '#0a0', isDone: true },
  ],
  members: [{ id: 'u1', name: 'Ploy Srisuk', avatar: null }],
  labels: ['Bug'],
  labelColors: { Bug: '#f00' },
  templates: [{ id: 't1', title: 'Weekly review' }],
};
const weekly: ScheduleTrigger = {
  type: 'schedule',
  every: 'week',
  weekdays: [1],
  time: '09:00',
};
const values = (fields: { key: string; value: string }[]) =>
  Object.fromEntries(fields.map((f) => [f.key, f.value]));

describe('the values of a trigger', () => {
  it('a move offers any column for both ends', () => {
    const fields = triggerFields(
      { type: 'task_moved', toColumnId: 'done' },
      board,
    );
    expect(values(fields)).toEqual({ fromColumnId: 'any', toColumnId: 'done' });
    expect(fields[0].options.map((o) => o.label)).toEqual([
      'Any column',
      'To do',
      'Done',
    ]);
    expect(fields.map((f) => f.pre)).toEqual(['From', 'to']);
  });

  it('"any" clears a filter, and a column sets it', () => {
    expect(
      withTriggerField(
        { type: 'task_moved', toColumnId: 'done' },
        'toColumnId',
        'any',
      ),
    ).toEqual({ type: 'task_moved', toColumnId: undefined });
    expect(
      withTriggerField({ type: 'task_created' }, 'columnId', 'todo'),
    ).toEqual({
      type: 'task_created',
      columnId: 'todo',
    });
  });

  it('days are numbers', () => {
    expect(
      withTriggerField({ type: 'due_soon', days: 1 }, 'days', '3'),
    ).toEqual({
      type: 'due_soon',
      days: 3,
    });
    expect(
      triggerFields({ type: 'task_idle', days: 7 }, board).map((f) => f.key),
    ).toEqual(['days', 'columnId']);
  });

  it('people, labels and plain triggers', () => {
    expect(
      triggerFields({ type: 'task_assigned' }, board)[0].options.map(
        (o) => o.label,
      ),
    ).toEqual(['Anyone', 'Ploy S.']);
    expect(
      triggerFields({ type: 'label_added', label: 'Bug' }, board)[0].value,
    ).toBe('Bug');
    expect(triggerFields({ type: 'task_finished' }, board)).toEqual([]);
  });

  it('a schedule shows the day of the month only when it is monthly', () => {
    expect(triggerFields(weekly, board).map((f) => f.key)).toEqual([
      'every',
      'time',
    ]);
    const monthly = withTriggerField(weekly, 'every', 'month');
    expect(monthly).toEqual({
      type: 'schedule',
      time: '09:00',
      every: 'month',
      monthDay: 1,
    });
    expect(triggerFields(monthly, board).map((f) => f.key)).toEqual([
      'every',
      'monthDay',
      'time',
    ]);
    expect(withTriggerField(monthly, 'monthDay', '15')).toMatchObject({
      monthDay: 15,
    });
    expect(withTriggerField(monthly, 'every', 'day')).toEqual({
      type: 'schedule',
      time: '09:00',
      every: 'day',
    });
    expect(withTriggerField(weekly, 'time', '14:30')).toMatchObject({
      time: '14:30',
    });
  });

  it('weekdays toggle, Monday first', () => {
    expect(
      weekdayPills(weekly).map((p) => `${p.letter}${p.on ? '*' : ''}`),
    ).toEqual(['M*', 'T', 'W', 'T', 'F', 'S', 'S']);
    expect(toggleWeekday(weekly, 4).weekdays).toEqual([1, 4]);
    expect(toggleWeekday(weekly, 1).weekdays).toEqual([]);
  });

  it('says when it runs next, in the workspace zone', () => {
    expect(
      scheduleNote(weekly, 'Asia/Bangkok', new Date('2026-11-12T03:00:00Z')),
    ).toBe(
      'Next: Mon, Nov 16 · Mon, Nov 23 · Mon, Nov 30. Times are in Asia/Bangkok, the time zone of this workspace.',
    );
    expect(scheduleNote({ ...weekly, weekdays: [] }, 'UTC', new Date())).toBe(
      'Times are in UTC, the time zone of this workspace.',
    );
  });
});

describe('conditions', () => {
  it('assignee has no value to pick; the others do', () => {
    expect(conditionFields(newCondition(), board).map((f) => f.key)).toEqual([
      'field',
      'op',
    ]);
    expect(
      conditionFields(
        { field: 'priority', op: 'is', value: 'high' },
        board,
      ).map((f) => f.key),
    ).toEqual(['field', 'op', 'value']);
    // a label reads "Label [Bug] is on the task"
    expect(
      conditionFields({ field: 'label', op: 'has', value: 'Bug' }, board).map(
        (f) => f.key,
      ),
    ).toEqual(['field', 'value', 'op']);
  });

  it('a new field starts from its own default', () => {
    expect(withConditionField(newCondition(), 'field', 'priority')).toEqual({
      field: 'priority',
      op: 'is',
      value: 'high',
    });
    expect(withConditionField(newCondition(), 'field', 'column')).toEqual({
      field: 'column',
      op: 'is',
      value: '',
    });
    expect(
      withConditionField(
        { field: 'label', op: 'has', value: '' },
        'value',
        'Bug',
      ),
    ).toEqual({ field: 'label', op: 'has', value: 'Bug' });
    expect(
      withConditionField(
        { field: 'label', op: 'has', value: 'Bug' },
        'field',
        'assignee',
      ),
    ).toEqual(newCondition());
  });
});

describe('actions', () => {
  it('"whoever made the change" is offered only when someone does', () => {
    const assign = newAction('assign');
    expect(
      actionFields(assign, board, true)[0].options.map((o) => o.label),
    ).toEqual(['Whoever made the change', 'Ploy S.']);
    expect(
      actionFields(assign, board, false)[0].options.map((o) => o.label),
    ).toEqual(['Ploy S.']);
  });

  it('every kind has its values and its words', () => {
    expect(actionFields(newAction('archive'), board, true)).toEqual([]);
    expect(actionFields(newAction('comment'), board, true)[0].text).toBe(true);
    expect(
      actionFields(newAction('create_task'), board, true).map((f) => f.key),
    ).toEqual(['templateId', 'columnId']);
    expect(
      actionFields(newAction('set_due'), board, true)[0].options.map(
        (o) => o.label,
      ),
    ).toEqual([
      'That day',
      'In 1 day',
      'In 2 days',
      'In 3 days',
      'In 7 days',
      'In 14 days',
      'In 30 days',
    ]);
    expect(actionFields(newAction('notify'), board, true)[0].value).toBe(
      'assignees',
    );
    expect(
      actionFields(newAction('add_label'), board, true)[0].placeholder,
    ).toBe('Choose a label');
    expect(
      actionFields(newAction('move'), board, true)[0].options,
    ).toHaveLength(2);
    expect(actionFields(newAction('set_priority'), board, true)[0].value).toBe(
      'high',
    );
    expect(actionLabel('remove_label')).toBe('Remove the label');
  });

  it('changes one value', () => {
    expect(withActionField(newAction('move'), 'columnId', 'done')).toEqual({
      type: 'move',
      columnId: 'done',
    });
    expect(withActionField(newAction('set_due'), 'days', '7')).toEqual({
      type: 'set_due',
      days: 7,
    });
    expect(
      withActionField(newAction('set_priority'), 'priority', 'low'),
    ).toEqual({
      type: 'set_priority',
      priority: 'low',
    });
  });

  it('offers what can still be added', () => {
    expect(addableActions(emptyDraft)).toHaveLength(10);
    const used: EditorDraft = {
      ...emptyDraft,
      trigger: { type: 'task_finished' },
      actions: [newAction('archive'), newAction('add_label')],
    };
    const types = addableActions(used).map((a) => a.type);
    expect(types).not.toContain('archive');
    // a second label can be added
    expect(types).toContain('add_label');
    expect(
      addableActions({ ...emptyDraft, trigger: weekly }).map((a) => a.type),
    ).toEqual(['create_task']);
  });

  it('lists edit in place', () => {
    expect(replaceAt(['a', 'b'], 1, 'c')).toEqual(['a', 'c']);
    expect(removeAt(['a', 'b'], 0)).toEqual(['b']);
  });
});

describe('changing the trigger', () => {
  const draft: EditorDraft = {
    trigger: { type: 'task_moved' },
    conditions: [newCondition()],
    actions: [{ type: 'assign', userId: 'actor' }, newAction('archive')],
    enabled: true,
  };

  it('a set time keeps only steps that make a task, and no conditions', () => {
    expect(withTrigger(draft, 'schedule')).toMatchObject({
      trigger: { type: 'schedule', every: 'week' },
      conditions: [],
      actions: [{ type: 'create_task', templateId: '', columnId: '' }],
    });
  });

  it('a date has nobody behind it: "whoever made the change" is cleared', () => {
    expect(withTrigger(draft, 'due_passed').actions[0]).toEqual({
      type: 'assign',
      userId: '',
    });
    expect(withTrigger(draft, 'task_created').actions[0]).toEqual({
      type: 'assign',
      userId: 'actor',
    });
  });
});

describe('whether a rule can be saved', () => {
  const ok: EditorDraft = {
    trigger: { type: 'task_finished' },
    conditions: [],
    actions: [{ type: 'archive' }],
    enabled: true,
  };
  it('says what is still missing, in order', () => {
    expect(draftProblem(emptyDraft, board)).toBe(
      'Pick a When and a Then to save',
    );
    expect(draftProblem({ ...ok, actions: [] }, board)).toBe(
      'Pick what the rule should do',
    );
    expect(
      draftProblem(
        {
          ...ok,
          trigger: { ...weekly, weekdays: [] },
          actions: [newAction('create_task')],
        },
        board,
      ),
    ).toBe('Pick at least one day');
    expect(
      draftProblem(
        { ...ok, conditions: [{ field: 'label', op: 'has', value: '' }] },
        board,
      ),
    ).toBe('Finish the condition');
    for (const type of [
      'move',
      'assign',
      'add_label',
      'comment',
      'create_task',
    ] as const) {
      expect(
        draftProblem({ ...ok, actions: [newAction(type)] }, board),
        type,
      ).toBe('Something is not picked yet');
    }
    expect(draftProblem(ok, board)).toBeNull();
  });

  it('refuses what the board no longer has', () => {
    expect(
      draftProblem(
        { ...ok, actions: [{ type: 'move', columnId: 'gone' }] },
        board,
      ),
    ).toBe('A column this rule uses was deleted');
  });
});

describe('what a template brings', () => {
  const template = {
    subtasks: ['a', 'b', 'c'],
    assigneeIds: ['u1', 'left'],
    dueInDays: 2,
  } as TaskTemplate;
  it('is one sentence, without a second full stop after a short name', () => {
    expect(templateNote(template, board)).toBe(
      'From the template: 3 subtasks, assigned to Ploy S., due 2 days after it is created.',
    );
    expect(templateNote({ ...template, dueInDays: null }, board)).toBe(
      'From the template: 3 subtasks, assigned to Ploy S.',
    );
    expect(
      templateNote(
        { ...template, subtasks: [], assigneeIds: [], dueInDays: 0 },
        board,
      ),
    ).toBe('From the template: due the day it is created.');
  });
  it('is nothing for a template with no extras, or none picked', () => {
    expect(
      templateNote(
        { ...template, subtasks: [], assigneeIds: [], dueInDays: null },
        board,
      ),
    ).toBeNull();
    expect(templateNote(undefined, board)).toBeNull();
  });
});
