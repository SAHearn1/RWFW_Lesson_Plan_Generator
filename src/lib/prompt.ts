// File: src/lib/prompt.ts

/** Public types you can reuse across the app */
export type Dok = 1 | 2 | 3 | 4;

export type Assignment = {
  subject: string;
  gradeLevel: string;
  topic: string;
  /** Example inputs: "60 minutes", "90", "1:30" */
  duration: string;
  learningObjectives?: string;
  specialNeeds?: string;
  availableResources?: string;
};

export type RWFWBrand = {
  fiveRsLabels?: string[]; // Optional custom labels, length 5
};

export function minutesFromDuration(d: string): number | null {
  const n = Number(d);
  if (!Number.isNaN(n) && n > 0) return Math.round(n);
  const m = d.match(/^(\d{1,2}):(\d{2})$/);
  if (m) {
    const h = Number(m[1]);
    const mm = Number(m[2]);
    if (!Number.isNaN(h) && !Number.isNaN(mm)) return h * 60 + mm;
  }
  const m2 = d.match(/(\d+)\s*min/gi);
  if (m2 && Number(m2[0])) return Number(m2[0]);
  return null;
}

/**
 * Build the Anthropic user prompt that forces a strict JSON object return
 * matching the RWFW schema required by the new UI and API.
 */
export function buildPrompt(assign: Assignment, brand: RWFWBrand = {}): string {
  const total = minutesFromDuration(assign.duration) ?? 90;
  const five = (brand.fiveRsLabels?.length === 5
    ? brand.fiveRsLabels
    : [
        "Relationships/Regulate",
        "Readiness & Relevance",
        "Rigor",
        "Release",
        "Reflection/Restorative",
      ]).join(" | ");

  return `
You are an expert educator guided by the Root Work Framework (RWFW). Design a trauma-informed, equity-first, strengths-based, community-connected lesson that is immediately teachable.

Return **ONLY** a valid JSON object (no prose, no markdown fences) that exactly matches the contract below.

NON-NEGOTIABLES
- RWFW and GRR: healing-centered rituals, cultural relevance, Living Learning Labs; steps under I Do / We Do / You Do.
- After **every** GRR step, include both tokens: "[Teacher Note: ...]" and "[Student Note: ...]".
- MTSS Tiers 1–3 must be explicit.
- “I Can” targets must each include a Webb’s DOK level (1–4).
- 5 Rs schedule must have exactly five blocks that sum to ~${total} minutes.
- No fabricated links. If a real link is unknown, use the literal string: "[Insert link here]".

CONTEXT
Subject: ${assign.subject}
Grade Level: ${assign.gradeLevel}
Topic: ${assign.topic}
Duration: ${assign.duration} (≈ ${total} minutes)
Teacher-provided learning objectives: ${assign.learningObjectives ?? "N/A"}
Special considerations: ${assign.specialNeeds ?? "N/A"}
Available resources: ${assign.availableResources ?? "N/A"}
5 Rs labels: ${five}

JSON CONTRACT (return exactly these keys; values must be non-empty where logical):
{
  "title": string,
  "overview": string,
  "materials": string[],

  "iCanTargets": [{"text": string, "dok": 1|2|3|4}],

  "fiveRsSchedule": [
    {"label": string, "minutes": number, "purpose": string},
    {"label": string, "minutes": number, "purpose": string},
    {"label": string, "minutes": number, "purpose": string},
    {"label": string, "minutes": number, "purpose": string},
    {"label": string, "minutes": number, "purpose": string}
  ],

  "literacySkillsAndResources": {
    "skills": string[],
    "resources": string[]   // real links or "[Insert link here]"
  },

  "bloomsAlignment": [{"task": string, "bloom": "Remember"|"Understand"|"Apply"|"Analyze"|"Evaluate"|"Create", "rationale": string}],

  "coTeachingIntegration": {
    "model": string,        // e.g., Station, Parallel, Team
    "roles": string[],      // concrete adult roles
    "grouping": string      // how students rotate / group size
  },

  "reteachingAndSpiral": {
    "sameDayQuickPivot": string,
    "nextDayPlan": string,
    "spiralIdeas": string[]
  },

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

  "lessonFlowGRR": [
    {"phase": "I Do"|"We Do"|"You Do", "step": string, "details": string, "teacherNote": string, "studentNote": string}
  ],

  "assessmentAndEvidence": {
    "formativeChecks": string[],
    "rubric": [{"criterion": string, "developing": string, "proficient": string, "advanced": string}],
    "exitTicket": string
  },

  // Legacy keys (for backward compatibility with older UIs)
  "objectives": string[],
  "timeline": [{"time": string, "activity": string, "description": string}],
  "differentiation": string,
  "extensions": string
}

STYLE GUIDANCE
- Professional, invitational tone.
- Asset-based language; ensure access for ELL and students with disabilities.
- Savannah/urban context examples are welcome when natural.
- Keep copy concise and teacher-ready.
`.trim();
}
