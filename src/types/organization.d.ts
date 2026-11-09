import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { organizationInvitationsTable, organizationsTable } from "@/db/schema";
import type {
  WorkspaceInvitableRole,
  WorkspaceRole,
} from "@/lib/rbac/workspace-permissions";
import type { InvitationStatus } from "./project";

export type Organizations = InferSelectModel<typeof organizationsTable>;
export type NewOrganizationRow = InferInsertModel<typeof organizationsTable>;
export type CreateOrganizationPayload = Pick<
  NewOrganizationRow,
  "name" | "description" | "logo" | "timeZone"
>;

export interface OrganizationCache extends Organizations {
  timestamp: number;
}

export type OrganizationInvitationRow = InferSelectModel<
  typeof organizationInvitationsTable
>;

export type PendingWorkspaceInvitation = Pick<
  OrganizationInvitationRow,
  "id" | "email" | "role" | "token" | "expiresAt" | "createdAt"
>;

export type InviteToWorkspacePayload = {
  emails: string[];
  role: WorkspaceInvitableRole;
};

export type InviteToWorkspaceResult = {
  invited: PendingWorkspaceInvitation[];
  /** addresses not invited, and why (already a member, already invited…) */
  skipped: { email: string; reason: string }[];
};

// what the /join/[token] page shows before Accept
export type WorkspaceInvitationPreview = {
  workspaceName: string;
  workspaceLogo: string | null;
  role: WorkspaceRole;
  email: string;
  status: InvitationStatus;
  emailMatches: boolean;
};

// an archived board, as Settings > General lists it
export type ArchivedBoard = {
  id: string;
  name: string;
  coverImage: string | null;
  settings: import("@/types/project-settings").ProjectSettings;
  archivedAt: Date | null;
  archivedByName: string | null;
  /** your role on it: restoring needs owner or admin */
  role: import("@/lib/rbac/permissions").ProjectRole;
  memberCount: number;
  taskCount: number;
};

export type UpdateOrganizationPayload = {
  name?: string;
  logo?: string | null;
  timeZone?: string;
};

// Settings > Members
export type WorkspaceMember = {
  userId: string;
  fullName: string;
  email: string;
  avatar: string | null;
  role: WorkspaceRole;
  joinedAt: Date;
  boardCount: number;
};

export type BoardGuest = {
  userId: string;
  fullName: string;
  email: string;
  avatar: string | null;
  boards: {
    projectId: string;
    name: string;
    role: import("@/lib/rbac/permissions").ProjectRole;
  }[];
};

export type WorkspaceMembersResponse = {
  members: WorkspaceMember[];
  /** only for the owner and admins */
  guests: BoardGuest[];
};

export type PendingWorkspaceInvitationWithInviter = PendingWorkspaceInvitation & {
  invitedBy: string | null;
  invitedByName: string | null;
};
