import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { projectsTable } from './project.table';
import { usersTable } from './user.table';

/** What a webhook can be told about. */
export type WebhookEvent =
  | 'task.created'
  | 'task.moved'
  | 'task.finished'
  | 'task.updated'
  | 'task.removed'
  | 'comment.added';

/**
 * An address outside TimeCraft that hears about what happens on a board.
 * The secret signs every request and is stored encrypted: it is shown once,
 * when the webhook is made.
 */
export const webhooksTable = pgTable(
  'webhooks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projectsTable.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    url: text('url').notNull(),
    secret: text('secret').notNull(),
    events: text('events')
      .array()
      .$type<WebhookEvent[]>()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    enabled: boolean('enabled').notNull().default(true),
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
    projectIdx: index('webhooks_project_idx').on(table.projectId),
  }),
);
