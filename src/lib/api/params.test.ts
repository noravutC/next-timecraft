import { describe, expect, it } from 'vitest';
import { BadRequestError } from './errors';
import { parseId, parseIdList } from './params';

const A = '0b8a4c1e-1f2d-4c3b-9a8e-7d6c5b4a3f21';
const B = '6f1e2d3c-4b5a-4968-8776-a5b4c3d2e1f0';

describe('parseId', () => {
  it('accepts a uuid', () => {
    expect(parseId(` ${A} `)).toBe(A);
  });

  it('rejects anything else with a 400', () => {
    expect(() => parseId('1 OR 1=1')).toThrow(BadRequestError);
    expect(() => parseId('')).toThrow(BadRequestError);
  });
});

describe('parseIdList', () => {
  it('splits, trims and de-duplicates', () => {
    expect(parseIdList(`${A}, ${B},${A},`)).toEqual([A, B]);
  });

  it('rejects empty, malformed and oversized lists', () => {
    expect(() => parseIdList(' , ')).toThrow(BadRequestError);
    expect(() => parseIdList(`${A},nope`)).toThrow(BadRequestError);
    expect(() => parseIdList([A, B].join(','), 1)).toThrow(BadRequestError);
  });
});
