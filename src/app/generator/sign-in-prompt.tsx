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
        <div className='mt-6 flex justify-center'>
          <a
            href='https://SAHearn1.github.io/Lesson-plan-explainer/'
            target='_blank'
            rel='noopener noreferrer'
            className='rounded bg-[#d4af37] px-6 py-3 text-base font-serif font-semibold text-[#1a3a2e] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#c9a32a] hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#d4af37]/30'
          >
            Lesson Plan Overview
          </a>
        </div>
      </div>
    </div>
  );
}
