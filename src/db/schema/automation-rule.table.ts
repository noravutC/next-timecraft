import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import type { taskPriorityLevelEnum } from './enums';
import { projectsTable } from './project.table';
import { usersTable } from './user.table';

type Priority = (typeof taskPriorityLevelEnum.enumValues)[number];

/** What starts a rule. Ids point at this board's columns and people. */
export type RuleTrigger =
  | { type: 'task_created'; columnId?: string }
  | { type: 'task_moved'; fromColumnId?: string; toColumnId?: string }
  | { type: 'task_finished' }
  | { type: 'task_assigned'; userId?: string }
  | { type: 'label_added'; label?: string }
  | { type: 'subtasks_done' }
  | { type: 'due_soon'; days: number }
  | { type: 'due_passed' }
  | { type: 'task_idle'; days: number; columnId?: string }
  | {
      type: 'schedule';
      every: 'day' | 'week' | 'month';
      /** 0 = Sunday to 6 = Saturday, when every is 'week' */
      weekdays?: number[];
      /** 1 to 28, when every is 'month' */
      monthDay?: number;
      /** HH:mm in the workspace's time zone */
      time: string;
    };

/** A check on the task itself, after the trigger matched. */
export type RuleCondition =
  | { field: 'assignee'; op: 'is_empty' | 'is_not_empty' }
  | { field: 'priority'; op: 'is' | 'is_not'; value: Priority }
  | { field: 'label'; op: 'has' | 'has_not'; value: string }
  | { field: 'column'; op: 'is' | 'is_not'; value: string };

export type RuleAction =
  | { type: 'move'; columnId: string }
  /** userId is a member's id, or 'actor' for whoever made the change */
  | { type: 'assign'; userId: string }
  | { type: 'set_priority'; priority: Priority }
  /** due this many days from the day the rule runs */
  | { type: 'set_due'; days: number }
  | { type: 'add_label'; label: string }
  | { type: 'remove_label'; label: string }
  | { type: 'comment'; body: string }
  /** to is 'creator', 'assignees' or a member's id */
  | { type: 'notify'; to: string }
  | { type: 'create_task'; templateId: string; columnId: string }
  | { type: 'archive' };

/**
 * "When this happens (only if that holds), do these things" on one board.
 * Rules that wait for a change run in the request that made it; rules
 * that wait for a date or a time run from the scheduled jobs.
 */
export const automationRulesTable = pgTable(
  'automation_rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projectsTable.id, { onDelete: 'cascade' }),
    trigger: jsonb('trigger').$type<RuleTrigger>().notNull(),
    conditions: jsonb('conditions')
      .$type<RuleCondition[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    actions: jsonb('actions').$type<RuleAction[]>().notNull(),
    enabled: boolean('enabled').notNull().default(true),
    // set when something the rule points at (a column, label, person or
    // template) is gone: it stays paused until it is saved again
    brokenReason: text('broken_reason'),
    // schedule rules only: the next time it is due. Moving it forward is
    // how a run is claimed, so one occurrence never runs twice.
    nextRunAt: timestamp('next_run_at', { withTimezone: true }),
    lastRunAt: timestamp('last_run_at', { withTimezone: true }),
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
    projectIdx: index('automation_rules_project_idx').on(table.projectId),
    // the schedule job, every 5 minutes: only rules waiting for a time
    nextRunIdx: index('automation_rules_next_run_idx')
      .on(table.nextRunAt)
      .where(sql`${table.enabled} AND ${table.nextRunAt} IS NOT NULL`),
  }),
);
