// src/app/api/generatePlan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = ['iad1'];
export const maxDuration = 60;

// Unique salt to avoid Vercel dedupe collisions with other routes
export const __RWFW_GENERATE_PLAN_SALT__ = 'generatePlan-v9-2025-08-12';

type GeneratePlanInput = {
  gradeLevel?: string;
  subject?: string;
  durationMinutes?: number;
  topic?: string;
  standards?: string[];
  days?: number;
  brandName?: string;
  includeAppendix?: boolean;
  includeRubrics?: boolean;
  includeAssetsDirectory?: boolean;
  userPrompt?: string;
};

type NormalizedInput = Required<
  Omit<GeneratePlanInput, 'standards'>
> & { standards: string[] };

type LessonPlanJSON = {
  meta: {
    title: string;
    subtitle?: string;
    gradeLevel: string;
    subject: string;
    days: number;
    durationMinutes: number;
    essentialQuestion: string;
    standards: string[];
  };
  days: Array<{
    day: number;
    title: string;
    learningTarget: string;
    essentialQuestion: string;
    standards: string[];
    flow: {
      opening: { minutes: number; activity: string; teacherNote: string; studentNote: string };
      iDo: { minutes: number; activity: string; teacherNote: string; studentNote: string };
      weDo: { minutes: number; activity: string; teacherNote: string; studentNote: string };
      youDoTogether: { minutes: number; activity: string; teacherNote: string; studentNote: string };
      youDoAlone: { minutes: number; activity: string; teacherNote: string; studentNote: string };
      closing: { minutes: number; activity: string; teacherNote: string; studentNote: string };
    };
    mtss: { tier1: string[]; tier2: string[]; tier3: string[] };
    selCompetencies: string[];
    regulationRituals: string[];
    assessment: { formative: string[]; summative?: string[] };
    resources: string[];
  }>;
  appendixA?: {
    namingConvention: string;
    assets: Array<{
      fileName: string;
      type: 'image' | 'pdf' | 'docx' | 'sheet' | 'link';
      description: string;
      altText?: string;
      howToGenerate?: string;
      linkPlaceholder?: string;
      figure?: string;
    }>;
  };
  markdown?: string;
};

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

function normalizeInput(body: GeneratePlanInput | null): NormalizedInput {
  const days = Math.min(Math.max(body?.days ?? 3, 1), 5);
  const standards =
    body?.standards && Array.isArray(body.standards) && body.standards.length > 0
      ? body.standards
      : ['CCSS.ELA-LITERACY.RI.9-10.1'];

  return {
    gradeLevel: body?.gradeLevel ?? '10',
    subject: body?.subject ?? 'ELA',
    durationMinutes: body?.durationMinutes ?? 90,
    topic: body?.topic ?? 'Citing Textual Evidence to Support a Claim',
    standards,
    days,
    brandName: body?.brandName ?? 'Root Work Framework',
    includeAppendix: body?.includeAppendix ?? true,
    includeRubrics: body?.includeRubrics ?? true,
    includeAssetsDirectory: body?.includeAssetsDirectory ?? true,
    userPrompt: body?.userPrompt ?? '',
  };
}

function validatePlan(plan: any): plan is LessonPlanJSON {
  return !!(plan?.meta?.title && Array.isArray(plan?.days) && plan.days[0]?.flow);
}

function safeParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function fallbackPlan(input: NormalizedInput): LessonPlanJSON {
  const mkStep = (label: string) => ({
    minutes: Math.round(input.durationMinutes / 6),
    activity: `${label}: See teacher script and student-facing directions.`,
    teacherNote:
      '[Teacher Note: Keep directions brief; offer options; monitor regulation; normalize help-seeking.]',
    studentNote:
      '[Student Note: You’ve got this. Ask for clarity, choose a strategy, and pace yourself.]',
  });

  const dayBlock = (day: number) => ({
    day,
    title: `${input.topic} — Day ${day}`,
    learningTarget: 'I can cite and explain textual evidence that supports a claim.',
    essentialQuestion: 'How do we choose evidence that truly supports our claim?',
    standards: input.standards,
    flow: {
      opening: mkStep('Opening'),
      iDo: mkStep('I Do'),
      weDo: mkStep('We Do'),
      youDoTogether: mkStep('You Do Together'),
      youDoAlone: mkStep('You Do Alone'),
      closing: mkStep('Closing'),
    },
    mtss: {
      tier1: ['Clear agenda; sentence starters; timers.'],
      tier2: ['Small-group check-ins; guided frames; extended time.'],
      tier3: ['1:1 conferencing; alternative modality; reduced load.'],
    },
    selCompetencies: ['Self-Management', 'Relationship Skills'],
    regulationRituals: ['Box breathing; stretch & reset.'],
    assessment: { formative: ['Exit ticket: Claim + cited evidence + why it fits.'] },
    resources: ['Projector', 'Timer', 'Student handout'],
  });

  return {
    meta: {
      title: `${input.subject} — ${input.topic}`,
      subtitle: '',
      gradeLevel: input.gradeLevel,
      subject: input.subject,
      days: input.days,
      durationMinutes: input.durationMinutes,
      essentialQuestion: 'How can we use evidence to support thinking?',
      standards: input.standards,
    },
    days: Array.from({ length: input.days }, (_, i) => dayBlock(i + 1)),
    appendixA: {
      namingConvention:
        '{LessonCode}_{GradeLevel}{SubjectAbbreviation}_{DescriptiveTitle}.{filetype}',
      assets: [],
    },
    markdown:
      '# Ready-to-Teach Pack (Fallback)\n\nIf you see this, the generator timed out. The JSON still has safe defaults.',
  };
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { ok: false, error: 'Missing ANTHROPIC_API_KEY' },
        { status: 500 },
      );
    }

    const input = normalizeInput((await req.json().catch(() => null)) as GeneratePlanInput | null);
    const standardsList =
      input.standards.length > 0 ? input.standards.join(', ') : 'No standards specified';

    const prompt = `Create a ${input.days}-day lesson plan.

Context:
- Grade Level: ${input.gradeLevel}
- Subject: ${input.subject}
- Topic: ${input.topic}
- Standards: ${standardsList}
- Block Duration: ${input.durationMinutes} minutes/day

Frameworks:
- STEAM + Project-Based Learning
- Trauma-informed practices
- MTSS tiers 1–3
- SEL competencies
- Gradual Release: Opening, I Do, We Do, You Do Together, You Do Alone, Closing

Return ONLY valid JSON with fields: meta, days[], appendixA, markdown.
No prose, no backticks.`;

    let raw = '';
    let plan: LessonPlanJSON | null = null;

    // Primary call
    try {
      const resp = await client.messages.create({
        model: 'claude-3-haiku-20240307',
        temperature: 0.3,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });
      raw = resp.content[0]?.type === 'text' ? resp.content[0].text.trim() : '';
      plan = safeParse<LessonPlanJSON>(raw);
    } catch {
      /* continue to fallback */
    }

    // Extract JSON if wrapped
    if (!plan && raw) {
      const s = raw.indexOf('{');
      const e = raw.lastIndexOf('}');
      if (s !== -1 && e > s) plan = safeParse<LessonPlanJSON>(raw.slice(s, e + 1));
    }

    if (!plan || !validatePlan(plan)) {
      plan = fallbackPlan(input);
    }

    // Keep UI contract exactly the same
    const teacherView = plan.markdown ?? '';
    const studentView = plan.markdown ?? '';
    const printView = plan.markdown ?? '';

    return NextResponse.json({
      ok: true,
      routeId: 'generatePlan-v9-anthropic-2025-08-12',
      generator: 'lesson-plan-generator-v9',
      plan,
      markdown: plan.markdown,
      teacherView,
      studentView,
      printView,
    });
  } catch (err) {
    const safe = fallbackPlan(
      normalizeInput({
        subject: 'ELA',
        topic: 'Citing Textual Evidence',
        gradeLevel: '10',
        days: 3,
      }),
    );
    return NextResponse.json({
      ok: true,
      routeId: 'generatePlan-v9-fallback',
      generator: 'lesson-plan-generator-v9',
      plan: safe,
      markdown: safe.markdown,
      teacherView: safe.markdown,
      studentView: safe.markdown,
      printView: safe.markdown,
      warning: 'Generator error handled with fallback.',
    });
  }
}
