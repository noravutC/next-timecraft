// src/auth.ts// src/auth.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/mongodb";
import { UsersModel } from "@/model/group-user/user";
import { MembershipModel } from "@/model/group-user/member-ship";
import { AuthOptions } from "next-auth";

export interface TimeCraftJWT extends Record<string, unknown> {
  id?: string;
  systemRole?: "owner" | "admin" | "member" | "guest";
  canCreateOrg?: boolean;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
}
export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt" as const, // fix type here
    maxAge: 48 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account }) {
      await connectDB();
      let dbUser = await UsersModel.findOne({ email: user.email });
      if (!dbUser) {
        dbUser = await UsersModel.create({
          fullName: user.name,
          email: user.email,
          avatar: user.image,
          provider: account?.provider,
          providerId: account?.providerAccountId,
          // systemRole: "member",
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await UsersModel.findOne({ email: user.email });
        if (dbUser) {
          const hasOrg = await MembershipModel.exists({
            userId: dbUser._id,
            role: "owner",
          });

          token.id = dbUser._id.toString();
          token.systemRole = dbUser.systemRole;
          token.canCreateOrg = !hasOrg;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const tokenTypes = token as TimeCraftJWT;
        session.user.id = tokenTypes.id ?? "";
        session.user.systemRole = tokenTypes.systemRole ?? "user";
        session.user.canCreateOrg = tokenTypes.canCreateOrg ?? false;
        session.user.email = tokenTypes.email ?? undefined;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
