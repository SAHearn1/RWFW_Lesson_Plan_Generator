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

    // The modern 'streamText' function expects the entire messages array.
    const result = await streamText({
      model: anthropic('claude-3-opus-20240229'),
      system: masterPrompt,
      messages: messages, // Pass the full message history
      maxTokens: 4096,
      temperature: 0.3,
    });

    return result.toAIStreamResponse();

  } catch (error: any) {
    console.error('[API_ERROR]', error);
    const errorMessage = error.message || 'An unexpected error occurred.';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}
