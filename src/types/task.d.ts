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
>;

export interface TaskCache extends Task {
  timestamp: number;
}

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

/** Server-side task filter — POST /api/task/columns applies it per column. */
export interface TaskFilter {
  q?: string;
  priorities?: TaskPriority[];
  tags?: string[];
  assigneeIds?: string[];
}
