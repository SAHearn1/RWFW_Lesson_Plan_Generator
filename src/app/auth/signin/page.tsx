'use client';

import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { FormEvent, useState } from 'react';

export default function SignInPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  const handleGoogleSignIn = async () => {
    const callbackUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/generator`
      : '/generator';

    setIsGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl });
    } catch (error) {
      console.error('Sign in error:', error);
      setIsGoogleLoading(false);
    }
  };

  const handleFacebookClick = () => {
    alert('Facebook sign in will connect to your authentication backend.');
  };

  const handleSignIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    console.log('Email sign in attempt:', { email, password });
    alert('Sign in functionality would connect to your authentication backend here.');
  };

  const handleSignUp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');

    console.log('Account creation attempt:', { name, email, password });
    alert('Account creation functionality would connect to your authentication backend here.');
  };

  const handleForgotPassword = () => {
    const email = window.prompt('Enter your email address to reset your password:');
    if (email) {
      console.log('Password reset requested for:', email);
      alert(`Password reset link would be sent to: ${email}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a3a2e]">
      {/* Hero Section */}
      <div className="bg-[#1a3a2e] text-white px-6 py-16 text-center">
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
        <p className="mx-auto max-w-2xl text-base leading-relaxed opacity-90 font-serif sm:text-lg">
          A dual-purpose pedagogy that weaves academic rigor with healing-centered,
          biophilic practice. This platform is your partner in creating truly
          transformative learning experiences.
        </p>
      </div>

      {/* Auth Container */}
      <div className="min-h-[60vh] bg-[#f5f0e1] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-[500px] rounded-lg bg-white p-8 shadow-lg sm:p-12">
          <div className="mb-10 border-b-2 border-[#e0d5b7]">
            <div className="grid grid-cols-2">
              <button
                type="button"
                onClick={() => setActiveTab('signin')}
                className={
                  `px-4 py-4 text-center text-lg font-serif transition-all ${
                  activeTab === 'signin'
                    ? 'border-b-4 border-[#d4af37] text-[#1a3a2e]'
                    : 'border-b-4 border-transparent text-[#8b8b8b] hover:text-[#1a3a2e]'
                }`
                }
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('signup')}
                className={
                  `px-4 py-4 text-center text-lg font-serif transition-all ${
                  activeTab === 'signup'
                    ? 'border-b-4 border-[#d4af37] text-[#1a3a2e]'
                    : 'border-b-4 border-transparent text-[#8b8b8b] hover:text-[#1a3a2e]'
                }`
                }
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Sign In Form */}
          {activeTab === 'signin' && (
            <form className="space-y-6" onSubmit={handleSignIn}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="flex items-center justify-center gap-2 rounded border-2 border-[#e0d5b7] bg-[#fefdfb] px-4 py-3 font-serif text-base text-[#1a3a2e] transition-all hover:border-[#d4af37] hover:bg-[#fefdfb] focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2 disabled:opacity-50"
                >
                  <svg
                    width="18"
                    height="18"
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
                  {isGoogleLoading ? 'Signing in...' : 'Google'}
                </button>
                <button
                  type="button"
                  onClick={handleFacebookClick}
                  className="flex items-center justify-center gap-2 rounded border-2 border-[#e0d5b7] bg-[#fefdfb] px-4 py-3 font-serif text-base text-[#1a3a2e] transition-all hover:border-[#d4af37] hover:bg-[#fefdfb] focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.16.256-.288.702-.384 1.335-.096.632-.098 1.351-.098 2.154v1.26h3.146l-.44 3.667h-2.705v7.98h-3.847z"
                      fill="#1877F2"
                    />
                  </svg>
                  Facebook
                </button>
              </div>

              <div className="flex items-center gap-4 text-sm text-[#8b8b8b] font-serif">
                <span className="h-px flex-1 bg-[#e0d5b7]" />
                or use email
                <span className="h-px flex-1 bg-[#e0d5b7]" />
              </div>

              <div className="space-y-6">
                <label className="block font-serif text-base text-[#1a3a2e]">
                  Email Address
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="you@example.com"
                    className="mt-2 w-full rounded border-2 border-[#e0d5b7] bg-[#fefdfb] px-3 py-3 text-base font-serif text-[#1a3a2e] transition-all placeholder:text-[#a8a8a8] focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2"
                  />
                </label>
                <label className="block font-serif text-base text-[#1a3a2e]">
                  Password
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="Enter your password"
                    className="mt-2 w-full rounded border-2 border-[#e0d5b7] bg-[#fefdfb] px-3 py-3 text-base font-serif text-[#1a3a2e] transition-all placeholder:text-[#a8a8a8] focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-[#1a3a2e] font-serif">
                  <input
                    type="checkbox"
                    name="remember"
                    className="h-4 w-4 border-2 border-[#e0d5b7] text-[#d4af37] focus:ring-[#d4af37]"
                  />
                  Keep me signed in
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-[#d4af37] underline-offset-2 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full rounded bg-[#d4af37] px-4 py-3 text-lg font-serif text-[#1a3a2e] transition-all hover:-translate-y-0.5 hover:bg-[#c9a32a] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2"
              >
                Sign In
              </button>
            </form>
          )}

          {/* Sign Up Form */}
          {activeTab === 'signup' && (
            <form className="space-y-6" onSubmit={handleSignUp}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="flex items-center justify-center gap-2 rounded border-2 border-[#e0d5b7] bg-[#fefdfb] px-4 py-3 font-serif text-base text-[#1a3a2e] transition-all hover:border-[#d4af37] hover:bg-[#fefdfb] focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2 disabled:opacity-50"
                >
                  <svg
                    width="18"
                    height="18"
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
                  {isGoogleLoading ? 'Signing in...' : 'Google'}
                </button>
                <button
                  type="button"
                  onClick={handleFacebookClick}
                  className="flex items-center justify-center gap-2 rounded border-2 border-[#e0d5b7] bg-[#fefdfb] px-4 py-3 font-serif text-base text-[#1a3a2e] transition-all hover:border-[#d4af37] hover:bg-[#fefdfb] focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.16.256-.288.702-.384 1.335-.096.632-.098 1.351-.098 2.154v1.26h3.146l-.44 3.667h-2.705v7.98h-3.847z"
                      fill="#1877F2"
                    />
                  </svg>
                  Facebook
                </button>
              </div>

              <div className="flex items-center gap-4 text-sm text-[#8b8b8b] font-serif">
                <span className="h-px flex-1 bg-[#e0d5b7]" />
                or create with email
                <span className="h-px flex-1 bg-[#e0d5b7]" />
              </div>

              <div className="space-y-6">
                <label className="block font-serif text-base text-[#1a3a2e]">
                  Full Name
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Jane Educator"
                    className="mt-2 w-full rounded border-2 border-[#e0d5b7] bg-[#fefdfb] px-3 py-3 text-base font-serif text-[#1a3a2e] transition-all placeholder:text-[#a8a8a8] focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2"
                  />
                </label>
                <label className="block font-serif text-base text-[#1a3a2e]">
                  Email Address
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="you@example.com"
                    className="mt-2 w-full rounded border-2 border-[#e0d5b7] bg-[#fefdfb] px-3 py-3 text-base font-serif text-[#1a3a2e] transition-all placeholder:text-[#a8a8a8] focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2"
                  />
                </label>
                <label className="block font-serif text-base text-[#1a3a2e]">
                  Password
                  <input
                    type="password"
                    name="password"
                    minLength={8}
                    required
                    placeholder="At least 8 characters"
                    className="mt-2 w-full rounded border-2 border-[#e0d5b7] bg-[#fefdfb] px-3 py-3 text-base font-serif text-[#1a3a2e] transition-all placeholder:text-[#a8a8a8] focus:border-[#d4af37] focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm text-[#1a3a2e] font-serif">
                <input
                  type="checkbox"
                  name="agree"
                  required
                  className="h-4 w-4 border-2 border-[#e0d5b7] text-[#d4af37] focus:ring-[#d4af37]"
                />
                I agree to the Terms of Service and Privacy Policy
              </label>

              <button
                type="submit"
                className="w-full rounded bg-[#d4af37] px-4 py-3 text-lg font-serif text-[#1a3a2e] transition-all hover:-translate-y-0.5 hover:bg-[#c9a32a] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:ring-offset-2"
              >
                Create Account
              </button>

              <p className="text-sm leading-relaxed text-[#6b6b6b] font-serif">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-[#d4af37] no-underline hover:underline">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-[#d4af37] no-underline hover:underline">Privacy Policy</a>
                . We&apos;ll never share your lesson plans or personal data without your
                permission.
              </p>
            </form>
          )}

          <div className="mt-10 border-t border-[#e0d5b7] pt-8 text-center">
            <a
              href="/"
              className="text-base font-serif text-[#d4af37] no-underline hover:underline"
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