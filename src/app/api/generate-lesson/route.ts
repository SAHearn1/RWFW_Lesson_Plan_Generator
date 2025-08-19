// File: src/app/api/generate-lesson/route.ts
import { NextRequest, NextResponse } from 'next/server';
import type { LessonPlan } from '@/types/lesson';

interface LessonRequest {
  subject: string;
  gradeLevel: string;
  topic: string;
  duration: string;
  learningObjectives?: string;
  specialNeeds?: string;
  availableResources?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: LessonRequest = await request.json();

    // Validate required fields (match frontend)
    const missingFields = [];
    if (!data.subject?.trim()) missingFields.push('subject');
    if (!data.gradeLevel?.trim()) missingFields.push('gradeLevel');
    if (!data.topic?.trim()) missingFields.push('topic');
    if (!data.duration?.trim()) missingFields.push('duration');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Build the prompt (you may already have buildPrompt in src/lib/prompt.ts)
    const prompt = `Create a comprehensive lesson plan using Root Work Framework principles. Return ONLY a valid JSON object with no markdown formatting.

LESSON DETAILS:
- Subject: ${data.subject}
- Grade Level: ${data.gradeLevel}
- Topic: ${data.topic}
- Duration: ${data.duration}
${data.learningObjectives ? `- Learning Objectives: ${data.learningObjectives}` : ''}
${data.specialNeeds ? `- Special Considerations: ${data.specialNeeds}` : ''}
${data.availableResources ? `- Available Resources: ${data.availableResources}` : ''}

ROOT WORK FRAMEWORK REQUIREMENTS:
Structure this lesson around the 5Rs:
1. RELATIONSHIPS - Build authentic connections and community
2. ROUTINES - Establish predictable, healing-centered structures
3. RELEVANCE - Connect learning to students' lives and experiences
4. RIGOR - Maintain high academic expectations with support
5. REFLECTION - Include metacognitive and restorative practices

Return a JSON object with exactly these fields:
{
  "title": "Creative lesson title incorporating Root Work Framework",
  "overview": "2-3 sentence description incorporating Root Work principles and healing-centered approach",
  "objectives": ["Array of 3-5 specific learning objectives that integrate SEL and academic goals"],
  "materials": ["Array of needed materials including culturally responsive and biophilic elements"],
  "timeline": [{"time": "0-10 minutes", "activity": "Activity name", "description": "Detailed description with trauma-informed approaches"}],
  "assessment": "Assessment strategies that honor multiple ways of knowing and include self-reflection",
  "differentiation": "Comprehensive accommodations for diverse learners including trauma-informed practices and MTSS support",
  "extensions": "Extension activities connecting to community, real-world applications, and family engagement"
}

Use warm, invitational language throughout. Focus on strengths-based, trauma-informed approaches. Ensure all activities are developmentally appropriate for ${data.gradeLevel}. Include healing-centered practices and cultural responsiveness.`;

    // Call Claude API (kept as in your current file)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const fallbackPlan: LessonPlan = {
        title: `Root Work Framework: ${data.topic} - Grade ${data.gradeLevel}`,
        overview: `This ${data.duration} lesson integrates ${data.topic} with Root Work Framework's 5Rs, creating a healing-centered learning environment that builds relationships, establishes routines, ensures relevance, maintains rigor, and promotes reflection through culturally responsive, trauma-informed instruction.`,
        // Minimal fill for new schema keys so UI doesn't break when fallback triggers
        materials: ['Student journals', 'Chart paper', 'Markers'],
        iCanTargets: [
          { text: `I can explain key ideas about ${data.topic}.`, dok: 2 },
          { text: 'I can collaborate with my peers to apply the concept.', dok: 3 },
        ],
        fiveRsSchedule: [
          { label: 'Relationships/Regulate', minutes: 10, purpose: 'Community check-in & readiness' },
          { label: 'Readiness & Relevance', minutes: 10, purpose: 'Connect topic to lived experiences' },
          { label: 'Rigor', minutes: 25, purpose: 'Model + guided practice with scaffolds' },
          { label: 'Release', minutes: 10, purpose: 'Partner or small-group application' },
          { label: 'Reflection/Restorative', minutes: 5, purpose: 'Exit reflection & celebration' },
        ],
        literacySkillsAndResources: { skills: ['Academic vocabulary', 'Speaking & listening'], resources: ['[Insert link here]'] },
        bloomsAlignment: [
          { task: `Summarize ${data.topic} in your own words`, bloom: 'Understand', rationale: 'Checks conceptual grasp' },
          { task: 'Apply the idea to a real-world scenario', bloom: 'Apply', rationale: 'Transfers learning' },
        ],
        coTeachingIntegration: { model: 'Team Teaching', roles: ['Lead mini-lesson', 'Monitor + confers'], grouping: 'Pairs/triads' },
        reteachingAndSpiral: {
          sameDayQuickPivot: 'Re-model with a worked example; use sentence stems.',
          nextDayPlan: 'Small-group reteach using manipulatives/visuals.',
          spiralIdeas: ['Do Now retrieval prompts', 'Weekly station revisit'],
        },
        mtssSupports: {
          tier1: ['Multiple modalities', 'Visuals & organizers'],
          tier2: ['Strategic pairing', 'Chunked tasks'],
          tier3: ['Alternative response modes', '1:1 conferencing'],
          progressMonitoring: ['Exit tickets', 'Work samples'],
        },
        therapeuticRootworkContext: {
          rationale: 'Ground learning in safety, belonging, and cultural wealth.',
          regulationCue: 'Box breathing + short movement reset.',
          restorativePractice: 'Closing circle appreciations.',
          communityAssets: ['Family knowledge', 'Local examples'],
        },
        lessonFlowGRR: [
          { phase: 'I Do', step: 'Modeling', details: 'Teacher models with think-aloud.', teacherNote: '[Teacher Note: Emphasize success criteria.]', studentNote: '[Student Note: Track the steps in notebook.]' },
          { phase: 'We Do', step: 'Guided practice', details: 'Solve a problem together.', teacherNote: '[Teacher Note: Prompt equitable participation.]', studentNote: '[Student Note: Try, then check with partner.]' },
          { phase: 'You Do', step: 'Independent/partner application', details: 'Apply to a short task.', teacherNote: '[Teacher Note: Confer with 3–5 students.]', studentNote: '[Student Note: Use checklist to self-assess.]' },
        ],
        assessmentAndEvidence: {
          formativeChecks: ['Thumbs-interval check', 'Quick write'],
          rubric: [{ criterion: 'Concept understanding', developing: 'Partial', proficient: 'Clear', advanced: 'Insightful' }],
          exitTicket: 'One-sentence summary + question.',
        },
        // legacy fields for your renderer
        objectives: [
          `Understand key concepts in ${data.topic}`,
          'Collaborate to solve problems',
          'Reflect on learning growth',
        ],
        timeline: [
          { time: '0–10', activity: 'Community building', description: 'Opening circle & norms' },
          { time: '10–35', activity: 'Core learning', description: 'Model + guided practice' },
          { time: '35–55', activity: 'Application', description: 'Partner task with choice' },
          { time: '55–60', activity: 'Closure', description: 'Reflection & exit ticket' },
        ],
        assessment: 'Observation, discussion, exit ticket',
        differentiation: 'Visuals, sentence stems, choice of response mode',
        extensions: 'Community interview; teach-back to peers',
      };

      return NextResponse.json({
        lessonPlan: fallbackPlan,
        fallback: true,
        success: true,
      });
    }

    const claudeData = await response.json();
    let raw = claudeData.content?.[0]?.text ?? '';
    raw = raw.replace(/```json\s?/g, '').replace(/```\s?/g, '').trim();

    let lessonPlan: LessonPlan;
    try {
      lessonPlan = JSON.parse(raw) as LessonPlan;
    } catch {
      // If the model returns malformed JSON, fall back to the structured plan above
      return NextResponse.json({ error: 'Parsing error from model output' }, { status: 502 });
    }

    return NextResponse.json({ lessonPlan, success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate lesson plan', success: false },
      { status: 500 }
    );
  }
}
