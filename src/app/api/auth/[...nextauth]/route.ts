// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
<<<<<<< HEAD
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

=======
export const runtime = 'nodejs';        // 🔑 Prisma requires Node runtime (not Edge)
export const dynamic = 'force-dynamic'; // avoid caching of auth endpoints
export const revalidate = 0;            // (belt + suspenders)
>>>>>>> 55c0516 (fix(auth route): remove duplicate NextAuth import)
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
