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

// --- Utilities ---
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

/**
 * Build the JSON-only prompt aligned to the expanded RWFW schema
 */
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

  // Legacy compatibility (optional if useful)
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
`;
}

/**
 * Strong fallback that conforms to the expanded schema
 */
function buildFallbackPlan(data: LessonRequest): LessonPlan {
  const mins = minutesFromDuration(data.duration);
  const blocks: FiveRsBlock[] = [
    { label: 'Relationships', minutes: Math.max(5, Math.round(mins * 0.15)), purpose: 'Community check-in, belonging signal, norms review.' },
    { label: 'Routines', minutes: Math.max(5, Math.round(mins * 0.15)), purpose: 'Agenda, success criteria, materials, predictable flow.' },
    { label: 'Relevance', minutes: Math.max(10, Math.round(mins * 0.2)), purpose: 'Connect content to lived experiences and community.' },
    { label: 'Rigor', minutes: Math.max(15, Math.round(mins * 0.35)), purpose: 'High-level task with scaffolds; multiple access points.' },
    { label: 'Reflection', minutes: Math.max(5, mins - (5 + 5 + 10 + 15)), purpose: 'Metacognition, exit ticket, restorative close.' }
  ];

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
    title: `RWFW: ${data.topic} — ${data.subject} (Grade
