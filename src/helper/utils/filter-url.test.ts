import { describe, expect, it } from 'vitest';
import { boardUrl } from './board-url';
import { EMPTY_BOARD_FILTER, readFilterUrl } from './filter-url';

const BOARD = '0b9a3c1e-6f2d-4c8a-9e1b-2d3f4a5b6c7d';
const USER = '7e6d5c4b-3a2f-4e1d-8c9b-0a1b2c3d4e5f';

describe('board filter in the URL', () => {
  it('round-trips through a board link', () => {
    const filter = {
      q: 'safari',
      priorities: ['high' as const],
      tags: ['Bug', 'A, B'],
      assigneeIds: [USER],
      mine: true,
      unassigned: true,
      due: ['overdue' as const, 'none' as const],
    };
    const url = boardUrl({ board: BOARD, filter });
    expect(url.startsWith(`/project?board=${BOARD}&q=safari`)).toBe(true);
    expect(readFilterUrl(new URL(url, 'http://x').searchParams)).toEqual(
      filter,
    );
  });

  it('leaves an empty filter out of the link', () => {
    expect(boardUrl({ board: BOARD, filter: EMPTY_BOARD_FILTER })).toBe(
      `/project?board=${BOARD}`,
    );
  });

  it('drops values that cannot be right', () => {
    const params = new URLSearchParams(
      'priority=urgent&priority=low&due=someday&assignee=bob&label=',
    );
    expect(readFilterUrl(params)).toEqual({
      ...EMPTY_BOARD_FILTER,
      priorities: ['low'],
    });
  });
});
