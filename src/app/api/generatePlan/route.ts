// src/app/api/generatePlan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = ['iad1'];
export const maxDuration = 60;

// Unique ID so Vercel doesn't dedupe this with other routes
const ROUTE_ID = 'generatePlan-v9-anthropic-2025-08-12';

// ---------- Types ----------
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

type StepBlock = {
  minutes: number;
  activity: string;
  teacherNote: string;
  studentNote: string;
};

type LessonDay = {
  day: number;
  title: string;
  learningTarget: string;
  essentialQuestion: string;
  standards: string[];
  flow: {
    opening: StepBlock;
    iDo: StepBlock;
    weDo: StepBlock;
    youDoTogether: StepBlock;
    youDoAlone: StepBlock;
    closing: StepBlock;
  };
  mtss: { tier1: string[]; tier2: string[]; tier3: string[] };
  selCompetencies: string[];
  regulationRituals: string[];
  assessment: { formative: string[]; summative?: string[] };
  resources: string[];
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
  days: LessonDay[];
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

// ---------- SDK ----------
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ---------- Helpers ----------
function normalizeInput(body: GeneratePlanInput | null): NormalizedInput {
  const days = Math.max(1, Math.min(5, Number(body?.days ?? 3)));
  const standards =
    body?.standards && Array.isArray(body.standards) && body.standards.length > 0
      ? body.standards
      : ['CCSS.ELA-LITERACY.RI.9-10.1'];

  return {
    gradeLevel: body?.gradeLevel?.trim() || '10',
    subject: body?.subject?.trim() || 'ELA',
    durationMinutes: Number(body?.durationMinutes ?? 90),
    topic: body?.topic?.trim() || 'Citing Textual Evidence to Support a Claim',
    standards,
    days,
    brandName: body?.brandName?.trim() || 'Root Work Framework',
    includeAppendix: body?.includeAppendix ?? true,
    includeRubrics: body?.includeRubrics ?? true,
    includeAssetsDirectory: body?.includeAssetsDirectory ?? true,
    userPrompt: body?.userPrompt?.trim() || '',
  };
}

function validateLessonPlan(plan: any): plan is LessonPlanJSON {
  return Boolean(
    plan &&
      plan.meta &&
      typeof plan.meta.title === 'string' &&
      Array.isArray(plan.days) &&
      plan.days.length > 0 &&
      plan.days[0]?.flow?.opening
  );
}

function safeJSON<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    const i = s.indexOf('{');
    const j = s.lastIndexOf('}');
    if (i !== -1 && j !== -1 && j > i) {
      try {
        return JSON.parse(s.slice(i, j + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function textFromAnthropic(content: Anthropic.Messages.ContentBlock[]): string {
  // Concatenate all text blocks (Claude can return multiple)
  return content
    .map((b) => (b.type === 'text' ? b.text : ''))
    .join('\n')
    .trim();
}

function minutesPerStep(total: number): number {
  // 6 blocks per day (Opening, I Do, We Do, You Do Together, You Do Alone, Closing)
  return Math.max(5, Math.round(total / 6));
}

function fallbackPlan(input: NormalizedInput): LessonPlanJSON {
  const mk = (label: string): StepBlock => ({
    minutes: minutesPerStep(input.durationMinutes),
    activity: `${label}: See teacher script and student-facing directions.`,
    teacherNote:
      '[Teacher Note: Keep directions brief; offer choices; monitor regulation; normalize help-seeking.]',
    studentNote:
      '[Student Note: You’ve got this. Ask for clarity, choose a strategy, and pace yourself.]',
  });

  const makeDay = (n: number): LessonDay => ({
    day: n,
    title: `${input.topic} — Day ${n}`,
    learningTarget: 'I can cite and explain textual evidence that supports a claim.',
    essentialQuestion: 'How do we choose evidence that truly supports our claim?',
    standards: input.standards,
    flow: {
      opening: mk('Opening'),
      iDo: mk('I Do'),
      weDo: mk('We Do'),
      youDoTogether: mk('You Do Together'),
      youDoAlone: mk('You Do Alone'),
      closing: mk('Closing'),
    },
    mtss: {
      tier1: ['Clear agenda; sentence starters; timers.'],
      tier2: ['Small-group check-ins; guided frames; extended time.'],
      tier3: ['1:1 conferencing; alternative modality; reduced load.'],
    },
    selCompetencies: ['Self-Management', 'Relationship Skills'],
    regulationRituals: ['Breathing box; quick reset walk (if available).'],
    assessment: { formative: ['Exit ticket: one claim, one cited evidence, and why it fits.'] },
    resources: ['Projector', 'Timer', 'Student handout'],
  });

  return {
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
    days: Array.from({ length: input.days }, (_, i) => makeDay(i + 1)),
    appendixA: {
      namingConvention: '{LessonCode}_{Grade}{SubjectAbbrev}_{DescriptiveTitle}.{ext}',
      assets: [
        {
          fileName: 'RootedInMe_10ELA_RitualGuidebook.pdf',
          type: 'pdf',
          description: 'Regulation rituals used during Opening and Closing.',
          altText: 'Guidebook cover with leaf motif',
          linkPlaceholder: '[Insert drive/link to PDF]',
          figure: 'Figure 1',
        },
      ],
    },
    markdown:
      '# Ready-to-Teach Pack (Fallback)\n\nIf you see this, the generator timed out. The plan above is a safe default so you can still teach today.',
  };
}

function makeTeacherView(plan: LessonPlanJSON): string {
  const header = `# ${plan.meta.title}\n_${plan.meta.subtitle || ''}_\n\n**Grade:** ${
    plan.meta.gradeLevel
  } • **Subject:** ${plan.meta.subject} • **Block:** ${plan.meta.durationMinutes} min • **Days:** ${
    plan.meta.days
  }\n\n**Standards:** ${plan.meta.standards?.join(', ') || '—'}\n`;
  const days = plan.days
    .map((d) => {
      const f = d.flow;
      return `\n## Day ${d.day}: ${d.title}\n**Learning Target:** ${d.learningTarget}\n**EQ:** ${
        d.essentialQuestion
      }\n\n### Flow (Teacher Notes)\n- **Opening (${f.opening.minutes}m):** ${f.opening.activity}\n  - ${f.opening.teacherNote}\n- **I Do (${f.iDo.minutes}m):** ${f.iDo.activity}\n  - ${f.iDo.teacherNote}\n- **We Do (${f.weDo.minutes}m):** ${f.weDo.activity}\n  - ${f.weDo.teacherNote}\n- **You Do Together (${f.youDoTogether.minutes}m):** ${f.youDoTogether.activity}\n  - ${f.youDoTogether.teacherNote}\n- **You Do Alone (${f.youDoAlone.minutes}m):** ${f.youDoAlone.activity}\n  - ${f.youDoAlone.teacherNote}\n- **Closing (${f.closing.minutes}m):** ${f.closing.activity}\n  - ${f.closing.teacherNote}\n\n**MTSS:** Tier1: ${d.mtss.tier1.join(
        '; '
      )} | Tier2: ${d.mtss.tier2.join('; ')} | Tier3: ${d.mtss.tier3.join('; ')}\n**Assessment:** Formative: ${d.assessment.formative.join(
        '; '
      )}${d.assessment.summative?.length ? ` | Summative: ${d.assessment.summative.join('; ')}` : ''}\n**Resources:** ${d.resources.join(
        ', '
      )}\n`;
    })
    .join('\n');
  return header + days;
}

function makeStudentView(plan: LessonPlanJSON): string {
  const intro = `# ${plan.meta.title}\nToday we explore **${plan.meta.essentialQuestion}**.\n\n**Success Criteria**\n- I can explain the big idea in my own words.\n- I can apply it in a short task.\n`;
  const days = plan.days
    .map((d) => {
      const f = d.flow;
      return `\n## Day ${d.day}\n- **Opening (${f.opening.minutes}m):** ${f.opening.studentNote}\n- **Learn with teacher (${f.iDo.minutes}m):** ${f.iDo.studentNote}\n- **Practice together (${f.weDo.minutes}m):** ${f.weDo.studentNote}\n- **Team task (${f.youDoTogether.minutes}m):** ${f.youDoTogether.studentNote}\n- **Try it yourself (${f.youDoAlone.minutes}m):** ${f.youDoAlone.studentNote}\n- **Wrap-up (${f.closing.minutes}m):** ${f.closing.studentNote}\n`;
    })
    .join('\n');
  return intro + days;
}

function makePrintView(plan: LessonPlanJSON): string {
  const head = `# ${plan.meta.title}\n**Grade:** ${plan.meta.gradeLevel} • **Subject:** ${plan.meta.subject} • **Block:** ${plan.meta.durationMinutes} min • **Days:** ${plan.meta.days}\n\n**Standards:** ${plan.meta.standards?.join(', ') || '—'}\n`;
  const days = plan.days
    .map((d) => {
      const f = d.flow;
      return `\n## Day ${d.day}: ${d.title}\n**Learning Target:** ${d.learningTarget}\n**EQ:** ${d.essentialQuestion}\n\n**Opening (${f.opening.minutes}m):** ${f.opening.activity}\n**I Do (${f.iDo.minutes}m):** ${f.iDo.activity}\n**We Do (${f.weDo.minutes}m):** ${f.weDo.activity}\n**You Do Together (${f.youDoTogether.minutes}m):** ${f.youDoTogether.activity}\n**You Do Alone (${f.youDoAlone.minutes}m):** ${f.youDoAlone.activity}\n**Closing (${f.closing.minutes}m):** ${f.closing.activity}\n`;
    })
    .join('\n');
  const appendix = plan.appendixA
    ? `\n---\n## Appendix A – Assets & Naming\n- **Convention:** ${plan.appendixA.namingConvention}\n${
        plan.appendixA.assets?.length
          ? plan.appendixA.assets.map((a) => `- **${a.fileName}** (${a.type}): ${a.description}`).join('\n')
          : '- (none)'
      }\n`
    : '';
  return head + days + appendix;
}

function makeBrandedMarkdown(plan: LessonPlanJSON, brandName: string): string {
  const banner =
    '> S.T.E.A.M. Powered, Trauma Informed, Project Base Lesson planning for real classrooms\n' +
    `> **${brandName}**`;
  return `# ${plan.meta.title}\n\n${banner}\n\n` + makePrintView(plan);
}

// ---------- Route ----------
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as GeneratePlanInput | null;
  const input = normalizeInput(body);

  // If no API key, still return a complete fallback (never error out to UI)
  if (!process.env.ANTHROPIC_API_KEY) {
    const plan = fallbackPlan(input);
    const teacherView = makeTeacherView(plan);
    const studentView = makeStudentView(plan);
    const printView = makePrintView(plan);
    const markdown = makeBrandedMarkdown(plan, input.brandName);
    const html = markdown; // keep same; UI should render markdown (not as <HTML/>)
    return NextResponse.json({
      ok: true,
      routeId: ROUTE_ID,
      plan,
      teacherView,
      studentView,
      printView,
      markdown,
      html,
      note: 'FALLBACK_NO_API_KEY',
    });
  }

  // Build prompt
  const standardsString =
    Array.isArray(input.standards) && input.standards.length ? input.standards.join(', ') : 'No standards specified';

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
Return ONLY a valid JSON object with this exact structure:

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
      "mtss": {
        "tier1": ["string"],
        "tier2": ["string"],
        "tier3": ["string"]
      },
      "selCompetencies": ["string"],
      "regulationRituals": ["string"],
      "assessment": {
        "formative": ["string"],
        "summative": ["string"]
      },
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
- Each activity must include [Teacher Note:] and [Student Note:]
- Balance timing to fit ${input.durationMinutes}-minute blocks
- Use empowering, trauma-informed language in student notes
- Include diverse, inclusive examples
${input.userPrompt ? `- Additional requirements: ${input.userPrompt}` : ''}

Respond with ONLY the JSON object, no additional text or formatting.`;

  let plan: LessonPlanJSON | null = null;
  let raw = '';

  try {
    const resp = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    raw = textFromAnthropic(resp.content);
    plan = safeJSON<LessonPlanJSON>(raw);
  } catch {
    // ignore; we'll fall back below
  }

  // One light repair attempt if wrapped in prose/fence
  if (!plan && raw) {
    plan = safeJSON<LessonPlanJSON>(raw);
  }

  // Final safety net
  if (!plan || !validateLessonPlan(plan)) {
    plan = fallbackPlan(input);
    plan.markdown =
      (plan.markdown || '') +
      `\n\n---\n**Debug:** Generator returned empty/invalid JSON; provided fallback. Route: ${ROUTE_ID}`;
  }

  // Minimal normalization
  plan.meta.standards = Array.isArray(plan.meta.standards) ? plan.meta.standards : [];
  plan.meta.subtitle =
    plan.meta.subtitle || 'S.T.E.A.M. Powered, Trauma Informed, Project-Based';

  // String views the UI can render immediately
  const teacherView = makeTeacherView(plan);
  const studentView = makeStudentView(plan);
  const printView = makePrintView(plan);
  const markdown = makeBrandedMarkdown(plan, input.brandName);
  const html = markdown; // keep equal; UI should treat this as plain string, not a <HTML> element

  return NextResponse.json({
    ok: true,
    routeId: ROUTE_ID,
    plan,
    teacherView,
    studentView,
    printView,
    markdown,
    html,
    generator: 'lesson-plan-generator-v9',
  });
}
