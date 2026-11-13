import {
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { automationRulesTable } from './automation-rule.table';
import { tasksTable } from './task.table';

/**
 * Rules that wait for a date look at the same tasks every few minutes.
 * A row here means "this rule already ran for this task and this date",
 * so it runs once: the key names the due date or the stay it fired for.
 */
export const automationFiredTable = pgTable(
  'automation_fired',
  {
    ruleId: uuid('rule_id')
      .notNull()
      .references(() => automationRulesTable.id, { onDelete: 'cascade' }),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasksTable.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.ruleId, table.taskId, table.key] }),
  }),
);
