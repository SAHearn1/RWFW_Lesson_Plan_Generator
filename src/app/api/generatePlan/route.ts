// src/app/api/generatePlan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const preferredRegion = ['iad1']; // unique per route to avoid dedupe
const UNIQUE_SALT = 'generatePlan-route-v1';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type GeneratePlanRequest = {
  gradeLevel?: string;
  subject?: string;
  durationMinutes?: number;
  topic?: string;
  mode?: 'Full Unit' | 'Single Lesson' | 'Project Only' | 'Student-Facing Task Only' | 'Diagnostic/Exit Activity';
  // You can add other knobs here as needed
};

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Missing OPENAI_API_KEY' },
        { status: 500 }
      );
    }

    const body = (await req.json()) as GeneratePlanRequest;

    // Minimal guardrails
    const grade = body.gradeLevel ?? '10';
    const subject = body.subject ?? 'ELA';
    const topic = body.topic ?? 'Citing textual evidence to support a claim';
    const duration = body.durationMinutes ?? 90;
    const mode = body.mode ?? 'Single Lesson';

    // Tight, self-contained prompt (you can swap in your master prompt if desired)
    const system = `You are an expert curriculum designer (20+ yrs) specializing in K–12, PBL, STEAM, Trauma-Informed Care, SEL (CASEL), MTSS, and Gradual Release of Responsibility. 
Return JSON with a top-level "schemaVersion", "title", "branding", "days" (array), and an "appendixA". 
Every lesson section MUST include both [Teacher Note:] and [Student Note:] lines right after the activity text. 
Assume 90 minutes unless provided. 
UNIQUE_SALT=${UNIQUE_SALT}`;

    const user = `Build a ${mode} lesson for Grade ${grade} ${subject} on "${topic}" in ${duration} minutes. 
Follow this daily flow exactly: Opening, I Do, We Do, You Do Together, You Do Alone, Closing.
Include: standards, essential question, learning target, SEL competencies, MTSS supports (Tier 1–3), regulation rituals, projects/choice, and Appendix A resource list. 
Return strict JSON only (no markdown).`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '{}';

    // Validate JSON quickly; if invalid, wrap as error
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { error: 'Model did not return valid JSON', raw },
        { status: 502 }
      );
    }

    // Return JSON to the UI; the UI renders Teacher/Student/Print tabs, etc.
    return NextResponse.json(
      {
        ok: true,
        plan: json,
      },
      { status: 200 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
