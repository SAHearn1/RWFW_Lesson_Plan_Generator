// File: src/app/api/quality-check/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Vercel-specific configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 180; // Allow up to 3 minutes for detailed analysis

// Initialize the OpenAI client. This uses the same API key as the asset generator.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// This is the core of the feature: a detailed prompt that turns the AI into an expert reviewer.
const qualityCheckSystemPrompt = `
You are an expert curriculum reviewer and instructional coach with a Ph.D. in Educational Leadership, specializing in Trauma-Informed Pedagogy and the Rootwork Framework. Your task is to analyze a lesson plan and provide a structured quality report in JSON format.

Analyze the provided lesson plan based on the following strict criteria:
1.  **Structural Integrity**: Does the lesson include all required components for each day (e.g., Essential Question, Learning Target, Opening, I Do, We Do, You Do, Closing)?
2.  **Note Compliance**: Does EVERY major activity section contain BOTH a [Teacher Note: ...] and a [Student Note: ...]? This is a non-negotiable requirement.
3.  **Trauma-Informed Principles**: Are principles of safety, trust, choice, collaboration, and empowerment evident in the activities and notes?
4.  **Pedagogical Soundness**: Is the Gradual Release of Responsibility (GRR) model followed logically? Are the activities engaging and aligned with the learning targets?
5.  **Rootwork Framework Alignment**: Does the language and tone of the student-facing notes reflect the empowering, healing-centered ethos of the Rootwork Framework?

Based on your analysis, provide a score from 1-100 and a brief report.
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lessonPlanText } = body;

    // --- 1. Validate the input ---
    if (!lessonPlanText || typeof lessonPlanText !== 'string') {
      return NextResponse.json({ error: 'Lesson plan text is required.' }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      console.error("CRITICAL: OPENAI_API_KEY is not configured.");
      return NextResponse.json({ error: 'Application not configured for quality analysis.' }, { status: 500 });
    }

    // --- (Future) Authenticate the user and check for premium status ---
    // Add logic here to ensure only premium users can access this feature.

    // --- 2. Call the OpenAI API for analysis ---
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // A powerful model is needed for nuanced analysis
      messages: [
        {
          role: "system",
          content: qualityCheckSystemPrompt,
        },
        {
          role: "user",
          content: `Please analyze the following lesson plan:\n\n---\n\n${lessonPlanText}`,
        },
      ],
      // This is crucial: it forces the AI to return a valid JSON object
      response_format: { type: "json_object" }, 
    });

    const report = response.choices[0].message.content;

    if (!report) {
      throw new Error("AI analysis returned an empty response.");
    }
    
    // The response is already a JSON string, so we can parse it directly
    const structuredReport = JSON.parse(report);

    // --- 3. Send the structured report back to the frontend ---
    return NextResponse.json({ qualityReport: structuredReport });

  } catch (error: any) {
    console.error('[QUALITY_API_ERROR]', error);
    return NextResponse.json({ error: 'Failed to perform quality analysis.' }, { status: 500 });
  }
}
