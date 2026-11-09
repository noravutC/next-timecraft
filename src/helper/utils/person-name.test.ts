import { describe, expect, it } from 'vitest';
import { initialsOf, shortName } from './person-name';
import { toneFor } from './avatar-tone';

describe('initialsOf', () => {
  it('takes the first and last word', () => {
    expect(initialsOf('Noravut Chaiyasit')).toBe('NC');
    expect(initialsOf('Mint de la Torre')).toBe('MT');
  });
  it('uses one letter for a single word and ? for nothing', () => {
    expect(initialsOf('ploy')).toBe('P');
    expect(initialsOf('   ')).toBe('?');
    expect(initialsOf(null)).toBe('?');
  });
  it('respects max', () => {
    expect(initialsOf('Website Relaunch', 1)).toBe('W');
  });
});

describe('shortName', () => {
  it('keeps the first name and the last initial', () => {
    expect(shortName('Arthit Kongkaew')).toBe('Arthit K.');
    expect(shortName('Ploy')).toBe('Ploy');
    expect(shortName(undefined)).toBe('');
  });
});

describe('toneFor', () => {
  it('is stable for the same seed', () => {
    expect(toneFor('user-1')).toBe(toneFor('user-1'));
  });
  it('spreads different seeds across tones', () => {
    const tones = new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(toneFor));
    expect(tones.size).toBeGreaterThan(2);
  });
});
