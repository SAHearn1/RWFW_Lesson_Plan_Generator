// src/app/api/generatePlan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = ['iad1']; // same region you’ve been using
export const maxDuration = 60;

// Unique ID to make Vercel function bundling happy
const ROUTE_ID = 'generatePlan-v10-anthropic-2025-08-12';

// --------- Types (kept minimal and permissive to avoid runtime issues) ---------
type GeneratePlanInput = {
  gradeLevel?: string;
  subject?: string;
  durationMinutes?: number | string;
  topic?: string;
  standards?: string[] | string;  // accept string or array
  days?: number | string;

  brandName?: string;
  includeAppendix?: boolean;
  includeRubrics?: boolean;
  includeAssetsDirectory?: boolean;

  userPrompt?: string;
};

type FlowStep = {
  minutes: number;
  activity: string;
  teacherNote?: string;
  studentNote?: string;
};

type DayBlock = {
  day: number;
  title: string;
  learningTarget: string;
  essentialQuestion: string;
  standards: string[];
  flow: {
    opening: FlowStep;
    iDo: FlowStep;
    weDo: FlowStep;
    youDoTogether: FlowStep;
    youDoAlone: FlowStep;
    closing: FlowStep;
  };
  mtss?: { tier1?: string[]; tier2?: string[]; tier3?: string[] };
  selCompetencies?: string[];
  regulationRituals?: string[];
  assessment?: { formative?: string[]; summative?: string[] };
  resources?: string[];
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
  days: DayBlock[];
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

// --------- Utilities ---------
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

function toNumber(val: unknown, fallback: number): number {
  const n =
    typeof val === 'number'
      ? val
      : typeof val === 'string'
      ? parseInt(val, 10)
      : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function toArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function renderMarkdownFromPlan(plan: LessonPlanJSON): string {
  const m = plan.meta;
  const header = `# ${m.title}
**Grade:** ${m.gradeLevel} • **Subject:** ${m.subject} • **Block:** ${m.durationMinutes} min • **Days:** ${m.days}

**Standards:** ${m.standards.join(', ')}

`;
  const body = plan.days
    .map((d) => {
      const f = d.flow;
      const sec = (label: string, s: FlowStep) =>
        `**${label} (${s.minutes}m):** ${s.activity}
${s.teacherNote ? `[Teacher Note: ${s.teacherNote}]` : ''}${
          s.studentNote ? ` [Student Note: ${s.studentNote}]` : ''
        }`;
      return `## Day ${d.day}: ${d.title}
**Learning Target:** ${d.learningTarget}
**EQ:** ${d.essentialQuestion}

${sec('Opening', f.opening)}
${sec('I Do', f.iDo)}
${sec('We Do', f.weDo)}
${sec('You Do Together', f.youDoTogether)}
${sec('You Do Alone', f.youDoAlone)}
${sec('Closing', f.closing)}
`;
    })
    .join('\n');

  const appendix = plan.appendixA
    ? `\n---\n## Appendix A – Assets & Naming\n- **Convention:** ${plan.appendixA.namingConvention}\n${plan.appendixA.assets
        .map(
          (a) =>
            `- **${a.fileName}** (${a.type}): ${a.description}${
              a.linkPlaceholder ? `\n  - ${a.linkPlaceholder}` : ''
            }`,
        )
        .join('\n')}\n`
    : '';

  return header + body + appendix;
}

function safeJSONParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function mkStep(minutes: number, label: string): FlowStep {
  return {
    minutes,
    activity: `${label}: See teacher script and student-facing directions.`,
    teacherNote:
      'Keep directions brief; offer options; monitor regulation; normalize help-seeking.',
    studentNote:
      'You’ve got this. Ask for clarity, choose a strategy, and pace yourself.',
  };
}

function fallbackPlan(input: {
  gradeLevel: string;
  subject: string;
  durationMinutes: number;
  topic: string;
  standards: string[];
  days: number;
}): LessonPlanJSON {
  const per = Math.max(5, Math.round(input.durationMinutes / 6));
  const day = (i: number): DayBlock => ({
    day: i,
    title: `${input.topic} — Day ${i}`,
    learningTarget: 'I can cite and explain textual evidence that supports a claim.',
    essentialQuestion: 'How do we choose evidence that truly supports our claim?',
    standards: input.standards,
    flow: {
      opening: mkStep(per, 'Opening'),
      iDo: mkStep(per, 'I Do'),
      weDo: mkStep(per, 'We Do'),
      youDoTogether: mkStep(per, 'You Do Together'),
      youDoAlone: mkStep(per, 'You Do Alone'),
      closing: mkStep(per, 'Closing'),
    },
    mtss: {
      tier1: ['Clear agenda; sentence starters; timers.'],
      tier2: ['Small-group check-ins; guided frames; extended time.'],
      tier3: ['1:1 conferencing; alternate modality; reduced load.'],
    },
    selCompetencies: ['Self-Management', 'Relationship Skills'],
    regulationRituals: ['Breathing box; brief reset.'],
    assessment: { formative: ['Exit ticket: claim + cited evidence + why it fits.'] },
    resources: ['Projector', 'Timer', 'Student handout'],
  });

  const plan: LessonPlanJSON = {
    meta: {
      title: `${input.subject} — ${input.topic}`,
      subtitle: '',
      gradeLevel: input.gradeLevel,
      subject: input.subject,
      days: input.days,
      durationMinutes: input.durationMinutes,
      essentialQuestion:
        'How can we design learning that heals, includes, and empowers?',
      standards: input.standards,
    },
    days: Array.from({ length: input.days }, (_, i) => day(i + 1)),
    appendixA: {
      namingConvention: 'LessonCode_GradeSubject_ShortTitle.extension',
      assets: [
        {
          fileName: 'Rituals_Quick_Guide.pdf',
          type: 'pdf',
          description: 'Regulation rituals quick reference for Opening/Closing.',
          altText: 'Guidebook cover',
          linkPlaceholder: '[Insert link to PDF]',
          figure: 'Figure 1',
        },
      ],
    },
  };

  plan.markdown = renderMarkdownFromPlan(plan);
  return plan;
}

function ensureNonEmptyOutputs(plan: LessonPlanJSON) {
  // Always ensure markdown exists
  if (!plan.markdown || !plan.markdown.trim()) {
    plan.markdown = renderMarkdownFromPlan(plan);
  }
  const teacherView = plan.markdown;
  const studentView =
    '## Student Overview\nUse this plan with your class. Follow your teacher’s directions for each step.';
  const printView = plan.markdown;

  // Provide multiple mirrors for maximum front-end compatibility (no UI changes needed)
  return {
    plan,
    teacherView,
    studentView,
    printView,
    markdown: plan.markdown,
    html: plan.markdown, // some UIs look for "html" even though it’s markdown text
  };
}

export async function POST(req: NextRequest) {
  // Read + normalize inputs
  const body = (await req.json().catch(() => ({}))) as GeneratePlanInput;

  const gradeLevel = (body.gradeLevel || '10').toString();
  const subject = (body.subject || 'ELA').toString();
  const durationMinutes = toNumber(body.durationMinutes, 90);
  const topic =
    (body.topic || 'Citing Textual Evidence to Support a Claim').toString();
  const standards = toArray(body.standards);
  const days = Math.min(Math.max(toNumber(body.days, 3), 1), 5);

  const userPrompt = (body.userPrompt || '').toString();

  // Build prompt for Anthropic
  const standardsString = standards.length > 0 ? standards.join(', ') : 'N/A';
  const prompt = `Create a ${days}-day lesson plan as a pure JSON object matching this schema:

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
      "mtss": {"tier1": ["string"], "tier2": ["string"], "tier3": ["string"]},
      "selCompetencies": ["string"],
      "regulationRituals": ["string"],
      "assessment": {"formative": ["string"], "summative": ["string"]},
      "resources": ["string"]
    }
  ],
  "appendixA": {
    "namingConvention": "string",
    "assets": [{"fileName":"string","type":"image|pdf|docx|sheet|link","description":"string","altText":"string","howToGenerate":"string","linkPlaceholder":"string","figure":"string"}]
  }
}

Context:
- Grade: ${gradeLevel}
- Subject: ${subject}
- Topic: ${topic}
- Block Minutes: ${durationMinutes}
- Standards: ${standardsString}

Rules:
- Return ONLY valid JSON (no prose).
- Balance time across Opening / I Do / We Do / You Do Together / You Do Alone / Closing to fit ${durationMinutes} minutes.
- Include brief [Teacher Note:] and [Student Note:] in each step.
${userPrompt ? `- Extra: ${userPrompt}` : ''}`;

  // Try Anthropic; if missing/invalid key, skip to fallback.
  let plan: LessonPlanJSON | null = null;
  let raw = '';

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const resp = await client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      });

      raw =
        resp.content[0]?.type === 'text' ? (resp.content[0] as any).text?.trim?.() || '' : '';

      // First, direct parse
      plan = safeJSONParse<LessonPlanJSON>(raw);

      // If the model wrapped JSON with prose, slice out the first/last braces
      if (!plan && raw) {
        const s = raw.indexOf('{');
        const e = raw.lastIndexOf('}');
        if (s !== -1 && e !== -1 && e > s) {
          plan = safeJSONParse<LessonPlanJSON>(raw.slice(s, e + 1));
        }
      }
    } catch {
      // swallow and use fallback below
    }
  }

  // Fallback if model failed or returned unusable JSON
  if (!plan || !plan.meta?.title || !Array.isArray(plan.days) || plan.days.length === 0) {
    plan = fallbackPlan({
      gradeLevel,
      subject,
      durationMinutes,
      topic,
      standards: standards.length ? standards : ['CCSS.ELA-LITERACY.RI.9-10.1'],
      days,
    });
  } else {
    // Make sure minimal fields exist and markdown is present
    if (!plan.meta.gradeLevel) plan.meta.gradeLevel = gradeLevel;
    if (!plan.meta.subject) plan.meta.subject = subject;
    if (!plan.meta.durationMinutes) plan.meta.durationMinutes = durationMinutes;
    if (!plan.meta.days) plan.meta.days = days;
    if (!plan.meta.title) plan.meta.title = `${subject} — ${topic}`;
    if (!plan.meta.standards || plan.meta.standards.length === 0) {
      plan.meta.standards = standards.length ? standards : ['CCSS.ELA-LITERACY.RI.9-10.1'];
    }
    if (!plan.markdown || !plan.markdown.trim()) {
      plan.markdown = renderMarkdownFromPlan(plan);
    }
  }

  // Always mirror outputs for maximum compatibility with existing UI
  const out = ensureNonEmptyOutputs(plan);

  return NextResponse.json({
    ok: true,
    routeId: ROUTE_ID,
    generator: 'lesson-plan-generator-v10',
    plan: out.plan,
    teacherView: out.teacherView,
    studentView: out.studentView,
    printView: out.printView,
    markdown: out.markdown,
    html: out.html,
  });
}
