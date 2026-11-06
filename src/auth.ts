// src/auth.ts
import NextAuth, { type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { and, eq, asc } from "drizzle-orm";
import { db } from "@/db";
import { membershipsTable, organizationsTable, usersTable } from "@/db/schema";
import { clientIp } from "@/lib/api/client-ip";
import { checkRateLimit } from "@/lib/api/rate-limit";
import { GUEST_EMAIL } from "@/lib/guest";

const GUEST_NAME = "Guest User";
const GUEST_LOGIN_LIMIT = { limit: 10, windowMs: 60_000 };

const provisionGuestAccount = async () => {
  const [guestUser] = await db
    .insert(usersTable)
    .values({
      fullName: GUEST_NAME,
      email: GUEST_EMAIL,
      avatar: null,
      provider: "guest",
      providerId: "guest",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: usersTable.email,
      set: { updatedAt: new Date() },
    })
    .returning({ id: usersTable.id });

  let [existingOrg] = await db
    .select({ id: organizationsTable.id })
    .from(organizationsTable)
    .where(eq(organizationsTable.createdBy, guestUser.id))
    .limit(1);

  if (!existingOrg) {
    [existingOrg] = await db
      .insert(organizationsTable)
      .values({
        name: "Demo Organization",
        description: "Guest demo workspace",
        createdBy: guestUser.id,
      })
      .returning({ id: organizationsTable.id });
  }

  await db
    .insert(membershipsTable)
    .values({
      userId: guestUser.id,
      organizationId: existingOrg.id,
      role: "owner",
    })
    .onConflictDoNothing();

  return { id: guestUser.id, name: GUEST_NAME, email: GUEST_EMAIL, image: null };
};

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

// Look the user up by a value the server already trusts: the provider's email
// at sign-in, or the token's own id afterwards. Never by client input.
type UserLookup = { email: string } | { id: string };

const hydrateTokenFromDb = async (token: TimeCraftJWT, lookup: UserLookup) => {
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
    .where(
      "id" in lookup
        ? eq(usersTable.id, lookup.id)
        : eq(usersTable.email, lookup.email),
    )
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
        eq(membershipsTable.role, "owner"),
      ),
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
  token.organizationId =
    ownedMembership?.organizationId ?? memberShip?.organizationId;
  token.systemRole = ownedMembership ? "owner" : "user";
  token.canCreateOrg = !Boolean(ownedMembership);

  return token;
};

export const authConfig: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: "guest",
      name: "Guest",
      credentials: {},
      async authorize(_credentials, request) {
        // anyone can mint a guest session: throttle per IP so it can't be scripted
        const allowed = checkRateLimit(
          `guest-login:${clientIp(request)}`,
          GUEST_LOGIN_LIMIT,
        ).ok;
        return allowed ? provisionGuestAccount() : null;
      },
    }),
  ],
  session: {
    strategy: "jwt" as const, // fix type here
    maxAge: 48 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Guest account is already provisioned in authorize()
      if (account?.provider === "guest") {
        return true;
      }

      if (!user.email) {
        return false;
      }

      // Users are matched by email, so only accept addresses Google has verified.
      if (account?.provider === "google" && profile?.email_verified === false) {
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
    async jwt({ token, user, trigger }) {
      const current = token as TimeCraftJWT;
      // Sign-in: the email comes from the provider (or guest authorize()).
      // Afterwards only the token's own id is trusted. The `update()` payload
      // is client-controlled, so it is ignored: `trigger === "update"` only
      // means "re-read the access context from the DB".
      const lookup: UserLookup | null = user?.email
        ? { email: user.email }
        : current.id
          ? { id: current.id }
          : null;
      if (!lookup) {
        return token;
      }

      const hasAccessContext =
        Boolean(current.id) &&
        Boolean(current.systemRole) &&
        typeof current.canCreateOrg === "boolean" &&
        (current.canCreateOrg ? true : Boolean(current.organizationId));

      // Avoid hitting DB on every `/api/auth/session` request.
      const shouldHydrate =
        Boolean(user) || trigger === "update" || !hasAccessContext;
      if (!shouldHydrate) {
        return token;
      }

      try {
        return await hydrateTokenFromDb(current, lookup);
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
        session.user.email = tokenTypes.email ?? session.user.email ?? "";
        session.user.name = tokenTypes.fullName ?? session.user.name ?? "";
        session.user.image = tokenTypes.avatar ?? session.user.image ?? null;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
