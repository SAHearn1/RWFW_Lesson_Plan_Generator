import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = ['iad1']; // keep unique per route

const ROUTE_ID = 'generatePlan-v3-2025-08-11'; // uniqueness guard

// ---------- Zod schemas ----------
const StepSchema = z.object({
  label: z.enum(['Opening', 'I Do', 'We Do', 'You Do Together', 'You Do Alone', 'Closing']),
  minutes: z.number().int().positive().max(180).optional(),
  text: z.string().min(5),
  teacherNote: z.string().min(5),
  studentNote: z.string().min(5),
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
  routeId: z.string().default(ROUTE_ID), // uniqueness carried in payload
  title: z.string(),
  branding: z
    .object({
      org: z.string().optional(),
      tagline: z.string().optional(),
      colors: z.object({ primary: z.string().optional(), secondary: z.string().optional() }).optional(),
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

// ---------- OpenAI ----------
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// ---------- Types ----------
type GeneratePlanRequest = {
  gradeLevel?: string;
  subject?: string;
  durationMinutes?: number;
  topic?: string;
  mode?: 'Full Unit' | 'Single Lesson' | 'Project Only' | 'Student-Facing Task Only' | 'Diagnostic/Exit Activity';
  days?: number;
  brand?: { org?: string; tagline?: string };
};

// ---------- Prompts ----------
function buildSystemPrompt() {
  return [
    'You are an expert curriculum designer (20+ years) in K–12, PBL, STEAM, TIC, SEL (CASEL), MTSS, and GRR.',
    'Return STRICT JSON ONLY — no markdown, no commentary.',
    'Top-level keys required: schemaVersion, routeId, title, branding, mode, durationMinutes, gradeLevel, subject, topic, days (array), appendixA (array).',
    'Each day requires: day, title, essentialQuestion, learningTarget, standards[], selCompetencies[], mtssSupports{tier1[], tier2[], tier3[]}, regulationRituals[], flow{opening,iDo,weDo,youDoTogether,youDoAlone,closing}.',
    'Each flow step requires: label, minutes, text, teacherNote, studentNote.',
    'MANDATORY: Every step must include "[Teacher Note: ...]" and "[Student Note: ...]" in their respective fields.',
    'Do not fabricate URLs; use placeholders like "[Insert link here]".',
    `ROUTE_ID=${ROUTE_ID}`,
  ].join(' ');
}

function buildUserPrompt(input: Required<GeneratePlanRequest>) {
  const { gradeLevel, subject, durationMinutes, topic, mode, days, brand } = input;
  return [
    `Build a ${mode} lesson for Grade ${gradeLevel} ${subject} on "${topic}" in ${durationMinutes} minutes.`,
    'Flow order: Opening, I Do, We Do, You Do Together, You Do Alone, Closing.',
    'Include standards, essential question, learning target, SEL competencies, MTSS (Tiers 1–3), regulation rituals, student choice, and Appendix A assets.',
    'Appendix naming: {LessonCode}_{Grade}{SubjectAbbrev}_{DescriptiveTitle}.{ext}.',
    brand?.org ? `Brand org: ${brand.org}.` : '',
    brand?.tagline ? `Brand tagline: ${brand.tagline}.` : '',
    `Number of days to generate: ${days}.`,
    'Return strict JSON matching the schema. No prose.',
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
    'You are a strict JSON repair tool. Given malformed/partial JSON, output corrected JSON only, matching the required schema.';
  const user = [
    'Required keys: schemaVersion, routeId, title, branding, mode, durationMinutes, gradeLevel, subject, topic, days[], appendixA[].',
    'Days->flow contains 6 steps with teacherNote/studentNote containing the exact bracketed text.',
    `Fix this JSON:\n${badJSON}`,
  ].join('\n');

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    max_tokens: 6000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });
  return res.choices[0]?.message?.content?.trim() ?? '';
}

function skeleton(input: Required<GeneratePlanRequest>): LessonPlan {
  const mkStep = (label: z.infer<typeof StepSchema>['label']) => ({
    label,
    minutes: 15,
    text: `Structured activity for ${label.toLowerCase()}.`,
    teacherNote:
      '[Teacher Note: Default skeleton—add differentiation, trauma-informed facilitation, and checks for understanding.]',
    studentNote:
      '[Student Note: You’ve got this—follow the steps, ask for help, and take regulation breaks as needed.]',
  });

  return {
    schemaVersion: '1.0',
    routeId: ROUTE_ID,
    title: `Draft: ${input.topic}`,
    branding: {
      org: input.brand?.org ?? 'Root Work Framework',
      tagline: input.brand?.tagline ?? 'S.T.E.A.M. Powered, Trauma Informed, Project Based',
    },
    mode: input.mode,
    durationMinutes: input.durationMinutes,
    gradeLevel: input.gradeLevel,
    subject: input.subject,
    topic: input.topic,
    days: [
      {
        day: 1,
        title: `Intro to ${input.topic}`,
        essentialQuestion: `Why does ${input.topic} matter for your growth and community?`,
        learningTarget: `I can explain key ideas of ${input.topic} and how I’ll demonstrate my understanding.`,
        standards: ['[Insert standard here]'],
        selCompetencies: ['Self-Management', 'Responsible Decision-Making'],
        mtssSupports: { tier1: ['Clear routines'], tier2: ['Small-group check-ins'], tier3: ['1:1 support'] },
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
        altText: 'Guidebook cover with a calm garden illustration',
      },
    ],
  };
}

// ---------- Handler ----------
export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ ok: false, error: 'Missing OPENAI_API_KEY', routeId: ROUTE_ID }, { status: 500 });
    }

    const body = (await req.json()) as GeneratePlanRequest;

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

    // model call with retry
    let raw = await callModelJSON(system, user, 0.4);
    if (!raw) raw = await callModelJSON(system, user, 0.2);
    if (!raw) return NextResponse.json({ ok: true, source: 'fallback-empty', routeId: ROUTE_ID, plan: skeleton(input) });

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const repaired = await tryRepairJSON(raw);
      if (!repaired) return NextResponse.json({ ok: true, source: 'fallback-unparsed', routeId: ROUTE_ID, plan: skeleton(input) });
      try {
        parsed = JSON.parse(repaired);
      } catch {
        return NextResponse.json({ ok: true, source: 'fallback-repair-failed', routeId: ROUTE_ID, plan: skeleton(input) });
      }
    }

    const check = PlanSchema.safeParse(parsed);
    if (!check.success) {
      const repaired = await tryRepairJSON(JSON.stringify(parsed));
      if (repaired) {
        try {
          const reparsed = JSON.parse(repaired);
          const ok = PlanSchema.safeParse(reparsed);
          if (ok.success) return NextResponse.json({ ok: true, source: 'repaired', routeId: ROUTE_ID, plan: ok.data });
        } catch {/* ignore */}
      }
      return NextResponse.json({ ok: true, source: 'fallback-invalid', routeId: ROUTE_ID, plan: skeleton(input) });
    }

    return NextResponse.json({ ok: true, source: 'llm', routeId: ROUTE_ID, plan: check.data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: true, source: 'fallback-exception', routeId: ROUTE_ID, error: msg, plan: skeleton({
      gradeLevel: '10',
      subject: 'ELA',
      durationMinutes: 90,
      topic: 'Citing textual evidence to support a claim',
      mode: 'Single Lesson',
      days: 1,
      brand: { org: 'Root Work Framework', tagline: 'S.T.E.A.M. Powered, Trauma Informed, Project Based' },
    }) });
  }
}
