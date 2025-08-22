// File: src/lib/auth.ts

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  // Use Prisma to store user accounts, sessions, etc.
  adapter: PrismaAdapter(prisma),
  // We'll start with Google as a sign-in option. We can add more later.
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // Define how user sessions are managed (JWT is standard and secure)
  session: {
    strategy: "jwt",
  },
  // Callbacks allow you to add custom logic and control the session data
  callbacks: {
    async session({ token, session }) {
      // --- THIS IS THE FIX ---
      // We add a check to ensure session.user exists before assigning to it.
      if (token && session.user) {
        // The default User type in next-auth doesn't have an 'id'.
        // We need to cast it to 'any' or extend the type to add it.
        // For simplicity and to get you running, we'll cast here.
        (session.user as any).id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
      }
      return session;
    },
    async jwt({ token, user }) {
      const dbUser = await prisma.user.findFirst({
        where: {
          email: token.email,
        },
      });

      if (!dbUser) {
        if (user) {
          token.id = user.id;
        }
        return token;
      }

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        picture: dbUser.image,
      };
    },
  },
  // Point to your secret key in the environment variables
  secret: process.env.NEXTAUTH_SECRET,
};
