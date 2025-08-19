// File: src/types/lesson.ts

export type Dok = 1 | 2 | 3 | 4;

export type FiveRsBlock = { label: string; minutes: number; purpose: string };

export type LessonFlowStep = {
  phase: 'I Do' | 'We Do' | 'You Do';
  step: string;
  details: string;
  teacherNote: string;   // must include "[Teacher Note:]"
  studentNote: string;   // must include "[Student Note:]"
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

  /** legacy compatibility */
  objectives?: string[];
  timeline?: Array<{ time: string; activity: string; description: string }>;
  assessment?: string;
  differentiation?: string;
  extensions?: string;
};
