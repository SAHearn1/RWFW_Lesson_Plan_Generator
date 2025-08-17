// File: src/app/api/lessons/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// We will need to create this file to hold your master prompt
import { masterPrompt } from '@/constants/prompts'; 

// Vercel-specific configuration for serverless functions
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Allow the function to run for up to 5 minutes for long lesson plans
export const maxDuration = 300; 

// Initialize the Anthropic AI client
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // --- 1. Validate the user's input ---
    if (!body.gradeLevel || !body.subjects || body.subjects.length === 0) {
      return NextResponse.json({ error: 'Grade level and subjects are required.' }, { status: 400 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("CRITICAL: ANTHROPIC_API_KEY is not configured.");
      return NextResponse.json({ error: 'Application not configured correctly.' }, { status: 500 });
    }

    // --- 2. Construct the prompt for the AI ---
    const userPrompt = `
      Please generate a lesson plan with the following specifications:
      - Grade Level: ${body.gradeLevel}
      - Subject(s): ${body.subjects.join(', ')}
      - Duration: ${body.days || 3} day(s)
      - Unit Title: ${body.unitTitle || 'Not specified'}
      - Standards: ${body.standards || 'Align with relevant national or state standards.'}
      - Additional Focus Areas: ${body.focus || 'None specified.'}
    `;

    // --- 3. Call the Anthropic API ---
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620', // Or your preferred model
      max_tokens: 8192, // Increased token limit for multi-day plans
      temperature: 0.3,
      system: masterPrompt, // Your secret, high-level instructions
      messages: [{ role: 'user', content: userPrompt }] // The user's specific request
    });

    const lessonPlan = response.content?.[0]?.type === 'text' ? response.content[0].text : '';
    
    if (!lessonPlan) {
      throw new Error('The AI returned an empty response.');
    }

    // --- 4. Send the successful response back to the frontend ---
    return NextResponse.json({ lessonPlan });

  } catch (error: any) {
    console.error('[API_ERROR]', error);
    let errorMessage = 'An unexpected error occurred during generation.';
    if (error.status === 429) {
      errorMessage = 'The generator is experiencing high demand. Please wait 60 seconds and try again.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
