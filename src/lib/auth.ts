import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

import { prisma } from '@/lib/db';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleConfigMissing = !googleClientId || !googleClientSecret;
const prismaUnavailable = !prisma;
const sessionStrategy: NonNullable<NextAuthOptions['session']>['strategy'] = prismaUnavailable
  ? 'jwt'
  : 'database';

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
    strategy: sessionStrategy,
  },
  callbacks: {
    async signIn() {
      if (googleConfigMissing) {
        console.error('Google OAuth environment variables are not set.');
        return false;
      }

      return true;
    },
    async session({ session, token, user }) {
      if (!session.user) {
        return session;
      }

      if (user) {
        session.user.id = user.id;
        session.user.email = user.email ?? session.user.email;
        session.user.name = user.name ?? session.user.name;
        session.user.image = user.image ?? session.user.image;

        return session;
      }

      if (token && token.sub) {
        session.user.id = token.sub;
        session.user.email = token.email ?? session.user.email;
        session.user.name = token.name ?? session.user.name;
        session.user.image = token.picture ?? session.user.image;
      }

      return session;
    },
    async jwt({ token, user }) {
      if (sessionStrategy !== 'jwt') {
        if (user) {
          token.sub = user.id;
          token.name = user.name ?? token.name;
          token.email = user.email ?? token.email;
          token.picture = user.image ?? token.picture;
        }

        return token;
      }

      if (!prisma) {
        if (user) {
          token.sub = user.id;
          token.name = user.name ?? token.name;
          token.email = user.email ?? token.email;
          token.picture = user.image ?? token.picture;
        }

        return token;
      }

      if (!token.email) {
        return token;
      }

      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });

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
      } catch (error) {
        console.error('Failed to look up user during JWT callback:', error);
      }

      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
