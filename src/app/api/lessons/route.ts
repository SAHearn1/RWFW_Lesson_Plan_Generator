import { NextRequest } from 'next/server';
import { streamText, type LanguageModelV1 } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

import { masterPrompt } from '@/constants/prompts';

// Vercel-specific configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const subjects =
      Array.isArray(body.subjects) ? body.subjects.join(', ') : String(body.subjects || '');

    const userPrompt = `
      Please generate a lesson plan with the following specifications:
      - Grade Level: ${body.gradeLevel ?? 'Not specified'}
      - Subject(s): ${subjects || 'Not specified'}
      - Duration: ${body.days ?? 3} day(s)
      - Unit Title: ${body.unitTitle || 'Not specified'}
      - Standards: ${body.standards || 'Align with relevant national or state standards.'}
      - Additional Focus Areas: ${body.focus || 'None specified.'}
    `.trim();

    // Temporary cast guards against duplicate @ai-sdk/provider versions in node_modules.
    // Once all AI SDK packages are aligned, you can remove the cast.
    const model = anthropic(
      process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620'
    ) as unknown as LanguageModelV1;

    const result = await streamText({
      model,
      system: masterPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      maxOutputTokens: typeof body.maxOutputTokens === 'number' ? body.maxOutputTokens : 4000,
      temperature: typeof body.temperature === 'number' ? body.temperature : 0.3,
    });

    // v4+ replacement for StreamingTextResponse
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
