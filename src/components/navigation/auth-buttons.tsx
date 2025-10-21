'use client';

import { signIn, signOut } from 'next-auth/react';
import { useState } from 'react';

type AuthButtonsProps = {
  isAuthenticated: boolean;
  userName?: string | null;
};

export function AuthButtons({ isAuthenticated, userName }: AuthButtonsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsSubmitting(true);
      await signIn('google', { callbackUrl: '/generator' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSubmitting(true);
      await signOut({ callbackUrl: '/' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {isAuthenticated && (
        <span className="text-sm text-slate-200">
          Signed in as <span className="font-semibold">{userName ?? 'Educator'}</span>
        </span>
      )}
      {isAuthenticated ? (
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSubmitting}
          className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-white/20 disabled:opacity-60"
        >
          {isSubmitting ? 'Signing out…' : 'Sign out'}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSignIn}
          disabled={isSubmitting}
          className="rounded-md bg-brand-gold-leaf px-3 py-1.5 text-sm font-semibold text-brand-deep-canopy shadow-sm transition hover:bg-white disabled:opacity-60"
        >
          {isSubmitting ? 'Opening…' : 'Sign in'}
        </button>
      )}
    </div>
  );
}
