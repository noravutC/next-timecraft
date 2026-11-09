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
 * A secret link that serves a board's due dates as an iCal feed, one per
 * person per board. The feed checks the person is still on the board, so
 * leaving or being removed stops it; resetting changes the token.
 */
export const calendarFeedsTable = pgTable(
  'calendar_feeds',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projectsTable.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tokenUnique: uniqueIndex('calendar_feeds_token_unique').on(table.token),
    userProjectUnique: uniqueIndex('calendar_feeds_user_project_unique').on(
      table.userId,
      table.projectId,
    ),
  }),
);
