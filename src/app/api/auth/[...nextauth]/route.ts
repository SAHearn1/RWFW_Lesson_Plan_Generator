import { authHandler } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export { authHandler as GET, authHandler as POST };
