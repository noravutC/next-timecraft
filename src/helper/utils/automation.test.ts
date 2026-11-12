import { describe, expect, it } from 'vitest';
import {
  ACTIONS,
  ACTOR,
  actionsFor,
  defaultTrigger,
  isDateTrigger,
  isScheduleRule,
  missingRef,
  repeatRule,
  ruleRefs,
  templateFromTask,
  TRIGGER_GROUP_CAPTIONS,
  triggerHasActor,
  TRIGGERS,
  triggerTitle,
  WEBHOOK_EVENTS,
  webhookEventName,
  type BoardRefs,
} from './automation';

const board: BoardRefs = {
  columnIds: new Set(['todo', 'review']),
  memberIds: new Set(['u1']),
  labels: new Set(['Bug']),
  templateIds: new Set(['t1']),
};

describe('what a rule points at', () => {
  it('collects columns, people, labels and templates once each', () => {
    expect(
      ruleRefs({
        trigger: {
          type: 'task_moved',
          fromColumnId: 'todo',
          toColumnId: 'review',
        },
        conditions: [
          { field: 'label', op: 'has', value: 'Bug' },
          { field: 'column', op: 'is', value: 'review' },
        ],
        actions: [
          { type: 'assign', userId: 'u1' },
          { type: 'notify', to: 'u1' },
          { type: 'add_label', label: 'Bug' },
          { type: 'create_task', templateId: 't1', columnId: 'todo' },
        ],
      }),
    ).toEqual({
      columnIds: ['todo', 'review'],
      userIds: ['u1'],
      labels: ['Bug'],
      templateIds: ['t1'],
    });
  });

  it('does not count stand-ins or a label being removed', () => {
    expect(
      ruleRefs({
        trigger: { type: 'task_finished' },
        conditions: [],
        actions: [
          { type: 'assign', userId: ACTOR },
          { type: 'notify', to: 'creator' },
          { type: 'notify', to: 'assignees' },
          { type: 'remove_label', label: 'Old' },
        ],
      }),
    ).toEqual({ columnIds: [], userIds: [], labels: [], templateIds: [] });
  });

  it('names the first thing the board no longer has', () => {
    const refs = (over: Partial<ReturnType<typeof ruleRefs>>) => ({
      columnIds: [],
      userIds: [],
      labels: [],
      templateIds: [],
      ...over,
    });
    expect(missingRef(refs({ columnIds: ['todo'] }), board)).toBeNull();
    expect(missingRef(refs({ columnIds: ['gone'] }), board)).toBe(
      'A column this rule uses was deleted',
    );
    expect(missingRef(refs({ userIds: ['left'] }), board)).toBe(
      'Someone this rule uses is no longer on the board',
    );
    expect(missingRef(refs({ labels: ['Triage'] }), board)).toBe(
      'The label Triage was deleted',
    );
    expect(missingRef(refs({ templateIds: ['x'] }), board)).toBe(
      'The template this rule uses was deleted',
    );
  });
});

describe('the catalog', () => {
  it('lists ten triggers and ten actions', () => {
    expect(TRIGGERS).toHaveLength(10);
    expect(ACTIONS).toHaveLength(10);
  });

  it('a rule at a set time can only create tasks', () => {
    expect(
      actionsFor({ type: 'schedule', every: 'day', time: '09:00' }),
    ).toEqual(['create_task']);
    expect(actionsFor({ type: 'task_finished' })).toHaveLength(10);
  });

  it('knows which triggers have someone behind them', () => {
    expect(triggerHasActor('task_moved')).toBe(true);
    expect(triggerHasActor('due_passed')).toBe(false);
    expect(triggerHasActor('schedule')).toBe(false);
    expect(isDateTrigger('task_idle')).toBe(true);
    expect(isDateTrigger('schedule')).toBe(false);
  });

  it('starts a new trigger with sensible values', () => {
    expect(defaultTrigger('task_idle')).toEqual({ type: 'task_idle', days: 7 });
    expect(defaultTrigger('schedule')).toEqual({
      type: 'schedule',
      every: 'week',
      weekdays: [1],
      time: '09:00',
    });
    expect(defaultTrigger('task_finished')).toEqual({ type: 'task_finished' });
  });

  it('names triggers and their groups', () => {
    expect(triggerTitle('task_idle')).toBe('A task has not moved');
    expect(Object.keys(TRIGGER_GROUP_CAPTIONS)).toEqual([
      'task',
      'date',
      'time',
    ]);
    expect(
      isScheduleRule({ type: 'schedule', every: 'day', time: '09:00' }),
    ).toBe(true);
    expect(isScheduleRule({ type: 'task_finished' })).toBe(false);
    expect(WEBHOOK_EVENTS).toHaveLength(6);
  });

  it('names webhook events', () => {
    expect(webhookEventName('task.finished')).toBe('Task finished');
    expect(webhookEventName('ping')).toBe('Test');
  });
});

describe('from a task', () => {
  const task = {
    title: 'Weekly review',
    description: 'What moved last week',
    priority: 'medium' as const,
    tags: ['Product'],
  };

  it('a template keeps what the task has, without its dates', () => {
    expect(templateFromTask(task, ['One', 'Two'], ['u1'])).toEqual({
      ...task,
      subtasks: ['One', 'Two'],
      assigneeIds: ['u1'],
      dueInDays: null,
    });
    expect(
      templateFromTask(task, Array(30).fill('x'), []).subtasks,
    ).toHaveLength(20);
  });

  it('"Repeat" is a weekly rule on that weekday, in the task’s column', () => {
    expect(repeatRule('t1', 'todo', 4)).toEqual({
      trigger: {
        type: 'schedule',
        every: 'week',
        weekdays: [4],
        time: '09:00',
      },
      conditions: [],
      actions: [{ type: 'create_task', templateId: 't1', columnId: 'todo' }],
      enabled: true,
    });
  });
});
