import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { projectMembersTable, projectsTable } from "@/db/schema";

export type ProjectRow = InferSelectModel<typeof projectsTable>;
export type NewProjectRow = InferInsertModel<typeof projectsTable>;

export type ProjectMemberRow = InferSelectModel<typeof projectMembersTable>;
export type NewProjectMemberRow = InferInsertModel<typeof projectMembersTable>;

export type ProjectRole = ProjectMemberRow["role"];

export type Member = Pick<ProjectMemberRow, "userId" | "role" | "joinedAt">;

export type Project = ProjectRow & {
  members: Member[];
};

export interface ProjectCache extends Project {
  timestamp: number;
}
