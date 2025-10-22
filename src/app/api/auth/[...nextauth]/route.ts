// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';        // 🔑 Prisma requires Node runtime (not Edge)
export const dynamic = 'force-dynamic'; // avoid caching of auth endpoints
export const revalidate = 0;            // (belt + suspenders)
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
