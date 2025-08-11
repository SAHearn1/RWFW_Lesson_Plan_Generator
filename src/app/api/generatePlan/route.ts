import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

type GeneratePayload = {
  gradeLevel: string;
  subjects: string[];
  duration: string | number;
  unitTitle?: string;
  standards?: string;
  focus?: string;
};

type LessonPlanData = {
  meta: {
    unitTitle: string;
    gradeLevel: string;
    subjects: string[];
    durationDays: number;
  };
  days: Array<{ dayNumber: number; title: string }>;
  appendixA?: Array<{
    fileName: string;
    type?: string;
    description?: string;
    altText?: string;
    figure?: string;
    link?: string;
  }>;
};

function coerceNumber(n: string | number, fallback = 3) {
  const num = typeof n === 'string' ? parseInt(n, 10) : n;
  return Number.isFinite(num) && num > 0 ? (num as number) : fallback;
}

function makeSystemPrompt() {
  return `
You are an expert curriculum designer (20+ yrs) specializing in: K–12, SPED, PBL, STEAM, Living Learning Labs, trauma-informed care, CASEL SEL, MTSS, GRR. You know the Root Work Framework (healing-centered, culturally responsive) and embed it naturally (no labels).

MANDATORY OUTPUT CONTRACT
- Return ONLY valid JSON (no extra text, no code fences).
- JSON shape:
{
  "lessonPlan": <see schema below>,
  "markdown": {
    "teacher": "Full teacher-facing Markdown",
    "student": "Full student-facing Markdown"
  }
}

"lessonPlan" schema:
{
  "meta": {
    "unitTitle": string,
    "gradeLevel": string,
    "subjects": string[],
    "durationDays": number
  },
  "days": [
    { "dayNumber": number, "title": string }
  ],
  "appendixA": [
    {
      "fileName": string,               // Respect naming convention
      "type": "image|pdf|docx|sheet|link|other",
      "description": string,
      "altText": string,
      "figure": "Figure X",
      "link": "[Insert link here]"
    }
  ]
}

TEACHER/STUDENT NOTES PROTOCOL (must appear after EVERY activity in Markdown):
- [Teacher Note: ...] (1–3 sentences; rationale, trauma-informed facilitation, differentiation, assessment, Rootwork tie-in)
- [Student Note: ...] (1–2 sentences; coaching voice, self-advocacy, regulation)

STRUCTURE PER DAY (both Teacher and Student markdown must include all):
- Header: Day #, Lesson Title, Essential Question, Learning Target, Standards
- Structured Flow with GRR:
  Opening (X min)
  I Do: Direct Instruction (X min)
  We Do: Collaborative (X min)
  You Do Together (X min)
  You Do Alone (X min)
  Closing (X min)
- For each step: include [Teacher Note:] and [Student Note:] before MTSS.
- Include: Student-facing instructions/scaffolds, Facilitator modeling, MTSS tiers, SEL competencies, Regulation rituals, Choice options, Multimedia placeholders, Assessment, Reflection/peer feedback.
- End with "Appendix A: Resource and Visual Asset Directory" with named assets following the standard naming convention:
  {LessonCode}_{GradeLevel}{SubjectAbbrev}_{DescriptiveTitle}.{ext}
  e.g., RootedInMe_10ELA_RitualGuidebook.pdf

QUALITY PASS:
- Ensure EVERY component has both notes in the specified format.
- Use warm, precise, professional tone. No filler. No external links unless explicitly marked as [Insert link here].
- Assume 90-minute blocks unless told otherwise.
`.trim();
}

function makeUserPrompt(p: GeneratePayload) {
  const days = coerceNumber(p.duration, 3);
  const unit = p.unitTitle?.trim() || 'Rooted in Me: Exploring Culture, Identity, and Expression';
  const standards = p.standards?.trim() || 'Align to relevant state/CCSS/NGSS and CASEL SEL standards.';
  const focus = p.focus?.trim() || 'Include trauma-informed supports, regulation rituals, and equity-centered scaffolds.';
  const subj = p.subjects?.join(', ');

  return `
Generate a ${days}-day, ready-to-teach STEAM/PBL Root Work Framework lesson for:

Grade Level: ${p.gradeLevel}
Subjects: ${subj}
Unit Title: ${unit}
Standards/Input: ${standards}
Additional Focus Areas: ${focus}

Must strictly follow the output contract and structure above. Return only JSON.
`.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as GeneratePayload | null;
    if (!body || !body.gradeLevel || !Array.isArray(body.subjects) || body.subjects.length === 0) {
      return NextResponse.json({ error: 'Missing required fields: gradeLevel and subjects' }, { status: 400 });
    }

    const system = makeSystemPrompt();
    const user = makeUserPrompt(body);

    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not set on the server.' },
        { status: 500 },
      );
    }

    const openai = new OpenAI({ apiKey });

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.5,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || '';

    // Strip code fences if present
    const cleaned = raw.replace(/^\s*```(json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    let parsed: any = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to salvage JSON between first "{" and last "}"
      const first = cleaned.indexOf('{');
      const last = cleaned.lastIndexOf('}');
      if (first >= 0 && last > first) {
        const candidate = cleaned.slice(first, last + 1);
        parsed = JSON.parse(candidate);
      } else {
        throw new Error('Model did not return valid JSON.');
      }
    }

    // Coerce minimal shape
    const lp: LessonPlanData = {
      meta: {
        unitTitle: parsed?.lessonPlan?.meta?.unitTitle || body.unitTitle || 'Root Work Lesson',
        gradeLevel: parsed?.lessonPlan?.meta?.gradeLevel || body.gradeLevel,
        subjects: parsed?.lessonPlan?.meta?.subjects || body.subjects,
        durationDays: coerceNumber(parsed?.lessonPlan?.meta?.durationDays || body.duration || 3),
      },
      days: Array.isArray(parsed?.lessonPlan?.days) ? parsed.lessonPlan.days : [],
      appendixA: Array.isArray(parsed?.lessonPlan?.appendixA) ? parsed.lessonPlan.appendixA : [],
    };

    const teacherMd: string = parsed?.markdown?.teacher || '';
    const studentMd: string = parsed?.markdown?.student || '';

    return NextResponse.json(
      {
        lessonPlan: lp,
        markdown: { teacher: teacherMd, student: studentMd },
      },
      { status: 200 },
    );
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('generatePlan error:', err);
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 },
    );
  }
}
