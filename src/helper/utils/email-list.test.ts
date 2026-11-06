import { describe, expect, it } from 'vitest';
import { appendEmail, parseEmailList } from './email-list';

describe('appendEmail', () => {
  it('adds a new address once, lower-cased', () => {
    expect(appendEmail([], ' Jane@X.com ')).toEqual(['jane@x.com']);
    expect(appendEmail(['jane@x.com'], 'jane@x.com')).toBeNull();
  });
});

describe('parseEmailList', () => {
  it('splits on commas and spaces, once each', () => {
    expect(parseEmailList('a@x.com, B@x.com;a@x.com  c@y.org')).toEqual({
      emails: ['a@x.com', 'b@x.com', 'c@y.org'],
      invalid: [],
    });
  });

  it('keeps what doesn’t look like an address apart', () => {
    expect(parseEmailList('jane, bob@x.com')).toEqual({
      emails: ['bob@x.com'],
      invalid: ['jane'],
    });
  });
});
