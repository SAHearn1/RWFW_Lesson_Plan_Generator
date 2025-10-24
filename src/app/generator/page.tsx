import { getServerAuthSession } from '@/lib/auth';

import GeneratorClient from './generator-client';
import { SignInPrompt } from './sign-in-prompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function GeneratorPage() {
  const session = await getServerAuthSession();

  if (!session) {
    return <SignInPrompt />;
  }

  return <GeneratorClient userName={session.user?.name} />;
}
