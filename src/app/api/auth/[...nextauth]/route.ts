import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/model/group-user/user";
import { TimeCraftJWT } from "@/types/jwt.type";
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 48 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account }) {
      await connectDB();

      // ตรวจสอบ user ใน DB
      let dbUser = await User.findOne({ email: user.email });
      if (!dbUser) {
        dbUser = await User.create({
          fullName: user.name,
          email: user.email,
          avatar: user.image,
          provider: account?.provider,
          providerId: account?.providerAccountId,
          systemRole: "user",
        });
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          const t = token as TimeCraftJWT;
          t.id = dbUser._id.toString();
          t.systemRole = dbUser.systemRole;
          return t;
        }
      } else if (token.email) {
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          const t = token as TimeCraftJWT;
          t.id = dbUser._id.toString();
          t.systemRole = dbUser.systemRole;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        const typedToken = token as TimeCraftJWT;
        session.user.id = typedToken.id! as string;
        session.user.systemRole = typedToken.systemRole! as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
