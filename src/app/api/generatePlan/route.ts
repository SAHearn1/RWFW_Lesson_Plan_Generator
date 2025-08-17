// FILE PATH: src/app/api/generatePlan/route.ts
// This version saves each successful lesson plan to your Firestore database.

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { masterPrompt } from '../../../masterPrompt';
import admin from 'firebase-admin';

// Vercel Pro Plan Configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5-minute timeout

// --- Initialize Firebase Admin SDK ---
// This ensures we only initialize the app once.
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Helper function to determine the grade band from your curriculum guide
const getGradeBand = (grade: string): string => {
    const gradeNum = parseInt(grade, 10);
    if (grade === 'K' || (gradeNum >= 1 && gradeNum <= 2)) return 'K-2';
    if (gradeNum >= 3 && gradeNum <= 5) return '3-5';
    if (gradeNum >= 6 && gradeNum <= 8) return '6-8';
    if (gradeNum >= 9 && gradeNum <= 12) return '9-12';
    return 'Unknown';
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validation
    if (!body.gradeLevel || !body.subjects || body.subjects.length === 0) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        console.error("CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY is not configured.");
        return NextResponse.json({ error: 'Database not configured correctly.' }, { status: 500 });
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
      model: 'claude-opus-4-1-20250805',
      max_tokens: 8192,
      temperature: 0.3,
      system: masterPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const lessonPlan = response.content?.[0]?.type === 'text' ? response.content[0].text : '';
    if (!lessonPlan) {
      throw new Error('The AI returned an empty response.');
    }

    // --- NEW: Save to Firestore Database ---
    const planId = db.collection('lesson_plans').doc().id; // Generate a unique ID
    const planData = {
        planId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        unitTitle: body.unitTitle || 'Untitled Plan',
        gradeBand: getGradeBand(body.gradeLevel),
        gradeLevel: body.gradeLevel,
        subjects: body.subjects,
        focus: body.focus ? body.focus.split(',').map((s: string) => s.trim()) : [],
        fullMarkdownContent: lessonPlan,
        // Add more fields from your guide's structure as needed
        // learningThemes: [], 
        // selCompetencies: [],
    };

    await db.collection('lesson_plans').doc(planId).set(planData);
    console.log(`[DB] Successfully saved lesson plan with ID: ${planId}`);
    // --- End of new database logic ---

    // Your quality validation logic remains the same
    // ...

    return NextResponse.json({ lessonPlan });

  } catch (error: any) {
    console.error('[API_ERROR]', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error.message) {
      errorMessage = `Generation failed: ${error.message}`;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
