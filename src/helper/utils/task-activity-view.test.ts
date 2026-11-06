import { describe, expect, it } from 'vitest';
import {
  describeActivity,
  formatEstimate,
  groupActivityByDay,
  joinNames,
} from './task-activity-view';
import type { TaskActivityWithActor } from '@/types';

const NOW = new Date('2026-11-06T12:00:00');
const TODO = { id: 'c1', name: 'To do', color: '#3B82F6' };
const DOING = { id: 'c2', name: 'In progress', color: '#F59E0B' };

describe('describeActivity', () => {
  it('describes a move with both columns', () => {
    expect(
      describeActivity({ type: 'moved', data: { from: TODO, to: DOING } }),
    ).toEqual({
      icon: 'moved',
      verb: 'moved this from',
      from: TODO,
      to: DOING,
    });
  });

  it('names priorities by their labels', () => {
    expect(
      describeActivity({
        type: 'priority_changed',
        data: { from: 'medium', to: 'high' },
      }),
    ).toMatchObject({
      verb: 'set priority to',
      object: 'High',
      note: 'from Medium',
    });
  });

  it('tells setting, changing and removing a due date apart', () => {
    const at = (iso: string) => new Date(iso).toISOString();
    expect(
      describeActivity(
        {
          type: 'due_changed',
          data: { from: null, to: at('2026-11-12T05:00:00Z') },
        },
        NOW,
      ),
    ).toMatchObject({ verb: 'set the due date to', object: 'Nov 12' });
    expect(
      describeActivity(
        {
          type: 'due_changed',
          data: {
            from: at('2026-11-10T05:00:00Z'),
            to: at('2026-11-12T05:00:00Z'),
          },
        },
        NOW,
      ),
    ).toMatchObject({
      verb: 'changed the due date to',
      object: 'Nov 12',
      note: 'from Nov 10',
    });
    expect(
      describeActivity(
        {
          type: 'due_changed',
          data: { from: at('2026-11-10T05:00:00Z'), to: null },
        },
        NOW,
      ),
    ).toMatchObject({ verb: 'removed the due date' });
  });

  it('uses short names for people', () => {
    expect(
      describeActivity({
        type: 'assignees_changed',
        data: {
          added: [
            { id: 'u1', name: 'Arthit Kittisak' },
            { id: 'u2', name: 'Ploy Sriwan' },
          ],
          removed: [],
        },
      }),
    ).toMatchObject({ verb: 'assigned', object: 'Arthit K. and Ploy S.' });
  });

  it('counts labels in the verb', () => {
    expect(
      describeActivity({
        type: 'labels_changed',
        data: { added: ['Auth', 'Infra'], removed: [] },
      }),
    ).toMatchObject({ verb: 'added labels', object: 'Auth, Infra' });
  });
});

describe('formatEstimate', () => {
  it('reads hours, days and weeks like the picker', () => {
    expect(formatEstimate(4)).toBe('4h');
    expect(formatEstimate(8)).toBe('1d');
    expect(formatEstimate(16)).toBe('2d');
    expect(formatEstimate(40)).toBe('1w');
    expect(formatEstimate(12)).toBe('12h');
  });
});

describe('joinNames', () => {
  it('joins with commas and a final "and"', () => {
    expect(joinNames(['A'])).toBe('A');
    expect(joinNames(['A', 'B'])).toBe('A and B');
    expect(joinNames(['A', 'B', 'C'])).toBe('A, B and C');
  });
});

describe('groupActivityByDay', () => {
  const item = (iso: string): TaskActivityWithActor => ({
    id: iso,
    taskId: 't',
    type: 'archived',
    data: {},
    createdAt: new Date(iso),
    actor: null,
  });

  it('groups by local day and keeps the given order', () => {
    const days = groupActivityByDay(
      [
        item('2026-11-06T11:00:00'),
        item('2026-11-06T09:00:00'),
        item('2026-11-05T16:20:00'),
        item('2026-11-03T15:15:00'),
      ],
      NOW,
    );
    expect(days.map((d) => d.items.length)).toEqual([2, 1, 1]);
    expect(days[2].label).toBe('Nov 3');
    expect(days[2].items[0].time).toBe('3:15 PM');
  });
});

describe('groupActivityByDay labels', () => {
  it('names today and yesterday relative to the given time', () => {
    const at = (iso: string): TaskActivityWithActor => ({
      id: iso,
      taskId: 't',
      type: 'restored',
      data: {},
      createdAt: new Date(iso),
      actor: null,
    });
    const days = groupActivityByDay(
      [at('2030-02-01T10:00:00'), at('2030-01-31T10:00:00')],
      new Date('2030-02-01T12:00:00'),
    );
    expect(days.map((d) => d.label)).toEqual(['Today', 'Yesterday']);
  });
});

describe('time logs in the history', () => {
  it('says how long, which day, and the note', () => {
    const now = new Date(2026, 10, 7);
    expect(
      describeActivity(
        {
          type: 'time_logged',
          data: { minutes: 45, day: '2026-11-06', note: 'callback fix' },
        },
        now,
      ),
    ).toEqual({
      icon: 'estimate',
      verb: 'logged',
      object: '45m',
      note: 'on Nov 6 · callback fix',
    });
  });
});
