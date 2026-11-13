import { describe, expect, it } from 'vitest';
import type { AutomationRule, TaskTemplate, Webhook } from '@/types';
import {
  boardContext,
  brokenReasonOf,
  dueInText,
  namesOf,
  ruleGroups,
  ruleIdeas,
  rulesSummary,
  templateCards,
  templateUses,
  webhookRows,
  weekStart,
  type BoardContext,
} from './automation-operations';

const at = (iso: string) => new Date(iso);
const board: BoardContext = {
  columns: [
    { id: 'backlog', name: 'Backlog', color: '#aaa', isDone: false },
    { id: 'todo', name: 'To do', color: '#00f', isDone: false },
    { id: 'doing', name: 'In progress', color: '#fa0', isDone: false },
    { id: 'review', name: 'Review', color: '#80f', isDone: false },
    { id: 'done', name: 'Done', color: '#0a0', isDone: true },
  ],
  members: [{ id: 'u1', name: 'Ploy Srisuk', avatar: null }],
  labels: ['Bug'],
  labelColors: { Bug: '#f00' },
  templates: [{ id: 't1', title: 'Weekly review' }],
};
const names = namesOf(board);

const rule = (over: Partial<AutomationRule>): AutomationRule => ({
  id: 'r1',
  projectId: 'p1',
  trigger: { type: 'task_finished' },
  conditions: [],
  actions: [{ type: 'archive' }],
  enabled: true,
  brokenReason: null,
  nextRunAt: null,
  lastRunAt: null,
  createdBy: 'u1',
  createdAt: at('2026-11-01T00:00:00Z'),
  updatedAt: at('2026-11-01T00:00:00Z'),
  runsThisWeek: 0,
  ...over,
});
const weekly = rule({
  id: 'weekly',
  trigger: { type: 'schedule', every: 'week', weekdays: [1], time: '09:00' },
  actions: [{ type: 'create_task', templateId: 't1', columnId: 'todo' }],
  nextRunAt: at('2026-11-16T02:00:00Z'),
  createdAt: at('2026-11-02T00:00:00Z'),
});

const template = (over: Partial<TaskTemplate>): TaskTemplate => ({
  id: 't1',
  projectId: 'p1',
  title: 'Weekly review',
  description: null,
  priority: 'medium',
  tags: ['Bug'],
  subtasks: ['a', 'b', 'c'],
  assigneeIds: ['u1'],
  dueInDays: 2,
  usedCount: 0,
  createdBy: 'u1',
  createdAt: at('2026-11-01T00:00:00Z'),
  updatedAt: at('2026-11-01T00:00:00Z'),
  ...over,
});

describe('the board as the pickers see it', () => {
  it('keeps this board’s live columns in order, and members whose profile arrived', () => {
    const context = boardContext({
      projectId: 'p1',
      columns: [
        {
          id: 'b',
          projectId: 'p1',
          name: 'B',
          color: null,
          isDone: true,
          isDeleted: false,
          orderFraction: 'a1',
        },
        {
          id: 'a',
          projectId: 'p1',
          name: 'A',
          color: '#111',
          isDone: false,
          isDeleted: false,
          orderFraction: 'a0',
        },
        {
          id: 'gone',
          projectId: 'p1',
          name: 'Gone',
          color: null,
          isDone: false,
          isDeleted: true,
          orderFraction: 'a2',
        },
        {
          id: 'other',
          projectId: 'p2',
          name: 'Other',
          color: null,
          isDone: false,
          isDeleted: false,
          orderFraction: 'a0',
        },
      ],
      memberIds: ['u1', 'u2'],
      users: { u1: { fullName: 'Ploy Srisuk', avatar: 'p.png' } },
      labels: ['Bug'],
      labelColors: { Bug: '#f00' },
      templates: [template({})],
    });
    expect(context.columns.map((c) => c.id)).toEqual(['a', 'b']);
    expect(context.members).toEqual([
      { id: 'u1', name: 'Ploy Srisuk', avatar: 'p.png' },
    ]);
    expect(context.templates).toEqual([{ id: 't1', title: 'Weekly review' }]);
  });

  it('starts the week on Monday in the zone', () => {
    // Thursday Nov 12 in Bangkok: Monday Nov 9, 00:00 = Nov 8 17:00 UTC
    expect(
      weekStart(at('2026-11-12T03:00:00Z'), 'Asia/Bangkok').toISOString(),
    ).toBe('2026-11-08T17:00:00.000Z');
  });
});

describe('the Rules list', () => {
  it('groups rules that wait for a change apart from those on a schedule', () => {
    const groups = ruleGroups(
      [weekly, rule({ runsThisWeek: 14 })],
      names,
      'Asia/Bangkok',
    );
    expect(groups.map((g) => g.caption)).toEqual([
      'When something happens',
      'On a schedule',
    ]);
    expect(groups[0].rows[0]).toMatchObject({
      tone: 'change',
      meta: '14 runs this week',
      sentence: 'When a task is finished, archive it.',
    });
    expect(groups[1].rows[0]).toMatchObject({
      tone: 'schedule',
      meta: 'Next: Mon, Nov 16',
    });
  });

  it('leaves out a group with no rules', () => {
    expect(ruleGroups([weekly], names, 'UTC').map((g) => g.caption)).toEqual([
      'On a schedule',
    ]);
  });

  it('says so for a rule that is off, broken or has not run', () => {
    const [group] = ruleGroups(
      [
        rule({
          id: 'a',
          enabled: false,
          brokenReason: 'The label X was deleted',
        }),
        rule({
          id: 'b',
          brokenReason: 'The label X was deleted',
          createdAt: at('2026-11-03T00:00:00Z'),
        }),
        rule({
          id: 'c',
          runsThisWeek: 1,
          createdAt: at('2026-11-04T00:00:00Z'),
        }),
        rule({ id: 'd', createdAt: at('2026-11-05T00:00:00Z') }),
      ],
      names,
      'UTC',
    );
    expect(group.rows.map((r) => [r.tone, r.meta, r.fix])).toEqual([
      ['change', 'Off', null],
      ['fix', 'No runs this week', 'The label X was deleted'],
      ['change', '1 run this week', null],
      ['change', 'No runs this week', null],
    ]);
  });

  it('says why a saved rule is paused', () => {
    const rules = [rule({ brokenReason: 'The label X was deleted' })];
    expect(brokenReasonOf(rules, 'r1')).toBe('The label X was deleted');
    expect(brokenReasonOf(rules, null)).toBeNull();
  });

  it('sums the week and counts the rules that need a fix', () => {
    expect(
      rulesSummary([
        rule({ runsThisWeek: 30 }),
        rule({ runsThisWeek: 7, brokenReason: 'x' }),
      ]),
    ).toEqual({ text: 'rules ran 37 times.', broken: '1 rule needs a fix' });
    expect(rulesSummary([rule({}), rule({ enabled: false })])).toEqual({
      text: '1 rule is on, and none has run yet.',
      broken: null,
    });
  });
});

describe('ideas to start with', () => {
  it('fills each one in with this board’s columns', () => {
    const ideas = ruleIdeas(board, []);
    expect(ideas.map((i) => i.key)).toEqual([
      'subtasks',
      'finished',
      'starter',
      'archive',
      'due',
      'repeat',
    ]);
    expect(ideas[0].title).toBe(
      'Move a task to Review when its subtasks are done',
    );
    expect(ideas[2].draft.trigger).toEqual({
      type: 'task_moved',
      toColumnId: 'doing',
    });
    expect(ideas[3].draft.trigger).toEqual({
      type: 'task_idle',
      days: 14,
      columnId: 'done',
    });
    expect(ideas[5].draft.actions).toEqual([
      { type: 'create_task', templateId: 't1', columnId: 'backlog' },
    ]);
  });

  it('leaves out what the board already has a rule like', () => {
    expect(ruleIdeas(board, [weekly]).map((i) => i.key)).not.toContain(
      'repeat',
    );
  });

  it('offers only what a board without a Done column can use', () => {
    const noDone = {
      ...board,
      columns: board.columns.filter((c) => !c.isDone),
    };
    expect(ruleIdeas(noDone, []).map((i) => i.key)).toEqual([
      'starter',
      'due',
      'repeat',
    ]);
  });
});

describe('templates', () => {
  it('say what a task from them starts with and how they are used', () => {
    const [card, unused] = templateCards(
      [
        template({}),
        template({
          id: 't2',
          title: 'Bug report',
          subtasks: [],
          dueInDays: null,
          usedCount: 12,
          createdAt: at('2026-11-02T00:00:00Z'),
        }),
      ],
      [weekly],
      names,
    );
    expect(card).toMatchObject({
      subtasks: '3 subtasks',
      due: 'Due in 2 days',
      usage: 'Every Monday at 9:00',
      repeats: true,
    });
    expect(unused).toMatchObject({
      subtasks: 'No subtasks',
      due: 'No due date',
      usage: 'Used 12 times',
      repeats: false,
    });
    expect(templateCards([template({})], [], names)[0].usage).toBe(
      'Not used yet',
    );
    expect(dueInText(0)).toBe('Due the same day');
    expect(dueInText(1)).toBe('Due in 1 day');
  });

  it('list the rules that make tasks from them', () => {
    expect(
      templateUses('t1', [weekly, rule({})], names, 'Asia/Bangkok'),
    ).toEqual([
      {
        ruleId: 'weekly',
        text: 'Every Monday at 9:00',
        next: 'Next: Mon, Nov 16',
      },
    ]);
  });
});

describe('webhooks', () => {
  const hook = (over: Partial<Webhook>): Webhook => ({
    id: 'w1',
    projectId: 'p1',
    name: 'Team chat',
    url: 'https://hooks.example.com/x',
    events: ['task.finished'],
    enabled: true,
    createdBy: 'u1',
    createdAt: at('2026-11-01T00:00:00Z'),
    updatedAt: at('2026-11-01T00:00:00Z'),
    health: { recent: 0, failed: 0, lastSentAt: null },
    ...over,
  });
  it('say how their last messages went', () => {
    const rows = webhookRows([
      hook({}),
      hook({
        id: 'w2',
        health: { recent: 5, failed: 3, lastSentAt: null },
        createdAt: at('2026-11-02T00:00:00Z'),
      }),
      hook({
        id: 'w3',
        enabled: false,
        health: { recent: 5, failed: 3, lastSentAt: null },
        createdAt: at('2026-11-03T00:00:00Z'),
      }),
    ]);
    expect(rows.map((r) => [r.tone, r.status, r.sub])).toEqual([
      ['ok', 'Working', 'Nothing sent yet'],
      ['failing', 'Failing: 3 of the last 5', null],
      ['off', 'Off', 'Nothing sent yet'],
    ]);
    expect(rows[0].events).toEqual(['Task finished']);
  });
});
