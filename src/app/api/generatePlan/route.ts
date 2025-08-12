// src/app/api/generatePlan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = ['iad1'];

// Lesson plan specific runtime config - increased timeout for OpenAI calls
export const maxDuration = 60;

const ROUTE_ID = 'generatePlan-v7-2025-08-12';

// Force unique bundle by adding specific lesson plan logic
const LESSON_PLAN_CONFIG = {
  maxDays: 5,
  gradeRanges: ['K-2', '3-5', '6-8', '9-12'],
  instructionalFrameworks: ['GRR', 'PBL', 'STEAM', 'MTSS', 'CASEL']
};

// Incoming payload (may be partial/optional)
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

// Fully normalized, non-optional version (safe to use everywhere)
type NormalizedInput = {
  gradeLevel: string;
  subject: string;
  durationMinutes: number;
  topic: string;
  standards: string[];
  days: number;

  brandName: string;
  includeAppendix: boolean;
  includeRubrics: boolean;
  includeAssetsDirectory: boolean;

  userPrompt: string;
};

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
    mtss: {
      tier1: string[];
      tier2: string[];
      tier3: string[];
    };
    selCompetencies: string[];
    regulationRituals: string[];
    assessment: {
      formative: string[];
      summative?: string[];
    };
    resources: string[];
  }>;
  appendixA?: {
    assets: Array<{
      fileName: string;
      type: 'image' | 'pdf' | 'docx' | 'sheet' | 'link';
      description: string;
      altText?: string;
      howToGenerate?: string;
      linkPlaceholder?: string;
      figure?: string;
    }>;
    namingConvention: string;
  };
  markdown?: string;
};

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function safeParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function normalizeInput(body: GeneratePlanInput | null): NormalizedInput {
  const days = Math.min(Math.max(body?.days ?? 3, 1), LESSON_PLAN_CONFIG.maxDays);
  
  // Ensure standards is always a valid array
  const standards = body?.standards && Array.isArray(body.standards) && body.standards.length > 0
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

// Guaranteed non-empty plan if model fails
function fallbackPlan(input: NormalizedInput): LessonPlanJSON {
  const mkStep = (label: string) => ({
    minutes: Math.round(input.durationMinutes / 6),
    activity: `${label}: See teacher script and student-facing directions.`,
    teacherNote:
      '[Teacher Note: Keep directions brief; offer options; monitor regulation; normalize help-seeking.]',
    studentNote:
      '[Student Note: You have got this. Ask for clarity, choose a strategy, and pace yourself.]',
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
    regulationRituals: ['Breathing box; brief outdoor reset (if available).'],
    assessment: { formative: ['Exit ticket: One claim + one cited evidence + why it fits.'] },
    resources: ['Projector', 'Timer', 'Student handout'],
  });

  const plan: LessonPlanJSON = {
    meta: {
      title: `${input.subject} — ${input.topic}`,
      subtitle: 'S.T.E.A.M. Powered, Trauma Informed, Project-Based',
      gradeLevel: input.gradeLevel,
      subject: input.subject,
      days: input.days,
      durationMinutes: input.durationMinutes,
      essentialQuestion: 'How can we design learning that heals, includes, and empowers?',
      standards: input.standards,
    },
    days: Array.from({ length: input.days }, (_, i) => dayBlock(i + 1)),
    appendixA: {
      namingConvention:
        '{LessonCode}_{GradeLevel}{SubjectAbbreviation}_{DescriptiveTitle}.{filetype}',
      assets: [
        {
          fileName: 'RootedInMe_10ELA_RitualGuidebook.pdf',
          type: 'pdf',
          description: 'Regulation rituals quick reference used in Opening and Closing.',
          altText: 'Guidebook cover with leaf motif',
          linkPlaceholder: '[Insert link to RootedInMe_10ELA_RitualGuidebook.pdf]',
          figure: 'Figure 1',
        },
      ],
    },
    markdown:
      '# Ready-to-Teach Pack (Fallback)\n\nIf you see this, the generator timed out. The scaffolds above are safe defaults so you can still teach today.',
  };

  return plan;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, routeId: ROUTE_ID, error: 'Missing OPENAI_API_KEY' },
        { status: 500 },
      );
    }

    const body = (await req.json().catch(() => null)) as GeneratePlanInput | null;
    const input = normalizeInput(body);

    const system =
      'You are a curriculum designer. Return STRICT JSON with keys: meta, days[], appendixA, markdown. ' +
      'Include [Teacher Note:] and [Student Note:] in activities. No markdown fences in JSON.';

    // Safely join standards with proper null checking
    const standardsString = Array.isArray(input.standards) && input.standards.length > 0
      ? input.standards.join(', ')
      : 'No standards specified';

    const user = `
Build ${input.days}-day lesson plan:
- Grade: ${input.gradeLevel}, Subject: ${input.subject}, Topic: ${input.topic}
- Standards: ${standardsString}, Brand: ${input.brandName}
- Duration: ${input.durationMinutes} min blocks
- Include: STEAM, PBL, trauma-informed, MTSS, SEL
- Structure: Opening, I Do, We Do, You Do Together, You Do Alone, Closing

JSON format: {"meta": {...}, "days": [{...}], "appendixA": {...}, "markdown": "..."}
${input.userPrompt ? `\nNotes: ${input.userPrompt}` : ''}
`.trim();

    let plan: LessonPlanJSON | null = null;
    let raw = '';

    // Primary call with timeout handling
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
      
      const r = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.35,
        max_tokens: 3000, // Reduced for faster response
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }, {
        signal: controller.signal,
      } as any);
      
      clearTimeout(timeoutId);
      raw = r.choices[0]?.message?.content?.trim() || '';
      plan = safeParse<LessonPlanJSON>(raw);
    } catch (error) {
      // OpenAI API call failed or timed out, handled by fallback below
    }

    // One repair attempt if model wrapped JSON in prose
    if (!plan && raw) {
      const s = raw.indexOf('{');
      const e = raw.lastIndexOf('}');
      if (s !== -1 && e !== -1 && e > s) {
        plan = safeParse<LessonPlanJSON>(raw.slice(s, e + 1));
      }
    }

    // Last resort
    if (!plan) {
      plan = fallbackPlan(input);
      plan.markdown =
        (plan.markdown || '') +
        `\n\n---\n**Debug**: Generator returned empty/invalid JSON; provided fallback. Route: ${ROUTE_ID}`;
    }

    // Ensure minimal fields exist with proper null checking
    if (!plan.meta?.title) {
      plan.meta = plan.meta || ({} as any);
      plan.meta.title = `${input.subject} — ${input.topic}`;
    }
    if (!plan.markdown) {
      plan.markdown = `# ${plan.meta.title}\n\n${plan.meta.subtitle || ''}\n\n**Grade:** ${
        plan.meta.gradeLevel
      } • **Subject:** ${plan.meta.subject} • **Block:** ${
        plan.meta.durationMinutes
      } min • **Days:** ${plan.meta.days}\n\n---\n\n${
        plan.days?.[0]?.flow?.opening?.activity || 'See daily flow in JSON.'
      }\n`;
    }

    return NextResponse.json({ ok: true, routeId: ROUTE_ID, plan });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const safe = fallbackPlan(
      normalizeInput({
        subject: 'ELA',
        topic: 'Citing Textual Evidence',
        gradeLevel: '10',
        days: 3,
      }),
    );
    return NextResponse.json(
      { ok: true, routeId: ROUTE_ID, plan: safe, warning: `Generator error: ${msg}` },
      { status: 200 },
    );
  }
}
