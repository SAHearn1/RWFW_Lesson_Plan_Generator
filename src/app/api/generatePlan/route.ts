// FILE PATH: src/app/api/generatePlan/route.ts
// This version includes type-safety checks to satisfy the compiler.

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { masterPrompt } from '../../../masterPrompt';

// Vercel Pro Plan Configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5-minute timeout

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// List of models to try, in order of preference.
const MODELS_IN_ORDER_OF_PREFERENCE = [
    'claude-opus-4-1-20250805',
    'claude-3-opus-20240229',
    'claude-3-5-sonnet-20240620',
    'claude-3-sonnet-20240229'
];

export async function POST(req: NextRequest) {
  let lessonPlan = '';
  let lastError: unknown = null;

  try {
    const body = await req.json();

    if (!body.gradeLevel || body.gradeLevel === 'Select Grade' || !body.subjects || body.subjects.length === 0) {
      return NextResponse.json({ error: 'Please ensure all required fields are selected.' }, { status: 400 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("CRITICAL: ANTHROPIC_API_KEY is not configured.");
      return NextResponse.json({ error: 'Application not configured correctly.' }, { status: 500 });
    }

    const userPrompt = `
      Please generate a lesson plan with the following specifications:
      - Grade Level: ${body.gradeLevel}
      - Subject(s): ${body.subjects.join(', ')}
      - Duration: ${body.days || 3} day(s)
      - Unit Title: ${body.unitTitle || 'Not specified'}
      - Standards: ${body.standards || 'Align with relevant national or state standards.'}
      - Additional Focus Areas: ${body.focus || 'None specified.'}
    `;
    
    // --- Fallback Logic ---
    for (const model of MODELS_IN_ORDER_OF_PREFERENCE) {
      try {
        console.log(`[API] Attempting generation with model: ${model}`);
        
        const response = await client.messages.create({
          model: model,
          max_tokens: 8192,
          temperature: 0.3,
          system: masterPrompt,
          messages: [{ role: 'user', content: userPrompt }]
        });
        
        const generatedText = response.content?.[0]?.type === 'text' ? response.content[0].text : '';
        
        if (generatedText) {
          console.log(`[API] Successfully generated with model: ${model}`);
          lessonPlan = generatedText;
          break; // Exit the loop on success
        }
      } catch (error) {
        lastError = error;
        // --- THIS IS THE CORRECTED, TYPE-SAFE BLOCK ---
        if (error instanceof Error) {
            console.warn(`[API] Model ${model} failed. Trying next model. Error:`, error.message);
        } else {
            console.warn(`[API] Model ${model} failed with an unknown error. Trying next model.`);
        }
      }
    }

    if (!lessonPlan) {
      console.error('[API] All models failed. Last error:', lastError);
      throw lastError || new Error('All available AI models failed to generate a response.');
    }

    // --- Quality Validation Logic ---
    const daysRequested = parseInt(String(body.days || 3), 10);
    const dayHeadersCount = (lessonPlan.match(/DAY \d+:/gi) || []).length;
    const teacherNotesCount = (lessonPlan.match(/\[Teacher Note:/gi) || []).length;
    const studentNotesCount = (lessonPlan.match(/\[Student Note:/gi) || []).length;
    
    const qualityIssues = [];
    if (dayHeadersCount < daysRequested) {
      qualityIssues.push(`only ${dayHeadersCount} of ${daysRequested} days were generated`);
    }
    if (teacherNotesCount < dayHeadersCount * 5) {
      qualityIssues.push('is missing some Teacher Notes');
    }
    if (studentNotesCount < dayHeadersCount * 5) {
      qualityIssues.push('is missing some Student Notes');
    }
    
    let finalLessonPlan = lessonPlan;
    if (qualityIssues.length > 0) {
      finalLessonPlan += `\n\n---\n\n## QUALITY ENHANCEMENT NOTICE\n\n`;
      finalLessonPlan += `⚡ **Partial Generation:** This plan ${qualityIssues.join(' and ')}.\n\n`;
      finalLessonPlan += `**For maximum quality, try generating fewer days (1-2) or a single subject.**\n`;
      finalLessonPlan += `*This lesson plan is designed to be fully functional for classroom use as-is.*`;
    }

    return NextResponse.json({ lessonPlan: finalLessonPlan });

  } catch (error) {
    // --- THIS IS THE CORRECTED, TYPE-SAFE FINAL CATCH BLOCK ---
    console.error('[API_ERROR] Final catch block:', error);
    let errorMessage = 'An unexpected error occurred during generation.';
    
    // Check if it's an API error from the SDK, which has a status property
    if (error && typeof error === 'object' && 'status' in error && error.status === 429) {
        errorMessage = 'The generator is currently experiencing high demand. Please wait 60 seconds and try again.';
    } else if (error instanceof Error) {
        errorMessage = `Generation failed: ${error.message}`;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
