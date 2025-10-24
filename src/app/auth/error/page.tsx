import Link from 'next/link';

type ErrorPageProps = {
  searchParams?: {
    error?: string;
  };
};

const errorMessages: Record<string, string> = {
  AccessDenied: 'Access was denied. Please try signing in again.',
  Configuration: 'The authentication service is not fully configured.',
  Default: 'Something went wrong while trying to sign you in.',
};

export default function AuthErrorPage({ searchParams }: ErrorPageProps) {
  const errorKey = searchParams?.error;
  const errorMessage = (errorKey && errorMessages[errorKey]) ?? errorMessages.Default;

  return (
    <main className='flex min-h-screen items-center justify-center bg-brand-canvas-light px-4 py-16'>
      <div className='max-w-lg rounded-2xl bg-white p-10 text-center shadow-xl'>
        <h1 className='text-3xl font-serif font-bold text-brand-deep-canopy'>
          Unable to sign you in
        </h1>
        <p className='mt-4 text-base text-brand-charcoal'>{errorMessage}</p>
        <div className='mt-8 flex flex-wrap justify-center gap-3'>
          <Link
            href='/'
            className='rounded-md bg-brand-gold-leaf px-4 py-2 text-sm font-semibold text-brand-deep-canopy shadow-sm transition hover:bg-white'
          >
            Return home
          </Link>
          <Link
            href='/api/auth/signin'
            className='rounded-md border border-brand-gold-leaf px-4 py-2 text-sm font-semibold text-brand-deep-canopy transition hover:bg-brand-gold-leaf/20'
          >
            Try again
          </Link>
        </div>
      </div>
    </main>
  );
}
