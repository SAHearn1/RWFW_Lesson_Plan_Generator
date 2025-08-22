import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { masterPrompt } from '@/constants/prompts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return json(500, { error: 'Server misconfigured: missing ANTHROPIC_API_KEY' });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) return json(400, { error: 'Invalid JSON body.' });

    const explicitPrompt =
      typeof body.prompt === 'string' ? body.prompt.trim() : null;

    const subjects = Array.isArray(body.subjects)
      ? body.subjects.join(', ')
      : String(body.subjects ?? '');

    const userPrompt =
      explicitPrompt ||
      `
Please generate a lesson plan with the following specifications:
- Grade Level: ${body.gradeLevel ?? 'Not specified'}
- Subject(s): ${subjects || 'Not specified'}
- Duration: ${body.days ?? 3} day(s)
- Unit Title: ${body.unitTitle || 'Not specified'}
- Standards: ${body.standards || 'Align with relevant national or state standards.'}
- Additional Focus Areas: ${body.focus || 'None specified.'}
`.trim();

    const model = anthropic(
      process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620'
    ) as any;

    const result = await streamText({
      model,
      system: masterPrompt,
      prompt: userPrompt,
      maxOutputTokens:
        typeof body.maxOutputTokens === 'number' ? body.maxOutputTokens : 4000,
      temperature:
        typeof body.temperature === 'number' ? body.temperature : 0.3,
    });

    // Simpler for the client: plain text stream
    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('[API_ERROR /api/lessons]', error);
    const message =
      (error?.error && (error.error.message || String(error.error))) ||
      error?.message ||
      'An unexpected error occurred.';
    return json(500, { error: message });
  }
}
