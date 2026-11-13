import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import {
  automationRulesTable,
  type RuleTrigger,
} from './automation-rule.table';
import { projectsTable } from './project.table';
import { tasksTable } from './task.table';

/**
 * Each time a rule did something, or could not: the History list. The rule
 * and the task are kept in words, so a row still reads right after either
 * is edited or deleted.
 */
export const automationRunsTable = pgTable(
  'automation_runs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projectsTable.id, { onDelete: 'cascade' }),
    ruleId: uuid('rule_id').references(() => automationRulesTable.id, {
      onDelete: 'set null',
    }),
    rule: text('rule').notNull(),
    trigger: text('trigger').$type<RuleTrigger['type']>().notNull(),
    taskId: uuid('task_id').references(() => tasksTable.id, {
      onDelete: 'set null',
    }),
    taskTitle: text('task_title').notNull().default(''),
    status: text('status').$type<'done' | 'needs_fix' | 'failed'>().notNull(),
    detail: text('detail').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectCreatedIdx: index('automation_runs_project_created_idx').on(
      table.projectId,
      table.createdAt.desc(),
    ),
  }),
);
