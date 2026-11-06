import { isUuid } from '@/lib/api/params';

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

/** `/project?board=…&task=…`, leaving out whatever is null. */
export const boardUrl = ({ board, task }: Partial<BoardUrlState>): string => {
  const params = new URLSearchParams();
  if (board) params.set('board', board);
  if (task) params.set('task', task);
  const query = params.toString();
  return query ? `${BOARD_PATH}?${query}` : BOARD_PATH;
};
