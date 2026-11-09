import { DefaultSession } from "next-auth";
import type { User as AppUser } from "../user";
import type { WorkspaceRole } from "@/lib/rbac/workspace-permissions";

type SystemRole = "owner" | "admin" | "member" | "guest" | "user";

declare module "next-auth" {
  interface Session {
    user: {
      id: AppUser["id"];
      fullName: AppUser["fullName"];
      avatar: AppUser["avatar"];
      provider: AppUser["provider"];
      providerId: AppUser["providerId"];
      organizationId: string;
      systemRole: SystemRole;
      canCreateOrg: boolean;
      /** member of at least one board, through an invitation or their own */
      hasBoards: boolean;
      /** role in the session's workspace; null without one */
      orgRole: WorkspaceRole | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: AppUser["id"];
    fullName?: AppUser["fullName"];
    avatar?: AppUser["avatar"];
    provider?: AppUser["provider"];
    providerId?: AppUser["providerId"];
    organizationId?: string;
    systemRole?: SystemRole;
    canCreateOrg?: boolean;
    hasBoards?: boolean;
    orgRole?: WorkspaceRole | null;
  }
}
