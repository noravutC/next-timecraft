import { db } from "@/db";
import { projectMembersTable, projectsTable } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { ForbiddenError } from "@/lib/api/errors";
import { can } from "./can";
import { Permission } from "./permissions";

export async function authorize(
  userId: string,
  projectIds: string[],
  permission: Permission,
): Promise<boolean> {
  if (projectIds.length === 0) return false;

  const memberships = await db
    .select({
      projectId: projectMembersTable.projectId,
      role: projectMembersTable.role,
    })
    .from(projectMembersTable)
    .innerJoin(
      projectsTable,
      eq(projectMembersTable.projectId, projectsTable.id),
    )
    .where(
      and(
        eq(projectMembersTable.userId, userId),
        inArray(projectMembersTable.projectId, projectIds),
      ),
    );

  if (memberships.length !== projectIds.length) return false;
  return memberships.every((m) => can(m.role, permission));
}

export async function authorizeOrThrow(
  userId: string,
  projectIds: string[],
  permission: Permission,
): Promise<void> {
  const ok = await authorize(userId, projectIds, permission);
  if (!ok) throw new ForbiddenError();
}
