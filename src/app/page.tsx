'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleExplainer = () => {
    // Navigate to an explainer page or show modal
    // For now, we'll scroll to the philosophy section
    const philosophySection = document.getElementById('philosophy');
    if (philosophySection) {
      philosophySection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signIn('google', { callbackUrl: '/generator' });
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-deep-canopy to-brand-evergreen px-6 pb-16 pt-24 text-center">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/svg/Logo.svg"
            alt="Root Work Framework Logo"
            width={180}
            height={180}
            className="mx-auto drop-shadow-2xl"
          />
        </div>

        {/* Title */}
        <h1 className="mb-6 font-serif text-5xl font-bold text-white md:text-6xl lg:text-7xl">
          Root Work Framework
        </h1>

        {/* Description */}
        <p className="mx-auto mb-12 max-w-3xl text-lg leading-relaxed text-slate-200 md:text-xl">
          A dual-purpose pedagogy that weaves academic rigor with healing-centered,
          biophilic practice. This platform is your partner in creating truly transformative
          learning experiences.
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <button
            type="button"
            onClick={handleExplainer}
            className="rounded-lg bg-white/10 px-8 py-3.5 text-lg font-semibold text-white shadow-lg backdrop-blur-sm transition hover:bg-white/20 hover:shadow-xl"
          >
            Lesson Plan Explainer
          </button>
          <button
            type="button"
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="rounded-lg bg-brand-gold-leaf px-8 py-3.5 text-lg font-semibold text-brand-deep-canopy shadow-lg transition hover:bg-brand-olive-gold hover:text-white hover:shadow-xl disabled:opacity-60"
          >
            {isSigningIn ? 'Opening…' : 'Sign In / Register'}
          </button>
        </div>
      </section>

      {/* Philosophy Section */}
      <section
        id="philosophy"
        className="bg-gradient-to-b from-brand-canvas-light to-white px-6 py-20"
      >
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-white p-8 shadow-brand md:p-12">
            <h2 className="mb-6 text-center font-serif text-3xl font-bold text-brand-deep-canopy md:text-4xl">
              The Philosophy Behind the Platform
            </h2>
            <p className="text-lg leading-relaxed text-brand-charcoal">
              This tool is more than a generator; it&apos;s a partner in curriculum design, built on the foundational principles of the
              Root Work Framework. By integrating healing-centered practices with rigorous academic content, we support
              educators in creating learning experiences that honor both the mind and the whole person.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
