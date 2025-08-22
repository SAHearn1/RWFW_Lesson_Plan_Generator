// File: src/app/api/lessons/route.ts
import { NextRequest } from 'next/server';
import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

import { masterPrompt } from '@/constants/prompts';

// Vercel-specific configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const userPrompt = `
      Please generate a lesson plan with the following specifications:
      - Grade Level: ${body.gradeLevel}
      - Subject(s): ${(body.subjects || []).join(', ')}
      - Duration: ${body.days || 3} day(s)
      - Unit Title: ${body.unitTitle || 'Not specified'}
      - Standards: ${body.standards || 'Align with relevant national or state standards.'}
      - Additional Focus Areas: ${body.focus || 'None specified.'}
    `;

    const result = await streamText({
      model: anthropic(process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620'), // set your model here
      system: masterPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      maxOutputTokens: 4000,
      temperature: 0.3,
    });

    // v4+ replacement for StreamingTextResponse
    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error('[API_ERROR]', error);
    const errorMessage = error?.error?.message || error?.message || 'An unexpected error occurred.';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}
