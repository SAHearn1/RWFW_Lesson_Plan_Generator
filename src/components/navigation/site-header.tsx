import Link from 'next/link';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

import { AuthButtons } from './auth-buttons';

export async function SiteHeader() {
  const session = await getServerSession(authOptions);

  return (
    <header className="bg-brand-deep-canopy text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-white no-underline">
          <img
            src="/images/rwfw-logo-1.jpg"
            alt="Root Work Framework Logo"
            className="h-10 w-10 rounded-full border-2 border-white/40 shadow-lg"
          />
          <span className="text-lg font-semibold tracking-tight">Root Work Framework</span>
        </Link>
        <AuthButtons isAuthenticated={Boolean(session)} userName={session?.user?.name} />
      </div>
    </header>
  );
}
