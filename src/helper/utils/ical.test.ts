import { describe, expect, it } from 'vitest';
import { buildIcal, escapeIcalText, foldIcalLine } from './ical';

describe('iCal feed', () => {
  it('escapes the characters RFC 5545 reserves', () => {
    expect(escapeIcalText('a,b;c\\d\ne')).toBe('a\\,b\\;c\\\\d\\ne');
  });

  it('folds long lines at 75 octets without splitting a character', () => {
    const line = `SUMMARY:${'ก'.repeat(40)}`;
    const folded = foldIcalLine(line);
    for (const part of folded.split('\r\n')) {
      expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    }
    expect(folded.replace(/\r\n /g, '')).toBe(line);
  });

  it('writes all-day events that end the next day', () => {
    const ics = buildIcal({
      name: 'Website Relaunch',
      now: new Date('2026-11-07T08:05:00Z'),
      events: [
        {
          uid: 't1@timecraft',
          date: { year: 2026, month: 11, day: 30 },
          summary: 'Ship it, finally',
          url: 'https://timecraft.example/project?task=t1',
        },
      ],
    });
    expect(ics).toContain('DTSTART;VALUE=DATE:20261130\r\n');
    expect(ics).toContain('DTEND;VALUE=DATE:20261201\r\n');
    expect(ics).toContain('SUMMARY:Ship it\\, finally\r\n');
    expect(ics).toContain('DTSTAMP:20261107T080500Z\r\n');
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });
});
