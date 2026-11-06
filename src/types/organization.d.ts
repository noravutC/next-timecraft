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
  "name" | "description" | "logo"
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
