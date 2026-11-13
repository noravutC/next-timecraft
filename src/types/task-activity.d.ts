import type { InferSelectModel } from 'drizzle-orm';
import type { taskActivitiesTable } from '@/db/schema';
import type { TaskActivityEntry } from '@/db/schema/task-activity.table';
export type {
  ActivityAutomationRef,
  ActivityColumnRef,
  ActivityPersonRef,
  TaskActivityEntry,
  TaskActivityType,
} from '@/db/schema/task-activity.table';

export type TaskActivityRow = InferSelectModel<typeof taskActivitiesTable>;

/** GET /api/task/[id]/activity: a change plus who made it. */
export type TaskActivityWithActor = TaskActivityEntry &
  Pick<TaskActivityRow, 'id' | 'taskId' | 'createdAt' | 'automation'> & {
    /** null when a rule made the change: then `automation` names it */
    actor: { id: string; fullName: string; avatar: string | null } | null;
  };

export interface TaskActivityPage {
  items: TaskActivityWithActor[];
  nextCursor: string | null;
}
