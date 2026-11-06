import { db } from "@/db";
import {
  columnsTable,
  projectMembersTable,
  taskAssigneesTable,
  tasksTable,
  usersTable,
} from "@/db/schema";
import { and, eq, inArray, notExists } from "drizzle-orm";

export async function getTaskColumnLink(taskId: string) {
  const [row] = await db
    .select({
      taskId: tasksTable.id,
      taskTitle: tasksTable.title,
      columnId: tasksTable.columnId,
      projectId: columnsTable.projectId,
    })
    .from(tasksTable)
    .innerJoin(columnsTable, eq(tasksTable.columnId, columnsTable.id))
    .where(eq(tasksTable.id, taskId))
    .limit(1);
  return row ?? null;
}

export interface AssigneeWithUser {
  userId: string;
  fullName: string;
  avatar: string | null;
  email: string;
}

export async function fetchAssignees(taskId: string): Promise<AssigneeWithUser[]> {
  return db
    .select({
      userId: taskAssigneesTable.userId,
      fullName: usersTable.fullName,
      avatar: usersTable.avatar,
      email: usersTable.email,
    })
    .from(taskAssigneesTable)
    .innerJoin(usersTable, eq(taskAssigneesTable.userId, usersTable.id))
    .where(eq(taskAssigneesTable.taskId, taskId));
}

export interface AssigneeWithUserAndTask extends AssigneeWithUser {
  taskId: string;
}

export async function fetchAssigneesForTasks(
  taskIds: string[],
): Promise<AssigneeWithUserAndTask[]> {
  if (taskIds.length === 0) return [];
  return db
    .select({
      taskId: taskAssigneesTable.taskId,
      userId: taskAssigneesTable.userId,
      fullName: usersTable.fullName,
      avatar: usersTable.avatar,
      email: usersTable.email,
    })
    .from(taskAssigneesTable)
    .innerJoin(usersTable, eq(taskAssigneesTable.userId, usersTable.id))
    .where(inArray(taskAssigneesTable.taskId, taskIds));
}

export async function setAssignees(
  taskId: string,
  userIds: string[],
): Promise<{
  assignees: AssigneeWithUser[];
  added: string[];
  removed: string[];
}> {
  return db.transaction(async (tx) => {
    const current = await tx
      .select({ userId: taskAssigneesTable.userId })
      .from(taskAssigneesTable)
      .where(eq(taskAssigneesTable.taskId, taskId));

    const currentSet = new Set(current.map((c) => c.userId));
    const nextSet = new Set(userIds);

    const toAdd = userIds.filter((u) => !currentSet.has(u));
    const toRemove = current
      .filter((c) => !nextSet.has(c.userId))
      .map((c) => c.userId);

    if (toRemove.length > 0) {
      await tx
        .delete(taskAssigneesTable)
        .where(
          and(
            eq(taskAssigneesTable.taskId, taskId),
            inArray(taskAssigneesTable.userId, toRemove),
          ),
        );
    }
    if (toAdd.length > 0) {
      await tx
        .insert(taskAssigneesTable)
        .values(toAdd.map((userId) => ({ taskId, userId })))
        .onConflictDoNothing();
    }

    const assignees = await tx
      .select({
        userId: taskAssigneesTable.userId,
        fullName: usersTable.fullName,
        avatar: usersTable.avatar,
        email: usersTable.email,
      })
      .from(taskAssigneesTable)
      .innerJoin(usersTable, eq(taskAssigneesTable.userId, usersTable.id))
      .where(eq(taskAssigneesTable.taskId, taskId));

    return { assignees, added: toAdd, removed: toRemove };
  });
}

// After a task moves to another board, drop assignees who are not members
// there — otherwise that board would see users (and emails) it never invited.
export async function removeNonMemberAssignees(
  taskIds: string[],
  projectId: string,
): Promise<void> {
  if (taskIds.length === 0) return;
  await db
    .delete(taskAssigneesTable)
    .where(
      and(
        inArray(taskAssigneesTable.taskId, taskIds),
        notExists(
          db
            .select({ id: projectMembersTable.id })
            .from(projectMembersTable)
            .where(
              and(
                eq(projectMembersTable.projectId, projectId),
                eq(projectMembersTable.userId, taskAssigneesTable.userId),
              ),
            ),
        ),
      ),
    );
}
