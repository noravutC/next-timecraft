import { db } from "@/db";
import { projectMembersTable, projectsTable } from "@/db/schema";
import {
  Permission,
  ROLE_PERMISSIONS,
} from "@/types/global/permission-project";
import { eq, and, inArray } from "drizzle-orm";

export async function hasPermission(
  userId: string,
  projectIds: string[],
  permission: Permission,
): Promise<boolean> {
  const accessibleMemberships = await db
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
  // const permissionByProject = accessibleMemberships.map((a) => (ROLE_PERMISSIONS[a.role].includes(permission)));
  // const hasPermission = permissionByProject.every((p) => p === true);
  // return hasPermission;
  if (
    accessibleMemberships.length === 0 ||
    accessibleMemberships.length !== projectIds.length
  ) {
    return false;
  }
  const permissionByProject = accessibleMemberships.map((a) =>
    ROLE_PERMISSIONS[a.role].includes(permission),
  );
  const hasPermission = permissionByProject.every((p) => p === true);
  return hasPermission;
}
