import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { webhooksTable, type WebhookEvent } from './webhook.table';

/** What is sent: the event, the board and the task as it was. */
export type WebhookPayload = {
  event: WebhookEvent | 'ping';
  sentAt: string;
  board: { id: string; name: string };
  task?: {
    id: string;
    title: string;
    column: string | null;
    priority: string;
    dueDate: string | null;
    labels: string[];
    url: string;
  };
  /** what changed, in the words of the task's history */
  change?: string;
  actor?: { name: string } | null;
};

/**
 * One message to one webhook. The row is written when the event happens
 * (the outbox) and sent afterwards, so a receiver that is down gets it
 * later: `nextAttemptAt` is when to try next, and claiming a row moves it
 * forward so two runs never send the same try.
 */
export const webhookDeliveriesTable = pgTable(
  'webhook_deliveries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    webhookId: uuid('webhook_id')
      .notNull()
      .references(() => webhooksTable.id, { onDelete: 'cascade' }),
    event: text('event').$type<WebhookEvent | 'ping'>().notNull(),
    // not a foreign key: the delivery outlives a deleted task
    taskId: uuid('task_id'),
    taskTitle: text('task_title').notNull().default(''),
    payload: jsonb('payload').$type<WebhookPayload>().notNull(),
    status: text('status')
      .$type<'pending' | 'sent' | 'failed'>()
      .notNull()
      .default('pending'),
    attempts: integer('attempts').notNull().default(0),
    // the receiver's answer to the last try
    responseStatus: integer('response_status'),
    durationMs: integer('duration_ms'),
    error: text('error'),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    webhookCreatedIdx: index('webhook_deliveries_webhook_created_idx').on(
      table.webhookId,
      table.createdAt.desc(),
    ),
    // the delivery job: only rows still waiting to be sent
    pendingIdx: index('webhook_deliveries_pending_idx')
      .on(table.nextAttemptAt)
      .where(sql`${table.status} = 'pending'`),
  }),
);
