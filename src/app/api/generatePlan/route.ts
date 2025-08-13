// src/app/api/generatePlan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = ['iad1'];
export const maxDuration = 60;

// ----- DO NOT REMOVE -----
// Unique fingerprint so Vercel won't dedupe this function with other routes
(globalThis as any).__RWFW_FUNC_FINGERPRINT__ = 'api/generatePlan@2025-08-12-v9';

const ROUTE_ID = 'generatePlan-v9-anthropic-2025-08-12';
const GENERATOR_ID = 'lesson-plan-generator-v9';

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
    mtss: { tier1: string[]; tier2: string[]; tier3: string[] };
    selCompetencies: string[];
    regulationRituals: string[];
    assessment: { formative: string[]; summative?: string[] };
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

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

function normalizeInput(body: GeneratePlanInput | null): NormalizedInput {
  const daysRaw = typeof body?.days === 'number' ? body!.days : 3;
  const days = Math.min(Math.max(daysRaw, 1), 5);
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

function validateLessonPlanStructure(plan: any): boolean {
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
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { ok: false, routeId: ROUTE_ID, error: 'Missing ANTHROPIC_API_KEY' },
        { status: 500 },
      );
    }

    const body = (await req.json().catch(() => null)) as GeneratePlanInput | null;
    const input = normalizeInput(body);

    const standardsString =
      Array.isArray(input.standards) && input.standards.length > 0
        ? input.standards.join(', ')
        : 'No standards specified';

    const prompt = `Create a ${input.days}-day lesson plan with the following requirements:

**Context:**
- Grade Level: ${input.gradeLevel}
- Subject: ${input.subject}
- Topic: ${input.topic}
- Standards: ${standardsString}
- Brand: ${input.brandName}
- Block Duration: ${input.durationMinutes} minutes per day

**Framework Requirements:**
- STEAM integration and Project-Based Learning
- Trauma-informed care principles
- MTSS (Multi-Tiered System of Supports) with Tier 1-3 strategies
- SEL (Social-Emotional Learning) competencies
- Gradual Release of Responsibility: Opening, I Do, We Do, You Do Together, You Do Alone, Closing

**Output Requirements:**
Return ONLY a valid JSON object with this exact structure (no markdown, no backticks):

{
  "meta": {
    "title": "string",
    "subtitle": "string",
    "gradeLevel": "string",
    "subject": "string",
    "days": number,
    "durationMinutes": number,
    "essentialQuestion": "string",
    "standards": ["string"]
  },
  "days": [
    {
      "day": number,
      "title": "string",
      "learningTarget": "string",
      "essentialQuestion": "string",
      "standards": ["string"],
      "flow": {
        "opening": {"minutes": number, "activity": "string", "teacherNote": "string", "studentNote": "string"},
        "iDo": {"minutes": number, "activity": "string", "teacherNote": "string", "studentNote": "string"},
        "weDo": {"minutes": number, "activity": "string", "teacherNote": "string", "studentNote": "string"},
        "youDoTogether": {"minutes": number, "activity": "string", "teacherNote": "string", "studentNote": "string"},
        "youDoAlone": {"minutes": number, "activity": "string", "teacherNote": "string", "studentNote": "string"},
        "closing": {"minutes": number, "activity": "string", "teacherNote": "string", "studentNote": "string"}
      },
      "mtss": { "tier1": ["string"], "tier2": ["string"], "tier3": ["string"] },
      "selCompetencies": ["string"],
      "regulationRituals": ["string"],
      "assessment": { "formative": ["string"], "summative": ["string"] },
      "resources": ["string"]
    }
  ],
  "appendixA": {
    "namingConvention": "string",
    "assets": [
      {
        "fileName": "string",
        "type": "image|pdf|docx|sheet|link",
        "description": "string",
        "altText": "string",
        "howToGenerate": "string",
        "linkPlaceholder": "string",
        "figure": "string"
      }
    ]
  },
  "markdown": "string"
}

**Important Notes:**
- Each activity includes [Teacher Note:] and [Student Note:].
- Balance minutes to total ~${input.durationMinutes} per day.
- Use inclusive, empowering language.
${input.userPrompt ? `- Additional Requirements: ${input.userPrompt}` : ''}

Return only JSON (no prose).`;

    let raw = '';
    let plan: LessonPlanJSON | null = null;

    // Primary call to Claude Haiku (fast/economical)
    try {
      const response = await client.messages.create({
        model: 'claude-3-haiku-20240307',
        temperature: 0.3,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      });

      raw = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '';
      plan = safeParse<LessonPlanJSON>(raw);
    } catch {
      // fall through to fallback
    }

    // Try to extract JSON if model wrapped it
    if (!plan && raw) {
      const s = raw.indexOf('{');
      const e = raw.lastIndexOf('}');
      if (s !== -1 && e > s) plan = safeParse<LessonPlanJSON>(raw.slice(s, e + 1));
    }

    if (!plan) {
      plan = fallbackPlan(input);
      plan.markdown =
        (plan.markdown || '') +
        `\n\n---\n**Debug**: Empty or invalid model response; served fallback. Route: ${ROUTE_ID}`;
    }

    if (!validateLessonPlanStructure(plan)) {
      plan = fallbackPlan(input);
    }

    // Ensure minimum meta + markdown exist
    plan.meta = plan.meta || ({} as any);
    if (!plan.meta.title) plan.meta.title = `${input.subject} — ${input.topic}`;
    if (!plan.markdown) {
      plan.markdown = `# ${plan.meta.title}
**Grade:** ${plan.meta.gradeLevel} • **Subject:** ${plan.meta.subject} • **Block:** ${plan.meta.durationMinutes} min • **Days:** ${plan.meta.days}

See JSON for full daily flow.`;
    }

    // Mirror views so existing UIs keep working without changes
    const teacherView = plan.markdown;
    const studentView = plan.markdown;
    const printView = plan.markdown;

    return NextResponse.json({
      ok: true,
      routeId: ROUTE_ID,
      generator: GENERATOR_ID,
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
      routeId: ROUTE_ID,
      generator: GENERATOR_ID,
      plan: safe,
      markdown: safe.markdown,
      teacherView: safe.markdown,
      studentView: safe.markdown,
      printView: safe.markdown,
      warning: 'Generator error handled with fallback.',
    });
  }
}
