import "server-only";

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import NextAuth, { type NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";

interface ExtendedJWT {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
  [key: string]: any;
}

import { prisma } from "@/lib/db";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleConfigMissing = !googleClientId || !googleClientSecret;

const prismaUnavailable = typeof prisma === "undefined" || prisma === null;
const sessionStrategy: "jwt" | "database" = prismaUnavailable ? "jwt" : "database";
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

// Backfill NEXTAUTH_URL on Vercel if missing
if (!process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}

interface RootAuthOptions extends NextAuthOptions {
  trustHost?: boolean;
}

interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

interface UserWithId {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

export const authOptions: RootAuthOptions = {
  adapter: !prismaUnavailable ? PrismaAdapter(prisma) : undefined,
  providers: [
    GoogleProvider({
      clientId: googleClientId ?? "missing-google-client-id",
      clientSecret: googleClientSecret ?? "missing-google-client-secret",
    }),
  ],
  callbacks: {
    async session({ session, token, user }) {
      if (!session.user) return session;

      if (user) {
        session.user.id = (user as any).id;
        session.user.email = user.email ?? session.user.email;
        session.user.name = user.name ?? session.user.name;
        session.user.image = user.image ?? session.user.image;
        return session;
      }

      const extToken = token as ExtendedJWT;

      if (extToken?.sub) {
        session.user.id = extToken.sub;
      }
      if (extToken.email) {
        session.user.email = extToken.email ?? session.user.email;
      }
      if (extToken.name) {
        session.user.name = extToken.name ?? session.user.name;
      }
      if (extToken.picture) {
        session.user.image = extToken.picture ?? session.user.image;
      }

      return session;
    },
    async jwt({ token, user }) {
      const extToken = token as ExtendedJWT;

      if (user) {
        extToken.sub = (user as any).id;
        extToken.name = (user as any).name ?? extToken.name;
        extToken.email = (user as any).email ?? extToken.email;
        extToken.picture = (user as any).image ?? extToken.picture;
      }

      if (!extToken.email || prismaUnavailable) return extToken;

      try {
        const dbUser = await prisma.user.findUnique({ where: { email: extToken.email } });
        if (dbUser) {
          extToken.sub = dbUser.id;
          extToken.name = dbUser.name ?? extToken.name;
          extToken.email = dbUser.email ?? extToken.email;
          extToken.picture = dbUser.image ?? extToken.picture;
        }
      } catch (err) {
        console.error("JWT callback DB lookup failed:", err);
      }
      return extToken;
    },
  },
  secret: nextAuthSecret,
  trustHost: true,
};

// Export a handler for easy re-use in the route file
export function getServerAuthSession() {
  return getServerSession(authOptions);
}
