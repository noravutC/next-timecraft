import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { tasksTable } from './task.table';
import { usersTable } from './user.table';

/** A column as it was at the time; it may be renamed or deleted later. */
export type ActivityColumnRef = {
  id: string;
  name: string;
  color: string | null;
};

/** A person as named at the time of the change. */
export type ActivityPersonRef = { id: string; name: string };

type Empty = Record<string, never>;

/** One change in a task's history: what changed, from what, to what. */
export type TaskActivityEntry =
  | { type: 'created'; data: { column: ActivityColumnRef | null } }
  | {
      type: 'moved';
      data: { from: ActivityColumnRef | null; to: ActivityColumnRef | null };
    }
  | { type: 'renamed'; data: { from: string; to: string } }
  | { type: 'description_changed'; data: Empty }
  | { type: 'priority_changed'; data: { from: string; to: string } }
  | { type: 'due_changed'; data: { from: string | null; to: string | null } }
  | { type: 'labels_changed'; data: { added: string[]; removed: string[] } }
  | { type: 'estimate_changed'; data: { from: number; to: number } }
  | { type: 'archived'; data: Empty }
  | { type: 'restored'; data: Empty }
  | {
      type: 'assignees_changed';
      data: { added: ActivityPersonRef[]; removed: ActivityPersonRef[] };
    }
  | { type: 'subtask_completed'; data: { title: string } }
  | { type: 'subtask_reopened'; data: { title: string } };

export type TaskActivityType = TaskActivityEntry['type'];

export const taskActivitiesTable = pgTable(
  'task_activities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasksTable.id, { onDelete: 'cascade' }),
    // the history outlives the account that made the change
    actorId: uuid('actor_id').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    type: text('type').$type<TaskActivityType>().notNull(),
    data: jsonb('data')
      .$type<TaskActivityEntry['data']>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    taskCreatedIdx: index('task_activities_task_created_idx').on(
      table.taskId,
      table.createdAt.desc(),
    ),
  }),
);
