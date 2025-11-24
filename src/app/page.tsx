import Image from 'next/image';
import Link from 'next/link';

import { getServerAuthSession } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const session = await getServerAuthSession();

  return (
    <div className="min-h-screen bg-[#1a3a2e]">
      {/* Hero Section */}
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center text-white">
        <div className="h-[120px] w-[120px] mx-auto mb-8">
          <Image
            src="/Emblem_of_Knowledge_and_Balance.png"
            alt="Root Work Framework Logo - Emblem of Knowledge and Balance"
            width={120}
            height={120}
            priority
          />
        </div>
        <h1 className="mb-4 text-4xl font-normal tracking-wide font-serif sm:text-5xl">
          Root Work Framework
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed opacity-90 font-serif sm:text-lg mb-12">
          A dual-purpose pedagogy that weaves academic rigor with healing-centered,
          biophilic practice. This platform is your partner in creating truly
          transformative learning experiences.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 mt-8">
          {session ? (
            // Authenticated user - single button
            <Link
              href="/generator"
              className="rounded bg-[#d4af37] px-8 py-4 text-lg font-serif text-[#1a3a2e] transition-all hover:-translate-y-0.5 hover:bg-[#c9a32a] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2 no-underline"
            >
              Begin Lesson Planning
            </Link>
          ) : (
            // Unauthenticated user - two buttons
            <>
              <Link
                href="/auth/signin"
                className="rounded bg-[#d4af37] px-8 py-4 text-lg font-serif text-[#1a3a2e] transition-all hover:-translate-y-0.5 hover:bg-[#c9a32a] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2 no-underline"
              >
                Signin/Register
              </Link>
              <Link
                href="/generator"
                className="rounded border-2 border-[#d4af37] bg-transparent px-8 py-4 text-lg font-serif text-[#d4af37] transition-all hover:-translate-y-0.5 hover:bg-[#d4af37] hover:text-[#1a3a2e] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2 no-underline"
              >
                Lesson Plan Overview
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
