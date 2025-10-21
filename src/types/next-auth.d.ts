declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & import('next-auth').DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub?: string;
  }
}
