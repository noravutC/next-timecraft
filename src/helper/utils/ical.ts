import { addDays } from './time-zone';

type CalendarDate = { year: number; month: number; day: number };

/** One all-day event in a calendar feed. */
export type IcalEvent = {
  uid: string;
  date: CalendarDate;
  summary: string;
  description?: string;
  url?: string;
};

const pad = (n: number) => String(n).padStart(2, '0');
const icalDate = (d: CalendarDate) => `${d.year}${pad(d.month)}${pad(d.day)}`;
// 2026-11-07T08:05:00.000Z -> 20261107T080500Z
const icalStamp = (at: Date) =>
  at
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

/** RFC 5545 text: backslashes, semicolons, commas and line breaks escaped. */
export const escapeIcalText = (text: string): string =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

const encoder = new TextEncoder();

/**
 * Lines over 75 octets go on in a continuation line that starts with a
 * space. Counted in UTF-8 bytes, never splitting a character.
 */
export const foldIcalLine = (line: string): string => {
  const parts: string[] = [];
  let current = '';
  let size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    // the leading space of a continuation line counts too
    const room = parts.length === 0 ? 75 : 74;
    if (size + bytes > room) {
      parts.push(current);
      current = char;
      size = bytes;
    } else {
      current += char;
      size += bytes;
    }
  }
  parts.push(current);
  return parts.join('\r\n ');
};

/** A whole iCal calendar of all-day events, ready to serve. */
export const buildIcal = (args: {
  name: string;
  events: IcalEvent[];
  now: Date;
}): string => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TimeCraft//Board due dates//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcalText(args.name)}`,
  ];
  for (const event of args.events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${icalStamp(args.now)}`,
      `DTSTART;VALUE=DATE:${icalDate(event.date)}`,
      `DTEND;VALUE=DATE:${icalDate(addDays(event.date, 1))}`,
      `SUMMARY:${escapeIcalText(event.summary)}`,
    );
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeIcalText(event.description)}`);
    }
    if (event.url) lines.push(`URL:${event.url}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(foldIcalLine).join('\r\n')}\r\n`;
};
