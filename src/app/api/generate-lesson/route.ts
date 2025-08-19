import { NextRequest, NextResponse } from 'next/server';
import type { LessonPlan, FiveRsBlock, LessonFlowStep } from '@/types/lesson';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type LessonRequest = {
  subject: string;
  gradeLevel: string;
  topic: string;
  duration: string; // e.g., "60 minutes"
  learningObjectives?: string;
  specialNeeds?: string;
  availableResources?: string;
};

// ---------- helpers ----------
function minutesFromDuration(d: string): number {
  const m = d.match(/\d+/);
  return m ? parseInt(m[0], 10) : 60;
}

function okJson(data: unknown, init: ResponseInit = {}) {
  return NextResponse.json(data, { ...init, headers: { 'Cache-Control': 'no-store' } });
}

function badRequest(msg: string) {
  return okJson({ error: msg }, { status: 400 });
}

function serverError(msg: string) {
  return okJson({ error: msg }, { status: 500 });
}

// ---------- prompt ----------
function buildPrompt(data: LessonRequest) {
  const mins = minutesFromDuration(data.duration);
  return `
You are an expert educator using the Root Work Framework (RWFW).
Return ONLY a valid JSON object matching the exact schema below. No markdown fences.

REQUIRED CONTEXT
- Subject: ${data.subject}
- Grade Level: ${data.gradeLevel}
- Topic: ${data.topic}
- Duration (minutes): ${mins}
${data.learningObjectives ? `- Teacher-provided objectives: ${data.learningObjectives}` : ''}
${data.specialNeeds ? `- Special considerations: ${data.specialNeeds}` : ''}
${data.availableResources ? `- Available resources: ${data.availableResources}` : ''}

SCHEMA (return exactly these keys at the top level):
{
  "title": string,
  "overview": string,
  "materials": string[],

  "iCanTargets": Array<{ "text": string, "dok": 1|2|3|4 }>,
  "fiveRsSchedule": Array<{ "label": "Relationships"|"Routines"|"Relevance"|"Rigor"|"Reflection", "minutes": number, "purpose": string }>,
  "literacySkillsAndResources": { "skills": string[], "resources": string[] },
  "bloomsAlignment": Array<{ "task": string, "bloom": "Remember"|"Understand"|"Apply"|"Analyze"|"Evaluate"|"Create", "rationale": string }>,

  "coTeachingIntegration": { "model": string, "roles": string[], "grouping": string },
  "reteachingAndSpiral": { "sameDayQuickPivot": string, "nextDayPlan": string, "spiralIdeas": string[] },

  "mtssSupports": {
    "tier1": string[],
    "tier2": string[],
    "tier3": string[],
    "progressMonitoring": string[]
  },

  "therapeuticRootworkContext": {
    "rationale": string,
    "regulationCue": string,
    "restorativePractice": string,
    "communityAssets": string[]
  },

  "lessonFlowGRR": Array<{
    "phase": "I Do"|"We Do"|"You Do",
    "step": string,
    "details": string,
    "teacherNote": string,     // include "[Teacher Note: ...]"
    "studentNote": string      // include "[Student Note: ...]"
  }>,

  "assessmentAndEvidence": {
    "formativeChecks": string[],
    "rubric": Array<{ "criterion": string, "developing": string, "proficient": string, "advanced": string }>,
    "exitTicket": string
  },

  // Legacy compatibility (optional)
  "objectives": string[],
  "timeline": Array<{ "time": string, "activity": string, "description": string }>,
  "assessment": string,
  "differentiation": string,
  "extensions": string
}

CONSTRAINTS
- Distribute ${mins} minutes across the 5 Rs in "fiveRsSchedule".
- Use healing-centered, culturally responsive, and biophilic language.
- Ensure "teacherNote" includes "[Teacher Note:" and "studentNote" includes "[Student Note:".
- Provide concrete, classroom-ready steps.
- If teacher provided objectives, incorporate them into I Can targets and Bloom's tasks.

OUTPUT
Return only the JSON object—no commentary, no code fences, no backticks.
`.trim();
}

// ---------- fallback ----------
function buildFallbackPlan(data: LessonRequest): LessonPlan {
  const mins = minutesFromDuration(data.duration);
  const blocks: FiveRsBlock[] = [
    { label: 'Relationships', minutes: Math.max(5, Math.round(mins * 0.15)), purpose: 'Community check-in, belonging signal, norms review.' },
    { label: 'Routines',     minutes: Math.max(5, Math.round(mins * 0.15)), purpose: 'Agenda, success criteria, materials, predictable flow.' },
    { label: 'Relevance',    minutes: Math.max(10, Math.round(mins * 0.20)), purpose: 'Connect content to lived experiences and community.' },
    { label: 'Rigor',        minutes: Math.max(15, Math.round(mins * 0.35)), purpose: 'High-level task with scaffolds; multiple access points.' },
    { label: 'Reflection',   minutes: Math.max(5, mins - (blocksMinutesSoFar(mins))), purpose: 'Metacognition, exit ticket, restorative close.' }
  ];

  function blocksMinutesSoFar(total: number) {
    // matches the same rounding above to avoid negative residue
    const a = Math.max(5, Math.round(total * 0.15));
    const b = Math.max(5, Math.round(total * 0.15));
    const c = Math.max(10, Math.round(total * 0.20));
    const d = Math.max(15, Math.round(total * 0.35));
    return a + b + c + d;
  }

  const grr: LessonFlowStep[] = [
    {
      phase: 'I Do',
      step: `Model key concept for ${data.topic}`,
      details: `Brief think-aloud connecting ${data.topic} to ${data.subject} standards for ${data.gradeLevel}.`,
      teacherNote: '[Teacher Note: Model strategy, name the steps, show success criteria.]',
      studentNote: '[Student Note: Watch, listen, and jot one question or connection.]'
    },
    {
      phase: 'We Do',
      step: 'Guided practice with scaffolded prompts',
      details: 'Work a similar example together; invite multiple solution paths and cultural assets.',
      teacherNote: '[Teacher Note: Prompt, pause, probe; check for understanding at each micro-step.]',
      studentNote: '[Student Note: Try the step with your partner; ask for a scaffold you need.]'
    },
    {
      phase: 'You Do',
      step: 'Choice-based task',
      details: 'Students demonstrate understanding via writing, diagram, mini-presentation, or creation.',
      teacherNote: '[Teacher Note: Circulate with targeted feedback aligned to rubric.]',
      studentNote: '[Student Note: Choose a format that shows your best thinking.]'
    }
  ];

  const plan: LessonPlan = {
    title: `RWFW: ${data.topic} - ${data.subject} (Grade ${data.gradeLevel})`,
    overview: `This ${data.duration} RWFW lesson integrates equity-first, trauma-informed practice to learn "${data.topic}". Students engage through the 5 Rs, reflect on growth, and apply learning in community-connected ways.`,
    materials: [
      'Board or projector',
      'Student journals',
      'Culturally relevant anchor texts or visuals',
      'Chart paper & markers',
      'Regulation tools (timer, calm corner items)'
    ],
    iCanTargets: [
      { text: `I can explain key ideas about ${data.topic} using academic and community language.`, dok: 2 },
      { text: `I can apply ${data.topic} to a real situation from my life or community.`, dok: 3 },
      { text: `I can reflect on how I learned and what helps me persist.`, dok: 2 }
    ],
    fiveRsSchedule: blocks,
    literacySkillsAndResources: {
      skills: ['Academic vocabulary in context', 'Claim-evidence-reasoning', 'Listening & speaking protocols'],
      resources: ['Local article or short text', 'Graphic organizer template', 'Sentence stems for discourse']
    },
    bloomsAlignment: [
      { task: `Define essential terms related to ${data.topic}`, bloom: 'Remember',  rationale: 'Activate prior knowledge to reduce cognitive load.' },
      { task: `Paraphrase the main idea of today’s mini-lesson`,     bloom: 'Understand', rationale: 'Ensure conceptual grasp before application.' },
      { task: `Apply ${data.topic} to a real-world scenario`,        bloom: 'Apply',     rationale: 'Make learning meaningful and transferable.' },
      { task: 'Compare two solution paths',                          bloom: 'Analyze',   rationale: 'Evaluate efficiency and assumptions.' },
      { task: 'Critique a peer product using rubric',                bloom: 'Evaluate',  rationale: 'Evidence-based reasoning and feedback.' },
      { task: 'Create a mini-product to teach others',               bloom: 'Create',    rationale: 'Synthesis and audience awareness.' }
    ],
    coTeachingIntegration: {
      model: 'Station Teaching',
      roles: ['Lead teacher: mini-lesson & checks', 'Co-teacher: small-group scaffolds & language supports'],
      grouping: 'Flexible, data-informed groups with multilingual and SPED supports'
    },
    reteachingAndSpiral: {
      sameDayQuickPivot: 'If CFUs show gaps, run a 5-minute micro-teach with a new example + guided prompt.',
      nextDayPlan: 'Start with 10-minute re-engagement task using errors as assets.',
      spiralIdeas: ['Weekly warm-ups revisiting the concept', 'Exit-ticket-driven small groups', 'Family prompt: teach a caregiver']
    },
    mtssSupports: {
      tier1: [
        'Clear success criteria & exemplars',
        'Choice in product & process',
        'Think-pair-share with sentence frames'
      ],
      tier2: [
        'Small-group guided practice',
        'Visuals & manipulatives',
        'Chunked tasks with checks'
      ],
      tier3: [
        'One-to-one scaffolded conferencing',
        'Alternative assessment formats',
        'Reduced cognitive load task version'
      ],
      progressMonitoring: [
        'Exit tickets with 2–3 indicators',
        'Checklist during conferences',
        'Quick rubric sampling mid-task'
      ]
    },
    therapeuticRootworkContext: {
      rationale: 'Learning is optimized when students feel seen, safe, and valued.',
      regulationCue: '2-minute breathing + stretch before Rigor block; timer visible.',
      restorativePractice: 'Closing circle: appreciations + one intention for next time.',
      communityAssets: ['Students’ lived experiences', 'Local history or environment', 'Family knowledge']
    },
    lessonFlowGRR: grr,
    assessmentAndEvidence: {
      formativeChecks: ['Fist-to-five after modeling', 'Circulating conferencing notes', 'Peer feedback with sentence frames'],
      rubric: [
        { criterion: 'Concept Accuracy',    developing: 'Partially correct',          proficient: 'Mostly correct',                      advanced: 'Consistently precise and nuanced' },
        { criterion: 'Evidence & Reasoning',developing: 'Limited evidence',           proficient: 'Clear evidence with reasoning',       advanced: 'Multiple pieces of evidence with strong reasoning' },
        { criterion: 'Communication',       developing: 'Basic clarity',               proficient: 'Clear and organized',                 advanced: 'Audience-aware and compelling' }
      ],
      exitTicket: `In 3–4 sentences, describe how ${data.topic} connects to something in your life, and one question you still have.`
    },
    // Legacy (optional for back-compat)
    objectives: [
      `Understand core ideas of ${data.topic}`,
      'Engage in collaborative discourse',
      'Demonstrate learning through a choice-based product'
    ],
    timeline: [
      { time: '0–10 min',  activity: 'Relationships', description: 'Welcome & belonging routine' },
      { time: '10–20 min', activity: 'Routines',      description: 'Agenda, criteria, materials' },
      { time: '20–35 min', activity: 'Relevance',     description: 'Hook & community connections' },
      { time: '35–50 min', activity: 'Rigor',         description: 'GRR: I Do → We Do → You Do' },
      { time: '50–60 min', activity: 'Reflection',    description: 'Exit ticket & circle close' }
    ],
    assessment: 'Growth-focused using rubric + self-reflection',
    differentiation: 'UDL, language supports, visual scaffolds, choice and pacing options',
    extensions: 'Community interview, mini-podcast, or place-based field note'
  };

  return plan;
}

// ---------- route ----------
export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    if (!raw) return badRequest('Invalid JSON body.');
    let data: Partial<LessonRequest> | null = null;
    try {
      data = JSON.parse(raw);
    } catch {
      return badRequest('Invalid JSON body.');
    }

    const missing: string[] = [];
    if (!data?.subject?.trim()) missing.push('subject');
    if (!data?.gradeLevel?.trim()) missing.push('gradeLevel');
    if (!data?.topic?.trim()) missing.push('topic');
    if (!data?.duration?.trim()) missing.push('duration');
    if (missing.length) return badRequest(`Missing required fields: ${missing.join(', ')}`);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY is not set');
      const fallback = buildFallbackPlan(data as LessonRequest);
      return okJson({ lessonPlan: fallback, fallback: true, success: true });
    }

    const prompt = buildPrompt(data as LessonRequest);

    // Get-it-working defaults; we can raise tokens & update model after validation
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 4000,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!resp.ok) {
      const t = await resp.text().catch(() => '');
      console.error('Anthropic API error:', resp.status, resp.statusText, t);
      const fallback = buildFallbackPlan(data as LessonRequest);
      return okJson({ lessonPlan: fallback, fallback: true, success: true });
    }

    const payload = await resp.json();
    let textOut = '';

    if (Array.isArray(payload?.content) && payload.content[0]?.type === 'text') {
      textOut = String(payload.content[0].text || '');
    } else if (typeof payload?.content?.[0] === 'object' && 'text' in payload.content[0]) {
      textOut = String(payload.content[0].text || '');
    } else if (typeof payload?.content === 'string') {
      textOut = payload.content;
    }

    textOut = textOut.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();

    let plan: LessonPlan | null = null;
    try {
      plan = JSON.parse(textOut) as LessonPlan;
    } catch (e) {
      console.error('JSON parse error from model output:', e, '\nRaw:', textOut.slice(0, 800));
    }

    if (!plan || typeof plan !== 'object') {
      const fallback = buildFallbackPlan(data as LessonRequest);
      return okJson({ lessonPlan: fallback, fallback: true, success: true });
    }

    // Patch critical structures if missing
    if (!Array.isArray(plan.fiveRsSchedule) || plan.fiveRsSchedule.length < 5) {
      plan.fiveRsSchedule = buildFallbackPlan(data as LessonRequest).fiveRsSchedule;
    }
    if (!Array.isArray(plan.iCanTargets) || plan.iCanTargets.length === 0) {
      plan.iCanTargets = buildFallbackPlan(data as LessonRequest).iCanTargets;
    }
    if (!Array.isArray(plan.lessonFlowGRR) || plan.lessonFlowGRR.length === 0) {
      plan.lessonFlowGRR = buildFallbackPlan(data as LessonRequest).lessonFlowGRR;
    }
    if (!plan.assessmentAndEvidence) {
      plan.assessmentAndEvidence = buildFallbackPlan(data as LessonRequest).assessmentAndEvidence;
    }

    return okJson({ lessonPlan: plan, success: true });
  } catch (err) {
    console.error('API Error:', err);
    return serverError('Failed to generate lesson plan');
  }
}
