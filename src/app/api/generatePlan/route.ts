// FILE PATH: src/app/api/generatePlan/route.ts
// This version uses your existing, robust master prompt file.

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { masterPrompt } from '../../../src/masterPrompt'; // Correctly imports your existing file

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validation
    if (!body.gradeLevel || body.gradeLevel === 'Select Grade') {
      return NextResponse.json({ error: 'Please select a valid grade level.' }, { status: 400 });
    }
    if (!body.subjects || body.subjects.length === 0) {
      return NextResponse.json({ error: 'Please select at least one subject.' }, { status: 400 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("CRITICAL: ANTHROPIC_API_KEY is not configured.");
      return NextResponse.json({ error: 'Application not configured correctly.' }, { status: 500 });
    }

    // Create a simple user prompt from the form data to give the AI its specific task
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
      model: 'claude-3-5-sonnet-20240620',
      // This token count is a good starting point for balancing detail and avoiding timeouts
      max_tokens: 6000, 
      temperature: 0.3,
      system: masterPrompt, // Use your original master prompt as the main system instructions
      messages: [{ role: 'user', content: userPrompt }]
    });

    const lessonPlan = response.content?.[0]?.type === 'text' ? response.content[0].text : '';
    
    if (!lessonPlan) {
      throw new Error('The AI returned an empty response.');
    }

    // --- Quality Validation Logic ---
    const daysRequested = parseInt(String(body.days || 3), 10);
    const dayHeadersCount = (lessonPlan.match(/# DAY \d+:/gi) || []).length;
    const teacherNotesCount = (lessonPlan.match(/\[Teacher Note:/gi) || []).length;
    const studentNotesCount = (lessonPlan.match(/\[Student Note:/gi) || []).length;
    
    const qualityIssues = [];
    if (dayHeadersCount < daysRequested) {
      qualityIssues.push(`only ${dayHeadersCount} of ${daysRequested} days were generated`);
    }
    // A high-quality day has at least 5 sections with notes
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

  } catch (error: any) {
    console.error('[API_ERROR]', error);
    let errorMessage = 'An unexpected error occurred during generation.';
    if (error.status === 429) {
      errorMessage = 'The generator is currently experiencing high demand. Please wait 60 seconds and try again.';
    } else if (error.message) {
      errorMessage = `Generation failed: ${error.message}`;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
