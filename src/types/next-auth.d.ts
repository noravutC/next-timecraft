import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      systemRole: string;
      canCreateOrg: boolean = false; 
    } & DefaultSession["user"]; // เอา name, email, image มาด้วย
  }

  interface JWT {
    id: string;
    systemRole: string;
  }
}