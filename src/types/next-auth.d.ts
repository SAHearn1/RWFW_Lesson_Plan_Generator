import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;          // NextAuth sets this to user id
    name?: string | null;
    email?: string | null;
    picture?: string | null; // we set this in callbacks
  }
}
