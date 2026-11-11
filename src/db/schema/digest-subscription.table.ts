import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { projectsTable } from './project.table';
import { usersTable } from './user.table';

/**
 * Who gets a board's weekly digest email: a row means it is on for that
 * person on that board, and turning it off deletes the row. The job only
 * sends to people who are still on the board.
 */
export const digestSubscriptionsTable = pgTable(
  'digest_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projectsTable.id, { onDelete: 'cascade' }),
    // the Monday (YYYY-MM-DD, in the workspace's zone) of the last digest
    // that went out, so a week is never sent twice
    lastSentWeek: text('last_sent_week'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userProjectUnique: uniqueIndex(
      'digest_subscriptions_user_project_unique',
    ).on(table.userId, table.projectId),
  }),
);
