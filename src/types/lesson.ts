// Root Work Framework — shared types for request payloads and lesson plans

// ---------- Input payload sent from the form to the API ----------
export type LessonRequest = {
  subject: string;
  gradeLevel: string;
  topic: string;
  duration: string; // e.g., "60 minutes"
  learningObjectives?: string;
  specialNeeds?: string;
  availableResources?: string;
};

// ---------- Core lesson plan types returned by the API ----------
export type Dok = 1 | 2 | 3 | 4;

export type FiveRsBlock = {
  label: string;      // e.g., "Relationships", "Routines", etc.
  minutes: number;    // time allocation
  purpose: string;    // intent/context for this block
};

export type LessonFlowStep = {
  phase: 'I Do' | 'We Do' | 'You Do';
  step: string;         // short action/title
  details: string;      // what happens in this step
  /** Must include "[Teacher Note: ...]" in content */
  teacherNote: string;
  /** Must include "[Student Note: ...]" in content */
  studentNote: string;
};

export type LessonPlan = {
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

  /** legacy compatibility (older plans) */
  objectives?: string[];
  timeline?: Array<{ time: string; activity: string; description: string }>;
  assessment?: string;
  differentiation?: string;
  extensions?: string;
};

