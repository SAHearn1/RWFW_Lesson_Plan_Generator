// File: src/app/api/lessons/route.ts

import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, CoreMessage } from 'ai';
import { masterPrompt } from '@/constants/prompts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages }: { messages: CoreMessage[] } = await req.json();

    const result = await streamText({
      // --- UPGRADED MODEL & TOKEN LIMIT ---
      model: anthropic('claude-opus-4-1-20250805'),
      system: masterPrompt,
      messages: messages,
      // --- THIS IS THE KEY UPGRADE ---
      // We are giving the AI the maximum possible space to generate a complete,
      // detailed, and resource-rich lesson plan.
      maxTokens: 32000,
      temperature: 0.3,
    });

    return result.toAIStreamResponse();

  } catch (error: any)
    {
    console.error('[API_ERROR]', error);
    const errorMessage = error.message || 'An unexpected error occurred.';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}
