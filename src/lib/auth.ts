import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

import { prisma } from '@/lib/db';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleConfigMissing = !googleClientId || !googleClientSecret;
const prismaUnavailable = !prisma;

if (googleConfigMissing) {
  console.warn(
    'Google OAuth environment variables are not set. Authentication routes will respond with an error until configured.',
  );
}

if (prismaUnavailable) {
  console.warn(
    'DATABASE_URL is not configured. Authentication will fall back to JWT-only sessions without database persistence.',
  );
}

export const authOptions: NextAuthOptions = {
  adapter: prisma ? PrismaAdapter(prisma) : undefined,
  providers: [
    GoogleProvider({
      clientId: googleClientId ?? 'missing-google-client-id',
      clientSecret: googleClientSecret ?? 'missing-google-client-secret',
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn() {
      if (googleConfigMissing) {
        console.error('Google OAuth environment variables are not set.');
        return false;
      }

      return true;
    },
    async session({ token, session }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.email = token.email ?? session.user.email;
        session.user.name = token.name ?? session.user.name;
        session.user.image = token.picture ?? session.user.image;
      }

      return session;
    },
    async jwt({ token, user }) {
      if (!prisma) {
        if (user) {
          token.sub = user.id;
          token.name = user.name ?? token.name;
          token.email = user.email ?? token.email;
          token.picture = user.image ?? token.picture;
        }

        return token;
      }

      const dbUser = token.email
        ? await prisma.user.findUnique({
            where: { email: token.email },
          })
        : null;

      if (!dbUser) {
        if (user) {
          token.sub = user.id;
        }

        return token;
      }

      token.sub = dbUser.id;
      token.name = dbUser.name ?? token.name;
      token.email = dbUser.email ?? token.email;
      token.picture = dbUser.image ?? token.picture;

      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
