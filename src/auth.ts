// src/auth.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { AuthOptions } from "next-auth";
import { and, eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { membershipsTable, usersTable } from "@/db/schema";

export interface TimeCraftJWT extends Record<string, unknown> {
  id?: string;
  fullName?: string;
  avatar?: string | null;
  provider?: string;
  providerId?: string;
  organizationId?: string;
  systemRole?: "owner" | "admin" | "member" | "guest" | "user";
  canCreateOrg?: boolean;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
}

const hydrateTokenFromDb = async (token: TimeCraftJWT, email: string) => {
  const [dbUser] = await db
    .select({
      id: usersTable.id,
      email: usersTable.email,
      fullName: usersTable.fullName,
      avatar: usersTable.avatar,
      provider: usersTable.provider,
      providerId: usersTable.providerId,
    })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!dbUser) {
    return token;
  }

  const [ownedMembership] = await db
    .select({
      id: membershipsTable.id,
      organizationId: membershipsTable.organizationId,
    })
    .from(membershipsTable)
    .where(
      and(
        eq(membershipsTable.userId, dbUser.id),
        eq(membershipsTable.role, "owner")
      )
    )
    .limit(1);

  const [memberShip] = await db
    .select({ organizationId: membershipsTable.organizationId })
    .from(membershipsTable)
    .where(eq(membershipsTable.userId, dbUser.id))
    .orderBy(asc(membershipsTable.createdAt))
    .limit(1);

  token.id = dbUser.id;
  token.email = dbUser.email;
  token.fullName = dbUser.fullName;
  token.avatar = dbUser.avatar ?? null;
  token.provider = dbUser.provider;
  token.providerId = dbUser.providerId;
  token.name = dbUser.fullName;
  token.picture = dbUser.avatar ?? null;
  token.organizationId = ownedMembership?.organizationId ?? memberShip?.organizationId;
  token.systemRole = ownedMembership ? "owner" : "user";
  token.canCreateOrg = !Boolean(ownedMembership);

  return token;
};

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
      if (!user.email) {
        return false;
      }

      const provider = account?.provider ?? "google";
      const providerId = account?.providerAccountId ?? user.email;

      await db
        .insert(usersTable)
        .values({
          fullName: user.name ?? user.email,
          email: user.email,
          avatar: user.image ?? null,
          provider,
          providerId,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: usersTable.email,
          set: {
            fullName: user.name ?? user.email,
            avatar: user.image ?? null,
            provider,
            providerId,
            updatedAt: new Date(),
          },
        });

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.user) {
        const updatedUser = session.user as {
          fullName?: string;
          avatar?: string | null;
          provider?: string;
          providerId?: string;
          organizationId?: string;
          systemRole?: TimeCraftJWT["systemRole"];
          canCreateOrg?: boolean;
          email?: string | null;
          name?: string | null;
          image?: string | null;
        };

        if (typeof updatedUser.fullName === "string") {
          token.fullName = updatedUser.fullName;
          token.name = updatedUser.fullName;
        }
        if (updatedUser.avatar !== undefined) {
          token.avatar = updatedUser.avatar ?? null;
          token.picture = updatedUser.avatar ?? null;
        }
        if (typeof updatedUser.provider === "string") {
          token.provider = updatedUser.provider;
        }
        if (typeof updatedUser.providerId === "string") {
          token.providerId = updatedUser.providerId;
        }
        if (typeof updatedUser.organizationId === "string") {
          token.organizationId = updatedUser.organizationId;
        }
        if (typeof updatedUser.systemRole === "string") {
          token.systemRole = updatedUser.systemRole;
        }
        if (typeof updatedUser.canCreateOrg === "boolean") {
          token.canCreateOrg = updatedUser.canCreateOrg;
        }
        if (typeof updatedUser.email === "string") {
          token.email = updatedUser.email;
        }
      }

      const hasAccessContext =
        Boolean(token.id) &&
        Boolean(token.systemRole) &&
        typeof token.canCreateOrg === "boolean" &&
        (token.canCreateOrg ? true : Boolean(token.organizationId));

      // Avoid hitting DB on every `/api/auth/session` request.
      // Re-hydrate on sign-in or when token is still incomplete.
      const shouldHydrate = Boolean(user) || !hasAccessContext;

      if (!shouldHydrate) {
        return token;
      }

      const email = user?.email ?? session?.user?.email ?? token.email;
      if (!email) {
        return token;
      }

      try {
        return hydrateTokenFromDb(token as TimeCraftJWT, email);
      } catch (error) {
        console.error("next-auth jwt callback error:", error);
        // Keep previous token so client session doesn't collapse to 500/unauth.
        return token;
      }
    },
    async session({ session, token }) {
      if (session.user) {
        const tokenTypes = token as TimeCraftJWT;
        session.user.id = tokenTypes.id ?? "";
        session.user.fullName = tokenTypes.fullName ?? "";
        session.user.avatar = tokenTypes.avatar ?? null;
        session.user.provider = tokenTypes.provider ?? "google";
        session.user.providerId = tokenTypes.providerId ?? "";
        session.user.organizationId = tokenTypes.organizationId ?? "";
        session.user.systemRole = tokenTypes.systemRole ?? "user";
        session.user.canCreateOrg = tokenTypes.canCreateOrg ?? false;
        session.user.email = tokenTypes.email ?? undefined;
        session.user.name = tokenTypes.fullName ?? session.user.name ?? "";
        session.user.image = tokenTypes.avatar ?? session.user.image ?? null;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
