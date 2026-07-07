import { db } from "@/db";
import {
  membershipsTable,
  projectMembersTable,
  projectsTable,
} from "@/db/schema";
import { authorize } from "@/lib/rbac/authorize";
import { Permission } from "@/lib/rbac/permissions";
import type { Member, NewProjectRow, ProjectRow } from "@/types";
import { and, desc, eq, inArray } from "drizzle-orm";

/**
 * @deprecated Import `authorize` from "@/lib/rbac/authorize" instead.
 */
export async function hasPermission(
  userId: string,
  projectIds: string[],
  permission: Permission,
): Promise<boolean> {
  return authorize(userId, projectIds, permission);
}

export async function isProjectMember(
  userId: string,
  projectId: string,
): Promise<boolean> {
  const [member] = await db
    .select({ id: projectMembersTable.id })
    .from(projectMembersTable)
    .where(
      and(
        eq(projectMembersTable.projectId, projectId),
        eq(projectMembersTable.userId, userId),
      ),
    )
    .limit(1);
  return Boolean(member);
}

export async function getProjectMemberRole(
  projectId: string,
  userId: string,
): Promise<Member["role"] | null> {
  const [member] = await db
    .select({ role: projectMembersTable.role })
    .from(projectMembersTable)
    .where(
      and(
        eq(projectMembersTable.projectId, projectId),
        eq(projectMembersTable.userId, userId),
      ),
    )
    .limit(1);
  return member?.role ?? null;
}

export async function removeProjectMember(
  projectId: string,
  userId: string,
): Promise<Member | undefined> {
  const [removed] = await db
    .delete(projectMembersTable)
    .where(
      and(
        eq(projectMembersTable.projectId, projectId),
        eq(projectMembersTable.userId, userId),
      ),
    )
    .returning({
      userId: projectMembersTable.userId,
      role: projectMembersTable.role,
      joinedAt: projectMembersTable.joinedAt,
    });
  return removed;
}

export async function getProjectNameById(
  projectId: string,
): Promise<string | undefined> {
  const [project] = await db
    .select({ name: projectsTable.name })
    .from(projectsTable)
    .where(eq(projectsTable.id, projectId))
    .limit(1);
  return project?.name;
}

export async function getOrgRole(
  userId: string,
  organizationId: string,
): Promise<string | null> {
  const [membership] = await db
    .select({ role: membershipsTable.role })
    .from(membershipsTable)
    .where(
      and(
        eq(membershipsTable.userId, userId),
        eq(membershipsTable.organizationId, organizationId),
      ),
    )
    .limit(1);
  return membership?.role ?? null;
}

// สร้างบอร์ด + สมัครผู้สร้างเป็น owner member ใน transaction เดียว
export async function createProjectWithOwner(
  values: NewProjectRow & { ownerId: string },
): Promise<ProjectRow> {
  return db.transaction(async (tx) => {
    const [project] = await tx.insert(projectsTable).values(values).returning();
    await tx.insert(projectMembersTable).values({
      projectId: project.id,
      userId: values.ownerId,
      role: "owner",
      joinedAt: new Date(),
    });
    return project;
  });
}

// การมองเห็นบอร์ด = project_members ล้วน (board-centric) — ไม่กรองตาม org
// เพื่อให้สมาชิกที่ถูกเชิญข้ามองค์กรเห็นบอร์ดด้วย
export async function fetchProjectsWithMembers(
  userId: string,
  projectIds: string[],
): Promise<Array<ProjectRow & { members: Member[] }>> {
  const myMemberRows = await db
    .select({ projectId: projectMembersTable.projectId })
    .from(projectMembersTable)
    .where(eq(projectMembersTable.userId, userId));
  const memberProjectIds = myMemberRows.map((r) => r.projectId);
  if (memberProjectIds.length === 0) return [];

  const conditions = [inArray(projectsTable.id, memberProjectIds)];
  if (projectIds.length > 0) {
    conditions.push(inArray(projectsTable.id, projectIds));
  }

  const projects = await db
    .select()
    .from(projectsTable)
    .where(and(...conditions))
    .orderBy(desc(projectsTable.createdAt));
  if (projects.length === 0) return [];

  const memberRows = await db
    .select({
      projectId: projectMembersTable.projectId,
      userId: projectMembersTable.userId,
      role: projectMembersTable.role,
      joinedAt: projectMembersTable.joinedAt,
    })
    .from(projectMembersTable)
    .where(
      inArray(
        projectMembersTable.projectId,
        projects.map((p) => p.id),
      ),
    );

  const membersByProject = memberRows.reduce<Record<string, Member[]>>(
    (acc, m) => {
      (acc[m.projectId] ??= []).push({
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
      });
      return acc;
    },
    {},
  );

  return projects.map((project) => ({
    ...project,
    members: membersByProject[project.id] ?? [],
  }));
}
