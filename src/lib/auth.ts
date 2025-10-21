import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

import { prisma } from '@/lib/db';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

const googleConfigMissing = !googleClientId || !googleClientSecret;
const prismaUnavailable = !prisma;

// Choose session strategy based on DB availability
const sessionStrategy: 'jwt' | 'database' = prismaUnavailable ? 'jwt' : 'database';

if (googleConfigMissing) {
  console.warn(
    'Google OAuth env vars are not set. Auth routes will error until configured.'
  );
}

if (prismaUnavailable) {
  console.warn(
    'DATABASE_URL is not configured. Falling back to JWT-only sessions without DB persistence.'
  );
}

if (prismaUnavailable) {
  console.warn(
    'DATABASE_URL is not configured. Authentication will fall back to JWT-only sessions without database persistence.',
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
      // Guard
      if (!session.user) return session;

      // Prefer the freshly-signed-in user object if present
      if (user) {
        session.user.id = user.id;
        session.user.email = user.email ?? session.user.email;
        session.user.name = user.name ?? session.user.name;
        session.user.image = user.image ?? session.user.image;
        return session;
      }

      // Otherwise populate from token
      if (token?.sub) {
        session.user.id = token.sub;
        session.user.email = (token as any).email ?? session.user.email;
        session.user.name = (token as any).name ?? session.user.name;
        session.user.image = (token as any).picture ?? session.user.image;
      }

      return session;
    },

    async jwt({ token, user }) {
      // On initial sign-in, copy fields from `user` to the token
      if (user) {
        token.sub = user.id;
        token.name = user.name ?? token.name;
        token.email = user.email ?? token.email;
        (token as any).picture = user.image ?? (token as any).picture;
      }

      // If no email, nothing more we can enrich
      if (!token.email) return token;

      // If no Prisma/DB, stop here (JWT-only mode)
      if (!prisma) return token;

      // Enrich token from DB
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });

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
