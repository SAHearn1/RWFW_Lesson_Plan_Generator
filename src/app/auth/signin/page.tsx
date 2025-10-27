'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useState } from 'react';

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a3a2e]">
      {/* Hero Section */}
      <div className="bg-[#1a3a2e] px-8 py-16 text-center text-white">
        <div className="mx-auto mb-8 h-[120px] w-[120px]">
          <Image
            src="/Emblem_of_Knowledge_and_Balance.png"
            alt="Root Work Framework Logo - Emblem of Knowledge and Balance"
            width={120}
            height={120}
            priority
          />
        </div>
        <h1 className="font-serif text-5xl font-normal tracking-wide">
          Root Work Framework
        </h1>
        <p className="mx-auto max-w-2xl font-serif text-lg leading-relaxed opacity-90">
          A dual-purpose pedagogy that weaves academic rigor with healing-centered,
          biophilic practice. This platform is your partner in creating truly
          transformative learning experiences.
        </p>
      </div>

      {/* Auth Container */}
      <div className="bg-[#f5f0e1] px-8 py-16">
        <div className="mx-auto max-w-[500px] rounded-lg bg-white p-12 shadow-lg">
          <h2 className="mb-8 text-center font-serif text-2xl text-[#1a3a2e]">
            Welcome Back
          </h2>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded border-2 border-[#e0d5b7] bg-[#fefdfb] p-4 font-serif text-base text-[#1a3a2e] transition-all hover:border-[#d4af37] hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
                fill="#4285F4"
              />
              <path
                d="M9.003 18c2.43 0 4.467-.806 5.956-2.18L12.05 13.56c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z"
                fill="#34A853"
              />
              <path
                d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
                fill="#FBBC05"
              />
              <path
                d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
                fill="#EA4335"
              />
            </svg>
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>

          {/* Info Text */}
          <p className="mt-6 text-center font-serif text-sm leading-relaxed text-[#6b6b6b]">
            By signing in, you agree to our{' '}
            <a href="#" className="text-[#d4af37] no-underline hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-[#d4af37] no-underline hover:underline">
              Privacy Policy
            </a>
            . We will never share your lesson plans or personal data without your
            permission.
          </p>

          {/* Back Link */}
          <div className="mt-8 border-t border-[#e0d5b7] pt-8 text-center">
            <a
              href="/"
              className="font-serif text-base text-[#d4af37] no-underline hover:underline"
            >
              ← Back to Generator Home
            </a>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600&display=swap');

        .font-serif {
          font-family: 'EB Garamond', 'Garamond', 'Georgia', 'Times New Roman', serif;
        }
      `}</style>
    </div>
  );
}

