import { db } from '@/db';
import {
  columnsTable,
  organizationsTable,
  projectMembersTable,
  projectsTable,
  taskTemplatesTable,
  usersTable,
} from '@/db/schema';
import type { BoardRefs } from '@/helper/utils/automation';
import type { RuleNames } from '@/helper/utils/automation-text';
import type { ActivityColumnRef } from '@/types';
import { and, eq, sql } from 'drizzle-orm';

/** What rules need to know about a board: its columns, people and labels. */
export type AutomationBoard = {
  id: string;
  name: string;
  timeZone: string;
  ownerId: string;
  doneColumnId: string | null;
  columns: (ActivityColumnRef & { isDone: boolean })[];
  members: { id: string; name: string }[];
  labels: string[];
  templates: { id: string; title: string }[];
};

/** Null when the board is gone. */
export async function getAutomationBoard(
  projectId: string,
): Promise<AutomationBoard | null> {
  const [[board], columns, members, templates] = await Promise.all([
    db
      .select({
        id: projectsTable.id,
        name: projectsTable.name,
        ownerId: projectsTable.ownerId,
        labels: projectsTable.tags,
        timeZone: sql<string>`coalesce(${organizationsTable.timeZone}, 'UTC')`,
      })
      .from(projectsTable)
      .leftJoin(
        organizationsTable,
        eq(organizationsTable.id, projectsTable.organizationId),
      )
      .where(eq(projectsTable.id, projectId)),
    db
      .select({
        id: columnsTable.id,
        name: columnsTable.name,
        color: columnsTable.color,
        isDone: columnsTable.isDone,
      })
      .from(columnsTable)
      .where(
        and(
          eq(columnsTable.projectId, projectId),
          eq(columnsTable.isDeleted, false),
        ),
      )
      .orderBy(sql`${columnsTable.orderFraction} COLLATE "C"`),
    db
      .select({ id: usersTable.id, name: usersTable.fullName })
      .from(projectMembersTable)
      .innerJoin(usersTable, eq(usersTable.id, projectMembersTable.userId))
      .where(eq(projectMembersTable.projectId, projectId)),
    db
      .select({ id: taskTemplatesTable.id, title: taskTemplatesTable.title })
      .from(taskTemplatesTable)
      .where(eq(taskTemplatesTable.projectId, projectId)),
  ]);
  if (!board) return null;
  return {
    ...board,
    doneColumnId: columns.find((c) => c.isDone)?.id ?? null,
    columns,
    members: members.map((m) => ({ id: m.id, name: m.name ?? '' })),
    templates,
  };
}

/** The board's names for the ids a rule holds, to put it in words. */
export const ruleNamesOf = (board: AutomationBoard): RuleNames => ({
  columns: Object.fromEntries(
    board.columns.map((c) => [c.id, { name: c.name, color: c.color }]),
  ),
  people: Object.fromEntries(board.members.map((m) => [m.id, m.name])),
  templates: Object.fromEntries(board.templates.map((t) => [t.id, t.title])),
});

/** What the board has, to check that a rule's refs still exist. */
export const boardRefsOf = (board: AutomationBoard): BoardRefs => ({
  columnIds: new Set(board.columns.map((c) => c.id)),
  memberIds: new Set(board.members.map((m) => m.id)),
  labels: new Set(board.labels),
  templateIds: new Set(board.templates.map((t) => t.id)),
});
