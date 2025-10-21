import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';

import GeneratorClient from './generator-client';
import { SignInPrompt } from './sign-in-prompt';

export default async function GeneratorPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return <SignInPrompt />;
  }

  return <GeneratorClient userName={session.user?.name} />;
}
