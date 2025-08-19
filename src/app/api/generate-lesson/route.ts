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
You are an expert RWFW (Root Work Framework) lesson designer. Produce a trauma-informed, STEAM-aligned lesson that complies with the JSON contract below. Return **ONLY** a valid JSON object—no prose, no markdown fences.

CONTEXT
Subject: ${data.subject}
Grade Level: ${data.gradeLevel}
Topic: ${data.topic}
Duration: ${data.duration} (≈ ${baseMinutes} minutes)
Learning Objectives (teacher-provided): ${data.learningObjectives ?? "N/A"}
Special Considerations: ${data.specialNeeds ?? "N/A"}
Available Resources: ${data.availableResources ?? "N/A"}

REQUIREMENTS
- Integrate: “I Can” targets tagged with Webb’s DOK (1–4); 5 Rs schedule with five blocks that sum to ~${baseMinutes} minutes; Literacy skills + resource links; Bloom’s alignment; Co-teaching model; Reteaching (same-day pivot + next-day) + Spiral ideas; MTSS Tiers 1–3; Therapeutic Rootwork context; GRR Lesson Flow steps with **both tokens**: "[Teacher Note: ...]" and "[Student Note: ...]" in every step.
- No fabricated links. If a real link is unknown, use the literal text: "[Insert link here]".
- Language: professional, strengths-based, healing-centered, copy-ready for teachers.

JSON CONTRACT (return exactly this shape and keys):
{
  "title": string,
  "overview": string,
  "materials": string[],
  "iCanTargets": [{"text": string, "dok": 1|2|3|4}],
  "fiveRsSchedule": [{"label": string, "minutes": number, "purpose": string}],  // exactly 5 items, minutes sum ≈ ${baseMinutes}
  "literacySkillsAndResources": {"skills": string[], "resources": string[]},
  "bloomsAlignment": [{"task": string, "bloom": "Remember"|"Understand"|"Apply"|"Analyze"|"Evaluate"|"Create", "rationale": string}],
  "coTeachingIntegration": {"model": string, "roles": string[], "grouping": string},
  "reteachingAndSpiral": {"sameDayQuickPivot": string, "nextDayPlan": string, "spiralIdeas": string[]},
  "mtssSupports": {"tier1": string[], "tier2": string[], "tier3": string[], "progressMonitoring": string[]},
  "therapeuticRootworkContext": {"rationale": string, "regulationCue": string, "restorativePractice": string, "communityAssets": string[]},
  "lessonFlowGRR": [{"phase": "I Do"|"We Do"|"You Do", "step": string, "details": string, "teacherNote": string, "studentNote": string}],
  "assessmentAndEvidence": {"formativeChecks": string[], "rubric": [{"criterion": string, "developing": string, "proficient": string, "advanced": string}], "exitTicket": string},
  "objectives": string[],
  "timeline": [{"time": string, "activity": string, "description": string}],
  "differentiation": string,
  "extensions": string
}
`;
}

/** -------- Handler -------- */

export async function POST(request: NextRequest) {
  try {
    const data: LessonRequest = await request.json();

    // Basic validation
    const missing: string[] = [];
    if (!data.subject?.trim()) missing.push("subject");
    if (!data.gradeLevel?.trim()) missing.push("gradeLevel");
    if (!data.topic?.trim()) missing.push("topic");
    if (!data.duration?.trim()) missing.push("duration");
    if (missing.length) {
      return NextResponse.json({ error: `Missing required fields: ${missing.join(", ")}` }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: "API configuration error (missing ANTHROPIC_API_KEY)" }, { status: 500 });
    }

    const models = modelOrder();
    if (!models.length) {
      return NextResponse.json(
        { error: "Missing CLAUDE_MODEL_ORDER env (comma-separated highest→lowest)." },
        { status: 500 }
      );
    }

    const prompt = buildPrompt(data);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort("timeout"), REQUEST_TIMEOUT_MS);

    let lastErr: unknown;
    let draftJson: string | null = null;

    for (const model of models) {
      try {
        const raw = await callAnthropic(model, prompt, ctrl.signal);
        draftJson = raw;
        break; // success
      } catch (e) {
        lastErr = e;
        // try next model
      }
    }

    clearTimeout(timer);

    if (!draftJson) {
      throw lastErr ?? new Error("All models failed");
    }

    // Parse and validate
    const plan = safeParse<LessonPlan>(draftJson);
    if (!plan) {
      throw new Error("JSON parsing failed");
    }

    const durationMinutes = minutesFromDuration(data.duration);
    const issues = [
      ...hasFiveRs(plan.fiveRsSchedule, durationMinutes),
      ...hasNotes(plan.lessonFlowGRR),
      ...hasKeySections(plan),
    ];

    if (issues.length) {
      throw new Error(`Validation errors: ${issues.join(" | ")}`);
    }

    return NextResponse.json({ lessonPlan: plan, success: true });
  } catch (error: any) {
    // Robust fallback using your legacy simpler schema (kept from your version, slightly tuned)
    const fallback: LessonPlan = {
      title: `Root Work Framework: ${error?.message ? "Fallback – " : ""}${new Date().toLocaleDateString()}`,
      overview:
        "This fallback plan preserves RWFW intent (healing-centered, culturally responsive, biophilic) and provides a workable structure while the generator recovers.",
      materials: [
        "Student journals / STEAM journals",
        "Flexible seating / circle space",
        "Chart paper, markers, sticky notes",
        "Culturally relevant texts or visuals",
        "Regulation tools (breathing cards, timers)",
        "Technology for multimodal expression",
      ],
      iCanTargets: [
        { text: "I can connect today’s topic to my community and lived experience.", dok: 2 },
        { text: "I can analyze key ideas using evidence.", dok: 3 },
        { text: "I can create a product that demonstrates my understanding.", dok: 4 },
      ],
      fiveRsSchedule: [
        { label: "Relationships/Regulate", minutes: 10, purpose: "Open in community; calm body/brain; norms." },
        { label: "Readiness & Relevance", minutes: 15, purpose: "Activate prior knowledge; local/community hook." },
        { label: "Rigor", minutes: 30, purpose: "Direct instruction + guided practice with supports." },
        { label: "Release", minutes: 25, purpose: "Independent/product work with choice and conferencing." },
        { label: "Reflection/Restorative", minutes: 10, purpose: "Exit ticket; circle close; set intentions." },
      ],
      literacySkillsAndResources: {
        skills: ["Cite textual evidence", "Academic discussion moves", "Purposeful note-taking"],
        resources: ["[Insert link here]", "[Insert link here]"],
      },
      bloomsAlignment: [
        { task: "Activate prior knowledge with local hook", bloom: "Understand", rationale: "Connect concepts." },
        { task: "Analyze anchor text excerpt", bloom: "Analyze", rationale: "Break down structure and meaning." },
        { task: "Create response product", bloom: "Create", rationale: "Synthesize understanding in a new form." },
      ],
      coTeachingIntegration: {
        model: "One Teach / One Assist",
        roles: ["Lead instruction", "Regulation & targeted support", "Station oversight"],
        grouping: "Flexible small groups rotating during Release.",
      },
      reteachingAndSpiral: {
        sameDayQuickPivot: "Re-model with a simpler exemplar; use sentence frames and dual-coding sketch.",
        nextDayPlan: "Small-group clinic on evidence selection and commentary.",
        spiralIdeas: ["Revisit evidence/commentary weekly via warmups.", "Mini-debates for speaking/listening."],
      },
      mtssSupports: {
        tier1: ["UDL options", "Think-alouds", "Checks for understanding every 8–10 min"],
        tier2: ["Small-group prompts", "Graphic organizers", "Teacher conferencing"],
        tier3: ["Reduced item sets", "Alternative product options", "1:1 scaffolded scripting"],
        progressMonitoring: ["Exit ticket rubric", "Anecdotal notes", "Quick probes in small groups"],
      },
      therapeuticRootworkContext: {
        rationale: "Learning happens when students feel seen, safe, and connected.",
        regulationCue: "Box breathing + grounding prompt at transitions.",
        restorativePractice: "Closing circle appreciations and commitments.",
        communityAssets: ["Savannah local histories", "Gullah-Geechee culture", "Neighborhood experts"],
      },
      lessonFlowGRR: [
        {
          phase: "I Do",
          step: "Model annotation of anchor text",
          details: "Think-aloud; show evidence selection and commentary.",
          teacherNote: "[Teacher Note: Explicitly name the skill; keep pace calm.]",
          studentNote: "[Student Note: Watch/listen; jot 2 takeaways in journal.]",
        },
        {
          phase: "We Do",
          step: "Jointly annotate a short passage",
          details: "Students suggest evidence; teacher records and questions.",
          teacherNote: "[Teacher Note: Use equity sticks; validate multiple ways of knowing.]",
          studentNote: "[Student Note: Offer an idea; listen for connections to peers.]",
        },
        {
          phase: "You Do",
          step: "Create a short product (paragraph/sketchnote/audio)",
          details: "Students choose modality to show understanding.",
          teacherNote: "[Teacher Note: Confer 1–1; adjust scaffolds by need.]",
          studentNote: "[Student Note: Use the success criteria to guide your work.]",
        },
      ],
      assessmentAndEvidence: {
        formativeChecks: ["Cold-call + no-opt-out", "Annotated sample collection", "Exit ticket"],
        rubric: [
          { criterion: "Evidence use", developing: "Vague/partial", proficient: "Clear/relevant", advanced: "Insightful/multiple" },
          { criterion: "Reasoning", developing: "List-like", proficient: "Explains connections", advanced: "Insight synthesizes ideas" },
          { criterion: "Clarity", developing: "Some errors", proficient: "Generally clear", advanced: "Polished/precise" },
        ],
        exitTicket: "One sentence: What new understanding will you carry into tomorrow?",
      },
      objectives: [
        "Build community and psychological safety",
        "Analyze text with evidence",
        "Communicate understanding via choice product",
      ],
      timeline: [
        { time: "0–10", activity: "Relationships/Regulate", description: "Opening ritual and norms." },
        { time: "10–25", activity: "Readiness & Relevance", description: "Local/community hook." },
        { time: "25–55", activity: "Rigor → Release", description: "I Do / We Do / You Do sequence." },
        { time: "55–60", activity: "Reflection/Restorative", description: "Exit + circle close." },
      ],
      differentiation:
        "UDL options, language scaffolds, visuals, movement breaks; MTSS tiers applied as needed.",
      extensions:
        "Community interview; local artifact analysis; share-out to families or another class.",
    };

    return NextResponse.json({ lessonPlan: fallback, success: false, error: error?.message ?? "Generator failed" }, { status: 200 });
  }
}
