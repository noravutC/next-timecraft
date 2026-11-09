import { describe, expect, it } from 'vitest';
import {
  filterTimeZones,
  formatGmtOffset,
  isTimeZone,
  timeZoneCity,
  timeZoneLabel,
  timeZoneOffsetMinutes,
  timeZoneOptions,
} from './time-zone';

const january = new Date('2026-01-15T12:00:00Z');
const july = new Date('2026-07-15T12:00:00Z');

describe('time zones', () => {
  it('knows real zones and refuses made-up ones', () => {
    expect(isTimeZone('Asia/Bangkok')).toBe(true);
    expect(isTimeZone('UTC')).toBe(true);
    expect(isTimeZone('Mars/Olympus_Mons')).toBe(false);
  });

  it('finds the offset, daylight time included', () => {
    expect(timeZoneOffsetMinutes('Asia/Bangkok', january)).toBe(420);
    expect(timeZoneOffsetMinutes('UTC', july)).toBe(0);
    expect(timeZoneOffsetMinutes('America/New_York', january)).toBe(-300);
    expect(timeZoneOffsetMinutes('America/New_York', july)).toBe(-240);
    expect(timeZoneOffsetMinutes('Asia/Kolkata', july)).toBe(330);
  });

  it('labels a zone the way the picker shows it', () => {
    expect(formatGmtOffset(-240)).toBe('GMT-04:00');
    expect(formatGmtOffset(330)).toBe('GMT+05:30');
    expect(timeZoneCity('America/Argentina/Buenos_Aires')).toBe('Buenos Aires');
    expect(timeZoneLabel('Asia/Bangkok', january)).toBe('(GMT+07:00) Bangkok');
  });

  it('lists zones west to east, with UTC', () => {
    const options = timeZoneOptions(january);
    expect(options.some((o) => o.value === 'UTC')).toBe(true);
    const offsets = options.map((o) => o.offset);
    expect([...offsets].sort((a, b) => a - b)).toEqual(offsets);
  });

  it('finds zones by city, id or offset', () => {
    const options = timeZoneOptions(january);
    expect(filterTimeZones(options, 'bangkok').map((o) => o.value)).toEqual([
      'Asia/Bangkok',
    ]);
    expect(
      filterTimeZones(options, 'GMT+07:00').every((o) => o.offset === 420),
    ).toBe(true);
    expect(filterTimeZones(options, '')).toHaveLength(options.length);
  });
});
