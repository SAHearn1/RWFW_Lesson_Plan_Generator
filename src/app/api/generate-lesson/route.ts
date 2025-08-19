// File: src/app/api/generate-lesson/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Force Node.js runtime for reliable body parsing on Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---- Types (inlined for stability) ----
type Dok = 1 | 2 | 3 | 4;

type FiveRsBlock = { label: string; minutes: number; purpose: string };

type LessonFlowStep = {
  phase: 'I Do' | 'We Do' | 'You Do';
  step: string;
  details: string;
  teacherNote: string;
  studentNote: string;
};

type LessonPlan = {
  title: string;
  overview: string;
  materials: string[];

  iCanTargets: Array<{ text: string; dok: Dok }>;
  fiveRsSchedule: FiveRsBlock[];
  literacySkillsAndResources: { skills: string[]; resources: string[] };
  bloomsAlignment: Array<{
    task: string;
    bloom: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
    rationale: string;
  }>;
  coTeachingIntegration: { model: string; roles: string[]; grouping: string };
  reteachingAndSpiral: { sameDayQuickPivot: string; nextDayPlan: string; spiralIdeas: string[] };
  mtssSupports: { tier1: string[]; tier2: string[]; tier3: string[]; progressMonitoring: string[] };
  therapeuticRootworkContext: {
    rationale: string;
    regulationCue: string;
    restorativePractice: string;
    communityAssets: string[];
  };
  lessonFlowGRR: LessonFlowStep[];
  assessmentAndEvidence: {
    formativeChecks: string[];
    rubric: Array<{ criterion: string; developing: string; proficient: string; advanced: string }>;
    exitTicket: string;
  };

  // legacy fields
  objectives?: string[];
  timeline?: Array<{ time: string; activity: string; description: string }>;
  assessment?: string;
  differentiation?: string;
  extensions?: string;
};

interface LessonRequest {
  subject: string;
  gradeLevel: string;
  topic: string;
  duration: string;
  learningObjectives?: string;
  specialNeeds?: string;
  availableResources?: string;
}

// Try JSON first (most reliable), then text → URLSearchParams
async function readBody(req: NextRequest): Promise<Record<string, unknown>> {
  // 1) JSON
  try {
    const ctype = req.headers.get('content-type') || '';
    if (ctype.includes('application/json')) {
      const j = await req.json();
      if (j && typeof j === 'object') return j as Record<string, unknown>;
    }
  } catch { /* fall through */ }

  // 2) Text → try JSON parse → try form-encoded
  const raw = await req.text();
  if (!raw) return {};
  try {
    const j = JSON.parse(raw);
    if (j && typeof j === 'object') return j as Record<string, unknown>;
  } catch { /* not JSON */ }

  try {
    const sp = new URLSearchParams(raw);
    const obj: Record<string, string> = {};
    sp.forEach((v, k) => { obj[k] = v; });
    if (Object.keys(obj).length) return obj;
  } catch { /* ignore */ }

  return {};
}

export async function POST(request: NextRequest) {
  try {
    const received = await readBody(request);

    // Normalize to strings
    const data: LessonRequest = {
      subject: (received.subject ?? '').toString(),
      gradeLevel: (received.gradeLevel ?? '').toString(),
      topic: (received.topic ?? '').toString(),
      duration: (received.duration ?? '').toString(),
      learningObjectives: (received.learningObjectives ?? '').toString(),
      specialNeeds: (received.specialNeeds ?? '').toString(),
      availableResources: (received.availableResources ?? '').toString(),
    };

    const missing: string[] = [];
    if (!data.subject.trim()) missing.push('subject');
    if (!data.gradeLevel.trim()) missing.push('gradeLevel');
    if (!data.topic.trim()) missing.push('topic');
    if (!data.duration.trim()) missing.push('duration');

    if (missing.length) {
      // Echo exactly what we saw so you can confirm field-by-field
      return NextResponse.json(
        {
          error: `Missing required fields: ${missing.join(', ')}`,
          debug: {
            headers: {
              'content-type': request.headers.get('content-type'),
            },
            receivedKeys: Object.keys(received),
            receivedSample: {
              subject: data.subject,
              gradeLevel: data.gradeLevel,
              topic: data.topic,
              duration: data.duration,
            },
          },
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 });
    }

    // --- Prompt minimized here for brevity; keep your RWFW JSON schema as before ---
    const prompt = `Create a comprehensive RWFW lesson. Return ONLY valid JSON matching the new schema (iCanTargets, fiveRsSchedule, literacySkillsAndResources, bloomsAlignment, coTeachingIntegration, reteachingAndSpiral, mtssSupports, therapeuticRootworkContext, lessonFlowGRR, assessmentAndEvidence, plus legacy fields). 
Subject: ${data.subject}
Grade Level: ${data.gradeLevel}
Topic: ${data.topic}
Duration: ${data.duration}
${data.learningObjectives ? `Objectives: ${data.learningObjectives}` : ''}
${data.specialNeeds ? `Special Considerations: ${data.specialNeeds}` : ''}
${data.availableResources ? `Available Resources: ${data.availableResources}` : ''}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      // Fallback plan (schema-compatible with your UI)
      const fallbackPlan: LessonPlan = {
        title: `Root Work Framework: ${data.topic} - Grade ${data.gradeLevel}`,
        overview: `This ${data.duration} lesson integrates ${data.topic} with RWFW (5Rs) for a healing-centered, culturally responsive experience.`,
        materials: ['Student journals', 'Chart paper', 'Markers'],
        iCanTargets: [
          { text: `I can explain key ideas in ${data.topic}.`, dok: 2 },
          { text: 'I can apply the concept in a real-world example.', dok: 3 },
        ],
        fiveRsSchedule: [
          { label: 'Relationships/Regulate', minutes: 10, purpose: 'Community check-in & readiness' },
          { label: 'Readiness & Relevance', minutes: 10, purpose: 'Connect to lived experiences' },
          { label: 'Rigor', minutes: 25, purpose: 'Model + guided practice with scaffolds' },
          { label: 'Release', minutes: 10, purpose: 'Choice-based application' },
          { label: 'Reflection/Restorative', minutes: 5, purpose: 'Exit reflection & celebration' },
        ],
        literacySkillsAndResources: { skills: ['Academic vocabulary', 'Speaking & listening'], resources: ['https://example.com/resource'] },
        bloomsAlignment: [
          { task: `Summarize ${data.topic}`, bloom: 'Understand', rationale: 'Checks core comprehension' },
          { task: 'Apply to a local scenario', bloom: 'Apply', rationale: 'Transfers learning contextually' },
        ],
        coTeachingIntegration: { model: 'Team Teaching', roles: ['Mini-lesson lead', 'Conferencing/monitoring'], grouping: 'Pairs/triads' },
        reteachingAndSpiral: {
          sameDayQuickPivot: 'Model a worked example; sentence stems and visuals.',
          nextDayPlan: 'Small-group reteach with manipulatives or exemplars.',
          spiralIdeas: ['Do Now retrieval', 'Weekly station revisit'],
        },
        mtssSupports: {
          tier1: ['Multiple modalities', 'Graphic organizers', 'UDL choices'],
          tier2: ['Strategic pairing', 'Chunking & guided notes'],
          tier3: ['Alt. response modes', '1:1 conferencing & assistive tech'],
          progressMonitoring: ['Exit tickets', 'Anecdotal notes', 'Work samples'],
        },
        therapeuticRootworkContext: {
          rationale: 'Center safety, belonging, and cultural wealth.',
          regulationCue: 'Box breathing + stretch or water break.',
          restorativePractice: 'Closing circle appreciations/commitments.',
          communityAssets: ['Family knowledge', 'Local history/examples'],
        },
        lessonFlowGRR: [
          { phase: 'I Do', step: 'Model with think-aloud', details: 'Brief direct instruction w/ anchor chart.', teacherNote: '[Teacher Note: Name success criteria.]', studentNote: '[Student Note: Track steps in notes.]' },
          { phase: 'We Do', step: 'Guided practice', details: 'Solve one together, equity sticks for voice.', teacherNote: '[Teacher Note: Prompt academic talk.]', studentNote: '[Student Note: Try, then compare.]' },
          { phase: 'You Do', step: 'Application w/ choice', details: 'Short task; visual/ written/ oral options.', teacherNote: '[Teacher Note: Confer with 3–5 students.]', studentNote: '[Student Note: Use checklist to self-assess.]' },
        ],
        assessmentAndEvidence: {
          formativeChecks: ['Fist-to-five', 'Quick write', 'Partner explain'],
          rubric: [{ criterion: 'Concept understanding', developing: 'Partial/unsupported', proficient: 'Clear & supported', advanced: 'Insightful transfer' }],
          exitTicket: 'One sentence summary + one question.',
        },
        // Legacy
        objectives: [`Understand key ideas in ${data.topic}`, 'Collaborate effectively', 'Reflect on growth'],
        timeline: [
          { time: '0–10', activity: 'Community building', description: 'Opening circle & norms' },
          { time: '10–35', activity: 'Core learning', description: 'Model + guided practice' },
          { time: '35–55', activity: 'Application', description: 'Choice task in pairs' },
          { time: '55–60', activity: 'Closure', description: 'Reflection + exit ticket' },
        ],
        assessment: 'Observation, discussion, exit ticket',
        differentiation: 'Visuals, stems, alt response modes',
        extensions: 'Community interview; peer teach-back',
      };

      return NextResponse.json({ lessonPlan: fallbackPlan, fallback: true, success: true });
    }

    const claudeData = await response.json();
    let raw = claudeData?.content?.[0]?.text ?? '';
    raw = raw.replace(/```json\s?/g, '').replace(/```\s?/g, '').trim();

    let lessonPlan: LessonPlan;
    try {
      lessonPlan = JSON.parse(raw) as LessonPlan;
    } catch {
      return NextResponse.json(
        { error: 'Parsing error from model output', raw },
        { status: 502 }
      );
    }

    return NextResponse.json({ lessonPlan, success: true });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to generate lesson plan', success: false },
      { status: 500 }
    );
  }
}
