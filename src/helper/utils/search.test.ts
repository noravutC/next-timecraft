import { describe, expect, it } from 'vitest';
import { escapeLike, snippetAround, splitMatch } from './search';

describe('search helpers', () => {
  it('makes a query literal for LIKE', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\');
  });

  it('cuts a snippet around the match at word edges', () => {
    const text =
      'Keep the last board on the device so it still opens in Safari with no connection at all, even offline.';
    const snippet = snippetAround(text, 'safari', 20);
    expect(snippet).toContain('Safari');
    expect(snippet.startsWith('…')).toBe(true);
    expect(snippet.endsWith('…')).toBe(true);
  });

  it('splits the first match out for highlighting', () => {
    expect(splitMatch('Fix drag preview in Safari', 'safari')).toEqual([
      'Fix drag preview in ',
      'Safari',
      '',
    ]);
    expect(splitMatch('Nothing here', 'safari')).toBeNull();
  });
});
