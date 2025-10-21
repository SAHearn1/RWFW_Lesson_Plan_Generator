import { createAnthropic } from '@ai-sdk/anthropic';
import type { CoreMessage } from 'ai';
import { streamText } from 'ai';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { masterPrompt } from '@/constants/prompts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const jsonHeaders = {
  'Content-Type': 'application/json',
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  try {
    const { messages }: { messages: CoreMessage[] } = await req.json();

    const result = await streamText({
      model: anthropic('claude-3-opus-20240229'),
      system: masterPrompt,
      messages,
      maxTokens: 4096,
      temperature: 0.3,
    });

    return result.toAIStreamResponse();
  } catch (error) {
    console.error('[API_ERROR]', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred.';

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
}
