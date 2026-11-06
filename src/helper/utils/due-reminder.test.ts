import { describe, expect, it } from 'vitest';
import {
  reminderInstant,
  reminderIsDue,
  reminderSummary,
} from './due-reminder';

// due Nov 12 (a Bangkok day), stored as noon UTC
const due = new Date('2026-11-12T05:00:00Z');

describe('due date reminders', () => {
  it('fires at 9:00 in the workspace zone, days before the due day', () => {
    // 9:00 Bangkok on Nov 11 = 02:00 UTC
    expect(reminderInstant(due, 1, 'Asia/Bangkok').toISOString()).toBe(
      '2026-11-11T02:00:00.000Z',
    );
    // on the day in New York (EST, UTC-5): 9:00 = 14:00 UTC
    expect(
      reminderInstant(
        new Date('2026-11-12T17:00:00Z'),
        0,
        'America/New_York',
      ).toISOString(),
    ).toBe('2026-11-12T14:00:00.000Z');
  });

  it('goes out on its day, from 9:00 until that day ends', () => {
    expect(
      reminderIsDue(due, 1, 'Asia/Bangkok', new Date('2026-11-11T01:59:00Z')),
    ).toBe(false);
    expect(
      reminderIsDue(due, 1, 'Asia/Bangkok', new Date('2026-11-11T02:00:00Z')),
    ).toBe(true);
    // Nov 11 ended at midnight Bangkok (17:00 UTC)
    expect(
      reminderIsDue(due, 1, 'Asia/Bangkok', new Date('2026-11-11T17:00:00Z')),
    ).toBe(false);
  });
});

describe('reminderSummary', () => {
  const now = new Date('2026-11-06T05:00:00Z');
  it('says who is reminded, when, in which zone', () => {
    expect(
      reminderSummary({
        dueDate: due,
        daysBefore: 1,
        assigneeNames: ['Noravut C.', 'Arthit K.'],
        timeZone: 'Asia/Bangkok',
        now,
      }),
    ).toBe(
      'Noravut C. and Arthit K. are reminded on Wednesday, Nov 11 at 9:00 AM, Bangkok time.',
    );
  });

  it('warns when nobody would get it, or the day has passed', () => {
    expect(
      reminderSummary({
        dueDate: due,
        daysBefore: 1,
        assigneeNames: [],
        timeZone: 'UTC',
        now,
      }),
    ).toBe('Nobody is assigned yet, so no one will be reminded.');
    expect(
      reminderSummary({
        dueDate: due,
        daysBefore: 7,
        assigneeNames: ['Ploy S.'],
        timeZone: 'Asia/Bangkok',
        now,
      }),
    ).toMatch(/already passed/);
  });

  it('says when it already went out', () => {
    expect(
      reminderSummary({
        dueDate: due,
        daysBefore: 1,
        assigneeNames: ['Ploy S.'],
        timeZone: 'Asia/Bangkok',
        remindedAt: new Date('2026-11-11T02:01:00Z'),
        now,
      }),
    ).toBe(
      'Reminder sent Wednesday, Nov 11. A new date or reminder sends another.',
    );
  });
});
