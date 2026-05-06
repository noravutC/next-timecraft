import { db } from "@/db";
import {
  columnsTable,
  taskAssigneesTable,
  tasksTable,
  usersTable,
} from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export async function getTaskColumnLink(taskId: string) {
  const [row] = await db
    .select({
      taskId: tasksTable.id,
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

export async function setAssignees(
  taskId: string,
  userIds: string[],
): Promise<AssigneeWithUser[]> {
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

    return tx
      .select({
        userId: taskAssigneesTable.userId,
        fullName: usersTable.fullName,
        avatar: usersTable.avatar,
        email: usersTable.email,
      })
      .from(taskAssigneesTable)
      .innerJoin(usersTable, eq(taskAssigneesTable.userId, usersTable.id))
      .where(eq(taskAssigneesTable.taskId, taskId));
  });
}
