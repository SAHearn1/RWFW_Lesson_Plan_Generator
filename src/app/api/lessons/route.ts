// File: src/app/api/lessons/route.ts

import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
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
    // The modern SDK expects the prompt in a 'messages' array.
    const { messages } = await req.json();

    // Use the modern 'streamText' function with the correct model identifier.
    const result = await streamText({
      model: anthropic('claude-3-opus-20240229'),
      system: masterPrompt,
      messages: messages, // Pass the user's prompt here
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

