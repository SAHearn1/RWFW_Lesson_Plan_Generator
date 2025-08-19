// File: src/app/api/generate-lesson/route.ts

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** -------- Types aligned to the new RWFW JSON contract -------- */

interface LessonRequest {
  subject: string;
  gradeLevel: string;
  topic: string;
  duration: string; // keep string to match your UI; we’ll also compute minutes
  learningObjectives?: string;
  specialNeeds?: string;
  availableResources?: string;
}

type FiveRsBlock = {
  label: string;           // e.g., "Relationships/Regulate"
  minutes: number;         // integer minutes
  purpose: string;         // RWFW rationale
};

type LessonFlowStep = {
  phase: "I Do" | "We Do" | "You Do";
  step: string;
  details: string;
  teacherNote: string;     // must include [Teacher Note:]
  studentNote: string;     // must include [Student Note:]
};

interface LessonPlan {
  // Legacy fields kept for backward compatibility
  title: string;
  overview: string;
  materials: string[];

  // New required sections (per teacher feedback)
  iCanTargets: Array<{ text: string; dok: 1 | 2 | 3 | 4 }>;

  fiveRsSchedule: FiveRsBlock[]; // must contain 5 items; minutes must sum to total

  literacySkillsAndResources: {
    skills: string[];          // reading/writing/speaking/listening skills
    resources: string[];       // vetted links or “[Insert link here]”
  };

  bloomsAlignment: Array<{ task: string; bloom: "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create"; rationale: string }>;

  coTeachingIntegration: {
    model: string;             // Station, Parallel, Team, etc.
    roles: string[];           // concrete roles/responsibilities
    grouping: string;          // how students rotate / group size
  };

  reteachingAndSpiral: {
    sameDayQuickPivot: string; // 5–10 min reteach move
    nextDayPlan: string;       // brief plan
    spiralIdeas: string[];     // what to revisit later
  };

  mtssSupports: {
    tier1: string[];           // universal supports
    tier2: string[];           // small-group/targeted
    tier3: string[];           // intensive/individualized
    progressMonitoring: string[];
  };

  therapeuticRootworkContext: {
    rationale: string;         // healing-centered why
    regulationCue: string;     // at least one cue/ritual
    restorativePractice: string;
    communityAssets: string[]; // Savannah/Gullah-Geechee etc.
  };

  lessonFlowGRR: LessonFlowStep[]; // each step must have both notes

  assessmentAndEvidence: {
    formativeChecks: string[];
    rubric: Array<{ criterion: string; developing: string; proficient: string; advanced: string }>;
    exitTicket: string;
  };

  // Legacy fields your UI may still read
  objectives: string[];
  timeline: Array<{ time: string; activity: string; description: string }>;
  differentiation: string; // keep, though MTSS now carries the structure
  extensions: string;
}

/** -------- Utility: env + model fallback + JSON cleaning -------- */

const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
const modelOrderEnv = process.env.CLAUDE_MODEL_ORDER ?? ""; // e.g., "opus-id,sonnet-id,haiku-id"
const MAX_TOKENS = Number(process.env.MAX_TOKENS ?? 4096);  // high default; API will clamp
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS ?? 90000);

function modelOrder(): string[] {
  return modelOrderEnv
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

function stripFences(s: string) {
  return s.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
}

function safeParse<T>(raw: string): T | null {
  try {
    return JSON.parse(stripFences(raw)) as T;
  } catch {
    return null;
  }
}

function minutesFromDuration(d: string): number | null {
  // Accept "90", "90 min", "1:30", etc.
  const num = Number(d);
  if (!Number.isNaN(num) && num > 0) return Math.round(num);
  const hhmmMatch = d.match(/^(\d{1,2}):(\d{2})$/);
  if (hhmmMatch) {
    const h = Number(hhmmMatch[1]);
    const m = Number(hhmmMatch[2]);
    if (!Number.isNaN(h) && !Number.isNaN(m)) return h * 60 + m;
  }
  return null;
}

/** -------- Validation for RWFW completeness -------- */

function hasFiveRs(schedule: FiveRsBlock[], totalMinutes: number | null): string[] {
  const issues: string[] = [];
  if (!Array.isArray(schedule) || schedule.length !== 5) {
    issues.push("fiveRsSchedule must contain exactly five blocks.");
    return issues;
  }
  schedule.forEach((b, i) => {
    if (!b.label || typeof b.minutes !== "number" || !b.purpose) {
      issues.push(`fiveRsSchedule[${i}] is missing label, minutes, or purpose.`);
    }
  });
  if (totalMinutes && schedule.reduce((sum, b) => sum + (b.minutes || 0), 0) !== totalMinutes) {
    issues.push("fiveRsSchedule minutes do not sum to total duration.");
  }
  return issues;
}

function hasNotes(flow: LessonFlowStep[]): string[] {
  const issues: string[] = [];
  if (!Array.isArray(flow) || flow.length === 0) {
    issues.push("lessonFlowGRR must include at least one step.");
    return issues;
  }
  flow.forEach((s, i) => {
    if (!s.teacherNote?.includes("[Teacher Note:")) {
      issues.push(`lessonFlowGRR[${i}] missing [Teacher Note:].`);
    }
    if (!s.studentNote?.includes("[Student Note:")) {
      issues.push(`lessonFlowGRR[${i}] missing [Student Note:].`);
    }
  });
  return issues;
}

function hasKeySections(plan: LessonPlan): string[] {
  const issues: string[] = [];
  if (!plan.iCanTargets?.length) issues.push("iCanTargets missing or empty.");
  if (!plan.literacySkillsAndResources?.skills?.length) issues.push("literacy skills missing.");
  if (!plan.bloomsAlignment?.length) issues.push("Bloom's alignment missing.");
  if (!plan.coTeachingIntegration?.model) issues.push("coTeachingIntegration.model missing.");
  if (!plan.mtssSupports) issues.push("MTSS supports missing.");
  if (!plan.therapeuticRootworkContext?.rationale) issues.push("Therapeutic Rootwork rationale missing.");
  if (!plan.assessmentAndEvidence?.exitTicket) issues.push("Exit ticket missing.");
  return issues;
}

/** -------- Anthropic call with fallback -------- */

async function callAnthropic(model: string, prompt: string, signal: AbortSignal): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: prompt }],
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status} on ${model}: ${text.slice(0, 400)}`);
  }

  const data = await res.json();
  const output = (data?.content?.[0]?.text ?? "").trim();
  if (!output) throw new Error(`Empty content from ${model}`);
  return output;
}

/** -------- Prompt builder (JSON contract, RWFW strict) -------- */

function buildPrompt(data: LessonRequest): string {
  const baseMinutes = minutesFromDuration(data.duration) ?? 90;

  return `
You are an expert RWFW (Root Work Framework) lesson designer. Produce a trauma-informed, STEAM-aligne
