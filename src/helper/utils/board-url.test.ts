import { describe, expect, it } from 'vitest';
import { boardUrl, readBoardUrl, readBoardView } from './board-url';

const BOARD = '0b9a3c1e-6f2d-4c8a-9e1b-2d3f4a5b6c7d';
const TASK = '7e6d5c4b-3a2f-4e1d-8c9b-0a1b2c3d4e5f';

describe('boardUrl', () => {
  it('builds the bare path without a board', () => {
    expect(boardUrl({ board: null, task: null })).toBe('/project');
  });

  it('adds the board, then the task', () => {
    expect(boardUrl({ board: BOARD })).toBe(`/project?board=${BOARD}`);
    expect(boardUrl({ board: BOARD, task: TASK })).toBe(
      `/project?board=${BOARD}&task=${TASK}`,
    );
  });
});

describe('readBoardUrl', () => {
  it('reads board and task ids', () => {
    expect(
      readBoardUrl(new URLSearchParams(`board=${BOARD}&task=${TASK}`)),
    ).toEqual({ board: BOARD, task: TASK });
  });

  it('accepts the old taskId parameter', () => {
    expect(readBoardUrl(new URLSearchParams(`taskId=${TASK}`))).toEqual({
      board: null,
      task: TASK,
    });
  });

  it('drops values that are not ids', () => {
    expect(
      readBoardUrl(new URLSearchParams('board=abc&task=<script>')),
    ).toEqual({ board: null, task: null });
  });

  it('round-trips what boardUrl builds', () => {
    const url = boardUrl({ board: BOARD, task: TASK });
    const params = new URLSearchParams(url.split('?')[1]);
    expect(readBoardUrl(params)).toEqual({ board: BOARD, task: TASK });
  });
});

describe('board view in the URL', () => {
  it('names only the calendar; the board is the default', () => {
    expect(boardUrl({ board: BOARD, view: 'calendar' })).toBe(
      `/project?board=${BOARD}&view=calendar`,
    );
    expect(boardUrl({ board: BOARD, view: 'board' })).toBe(
      `/project?board=${BOARD}`,
    );
    expect(readBoardView(new URLSearchParams('view=calendar'))).toBe(
      'calendar',
    );
    expect(readBoardView(new URLSearchParams('view=gantt'))).toBe('board');
  });
});
