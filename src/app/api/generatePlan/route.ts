// FILE PATH: src/app/api/generatePlan/route.ts
// This version uses the top-tier Opus 4.1 model and maximizes Vercel Pro plan limits.

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { masterPrompt } from '../../../masterPrompt';

// Vercel Pro Plan Configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Set timeout to 5 minutes (300 seconds)

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
      model: 'claude-opus-4-1-20250805', // Using the top-tier model
      max_tokens: 8192, // Maximize the output tokens
      temperature: 0.3,
      system: masterPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const lessonPlan = response.content?.[0]?.type === 'text' ? response.content[0].text : '';
    
    if (!lessonPlan) {
      throw new Error('The AI returned an empty response.');
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
