import { isUuid } from '@/lib/api/params';
import { PRIORITY_ORDER } from '@/lib/task-priority';
import type { BoardFilterState, DueBucket, TaskPriority } from '@/types';
import { DUE_BUCKETS } from './due-filter';

export const EMPTY_BOARD_FILTER: BoardFilterState = {
  q: '',
  priorities: [],
  tags: [],
  assigneeIds: [],
  mine: false,
  unassigned: false,
  due: [],
};

// "me" means whoever opens the link, not whoever shared it
const ME = 'me';
const NOBODY = 'none';
const KEYS = ['q', 'priority', 'label', 'assignee', 'due'];

const unique = <T>(values: T[]) => [...new Set(values)];

/** The filter a board link carries. Values that can't be right are dropped. */
export const readFilterUrl = (params: URLSearchParams): BoardFilterState => {
  const assignees = params.getAll('assignee');
  return {
    q: (params.get('q') ?? '').slice(0, 200),
    priorities: unique(
      params
        .getAll('priority')
        .filter((p): p is TaskPriority =>
          PRIORITY_ORDER.includes(p as TaskPriority),
        ),
    ),
    tags: unique(params.getAll('label').filter((t) => t && t.length <= 64)),
    assigneeIds: unique(assignees.filter(isUuid)),
    mine: assignees.includes(ME),
    unassigned: assignees.includes(NOBODY),
    due: unique(
      params
        .getAll('due')
        .filter((d): d is DueBucket => DUE_BUCKETS.includes(d as DueBucket)),
    ),
  };
};

/** Writes the filter into `params`, replacing whatever filter was there. */
export const writeFilterUrl = (
  params: URLSearchParams,
  filter: BoardFilterState,
): void => {
  KEYS.forEach((key) => params.delete(key));
  if (filter.q.trim()) params.set('q', filter.q.trim());
  filter.priorities.forEach((p) => params.append('priority', p));
  filter.due.forEach((d) => params.append('due', d));
  filter.tags.forEach((t) => params.append('label', t));
  if (filter.mine) params.append('assignee', ME);
  filter.assigneeIds.forEach((id) => params.append('assignee', id));
  if (filter.unassigned) params.append('assignee', NOBODY);
};
