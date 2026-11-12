import { db } from '@/db';
import { webhookDeliveriesTable, webhooksTable } from '@/db/schema';
import type {
  NewWebhookRow,
  Webhook,
  WebhookDeliveryRow,
  WebhookHealth,
  WebhookRow,
} from '@/types';
import { and, asc, desc, eq, inArray, lte, ne, sql } from 'drizzle-orm';

/** How many of a webhook's latest messages its health is read from. */
const HEALTH_WINDOW = 5;

/** A try that is being sent is not offered again for this long. */
const LEASE_MS = 10 * 60_000;

const mine = (webhookId: string, projectId: string) =>
  and(eq(webhooksTable.id, webhookId), eq(webhooksTable.projectId, projectId));

async function healthOf(webhookId: string): Promise<WebhookHealth> {
  const latest = await db
    .select({
      status: webhookDeliveriesTable.status,
      attempts: webhookDeliveriesTable.attempts,
      createdAt: webhookDeliveriesTable.createdAt,
    })
    .from(webhookDeliveriesTable)
    .where(
      and(
        eq(webhookDeliveriesTable.webhookId, webhookId),
        ne(webhookDeliveriesTable.event, 'ping'),
      ),
    )
    .orderBy(desc(webhookDeliveriesTable.createdAt))
    .limit(HEALTH_WINDOW);
  // tried at least once and not accepted yet
  const tried = latest.filter((d) => d.attempts > 0);
  return {
    recent: tried.length,
    failed: tried.filter((d) => d.status !== 'sent').length,
    lastSentAt: latest.find((d) => d.status === 'sent')?.createdAt ?? null,
  };
}

const withoutSecret = async ({
  secret: _secret,
  ...row
}: WebhookRow): Promise<Webhook> => ({
  ...row,
  health: await healthOf(row.id),
});

/** A board's webhooks, oldest first, each with how its last messages went. */
export async function listWebhooks(projectId: string): Promise<Webhook[]> {
  const rows = await db
    .select()
    .from(webhooksTable)
    .where(eq(webhooksTable.projectId, projectId))
    .orderBy(asc(webhooksTable.createdAt));
  return Promise.all(rows.map(withoutSecret));
}

export async function countWebhooks(projectId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(webhooksTable)
    .where(eq(webhooksTable.projectId, projectId));
  return row?.n ?? 0;
}

/** With its secret: only for sending. */
export async function getWebhook(
  webhookId: string,
  projectId: string,
): Promise<WebhookRow | null> {
  const [row] = await db
    .select()
    .from(webhooksTable)
    .where(mine(webhookId, projectId));
  return row ?? null;
}

export async function insertWebhook(
  values: Pick<
    NewWebhookRow,
    'projectId' | 'name' | 'url' | 'secret' | 'events' | 'createdBy'
  >,
): Promise<Webhook> {
  const [created] = await db.insert(webhooksTable).values(values).returning();
  return withoutSecret(created);
}

export async function updateWebhook(
  webhookId: string,
  projectId: string,
  patch: Partial<Pick<NewWebhookRow, 'name' | 'url' | 'events' | 'enabled'>>,
): Promise<Webhook | null> {
  const [updated] = await db
    .update(webhooksTable)
    .set({ ...patch, updatedAt: new Date() })
    .where(mine(webhookId, projectId))
    .returning();
  return updated ? withoutSecret(updated) : null;
}

export async function deleteWebhook(
  webhookId: string,
  projectId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(webhooksTable)
    .where(mine(webhookId, projectId))
    .returning({ id: webhooksTable.id });
  return deleted.length > 0;
}

/** The switched-on webhooks of these boards, to hand events to. */
export async function listSubscribers(projectIds: string[]) {
  if (projectIds.length === 0) return [];
  return db
    .select({
      id: webhooksTable.id,
      projectId: webhooksTable.projectId,
      events: webhooksTable.events,
    })
    .from(webhooksTable)
    .where(
      and(
        inArray(webhooksTable.projectId, projectIds),
        eq(webhooksTable.enabled, true),
      ),
    );
}

/** Writes messages to send: from here on they are not lost. */
export async function insertDeliveries(
  rows: Pick<
    WebhookDeliveryRow,
    'webhookId' | 'event' | 'taskId' | 'taskTitle' | 'payload'
  >[],
): Promise<string[]> {
  if (rows.length === 0) return [];
  const created = await db
    .insert(webhookDeliveriesTable)
    .values(rows)
    .returning({ id: webhookDeliveriesTable.id });
  return created.map((r) => r.id);
}

/**
 * Takes messages whose time has come, counting the try. Taking one moves
 * its next time forward, so another run leaves it alone while it is sent.
 * `ids` narrows it to messages just written.
 */
export async function claimDeliveries(
  now: Date,
  limit: number,
  ids?: string[],
) {
  const due = db
    .select({ id: webhookDeliveriesTable.id })
    .from(webhookDeliveriesTable)
    .where(
      and(
        eq(webhookDeliveriesTable.status, 'pending'),
        lte(webhookDeliveriesTable.nextAttemptAt, now),
        ids ? inArray(webhookDeliveriesTable.id, ids) : undefined,
      ),
    )
    .orderBy(asc(webhookDeliveriesTable.nextAttemptAt))
    .limit(limit)
    .for('update', { skipLocked: true });
  const claimed = await db
    .update(webhookDeliveriesTable)
    .set({
      attempts: sql`${webhookDeliveriesTable.attempts} + 1`,
      nextAttemptAt: new Date(now.getTime() + LEASE_MS),
    })
    .where(inArray(webhookDeliveriesTable.id, due))
    .returning();
  if (claimed.length === 0) return [];
  const hooks = await db
    .select()
    .from(webhooksTable)
    .where(
      inArray(webhooksTable.id, [...new Set(claimed.map((d) => d.webhookId))]),
    );
  const byId = new Map(hooks.map((h) => [h.id, h]));
  return claimed.flatMap((delivery) => {
    const webhook = byId.get(delivery.webhookId);
    return webhook ? [{ delivery, webhook }] : [];
  });
}

/** Writes down how a try went, and when the next one is if there is one. */
export async function finishDelivery(
  deliveryId: string,
  result: Pick<
    WebhookDeliveryRow,
    'status' | 'responseStatus' | 'durationMs' | 'error'
  > & { nextAttemptAt?: Date },
): Promise<void> {
  await db
    .update(webhookDeliveriesTable)
    .set(result)
    .where(eq(webhookDeliveriesTable.id, deliveryId));
}

/** Puts a message back in line, as if it were new: "Send again now". */
export async function requeueDelivery(
  deliveryId: string,
  projectId: string,
  now: Date,
): Promise<boolean> {
  const hooks = db
    .select({ id: webhooksTable.id })
    .from(webhooksTable)
    .where(eq(webhooksTable.projectId, projectId));
  const updated = await db
    .update(webhookDeliveriesTable)
    .set({ status: 'pending', attempts: 0, nextAttemptAt: now })
    .where(
      and(
        eq(webhookDeliveriesTable.id, deliveryId),
        inArray(webhookDeliveriesTable.webhookId, hooks),
        ne(webhookDeliveriesTable.status, 'sent'),
      ),
    )
    .returning({ id: webhookDeliveriesTable.id });
  return updated.length > 0;
}
