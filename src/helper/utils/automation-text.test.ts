import { describe, expect, it } from 'vitest';
import {
  partsText,
  ruleSentence,
  runDetail,
  runNote,
  thenParts,
  whenParts,
  whenText,
  type RuleNames,
} from './automation-text';

const names: RuleNames = {
  columns: {
    review: { name: 'Review', color: '#8b5cf6' },
    todo: { name: 'To do', color: '#3b82f6' },
  },
  people: { u1: 'Ploy Srisuk' },
  templates: { t1: 'Weekly review' },
};

describe('a rule in words', () => {
  it('reads as one sentence', () => {
    expect(
      ruleSentence(
        {
          trigger: { type: 'task_moved', toColumnId: 'review' },
          conditions: [{ field: 'assignee', op: 'is_empty' }],
          actions: [
            { type: 'assign', userId: 'u1' },
            { type: 'add_label', label: 'Needs review' },
          ],
        },
        names,
      ),
    ).toBe(
      'When a task moves to Review and nobody is assigned, assign Ploy S. and add the label Needs review.',
    );
  });

  it('does not end with two full stops after a shortened name', () => {
    expect(
      ruleSentence(
        {
          trigger: { type: 'task_finished' },
          conditions: [],
          actions: [{ type: 'assign', userId: 'u1' }],
        },
        names,
      ),
    ).toBe('When a task is finished, assign Ploy S.');
  });

  it('a schedule names its days and time', () => {
    expect(
      ruleSentence(
        {
          trigger: {
            type: 'schedule',
            every: 'week',
            weekdays: [4, 1],
            time: '09:00',
          },
          conditions: [],
          actions: [
            { type: 'create_task', templateId: 't1', columnId: 'todo' },
          ],
        },
        names,
      ),
    ).toBe('Every Monday and Thursday at 9:00, create Weekly review in To do.');
    expect(
      whenText(
        {
          trigger: {
            type: 'schedule',
            every: 'month',
            monthDay: 1,
            time: '09:00',
          },
          conditions: [],
        },
        names,
      ),
    ).toBe('On day 1 of every month at 9:00');
  });

  it('joins three steps with a comma and "and"', () => {
    expect(
      partsText(
        thenParts(
          [
            { type: 'set_priority', priority: 'high' },
            { type: 'notify', to: 'assignees' },
            { type: 'archive' },
          ],
          names,
        ),
      ),
    ).toBe('Set the priority to High, notify the assignees and archive it');
  });

  it('draws values as chips of their kind', () => {
    const parts = whenParts(
      {
        trigger: { type: 'task_idle', days: 7, columnId: 'review' },
        conditions: [{ field: 'priority', op: 'is', value: 'high' }],
      },
      names,
    );
    expect(parts.map((p) => p.kind)).toEqual([
      'text',
      'value',
      'text',
      'column',
      'text',
      'text',
      'priority',
    ]);
    expect(partsText(parts)).toBe(
      'When a task has not moved for 7 days in Review and the priority is High',
    );
  });

  it('says so when what it points at is gone', () => {
    expect(
      whenText(
        { trigger: { type: 'task_created', columnId: 'gone' }, conditions: [] },
        names,
      ),
    ).toBe('When a task is created in a deleted column');
    expect(
      partsText(thenParts([{ type: 'assign', userId: 'left' }], names)),
    ).toBe('Assign someone who left');
  });

  it('covers every trigger without a column or person', () => {
    const when = (trigger: Parameters<typeof whenText>[0]['trigger']) =>
      whenText({ trigger, conditions: [] }, names);
    expect(when({ type: 'task_moved' })).toBe(
      'When a task moves to another column',
    );
    expect(when({ type: 'task_moved', fromColumnId: 'todo' })).toBe(
      'When a task leaves To do',
    );
    expect(when({ type: 'task_assigned', userId: 'u1' })).toBe(
      'When Ploy S. is assigned to a task',
    );
    expect(when({ type: 'label_added', label: 'Bug' })).toBe(
      'When the label Bug is added',
    );
    expect(when({ type: 'due_soon', days: 1 })).toBe(
      'When a due date is 1 day away',
    );
    expect(when({ type: 'schedule', every: 'day', time: '14:30' })).toBe(
      'Every day at 14:30',
    );
  });
});

describe('what a run did', () => {
  it('is a list for History and a sentence for the note', () => {
    const did = ['assigned Ploy S.', 'added Needs review'];
    expect(runDetail(did)).toBe('Assigned Ploy S., added Needs review');
    expect(runNote(did)).toBe('A rule assigned Ploy S. and added Needs review');
    expect(runNote(['moved it to Review'])).toBe('A rule moved it to Review');
  });
});
