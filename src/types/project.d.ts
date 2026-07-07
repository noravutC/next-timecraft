import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type {
  projectInvitationsTable,
  projectMembersTable,
  projectsTable,
} from "@/db/schema";

export type ProjectRow = InferSelectModel<typeof projectsTable>;
export type NewProjectRow = InferInsertModel<typeof projectsTable>;

export type ProjectMemberRow = InferSelectModel<typeof projectMembersTable>;
export type NewProjectMemberRow = InferInsertModel<typeof projectMembersTable>;

export type ProjectRole = ProjectMemberRow["role"];

export type Member = Pick<ProjectMemberRow, "userId" | "role" | "joinedAt">;

// owner มีได้จากการสร้างบอร์ดเท่านั้น — เชิญเพิ่มได้แค่ 3 role นี้
export type InvitableRole = Exclude<ProjectRole, "owner">;

export type InviteMemberPayload = {
  email: string;
  role: InvitableRole;
};

export type ProjectInvitationRow = InferSelectModel<
  typeof projectInvitationsTable
>;
export type NewProjectInvitationRow = InferInsertModel<
  typeof projectInvitationsTable
>;

// รายการ pending ใน invite dialog — คนที่มีสิทธิ์ member:invite เห็น token
// เพื่อ copy ลิงก์เชิญได้
export type PendingInvitation = Pick<
  ProjectInvitationRow,
  "id" | "email" | "role" | "token" | "expiresAt" | "createdAt"
>;

export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

// preview ที่หน้า /invite/[token] ใช้ก่อนกด Accept
export type InvitationPreview = {
  projectName: string;
  role: ProjectRole;
  email: string;
  status: InvitationStatus;
  emailMatches: boolean;
};

export type Project = ProjectRow & {
  members: Member[];
};

export interface ProjectCache extends Project {
  timestamp: number;
}
