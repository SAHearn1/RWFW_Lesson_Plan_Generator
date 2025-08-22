// File: src/app/api/lessons/route.ts

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
// --- UPDATED IMPORTS ---
import { AnthropicStream, StreamingTextResponse, toAIStream } from 'ai';

import { masterPrompt } from '@/constants/prompts'; 

// Vercel-specific configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; 

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const userPrompt = `
      Please generate a lesson plan with the following specifications:
      - Grade Level: ${body.gradeLevel}
      - Subject(s): ${body.subjects.join(', ')}
      - Duration: ${body.days || 3} day(s)
      - Unit Title: ${body.unitTitle || 'Not specified'}
      - Standards: ${body.standards || 'Align with relevant national or state standards.'}
      - Additional Focus Areas: ${body.focus || 'None specified.'}
    `;

    const response = await client.messages.create({
      model: 'claude-opus-4-1-20250805', 
      max_tokens: 32000,
      temperature: 0.3,
      system: masterPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      stream: true, // Enable streaming
    });

    // --- THIS IS THE FIX ---
    // Convert the Anthropic-native stream into a standard, AI-SDK-compatible format.
    const stream = AnthropicStream(response);
    const aiStream = toAIStream(stream);

    // Respond with the correctly formatted stream
    return new StreamingTextResponse(aiStream);

  } catch (error: any) {
    console.error('[API_ERROR]', error);
    const errorMessage = error.error?.message || 'An unexpected error occurred.';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}
