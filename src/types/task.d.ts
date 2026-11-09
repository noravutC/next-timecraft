import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { tasksTable } from '@/db/schema';

export type TaskRow = InferSelectModel<typeof tasksTable>;
export type NewTaskRow = InferInsertModel<typeof tasksTable>;

export type TaskPriority = TaskRow['priority'];
export type Task = TaskRow;

export type CreateTaskPayload = Pick<
  NewTaskRow,
  | 'columnId'
  | 'title'
  | 'description'
  | 'orderFraction'
  | 'tags'
  | 'priority'
  | 'dueDate'
>;

export type UpdateTaskPayload = Pick<
  NewTaskRow,
  | 'id'
  | 'columnId'
  | 'title'
  | 'description'
  | 'orderFraction'
  | 'tags'
  | 'priority'
  | 'dueDate'
  | 'archived'
  | 'estimatedHours'
  | 'remindDaysBefore'
>;

export interface TaskCache extends Task {
  timestamp: number;
}

/** GET /api/task/[ids]: a task plus the board it's on. */
export type TaskWithBoard = Task & { projectId: string | null };

/** Cursor pointing at the last loaded task of a column (orderFraction + id tiebreak). */
export interface TaskPageCursor {
  orderFraction: string;
  id: string;
}

/** Per-column pagination state returned by POST /api/task/columns. */
export interface TaskPageInfo {
  hasMore: boolean;
  nextCursor: TaskPageCursor | null;
  total: number;
}

export interface PayloadMoveTask {
  activeTaskId: string;
  projectId: string;
  columnSouce: string;
  orderDestination: number;
  columnDestination: string;
}

/** Where a due date falls, as the board's Due date filter groups them. */
export type DueBucket = 'overdue' | 'this_week' | 'later' | 'none';

/** Local midnight today and the Monday after it, as ISO instants. */
export type DueBounds = { today: string; weekEnd: string };

/** Server-side task filter — POST /api/task/columns applies it per column. */
export interface TaskFilter {
  q?: string;
  priorities?: TaskPriority[];
  tags?: string[];
  assigneeIds?: string[];
  /** assigned to whoever is looking */
  mine?: boolean;
  /** nobody assigned */
  unassigned?: boolean;
  due?: DueBucket[];
  /** set with `due`: the bucket edges in the viewer's time zone */
  dueBounds?: DueBounds;
}

/** The board's filter as the toolbar holds it and a link carries it. */
export type BoardFilterState = {
  q: string;
  priorities: TaskPriority[];
  tags: string[];
  assigneeIds: string[];
  mine: boolean;
  unassigned: boolean;
  due: DueBucket[];
};

/** Tasks per priority in one column, ignoring board filters (filter menu counts). */
export type PriorityCounts = Partial<Record<TaskPriority, number>>;

// Board settings > Archive
export type ArchivedTask = {
  id: string;
  title: string;
  archivedAt: Date | null;
  archivedByName: string | null;
  columnId: string;
  columnName: string;
  columnColor: string;
};

export type DeletedColumn = {
  id: string;
  name: string;
  color: string;
  deletedAt: Date | null;
  deletedByName: string | null;
  purgeAt: Date | null;
  taskCount: number;
};

export type BoardArchive = { tasks: ArchivedTask[]; columns: DeletedColumn[] };

// ⌘K search
export type TaskSearchHit = {
  taskId: string;
  title: string;
  description: string | null;
  projectId: string;
  projectName: string;
  coverImage: string | null;
  settings: import('@/types/project-settings').ProjectSettings;
  columnName: string;
  columnColor: string;
  /** where the words were found */
  match: 'title' | 'description' | 'comment';
  /** the words around the match, for descriptions and comments */
  snippet: string | null;
};
