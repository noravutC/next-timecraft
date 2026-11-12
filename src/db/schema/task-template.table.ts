import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { taskPriorityLevelEnum } from './enums';
import { projectsTable } from './project.table';
import { usersTable } from './user.table';

/**
 * A task to reuse on one board: what a new task starts with. People and
 * labels are checked again when it is used, so a template never adds
 * someone who left the board or a label that was deleted.
 */
export const taskTemplatesTable = pgTable(
  'task_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projectsTable.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    priority: taskPriorityLevelEnum('priority').notNull().default('medium'),
    tags: text('tags')
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    // subtask titles, in order
    subtasks: text('subtasks')
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    assigneeIds: uuid('assignee_ids')
      .array()
      .notNull()
      .default(sql`ARRAY[]::uuid[]`),
    // due this many days after the task is created; null = no due date
    dueInDays: integer('due_in_days'),
    usedCount: integer('used_count').notNull().default(0),
    createdBy: uuid('created_by').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectIdx: index('task_templates_project_idx').on(table.projectId),
  }),
);
