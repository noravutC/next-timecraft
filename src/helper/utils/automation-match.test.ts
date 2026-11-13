import { describe, expect, it } from 'vitest';
import type { TaskActivityEntry } from '@/types';
import {
  conditionsHold,
  ruleEventsOf,
  triggerMatches,
  webhookEventsOf,
  type TaskFacts,
} from './automation-match';

const col = (id: string) => ({ id, name: id, color: null });
const moved = (from: string, to: string): TaskActivityEntry => ({
  type: 'moved',
  data: { from: col(from), to: col(to) },
});
const task: TaskFacts = {
  columnId: 'review',
  priority: 'medium',
  tags: ['Bug'],
  assigneeIds: [],
};

describe('what a change means to rules', () => {
  it('a move into Done is also the task being finished', () => {
    expect(ruleEventsOf(moved('doing', 'done'), 'done')).toEqual([
      { type: 'task_moved', fromColumnId: 'doing', toColumnId: 'done' },
      { type: 'task_finished' },
    ]);
    expect(ruleEventsOf(moved('doing', 'review'), 'done')).toEqual([
      { type: 'task_moved', fromColumnId: 'doing', toColumnId: 'review' },
    ]);
  });

  it('a task made in Done is created and finished', () => {
    const made: TaskActivityEntry = {
      type: 'created',
      data: { column: col('done') },
    };
    expect(ruleEventsOf(made, 'done').map((e) => e.type)).toEqual([
      'task_created',
      'task_finished',
    ]);
    expect(ruleEventsOf(made, null).map((e) => e.type)).toEqual([
      'task_created',
    ]);
  });

  it('only people and labels that were added count', () => {
    expect(
      ruleEventsOf(
        {
          type: 'assignees_changed',
          data: { added: [], removed: [{ id: 'u1', name: 'A' }] },
        },
        null,
      ),
    ).toEqual([]);
    expect(
      ruleEventsOf(
        { type: 'labels_changed', data: { added: ['Bug'], removed: [] } },
        null,
      ),
    ).toEqual([{ type: 'label_added', labels: ['Bug'] }]);
  });

  it('edits that no rule waits for start nothing', () => {
    expect(
      ruleEventsOf({ type: 'renamed', data: { from: 'a', to: 'b' } }, null),
    ).toEqual([]);
    expect(
      ruleEventsOf({ type: 'subtask_reopened', data: { title: 'x' } }, null),
    ).toEqual([]);
  });
});

describe('whether a rule waits for this change', () => {
  it('a move matches any column unless the rule names one', () => {
    const event = {
      type: 'task_moved',
      fromColumnId: 'doing',
      toColumnId: 'review',
    } as const;
    expect(triggerMatches({ type: 'task_moved' }, event)).toBe(true);
    expect(
      triggerMatches({ type: 'task_moved', toColumnId: 'review' }, event),
    ).toBe(true);
    expect(
      triggerMatches({ type: 'task_moved', toColumnId: 'done' }, event),
    ).toBe(false);
    expect(
      triggerMatches(
        { type: 'task_moved', fromColumnId: 'todo', toColumnId: 'review' },
        event,
      ),
    ).toBe(false);
  });

  it('a rule for one person or label needs that one', () => {
    expect(
      triggerMatches(
        { type: 'task_assigned', userId: 'u2' },
        { type: 'task_assigned', userIds: ['u1'] },
      ),
    ).toBe(false);
    expect(
      triggerMatches(
        { type: 'label_added', label: 'Bug' },
        { type: 'label_added', labels: ['Bug', 'Infra'] },
      ),
    ).toBe(true);
  });

  it('never matches a different kind of change', () => {
    expect(
      triggerMatches({ type: 'task_finished' }, { type: 'subtasks_done' }),
    ).toBe(false);
    expect(
      triggerMatches({ type: 'subtasks_done' }, { type: 'subtasks_done' }),
    ).toBe(true);
    // dates and the clock are looked for by the jobs, not by a change
    expect(
      triggerMatches({ type: 'due_passed' }, { type: 'task_finished' }),
    ).toBe(false);
  });
});

describe('conditions on the task', () => {
  it('pass when there are none', () => {
    expect(conditionsHold([], task)).toBe(true);
  });

  it('check assignees, priority, labels and the column', () => {
    expect(conditionsHold([{ field: 'assignee', op: 'is_empty' }], task)).toBe(
      true,
    );
    expect(
      conditionsHold([{ field: 'assignee', op: 'is_not_empty' }], task),
    ).toBe(false);
    expect(
      conditionsHold(
        [{ field: 'priority', op: 'is_not', value: 'high' }],
        task,
      ),
    ).toBe(true);
    expect(
      conditionsHold([{ field: 'label', op: 'has_not', value: 'Bug' }], task),
    ).toBe(false);
    expect(
      conditionsHold([{ field: 'column', op: 'is', value: 'review' }], task),
    ).toBe(true);
  });

  it('need every one to hold', () => {
    expect(
      conditionsHold(
        [
          { field: 'label', op: 'has', value: 'Bug' },
          { field: 'priority', op: 'is', value: 'high' },
        ],
        task,
      ),
    ).toBe(false);
  });
});

describe('what a change means to webhooks', () => {
  it('names moves, finishes, edits and removals', () => {
    expect(webhookEventsOf(moved('a', 'done'), 'done')).toEqual([
      'task.moved',
      'task.finished',
    ]);
    expect(webhookEventsOf(moved('a', 'b'), 'done')).toEqual(['task.moved']);
    expect(webhookEventsOf({ type: 'archived', data: {} }, null)).toEqual([
      'task.removed',
    ]);
    expect(
      webhookEventsOf({ type: 'renamed', data: { from: 'a', to: 'b' } }, null),
    ).toEqual(['task.updated']);
  });

  it('leaves subtasks and logged time out', () => {
    expect(
      webhookEventsOf(
        { type: 'subtask_completed', data: { title: 'x' } },
        null,
      ),
    ).toEqual([]);
    expect(
      webhookEventsOf(
        { type: 'time_logged', data: { minutes: 5, day: '2026-11-12' } },
        null,
      ),
    ).toEqual([]);
  });
});
