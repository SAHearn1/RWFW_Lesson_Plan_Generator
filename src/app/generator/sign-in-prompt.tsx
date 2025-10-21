import { AuthButtons } from '@/components/navigation/auth-buttons';

export function SignInPrompt() {
  return (
    <div className='min-h-[60vh] bg-brand-canvas-light py-24'>
      <div className='mx-auto max-w-2xl rounded-2xl bg-white p-10 text-center shadow-xl'>
        <h1 className='text-3xl font-serif font-bold text-brand-deep-canopy'>
          Sign in to begin planning
        </h1>
        <p className='mt-4 text-base text-brand-charcoal'>
          Create a free account to securely generate, revisit, and download
          lesson plans tailored to your classroom.
        </p>
        <div className='mt-8 flex justify-center'>
          <AuthButtons isAuthenticated={false} />
        </div>
      </div>
    </div>
  );
}
