import { describe, expect, it } from 'vitest';
import { formatDuration, parseDuration, spentPercent } from './duration';

describe('parseDuration', () => {
  it('reads hours, minutes and both', () => {
    expect(parseDuration('45m')).toBe(45);
    expect(parseDuration('2h')).toBe(120);
    expect(parseDuration('1h 30m')).toBe(90);
    expect(parseDuration('1h30m')).toBe(90);
    expect(parseDuration('1.5h')).toBe(90);
    expect(parseDuration(' 90 ')).toBe(90);
  });

  it('refuses what it cannot read, nothing, and over a day', () => {
    expect(parseDuration('')).toBeNull();
    expect(parseDuration('soon')).toBeNull();
    expect(parseDuration('0m')).toBeNull();
    expect(parseDuration('25h')).toBeNull();
    expect(parseDuration('h')).toBeNull();
  });
});

describe('formatDuration', () => {
  it('shows hours and minutes', () => {
    expect(formatDuration(200)).toBe('3h 20m');
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(0)).toBe('0m');
  });
});

describe('spentPercent', () => {
  it('measures against the estimate, never past full', () => {
    expect(spentPercent(200, 8)).toBe(42);
    expect(spentPercent(600, 8)).toBe(100);
    expect(spentPercent(30, 0)).toBe(0);
  });
});
