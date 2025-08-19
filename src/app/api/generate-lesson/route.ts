// File: src/app/api/generate-lesson/route.ts
import { NextRequest, NextResponse } from 'next/server';
import type { LessonPlan } from '@/types/lesson';

// Ensure stable body parsing on Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface LessonRequest {
  subject: string;
  gradeLevel: string;
  topic: string;
  duration: string;
  learningObjectives?: string;
  specialNeeds?: string;
  availableResources?: string;
}

async function readBody(req: NextRequest): Promise<Partial<LessonRequest>> {
  // Read as text once, then try multiple parsers
  const raw = await req.text();
  if (!raw) return {};

  // Try JSON
  try {
    const j = JSON.parse(raw);
    if (j && typeof j === 'object') return j;
  } catch { /* ignore */ }

  // Try URLSearchParams (in case something posts form-encoded)
  try {
    const sp = new URLSearchParams(raw);
    const obj: Record<string, string> = {};
    sp.forEach((v, k) => { obj[k] = v; });
    if (Object.keys(obj).length) return obj as Partial<LessonRequest>;
  } catch { /* ignore */ }

  return {};
}

export async function POST(request: NextRequest) {
  try {
    const dataPartial = await readBody(request);
    const data = {
      subject: dataPartial.subject?.toString() ?? '',
      gradeLevel: dataPartial.gradeLevel?.toString() ?? '',
      topic: dataPartial.topic?.toString() ?? '',
      duration: dataPartial.duration?.toString() ?? '',
      learningObjectives: dataPartial.learningObjectives?.toString() ?? '',
      specialNeeds: dataPartial.specialNeeds?.toString() ?? '',
      availableResources: dataPartial.availableResources?.toString() ?? '',
    };

    // Validate required fields (mirror client)
    const missingFields: string[] = [];
    if (!data.subject.trim()) missingFields.push('subject');
    if (!data.gradeLevel.trim()) missingFields.push('gradeLevel');
    if (!data.topic.trim()) missingFields.push('topic');
    if (!data.duration.trim()) missingFields.push('duration');

    if (missingFields.length > 0) {
      // Echo what we actually received to make debugging easy
      return NextResponse.json(
        {
          error: `Missing required fields: ${missingFields.join(', ')}`,
          received: {
            subject: data.subject,
            gradeLevel: data.gradeLevel,
            topic: data.topic,
            duration: data.duration,
          },
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API configuration error' }, { status: 500 });
    }

    // --- Prompt (unchanged core idea, shortened here) ---
    const prompt = `Create a comprehensive lesson plan using Root Work Framework principles. Return ONLY a valid JSON object with no markdown formatting.

LESSON DETAILS:
- Subject: ${data.subject}
- Grade Level: ${data.gradeLevel}
- Topic: ${data.topic}
- Duration: ${data.duration}
${data.learningObjectives ? `- Learning Objectives: ${data.learningObjectives}` : ''}
${data.specialNeeds ? `- Special Considerations: ${data.specialNeeds}` : ''}
${data.availableResources ? `- Available Resources: ${data.availableResources}` : ''}

Return a JSON object with exactly these fields:
{
  "title": "...",
  "overview": "...",
  "materials": ["..."],
  "iCanTargets": [{"text":"...", "dok": 1}],
  "fiveRsSchedule": [{"label":"...", "minutes":10, "purpose":"..."}],
  "literacySkillsAndResources": {"skills":["..."], "resources":["..."]},
  "bloomsAlignment": [{"task":"...", "bloom":"Apply", "rationale":"..."}],
  "coTeachingIntegration": {"model":"...", "roles":["..."], "grouping":"..."},
  "reteachingAndSpiral": {"sameDayQuickPivot":"...", "nextDayPlan":"...", "spiralIdeas":["..."]},
  "mtssSupports": {"tier1":["..."], "tier2":["..."], "tier3":["..."], "progressMonitoring":["..."]},
  "therapeuticRootworkContext": {"rationale":"...", "regulationCue":"...", "restorativePractice":"...", "communityAssets":["..."]},
  "lessonFlowGRR": [{"phase":"I Do","step":"...","details":"...","teacherNote":"[Teacher Note: ...]","studentNote":"[Student Note: ...]"}],
  "assessmentAndEvidence": {"formativeChecks":["..."], "rubric":[{"criterion":"...","developing":"...","proficient":"...","advanced":"..."}], "exitTicket":"..."}
}`;

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
      // --- Fallback compatible with UI schema ---
      const fallbackPlan: LessonPlan = {
        title: `Root Work Framework: ${data.topic} - Grade ${data.gradeLevel}`,
        overview: `This ${data.duration} lesson integrates ${data.topic} with the 5Rs for a healing-centered, culturally responsive experience.`,
        materials: ['Student journals', 'Chart paper', 'Markers'],
        iCanTargets: [
          { text: `I can explain the main idea of ${data.topic}.`, dok: 2 },
          { text: 'I can collaborate to apply the concept.', dok: 3 },
        ],
        fiveRsSchedule: [
          { label: 'Relationships/Regulate', minutes: 10, purpose: 'Community check-in & readiness' },
          { label: 'Readiness & Relevance', minutes: 10, purpose: 'Connect to lived experience' },
          { label: 'Rigor', minutes: 25, purpose: 'Model + guided practice with scaffolds' },
          { label: 'Release', minutes: 10, purpose: 'Partner/small-group application' },
          { label: 'Reflection/Restorative', minutes: 5, purpose: 'Exit reflection & celebration' },
        ],
        literacySkillsAndResources: { skills: ['Academic vocabulary', 'Speaking & listening'], resources: ['https://example.com/resource'] },
        bloomsAlignment: [
          { task: `Summarize ${data.topic}`, bloom: 'Understand', rationale: 'Checks conceptual grasp' },
          { task: 'Apply to a local scenario', bloom: 'Apply', rationale: 'Transfers learning' },
        ],
        coTeachingIntegration: { model: 'Team Teaching', roles: ['Mini-lesson lead', 'Conference/monitor'], grouping: 'Pairs/triads' },
        reteachingAndSpiral: {
          sameDayQuickPivot: 'Re-model with worked example; sentence stems.',
          nextDayPlan: 'Small-group reteach with manipulatives/visuals.',
          spiralIdeas: ['Do Now retrieval', 'Weekly station revisit'],
        },
        mtssSupports: {
          tier1: ['Multiple modalities', 'Visuals & organizers'],
          tier2: ['Strategic pairing', 'Chunked tasks'],
          tier3: ['Alternative response modes', '1:1 conferencing'],
          progressMonitoring: ['Exit tickets', 'Work samples'],
        },
        therapeuticRootworkContext: {
          rationale: 'Center safety, belonging, and cultural wealth.',
          regulationCue: 'Box breathing + stretch.',
          restorativePractice: 'Closing circle appreciations.',
          communityAssets: ['Family knowledge', 'Local examples'],
        },
        lessonFlowGRR: [
          { phase: 'I Do', step: 'Modeling', details: 'Teacher models with think-aloud.', teacherNote: '[Teacher Note: Highlight success criteria.]', studentNote: '[Student Note: Track steps in notebook.]' },
          { phase: 'We Do', step: 'Guided practice', details: 'Solve one together.', teacherNote: '[Teacher Note: Prompt equitable voice.]', studentNote: '[Student Note: Try, then check with partner.]' },
          { phase: 'You Do', step: 'Application', details: 'Short task with choice of representation.', teacherNote: '[Teacher Note: Confer with 3–5 students.]', studentNote: '[Student Note: Use checklist to self-assess.]' },
        ],
        assessmentAndEvidence: {
          formativeChecks: ['Fist-to-five', 'Quick write'],
          rubric: [{ criterion: 'Concept understanding', developing: 'Partial', proficient: 'Clear', advanced: 'Insightful' }],
          exitTicket: 'One-sentence summary + question.',
        },
        // Legacy for backward compatibility
        objectives: [
          `Understand key ideas in ${data.topic}`, 'Collaborate effectively', 'Reflect on growth'
        ],
        timeline: [
          { time: '0–10', activity: 'Community building', description: 'Opening circle & norms' },
          { time: '10–35', activity: 'Core learning', description: 'Model + guided practice' },
          { time: '35–55', activity: 'Application', description: 'Partner task with choice' },
          { time: '55–60', activity: 'Closure', description: 'Reflection & exit ticket' },
        ],
        assessment: 'Observation, discussion, exit ticket',
        differentiation: 'Visuals, stems, alternative response modes',
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
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate lesson plan', success: false },
      { status: 500 }
    );
  }
}
