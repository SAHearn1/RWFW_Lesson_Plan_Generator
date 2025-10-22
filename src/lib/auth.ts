import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

import { prisma } from '@/lib/db';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const googleConfigMissing = !googleClientId || !googleClientSecret;
const prismaUnavailable = !prisma;

const sessionStrategy: 'jwt' | 'database' = prismaUnavailable ? 'jwt' : 'database';

if (googleConfigMissing) {
  console.warn('Google OAuth env vars are not set. Auth routes will error until configured.');
}

if (prismaUnavailable) {
  console.warn('DATABASE_URL is not configured. Falling back to JWT-only sessions (no DB).');
}

export const authOptions: NextAuthOptions = {
  adapter: prisma ? PrismaAdapter(prisma) : undefined,
  providers: [
    GoogleProvider({
      clientId: googleClientId ?? 'missing-google-client-id',
      clientSecret: googleClientSecret ?? 'missing-google-client-secret',
    }),
  ],
  session: { strategy: sessionStrategy },
  callbacks: {
    async signIn() {
      if (googleConfigMissing) {
        console.error('Google OAuth environment variables are not set.');
        return false;
      }
      return true;
    },

    async session({ session, token, user }) {
      if (!session.user) return session;

      if (user) {
        session.user.id = user.id;
        session.user.email = user.email ?? session.user.email;
        session.user.name = user.name ?? session.user.name;
        session.user.image = user.image ?? session.user.image;
        return session;
      }

      if (token?.sub) {
        session.user.id = token.sub;
        session.user.email = (token as any).email ?? session.user.email;
        session.user.name = (token as any).name ?? session.user.name;
        session.user.image = (token as any).picture ?? session.user.image;
      }

      return session;
    },

    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name ?? token.name;
        token.email = user.email ?? token.email;
        (token as any).picture = user.image ?? (token as any).picture;
      }

      if (!token.email) return token;
      if (!prisma) return token;

      try {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
        if (dbUser) {
          token.sub = dbUser.id;
          token.name = dbUser.name ?? token.name;
          token.email = dbUser.email ?? token.email;
          (token as any).picture = dbUser.image ?? (token as any).picture;
        }
      } catch (error) {
        console.error('JWT callback DB lookup failed:', error);
      }

      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
