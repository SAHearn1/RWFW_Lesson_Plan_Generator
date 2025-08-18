// File: src/app/api/lessons/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

import { masterPrompt } from '@/constants/prompts'; 

// Vercel-specific configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; 

// Initialize the Anthropic AI client
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// --- Helper function for making the API call ---
// This allows us to easily try different models
const generateLessonPlan = async (model: string, systemPrompt: string, userPrompt: string) => {
    return client.messages.create({
        model: model,
        max_tokens: 32000, // Keep the max limit; smaller models will just use what they need
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
    });
};

export async function POST(req: NextRequest) {
  const body = await req.json();

  // --- 1. Validate Input ---
  if (!body.gradeLevel || !body.subjects || body.subjects.length === 0) {
    return NextResponse.json({ error: 'Grade level and subjects are required.' }, { status: 400 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("CRITICAL: ANTHROPIC_API_KEY is not configured.");
    return NextResponse.json({ error: 'Application not configured correctly.' }, { status: 500 });
  }

  // --- 2. Construct User Prompt ---
  const userPrompt = `
    Please generate a lesson plan with the following specifications:
    - Grade Level: ${body.gradeLevel}
    - Subject(s): ${body.subjects.join(', ')}
    - Duration: ${body.days || 3} day(s)
    - Unit Title: ${body.unitTitle || 'Not specified'}
    - Standards: ${body.standards || 'Align with relevant national or state standards.'}
    - Additional Focus Areas: ${body.focus || 'None specified.'}
  `;

  try {
    // --- 3. Primary Attempt: Use the premium Opus 4.1 model ---
    console.log('Attempting generation with primary model: claude-opus-4-1-20250805');
    const response = await generateLessonPlan('claude-opus-4-1-20250805', masterPrompt, userPrompt);
    
    const lessonPlan = response.content?.[0]?.type === 'text' ? response.content[0].text : '';
    if (!lessonPlan) throw new Error('The AI returned an empty response.');

    return NextResponse.json({ lessonPlan });

  } catch (error: any) {
    // --- 4. Fallback Logic: Check for an "overloaded" error ---
    if (error.status === 529 || (error.error?.type === 'overloaded_error')) {
      console.warn('Primary model overloaded. Attempting fallback to claude-sonnet-4-20250514...');
      try {
        // --- Secondary Attempt: Use the powerful Sonnet 4 model ---
        const fallbackResponse = await generateLessonPlan('claude-sonnet-4-20250514', masterPrompt, userPrompt);
        
        const lessonPlan = fallbackResponse.content?.[0]?.type === 'text' ? fallbackResponse.content[0].text : '';
        if (!lessonPlan) throw new Error('The fallback AI model also returned an empty response.');

        return NextResponse.json({ lessonPlan });

      } catch (fallbackError: any) {
        console.error('[FALLBACK_API_ERROR]', fallbackError);
        return NextResponse.json({ error: 'The service is currently experiencing high demand. Please try again in a few moments.' }, { status: 503 });
      }
    }

    // --- 5. Handle all other errors ---
    console.error('[PRIMARY_API_ERROR]', error);
    const errorMessage = error.error?.message || 'An unexpected error occurred during generation.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
