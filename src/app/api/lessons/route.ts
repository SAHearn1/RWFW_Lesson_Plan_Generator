// File: src/app/api/lessons/route.ts

import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { masterPrompt } from '@/constants/prompts';

// Vercel-specific configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Initialize the Anthropic provider, ensuring the API key is passed correctly.
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  try {
    // The 'useCompletion' hook sends the user's input as a 'prompt' property.
    const { prompt } = await req.json();

    // Use the modern 'streamText' function.
    const result = await streamText({
      model: anthropic('claude-3-opus-20240229'),
      system: masterPrompt,
      prompt: prompt, // Pass the user's prompt string here
      maxTokens: 4096,
      temperature: 0.3,
    });

    // Respond with the stream using the built-in helper.
    return result.toAIStreamResponse();

  } catch (error: any) {
    console.error('[API_ERROR]', error);
    const errorMessage = error.message || 'An unexpected error occurred.';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}
