import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { LoginSchema } from "@/lib/schemas";

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
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

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
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id                  = user.id;
        token.role                = user.role;
        token.onboardingCompleted = user.onboardingCompleted;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id                  = token.id as string;
        session.user.role                = token.role as "USER" | "ADMIN";
        session.user.onboardingCompleted = token.onboardingCompleted as boolean;

        // Always fetch fresh name + image from DB so profile edits are
        // reflected immediately without requiring a new login.
        const fresh = await db.user.findUnique({
          where:  { id: token.id as string },
          select: { name: true, image: true },
        });
        if (fresh) {
          session.user.name  = fresh.name;
          session.user.image = fresh.image;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error:  "/login",
  },
});
