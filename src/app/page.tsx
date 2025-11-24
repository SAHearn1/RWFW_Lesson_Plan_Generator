import { getServerAuthSession } from '@/lib/auth';

import GeneratorClient from '@/components/generator/generator-client';
import { SignInPrompt } from '@/components/generator/sign-in-prompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getServerAuthSession();

  if (!session) {
    return <SignInPrompt />;
  }

  return <GeneratorClient userName={session.user?.name} />;
}
