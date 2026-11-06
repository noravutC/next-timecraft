import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
  it('quotes commas, quotes and line breaks', () => {
    expect(toCsv(['a', 'b'], [['x, y', 'say "hi"\nthere']])).toBe(
      'a,b\r\n"x, y","say ""hi""\nthere"\r\n',
    );
  });

  it('keeps formulas from running in a spreadsheet', () => {
    expect(toCsv(['t'], [['=1+1'], ['-2'], ['@x'], ['plain']])).toBe(
      "t\r\n'=1+1\r\n'-2\r\n'@x\r\nplain\r\n",
    );
  });

  it('leaves empty values empty', () => {
    expect(toCsv(['a', 'b'], [[null, undefined]])).toBe('a,b\r\n,\r\n');
  });
});
