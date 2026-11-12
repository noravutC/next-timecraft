import { db } from '@/db';
import {
  automationRulesTable,
  automationRunsTable,
  organizationsTable,
  projectsTable,
} from '@/db/schema';
import type {
  AutomationRule,
  AutomationRuleRow,
  RuleTriggerType,
  SaveRulePayload,
} from '@/types';
import { and, asc, eq, gte, inArray, isNull, lte, sql } from 'drizzle-orm';

const mine = (ruleId: string, projectId: string) =>
  and(
    eq(automationRulesTable.id, ruleId),
    eq(automationRulesTable.projectId, projectId),
  );

const triggerType = sql<RuleTriggerType>`${automationRulesTable.trigger}->>'type'`;

// rules that can run: switched on, and nothing they point at is missing
const live = and(
  eq(automationRulesTable.enabled, true),
  isNull(automationRulesTable.brokenReason),
);

/** A board's rules, oldest first, with how often each ran since `since`. */
export async function listRules(
  projectId: string,
  since: Date,
): Promise<AutomationRule[]> {
  const [rules, runs] = await Promise.all([
    db
      .select()
      .from(automationRulesTable)
      .where(eq(automationRulesTable.projectId, projectId))
      .orderBy(asc(automationRulesTable.createdAt)),
    db
      .select({
        ruleId: automationRunsTable.ruleId,
        n: sql<number>`count(*)::int`,
      })
      .from(automationRunsTable)
      .where(
        and(
          eq(automationRunsTable.projectId, projectId),
          eq(automationRunsTable.status, 'done'),
          gte(automationRunsTable.createdAt, since),
        ),
      )
      .groupBy(automationRunsTable.ruleId),
  ]);
  const count = new Map(runs.map((r) => [r.ruleId, r.n]));
  return rules.map((rule) => ({
    ...rule,
    runsThisWeek: count.get(rule.id) ?? 0,
  }));
}

export async function countRules(projectId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(automationRulesTable)
    .where(eq(automationRulesTable.projectId, projectId));
  return row?.n ?? 0;
}

export async function getRule(
  ruleId: string,
  projectId: string,
): Promise<AutomationRuleRow | null> {
  const [row] = await db
    .select()
    .from(automationRulesTable)
    .where(mine(ruleId, projectId));
  return row ?? null;
}

export async function insertRule(
  projectId: string,
  userId: string,
  payload: SaveRulePayload,
  nextRunAt: Date | null,
): Promise<AutomationRuleRow> {
  const [created] = await db
    .insert(automationRulesTable)
    .values({ ...payload, projectId, createdBy: userId, nextRunAt })
    .returning();
  return created;
}

/** Saving a rule again clears what broke it: its refs were just checked. */
export async function updateRule(
  ruleId: string,
  projectId: string,
  patch: Partial<SaveRulePayload> & {
    nextRunAt?: Date | null;
    brokenReason?: string | null;
  },
): Promise<AutomationRuleRow | null> {
  const [updated] = await db
    .update(automationRulesTable)
    .set({ ...patch, updatedAt: new Date() })
    .where(mine(ruleId, projectId))
    .returning();
  return updated ?? null;
}

export async function deleteRule(
  ruleId: string,
  projectId: string,
): Promise<boolean> {
  const deleted = await db
    .delete(automationRulesTable)
    .where(mine(ruleId, projectId))
    .returning({ id: automationRulesTable.id });
  return deleted.length > 0;
}

/** Pauses a rule that points at something the board no longer has. */
export async function markRuleBroken(
  ruleId: string,
  reason: string,
): Promise<void> {
  await db
    .update(automationRulesTable)
    .set({ brokenReason: reason })
    .where(eq(automationRulesTable.id, ruleId));
}

/** The rules on these boards that wait for a change someone makes. */
export async function listChangeRules(
  projectIds: string[],
): Promise<AutomationRuleRow[]> {
  if (projectIds.length === 0) return [];
  return db
    .select()
    .from(automationRulesTable)
    .where(
      and(
        inArray(automationRulesTable.projectId, projectIds),
        live,
        sql`${triggerType} not in ('schedule', 'due_soon', 'due_passed', 'task_idle')`,
      ),
    )
    .orderBy(asc(automationRulesTable.createdAt));
}

const withZone = {
  rule: automationRulesTable,
  timeZone: sql<string>`coalesce(${organizationsTable.timeZone}, 'UTC')`,
};

const zoned = () =>
  db
    .select(withZone)
    .from(automationRulesTable)
    .innerJoin(
      projectsTable,
      eq(projectsTable.id, automationRulesTable.projectId),
    )
    .leftJoin(
      organizationsTable,
      eq(organizationsTable.id, projectsTable.organizationId),
    );

// an archived board is read-only: nothing runs on it
const active = eq(projectsTable.archived, false);

/** Schedule rules whose time has come, on every board that is not archived. */
export async function listDueSchedules(now: Date) {
  return zoned().where(
    and(live, active, lte(automationRulesTable.nextRunAt, now)),
  );
}

/**
 * Takes a schedule rule's occurrence by moving its next time forward. Only
 * one caller gets true: for the next one, the time is no longer due.
 */
export async function claimSchedule(
  ruleId: string,
  next: Date | null,
  now: Date,
): Promise<boolean> {
  const claimed = await db
    .update(automationRulesTable)
    .set({ nextRunAt: next, lastRunAt: now })
    .where(
      and(
        eq(automationRulesTable.id, ruleId),
        lte(automationRulesTable.nextRunAt, now),
      ),
    )
    .returning({ id: automationRulesTable.id });
  return claimed.length > 0;
}

/** Rules that wait for a date, on every board that is not archived. */
export async function listDateRules() {
  return zoned().where(
    and(
      live,
      active,
      sql`${triggerType} in ('due_soon', 'due_passed', 'task_idle')`,
    ),
  );
}
