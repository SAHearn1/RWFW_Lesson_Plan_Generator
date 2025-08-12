// src/app/api/generatePlan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

export const runtime = 'nodejs';
export const preferredRegion = ['iad1']; // keep distinct from other routes to avoid Vercel dedupe
const UNIQUE_SALT = 'generatePlan-route-v2';

// ---------- Zod schema (minimal but strict enough to render UI) ----------
const StepSchema = z.object({
  label: z.enum(['Opening', 'I Do', 'We Do', 'You Do Together', 'You Do Alone', 'Closing']),
  minutes: z.number().int().positive().max(180).optional(),
  text: z.string().min(5),
  teacherNote: z.string().min(5), // we’ll enforce “[Teacher Note:” via prompt
  studentNote: z.string().min(5), // we’ll enforce “[Student Note:” via prompt
});

const DaySchema = z.object({
  day: z.number().int().positive(),
  title: z.string().min(3),
  essentialQuestion: z.string().min(3),
  learningTarget: z.string().min(3),
  standards: z.array(z.string()).min(1),
  selCompetencies: z.array(z.string()).min(1),
  mtssSupports: z.object({
    tier1: z.array(z.string()).optional().default([]),
    tier2: z.array(z.string()).optional().default([]),
    tier3: z.array(z.string()).optional().default([]),
  }),
  regulationRituals: z.array(z.string()).optional().default([]),
  flow: z.object({
    opening: StepSchema,
    iDo: StepSchema,
    weDo: StepSchema,
    youDoTogether: StepSchema,
    youDoAlone: StepSchema,
    closing: StepSchema,
  }),
});

const AssetSchema = z.object({
  name: z.string(),
  type: z.enum(['image', 'pdf', 'docx', 'png', 'jpg']).optional(),
  description: z.string().optional(),
  altText: z.string().optional(),
  prompt: z.string().optional(),
});

const PlanSchema = z.object({
  schemaVersion: z.string().default('1.0'),
  title: z.string(),
  branding: z
    .object({
      org: z.string().optional(),
      tagline: z.string().optional(),
      colors: z
        .object({
          primary: z.string().optional(),
          secondary: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  mode: z
    .enum(['Full Unit', 'Single Lesson', 'Project Only', 'Student-Facing Task Only', 'Diagnostic/Exit Activity'])
    .default('Single Lesson'),
  durationMinutes: z.number().int().positive().max(300).default(90),
  gradeLevel: z.string().optional(),
  subject: z.string().optional(),
  topic: z.string().optional(),
  days: z.array(DaySchema).min(1),
  appendixA: z.array(AssetSchema).optional().default([]),
});

type LessonPlan = z.infer<typeof PlanSchema>;

// ---------- OpenAI client ----------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// ---------- Request payload ----------
type GeneratePlanRequest = {
  gradeLevel?: string;
  subject?: string;
  durationMinutes?: number;
  topic?: string;
  mode?: 'Full Unit' | 'Single Lesson' | 'Project Only' | 'Student-Facing Task Only' | 'Diagnostic/Exit Activity';
  days?: number; // optional for Full Unit
  brand?: { org?: string; tagline?: string };
};

// ---------- Prompts ----------
function buildSystemPrompt() {
  return [
    'You are an expert curriculum designer (20+ years) in K–12, PBL, STEAM, Trauma-Informed Care, SEL (CASEL), MTSS, and Gradual Release of Responsibility (GRR).',
    'Return STRICT JSON ONLY — no markdown, no commentary.',
    'Top-level keys required: schemaVersion, title, branding, mode, durationMinutes, gradeLevel, subject, topic, days (array), appendixA (array).',
    'Each day requires: day, title, essentialQuestion, learningTarget, standards[], selCompetencies[], mtssSupports{tier1[], tier2[], tier3[]}, regulationRituals[],',
    'and flow{opening, iDo, weDo, youDoTogether, youDoAlone, closing}.',
    'Each flow step requires: label, minutes, text, teacherNote, studentNote.',
    'MANDATORY: In each step, include the exact strings: "[Teacher Note: ...]" and "[Student Note: ...]" — place them right after the activity text.',
    'Do not fabricate URLs; if needed, include placeholders like "[Insert link here]".',
    `UNIQUE_SALT=${UNIQUE_SALT}`,
  ].join(' ');
}

function buildUserPrompt(input: Required<GeneratePlanRequest>) {
  const { gradeLevel, subject, durationMinutes, topic, mode, days, brand } = input;
  return [
    `Build a ${mode} lesson for Grade ${gradeLevel} ${subject} on "${topic}" in ${durationMinutes} minutes.`,
    'Daily flow order (exact): Opening, I Do, We Do, You Do Together, You Do Alone, Closing.',
    'Include: standards, essential question, learning target, SEL competencies, MTSS supports (Tier 1–3), regulation rituals, student choice, and Appendix A assets.',
    'Appendix assets should follow naming like {LessonCode}_{Grade}{SubjectAbbrev}_{DescriptiveTitle}.{ext}.',
    brand?.org ? `Brand org: ${brand.org}.` : '',
    brand?.tagline ? `Brand tagline: ${brand.tagline}.` : '',
    days ? `Number of days to generate: ${days}.` : '',
    'Return strict JSON that matches the required keys. No prose.',
  ]
    .filter(Boolean)
    .join(' ');
}

// ---------- Helpers ----------
async function callModelJSON(system: string, user: string, temperature = 0.4) {
  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature,
    max_tokens: 6000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  return res.choices[0]?.message?.content?.trim() ?? '';
}

async function tryRepairJSON(badJSON: string) {
  const system =
    'You are a strict JSON repair tool. Given malformed or schema-mismatched JSON, return corrected JSON that preserves content and fits the required structure. Return JSON only.';
  const user = [
    'Required top-level keys: schemaVersion, title, branding, mode, durationMinutes, gradeLevel, subject, topic, days (array), appendixA (array).',
    'Each day: day, title, essentialQuestion, learningTarget, standards[], selCompetencies[], mtssSupports{tier1[], tier2[], tier3[]}, regulationRituals[],',
    'flow{opening, iDo, weDo, youDoTogether, youDoAlone, closing}. Each step: label, minutes, text, teacherNote, studentNote.',
    'Ensure every step includes strings "[Teacher Note: ...]" and "[Student Note: ...]" in those fields, not embedded in text.',
    `Here is the candidate JSON to repair:\n${badJSON}`,
  ].join('\n');

  const repaired = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    max_tokens: 6000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  return repaired.choices[0]?.message?.content?.trim() ?? '';
}

function makeSkeletonFallback(input: Required<GeneratePlanRequest>): LessonPlan {
  const { gradeLevel, subject, durationMinutes, topic, mode, brand } = input;
  const mkStep = (label: z.infer<typeof StepSchema>['label']): z.infer<typeof StepSchema> => ({
    label,
    minutes: 15,
    text: `Structured activity for ${label.toLowerCase()}.`,
    teacherNote:
      '[Teacher Note: This is a safe default skeleton. Add specifics, differentiation, and trauma-informed facilitation as needed.]',
    studentNote:
      '[Student Note: You can do this—use the steps, ask questions, and take breaks if you need them.]',
  });

  return {
    schemaVersion: '1.0',
    title: `Draft: ${topic}`,
    branding: {
      org: brand?.org ?? 'Root Work Framework',
      tagline: brand?.tagline ?? 'S.T.E.A.M. Powered, Trauma Informed, Project Based',
    },
    mode,
    durationMinutes,
    gradeLevel,
    subject,
    topic,
    days: [
      {
        day: 1,
        title: `Intro to ${topic}`,
        essentialQuestion: `Why does ${topic} matter for your growth and community?`,
        learningTarget: `I can describe key ideas of ${topic} and explain how I will demonstrate my understanding.`,
        standards: ['[Insert standard here]'],
        selCompetencies: ['Self-Management', 'Responsible Decision-Making'],
        mtssSupports: { tier1: ['Clear routines'], tier2: ['Small-group check-ins'], tier3: ['1:1 coaching'] },
        regulationRituals: ['3 mindful breaths', 'Movement stretch'],
        flow: {
          opening: mkStep('Opening'),
          iDo: mkStep('I Do'),
          weDo: mkStep('We Do'),
          youDoTogether: mkStep('You Do Together'),
          youDoAlone: mkStep('You Do Alone'),
          closing: mkStep('Closing'),
        },
      },
    ],
    appendixA: [
      {
        name: 'RootedInMe_10ELA_RitualGuidebook.pdf',
        type: 'pdf',
        description: 'Daily regulation rituals for opening/closing.',
        altText: 'Guidebook cover with calm garden illustration',
      },
    ],
  };
}

// ---------- Handler ----------
export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
    }

    const body = (await req.json()) as GeneratePlanRequest;

    // Defaults to keep prompts stable
    const input: Required<GeneratePlanRequest> = {
      gradeLevel: body.gradeLevel ?? '10',
      subject: body.subject ?? 'ELA',
      durationMinutes: body.durationMinutes ?? 90,
      topic: body.topic ?? 'Citing textual evidence to support a claim',
      mode: body.mode ?? 'Single Lesson',
      days: body.days ?? 1,
      brand: body.brand ?? { org: 'Root Work Framework', tagline: 'S.T.E.A.M. Powered, Trauma Informed, Project Based' },
    };

    const system = buildSystemPrompt();
    const user = buildUserPrompt(input);

    // Try twice with slightly lower temperature on second try
    let raw = await callModelJSON(system, user, 0.4);
    if (!raw) {
      raw = await callModelJSON(system, user, 0.2);
    }

    // If still empty, fall back
    if (!raw) {
      const fallback = makeSkeletonFallback(input);
      return NextResponse.json({ ok: true, source: 'fallback-empty', plan: fallback }, { status: 200 });
    }

    // Parse attempt #1
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try a one-shot repair
      const repaired = await tryRepairJSON(raw);
      if (!repaired) {
        const fallback = makeSkeletonFallback(input);
        return NextResponse.json({ ok: true, source: 'fallback-unparsed', plan: fallback }, { status: 200 });
      }
      try {
        parsed = JSON.parse(repaired);
      } catch {
        const fallback = makeSkeletonFallback(input);
        return NextResponse.json({ ok: true, source: 'fallback-repair-failed', plan: fallback }, { status: 200 });
      }
    }

    // Validate with Zod; if invalid, try repair once with the stringified parsed
    const first = PlanSchema.safeParse(parsed);
    if (!first.success) {
      const repaired = await tryRepairJSON(JSON.stringify(parsed));
      if (repaired) {
        try {
          const fixed = JSON.parse(repaired);
          const second = PlanSchema.safeParse(fixed);
          if (second.success) {
            return NextResponse.json({ ok: true, source: 'repaired', plan: second.data }, { status: 200 });
          }
        } catch {
          // fall through
        }
      }
      const fallback = makeSkeletonFallback(input);
      return NextResponse.json({ ok: true, source: 'fallback-invalid', plan: fallback }, { status: 200 });
    }

    // Success
    return NextResponse.json({ ok: true, source: 'llm', plan: first.data }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    // Last-resort: return skeleton so the UI never shows “Empty response”
    try {
      const fallback = makeSkeletonFallback({
        gradeLevel: '10',
        subject: 'ELA',
        durationMinutes: 90,
        topic: 'Citing textual evidence to support a claim',
        mode: 'Single Lesson',
        days: 1,
        brand: { org: 'Root Work Framework', tagline: 'S.T.E.A.M. Powered, Trauma Informed, Project Based' },
      });
      return NextResponse.json({ ok: true, source: 'fallback-exception', error: msg, plan: fallback }, { status: 200 });
    } catch {
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }
}
