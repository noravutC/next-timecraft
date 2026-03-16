import { DefaultSession } from "next-auth";
import type { User as AppUser } from "../user";

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
  }
}
