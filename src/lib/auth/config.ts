// Mbuni CEX — NextAuth configuration
// JWT strategy with Credentials provider backed by Prisma (SQLite)

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.toLowerCase().trim();
        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        };
      },
    }),
  ],
  pages: {
    // We use a custom in-app auth screen — no NextAuth-hosted pages.
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      // Refresh onboarding flag from DB on every JWT mint
      if (token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { onboardingComplete: true, tier: true, kycStatus: true, name: true },
        });
        if (dbUser) {
          token.onboardingComplete = dbUser.onboardingComplete;
          token.tier = dbUser.tier;
          token.kycStatus = dbUser.kycStatus;
          if (!token.name && dbUser.name) token.name = dbUser.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { onboardingComplete?: boolean }).onboardingComplete =
          token.onboardingComplete as boolean;
        (session.user as { tier?: number }).tier = token.tier as number;
        (session.user as { kycStatus?: string }).kycStatus = token.kycStatus as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? "mbuni-cex-dev-secret-change-me",
};

// Extend Session types
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      email: string;
      name?: string | null;
      onboardingComplete?: boolean;
      tier?: number;
      kycStatus?: string;
    };
  }
  interface User {
    id: string;
    email: string;
    name?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    onboardingComplete?: boolean;
    tier?: number;
    kycStatus?: string;
  }
}
