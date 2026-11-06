import { isUuid } from '@/lib/api/params';
import type { BoardFilterState } from '@/types';
import { writeFilterUrl } from './filter-url';

/** Where a board link points: the open board and, optionally, an open task. */
export type BoardUrlState = { board: string | null; task: string | null };

export const BOARD_PATH = '/project';

const idParam = (params: URLSearchParams, key: string): string | null => {
  const value = params.get(key);
  return value && isUuid(value) ? value : null;
};

/**
 * Reads `?board=&task=` from a board URL. Values that aren't ids are dropped.
 * `taskId` is the parameter older "Copy link" links used.
 */
export const readBoardUrl = (params: URLSearchParams): BoardUrlState => ({
  board: idParam(params, 'board'),
  task: idParam(params, 'task') ?? idParam(params, 'taskId'),
});

/**
 * `/project?board=…&task=…`, leaving out whatever is null, then the board
 * filter when one is given.
 */
export const boardUrl = ({
  board,
  task,
  filter,
}: Partial<BoardUrlState> & { filter?: BoardFilterState }): string => {
  const params = new URLSearchParams();
  if (board) params.set('board', board);
  if (task) params.set('task', task);
  if (filter) writeFilterUrl(params, filter);
  const query = params.toString();
  return query ? `${BOARD_PATH}?${query}` : BOARD_PATH;
};
