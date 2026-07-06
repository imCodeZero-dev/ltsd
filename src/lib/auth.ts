import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { LoginSchema } from "@/lib/schemas";
import { logAuth } from "@/lib/system-log";

// Augment the session type so role + onboardingCompleted flow through
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
      role: "USER" | "ADMIN";
      onboardingCompleted: boolean;
    };
  }
  interface User {
    role: "USER" | "ADMIN";
    onboardingCompleted: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = LoginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user?.passwordHash) {
          logAuth("login:failed", { email: parsed.data.email, reason: "user_not_found" });
          return null;
        }

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) {
          logAuth("login:failed", { email: parsed.data.email, userId: user.id, reason: "invalid_password" });
          return null;
        }

        if (!user.isActive) {
          logAuth("login:failed", { email: parsed.data.email, userId: user.id, reason: "account_deactivated" });
          return null;
        }

        return {
          id:                  user.id,
          email:               user.email,
          name:                user.name,
          image:               user.image,
          role:                user.role,
          onboardingCompleted: user.onboardingCompleted,
        };
      },
    }),
  ],
  events: {
    // Create default preferences row for any new user (covers Google OAuth,
    // where the PrismaAdapter creates the User but not the preferences)
    async createUser({ user }) {
      if (user.id) {
        await db.userPreferences.upsert({
          where:  { userId: user.id },
          create: { userId: user.id },
          update: {},
        });
      }
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      // Single DB query per request — refresh all mutable fields from DB.
      // The session callback reads these from the token (no extra query).
      if (token.id) {
        const dbUser = await db.user.findUnique({
          where:  { id: token.id as string },
          select: { role: true, onboardingCompleted: true, name: true, image: true, isActive: true },
        });
        if (!dbUser || !dbUser.isActive) {
          // Deactivated or deleted — mark token so session callback can kill it
          token.isActive = false;
          return token;
        }
        token.role                = dbUser.role;
        token.onboardingCompleted = dbUser.onboardingCompleted;
        token.name                = dbUser.name;
        token.image               = dbUser.image;
        token.isActive            = true;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        if (token.isActive === false) return null as never; // kills the session
        session.user.id                  = token.id as string;
        session.user.role                = token.role as "USER" | "ADMIN";
        session.user.onboardingCompleted = token.onboardingCompleted as boolean;
        session.user.name                = (token.name as string | null) ?? null;
        session.user.image               = (token.image as string | null) ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error:  "/login",
  },
});
