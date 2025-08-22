import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

import { masterPrompt } from '@/constants/prompts';

// Vercel-specific configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const subjects = Array.isArray(body.subjects)
      ? body.subjects.join(', ')
      : String(body.subjects ?? '');

    const userPrompt = `
Please generate a lesson plan with the following specifications:
- Grade Level: ${body.gradeLevel ?? 'Not specified'}
- Subject(s): ${subjects || 'Not specified'}
- Duration: ${body.days ?? 3} day(s)
- Unit Title: ${body.unitTitle || 'Not specified'}
- Standards: ${body.standards || 'Align with relevant national or state standards.'}
- Additional Focus Areas: ${body.focus || 'None specified.'}
`.trim();

    // Avoid type identity clashes by not importing SDK model types at all.
    const model = anthropic(
      process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620'
    ) as any;

    const result = await streamText({
      model,
      system: masterPrompt,
      // Using `prompt` keeps compatibility across AI SDK minor versions.
      prompt: userPrompt,
      maxOutputTokens:
        typeof body.maxOutputTokens === 'number' ? body.maxOutputTokens : 4000,
      temperature:
        typeof body.temperature === 'number' ? body.temperature : 0.3,
    });

    // v4+ streaming response
    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error('[API_ERROR]', error);
    const message =
      (error?.error && (error.error.message || String(error.error))) ||
      error?.message ||
      'An unexpected error occurred.';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
