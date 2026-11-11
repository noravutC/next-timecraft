import { db } from '@/db';
import {
  digestSubscriptionsTable,
  organizationsTable,
  projectMembersTable,
  projectsTable,
  taskAssigneesTable,
  tasksTable,
  usersTable,
} from '@/db/schema';
import { digestWeek, nextDigestAt } from '@/helper/utils/insights';
import { withPrefDefaults } from '@/helper/utils/notification-prefs';
import type { DigestContents, DigestState } from '@/types';
import { and, eq, isNull, ne, or, sql } from 'drizzle-orm';
import {
  completionSummary,
  getBoardLanes,
  listAttention,
  listDueSoon,
  openCounts,
} from './insights-utils';

/** Rows in the email's "Finished last week" and "Needs attention" lists. */
const FINISHED_LIMIT = 3;
const ATTENTION_LIMIT = 5;

const mine = (userId: string, projectId: string) =>
  and(
    eq(digestSubscriptionsTable.userId, userId),
    eq(digestSubscriptionsTable.projectId, projectId),
  );

/** Whether this person gets this board's weekly digest. */
export async function hasDigest(
  userId: string,
  projectId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: digestSubscriptionsTable.id })
    .from(digestSubscriptionsTable)
    .where(mine(userId, projectId));
  return Boolean(row);
}

/** Turns the weekly digest on or off for one person on one board. */
export async function setDigest(
  userId: string,
  projectId: string,
  on: boolean,
): Promise<void> {
  if (on) {
    await db
      .insert(digestSubscriptionsTable)
      .values({ userId, projectId })
      .onConflictDoNothing({
        target: [
          digestSubscriptionsTable.userId,
          digestSubscriptionsTable.projectId,
        ],
      });
  } else {
    await db.delete(digestSubscriptionsTable).where(mine(userId, projectId));
  }
}

/** A board's name and the zone its weeks are counted in. */
export async function getDigestBoard(projectId: string) {
  const [board] = await db
    .select({
      name: projectsTable.name,
      timeZone: organizationsTable.timeZone,
    })
    .from(projectsTable)
    .leftJoin(
      organizationsTable,
      eq(organizationsTable.id, projectsTable.organizationId),
    )
    .where(eq(projectsTable.id, projectId));
  return board ? { name: board.name, timeZone: board.timeZone ?? 'UTC' } : null;
}

/** Your digest setting for a board, and when the next one would go out. */
export async function getDigestState(
  userId: string,
  projectId: string,
  now: Date = new Date(),
): Promise<DigestState> {
  const [on, board, [user]] = await Promise.all([
    hasDigest(userId, projectId),
    getDigestBoard(projectId),
    db
      .select({ prefs: usersTable.notificationPrefs })
      .from(usersTable)
      .where(eq(usersTable.id, userId)),
  ]);
  return {
    on,
    nextAt: nextDigestAt(now, board?.timeZone ?? 'UTC').toISOString(),
    emailOff: !withPrefDefaults(user?.prefs).email,
  };
}

/**
 * Every digest that could go out: the person is still on the board, has an
 * inbox (not deleted, not the shared guest) and the board isn't archived.
 */
export async function listDigestSubscriptions() {
  return db
    .select({
      id: digestSubscriptionsTable.id,
      projectId: digestSubscriptionsTable.projectId,
      lastSentWeek: digestSubscriptionsTable.lastSentWeek,
      email: usersTable.email,
      prefs: usersTable.notificationPrefs,
      boardName: projectsTable.name,
      timeZone: sql<string>`coalesce(${organizationsTable.timeZone}, 'UTC')`,
    })
    .from(digestSubscriptionsTable)
    .innerJoin(usersTable, eq(usersTable.id, digestSubscriptionsTable.userId))
    .innerJoin(
      projectsTable,
      eq(projectsTable.id, digestSubscriptionsTable.projectId),
    )
    .innerJoin(
      projectMembersTable,
      and(
        eq(projectMembersTable.projectId, digestSubscriptionsTable.projectId),
        eq(projectMembersTable.userId, digestSubscriptionsTable.userId),
      ),
    )
    .leftJoin(
      organizationsTable,
      eq(organizationsTable.id, projectsTable.organizationId),
    )
    .where(
      and(
        isNull(usersTable.deletedAt),
        ne(usersTable.provider, 'guest'),
        eq(projectsTable.archived, false),
      ),
    );
}

/**
 * Marks a week's digest as sent for one subscription. False when it already
 * was, so two runs at once send it only once.
 */
export async function claimDigest(id: string, weekKey: string) {
  const rows = await db
    .update(digestSubscriptionsTable)
    .set({ lastSentWeek: weekKey })
    .where(
      and(
        eq(digestSubscriptionsTable.id, id),
        or(
          isNull(digestSubscriptionsTable.lastSentWeek),
          ne(digestSubscriptionsTable.lastSentWeek, weekKey),
        ),
      ),
    )
    .returning({ id: digestSubscriptionsTable.id });
  return rows.length > 0;
}

/** Puts a claim back after a failed send, so the next run tries again. */
export async function releaseDigest(id: string, lastSentWeek: string | null) {
  await db
    .update(digestSubscriptionsTable)
    .set({ lastSentWeek })
    .where(eq(digestSubscriptionsTable.id, id));
}

/**
 * What the digest sent on the Monday `weekKey` says about a board. Null
 * when the board has no Done column: nothing can be counted as finished.
 */
export async function getDigestContents(
  projectId: string,
  weekKey: string,
  tz: string,
): Promise<DigestContents | null> {
  const lanes = await getBoardLanes(projectId);
  if (!lanes.done) return null;
  const doneColumnId = lanes.done.id;
  const week = digestWeek(weekKey, tz);

  const [summary, finished, counts, attention, dueSoon] = await Promise.all([
    completionSummary(doneColumnId, week, tz),
    db.execute<{ title: string; by: string | null }>(sql`
      select t.title, (
        select u.full_name from ${taskAssigneesTable} ta
        join ${usersTable} u on u.id = ta.user_id
        where ta.task_id = t.id
        order by ta.created_at limit 1) as by
      from ${tasksTable} t
      where t.column_id = ${doneColumnId}
        and t.completed_at >= ${week.from.toISOString()}::timestamptz
        and t.completed_at < ${week.to.toISOString()}::timestamptz
      order by t.completed_at desc
      limit ${FINISHED_LIMIT}
    `),
    openCounts(projectId, week.to),
    listAttention({
      projectId,
      doneColumnId,
      firstColumnId: lanes.open[0]?.id ?? null,
      // as of the Monday it is sent: the same email whenever the job runs
      now: week.to,
      today: week.to,
      tz,
      limit: ATTENTION_LIMIT,
    }),
    listDueSoon({
      projectId,
      from: week.to,
      to: week.nextWeek,
      today: week.to,
      tz,
      limit: ATTENTION_LIMIT,
    }),
  ]);

  // overdue, blocked and stuck first; tasks due this week fill what is left
  const listed = new Set(attention.items.map((a) => a.id));
  const upcoming = dueSoon.items.filter((d) => !listed.has(d.id));
  return {
    completed: summary.total,
    previousCompleted: summary.previous,
    median: summary.median,
    finished: [...finished],
    dueThisWeek: dueSoon.total,
    overdue: counts.overdue,
    attention: [...attention.items, ...upcoming].slice(0, ATTENTION_LIMIT),
    // a task in both lists is counted once only when it is among the listed
    attentionTotal:
      attention.total +
      dueSoon.total -
      (dueSoon.items.length - upcoming.length),
  };
}
