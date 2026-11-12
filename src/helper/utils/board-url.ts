import { isUuid } from '@/lib/api/params';
import type { BoardFilterState } from '@/types';
import { writeFilterUrl } from './filter-url';

/** Where a board link points: the open board and, optionally, an open task. */
export type BoardUrlState = { board: string | null; task: string | null };

/**
 * The board as columns (the default, left out of links), as a calendar or
 * as its numbers.
 */
export type BoardUrlView = 'board' | 'calendar' | 'insights';

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

export const readBoardView = (params: URLSearchParams): BoardUrlView => {
  const view = params.get('view');
  return view === 'calendar' || view === 'insights' ? view : 'board';
};

/**
 * `/project?board=…&task=…`, leaving out whatever is null, then the view
 * and the board filter when they're given.
 */
export const boardUrl = ({
  board,
  task,
  view,
  filter,
}: Partial<BoardUrlState> & {
  view?: BoardUrlView;
  filter?: BoardFilterState;
}): string => {
  const params = new URLSearchParams();
  if (board) params.set('board', board);
  if (task) params.set('task', task);
  if (view && view !== 'board') params.set('view', view);
  if (filter) writeFilterUrl(params, filter);
  const query = params.toString();
  return query ? `${BOARD_PATH}?${query}` : BOARD_PATH;
};
