import { db } from "@/db";
import {
  membershipsTable,
  projectMembersTable,
  usersTable,
} from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

export async function getUserIdByEmail(
  email: string,
): Promise<string | undefined> {
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(sql`lower(${usersTable.email}) = ${email.toLowerCase()}`)
    .limit(1);
  return user?.id;
}

// โปรไฟล์ที่ viewer มองเห็นได้ = คนที่ "ร่วมบอร์ด" หรือ "ร่วม org" กัน —
// ต้องมีเงื่อนไขร่วมบอร์ด เพราะสมาชิกที่ถูกเชิญข้ามองค์กรไม่ได้ร่วม org กับเรา
export async function filterVisibleUserIds(
  viewerId: string,
  userIds: string[],
): Promise<string[]> {
  const unique = Array.from(new Set(userIds));
  if (unique.length === 0) return [];

  const myProjects = db
    .select({ projectId: projectMembersTable.projectId })
    .from(projectMembersTable)
    .where(eq(projectMembersTable.userId, viewerId));
  const sharedBoardRows = await db
    .selectDistinct({ userId: projectMembersTable.userId })
    .from(projectMembersTable)
    .where(
      and(
        inArray(projectMembersTable.userId, unique),
        inArray(projectMembersTable.projectId, myProjects),
      ),
    );

  const myOrgs = db
    .select({ organizationId: membershipsTable.organizationId })
    .from(membershipsTable)
    .where(eq(membershipsTable.userId, viewerId));
  const sharedOrgRows = await db
    .selectDistinct({ userId: membershipsTable.userId })
    .from(membershipsTable)
    .where(
      and(
        inArray(membershipsTable.userId, unique),
        inArray(membershipsTable.organizationId, myOrgs),
      ),
    );

  return [
    ...new Set([
      ...sharedBoardRows.map((r) => r.userId),
      ...sharedOrgRows.map((r) => r.userId),
    ]),
  ];
}

export async function getPublicUsersByIds(userIds: string[]) {
  if (userIds.length === 0) return [];
  return db
    .select({
      id: usersTable.id,
      fullName: usersTable.fullName,
      email: usersTable.email,
      avatar: usersTable.avatar,
    })
    .from(usersTable)
    .where(inArray(usersTable.id, userIds));
}
