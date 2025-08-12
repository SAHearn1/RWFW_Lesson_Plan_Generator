// src/app/api/generatePlan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = ['iad1'];

const ROUTE_ID = 'generatePlan-v6-2025-08-12';

type GeneratePlanInput = {
  // minimal fields the UI might send
  gradeLevel?: string;
  subject?: string;
  durationMinutes?: number; // default 90
  topic?: string;
  standards?: string[];
  days?: number; // 3-5
  // optional: branding and switches
  brandName?: string; // e.g., Root Work Framework
  includeAppendix?: boolean;
  includeRubrics?: boolean;
  includeAssetsDirectory?: boolean;
  // raw freeform prompt from user, optional
  userPrompt?: string;
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
  // branded, teacher-facing HTML/MD we can show/print
  markdown?: string;
};

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Small safety net JSON parser
function safeParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// Minimal, “can’t fail” fallback so UI never shows empty
function fallbackPlan(input: GeneratePlanInput): LessonPlanJSON {
  const grade = input.gradeLevel || '10';
  const subject = input.subject || 'ELA';
  const days = Math.min(Math.max(input.days ?? 3, 1), 5);
  const duration = input.durationMinutes ?? 90;
  const topic = input.topic || 'Citing Textual Evidence';
  const standards = input.standards?.length ? input.standards : ['CCSS.ELA-LITERACY.RI.9-10.1'];

  const mkStep = (label: string) => ({
    minutes: 15,
    activity: `${label}: See teacher script and student-facing directions.`,
    teacherNote:
      '[Teacher Note: Keep directions brief; offer options; monitor regulation; normalize help-seeking.]',
    studentNote:
      '[Student Note: You’ve got this. Ask for clarity, choose a strategy, and pace yourself.]',
  });

  const dayBlock = (day: number) => ({
    day,
    title: `${topic} — Day ${day}`,
    learningTarget: 'I can cite and explain textual evidence that supports a claim.',
    essentialQuestion: 'How do we choose evidence that truly supports our claim?',
    standards,
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
      title: `${subject} — ${topic}`,
      subtitle: 'S.T.E.A.M. Powered, Trauma Informed, Project-Based',
      gradeLevel: grade,
      subject,
      days,
      durationMinutes: duration,
      essentialQuestion: 'How can we design learning that heals, includes, and empowers?',
      standards,
    },
    days: Array.from({ length: days }, (_, i) => dayBlock(i + 1)),
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

    const body = (await req.json()) as GeneratePlanInput | null;

    const input: GeneratePlanInput = {
      gradeLevel: body?.gradeLevel ?? '10',
      subject: body?.subject ?? 'ELA',
      durationMinutes: body?.durationMinutes ?? 90,
      topic: body?.topic ?? 'Citing Textual Evidence to Support a Claim',
      standards:
        body?.standards && body.standards.length
          ? body.standards
          : ['CCSS.ELA-LITERACY.RI.9-10.1'],
      days: Math.min(Math.max(body?.days ?? 3, 1), 5),
      brandName: body?.brandName ?? 'Root Work Framework',
      includeAppendix: body?.includeAppendix ?? true,
      includeRubrics: body?.includeRubrics ?? true,
      includeAssetsDirectory: body?.includeAssetsDirectory ?? true,
      userPrompt: body?.userPrompt ?? '',
    };

    // Concise master prompt tuned for JSON_OBJECT return
    const system =
      'You are a senior curriculum designer (PBL, STEAM, Trauma-Informed, GRR, MTSS, CASEL). ' +
      'Return STRICT JSON with keys: meta, days[], appendixA, markdown. ' +
      'Every major component MUST include [Teacher Note:] and [Student Note:] exactly as brackets. ' +
      'Do not include markdown fences in JSON.';

    const user = `
Build a ${input.days}-day lesson integrating:
- Trauma-informed care (SAMHSA principles)
- STEAM & PBL
- Living Learning Lab (garden/nature metaphors)
- CASEL SEL
- MTSS (Tier 1–3)
- GRR (Opening, I Do, We Do, You Do Together, You Do Alone, Closing)
- Student agency and choice
- ${input.durationMinutes} minute block schedule

Context:
- Grade Level: ${input.gradeLevel}
- Subject: ${input.subject}
- Topic: ${input.topic}
- Standards: ${input.standards.join(', ')}
- Branding: ${input.brandName}

OUTPUT SHAPE (JSON OBJECT):
{
  "meta": { "title": string, "subtitle": string, "gradeLevel": string, "subject": string, "days": number, "durationMinutes": number, "essentialQuestion": string, "standards": string[] },
  "days": [
    {
      "day": number,
      "title": string,
      "learningTarget": string,
      "essentialQuestion": string,
      "standards": string[],
      "flow": {
        "opening": { "minutes": number, "activity": string, "teacherNote": string, "studentNote": string },
        "iDo": { "minutes": number, "activity": string, "teacherNote": string, "studentNote": string },
        "weDo": { "minutes": number, "activity": string, "teacherNote": string, "studentNote": string },
        "youDoTogether": { "minutes": number, "activity": string, "teacherNote": string, "studentNote": string },
        "youDoAlone": { "minutes": number, "activity": string, "teacherNote": string, "studentNote": string },
        "closing": { "minutes": number, "activity": string, "teacherNote": string, "studentNote": string }
      },
      "mtss": { "tier1": string[], "tier2": string[], "tier3": string[] },
      "selCompetencies": string[],
      "regulationRituals": string[],
      "assessment": { "formative": string[], "summative": string[] },
      "resources": string[]
    }
  ],
  "appendixA": {
    "namingConvention": string,
    "assets": [{ "fileName": string, "type": "image"|"pdf"|"docx"|"sheet"|"link", "description": string, "altText": string, "howToGenerate": string, "linkPlaceholder": string, "figure": string }]
  },
  "markdown": string  // branded teacher-facing printable markdown
}

Constraints:
- Place [Teacher Note:] and [Student Note:] immediately after each activity text in flow.
- Use warm, empowering tone for student notes.
- Keep times roughly balanced to fit ${input.durationMinutes} minutes per day.
- Include a concise but complete Appendix A asset list using the naming convention: {LessonCode}_{GradeLevel}{SubjectAbbreviation}_{DescriptiveTitle}.{filetype}
${input.userPrompt ? `\nAdditional teacher notes: ${input.userPrompt}\n` : ''}
`.trim();

    // Ask model to return strict JSON
    let plan: LessonPlanJSON | null = null;
    let modelContent = '';

    try {
      const r = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.35,
        max_tokens: 4500,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      });

      modelContent = r.choices[0]?.message?.content?.trim() || '';
      plan = safeParse<LessonPlanJSON>(modelContent);
    } catch (_) {
      // swallow; will try fallback path below
    }

    // If empty or invalid, try a tiny repair pass once
    if (!plan) {
      if (modelContent) {
        // try to extract JSON substring if model added prose
        const start = modelContent.indexOf('{');
        const end = modelContent.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
          plan = safeParse<LessonPlanJSON>(modelContent.slice(start, end + 1));
        }
      }
    }

    // Final fallback (guaranteed non-empty)
    if (!plan) {
      plan = fallbackPlan(input);
      // attach small debug so UI can show a banner if desired
      plan.markdown =
        (plan.markdown || '') +
        `\n\n---\n**Debug**: Generator returned empty/invalid JSON; provided fallback. Route: ${ROUTE_ID}`;
    }

    // Ensure minimal required fields present
    if (!plan.meta?.title) {
      plan.meta = plan.meta || ({} as any);
      plan.meta.title = `${input.subject} — ${input.topic}`;
    }
    if (!plan.markdown) {
      // quick branded markdown for print/preview
      plan.markdown = `# ${plan.meta.title}\n\n${plan.meta.subtitle || ''}\n\n**Grade:** ${
        plan.meta.gradeLevel
      } • **Subject:** ${plan.meta.subject} • **Block:** ${
        plan.meta.durationMinutes
      } min • **Days:** ${plan.meta.days}\n\n---\n\n${
        plan.days?.[0]?.flow?.opening?.activity || 'See daily flow in JSON.'
      }\n`;
    }

    // Return both machine JSON and printable markdown in one payload
    return NextResponse.json({
      ok: true,
      routeId: ROUTE_ID,
      plan,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    // Still return a fallback so UI can proceed
    const safe = fallbackPlan({
      subject: 'ELA',
      topic: 'Citing Textual Evidence',
      gradeLevel: '10',
      days: 3,
    });
    return NextResponse.json(
      { ok: true, routeId: ROUTE_ID, plan: safe, warning: `Generator error: ${msg}` },
      { status: 200 },
    );
  }
}
