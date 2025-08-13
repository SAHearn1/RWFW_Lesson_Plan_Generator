// src/app/api/generatePlan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = ['iad1'];
export const maxDuration = 60;

const ROUTE_ID = 'generatePlan-v8-anthropic-2025-08-12-unique';

// Lesson plan specific configuration for unique bundling
const LESSON_PLAN_CONFIG = {
  maxDays: 5,
  gradeRanges: ['K-2', '3-5', '6-8', '9-12'],
  instructionalFrameworks: ['GRR', 'PBL', 'STEAM', 'MTSS', 'CASEL'],
  generator: 'lesson-plan-generator-v8'
};

// Incoming payload (may be partial/optional)
type GeneratePlanInput = {
  gradeLevel?: string;
  subject?: string;
  durationMinutes?: number;
  topic?: string;
  standards?: string[];
  days?: number;

  brandName?: string;
  includeAppendix?: boolean;
  includeRubrics?: boolean;
  includeAssetsDirectory?: boolean;

  userPrompt?: string;
};

// Fully normalized, non-optional version (safe to use everywhere)
type NormalizedInput = {
  gradeLevel: string;
  subject: string;
  durationMinutes: number;
  topic: string;
  standards: string[];
  days: number;

  brandName: string;
  includeAppendix: boolean;
  includeRubrics: boolean;
  includeAssetsDirectory: boolean;

  userPrompt: string;
};

type LessonPlanJSON = {
  meta: {
    title: string;
    subtitle?: string;
    gradeLevel: string;
    subject: string;
    days: number;
    durationMinutes: number;
    essentialQuestion: string;
    standards: string[];
  };
  days: Array<{
    day: number;
    title: string;
    learningTarget: string;
    essentialQuestion: string;
    standards: string[];
    flow: {
      opening: { minutes: number; activity: string; teacherNote: string; studentNote: string };
      iDo: { minutes: number; activity: string; teacherNote: string; studentNote: string };
      weDo: { minutes: number; activity: string; teacherNote: string; studentNote: string };
      youDoTogether: { minutes: number; activity: string; teacherNote: string; studentNote: string };
      youDoAlone: { minutes: number; activity: string; teacherNote: string; studentNote: string };
      closing: { minutes: number; activity: string; teacherNote: string; studentNote: string };
    };
    mtss: {
      tier1: string[];
      tier2: string[];
      tier3: string[];
    };
    selCompetencies: string[];
    regulationRituals: string[];
    assessment: {
      formative: string[];
      summative?: string[];
    };
    resources: string[];
  }>;
  appendixA?: {
    assets: Array<{
      fileName: string;
      type: 'image' | 'pdf' | 'docx' | 'sheet' | 'link';
      description: string;
      altText?: string;
      howToGenerate?: string;
      linkPlaceholder?: string;
      figure?: string;
    }>;
    namingConvention: string;
  };
  markdown?: string;
};

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Lesson plan specific validation function
function validateLessonPlanStructure(plan: any): boolean {
  return !!(plan?.meta?.title && plan?.days?.length && plan?.days[0]?.flow);
}

function safeParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function normalizeInput(body: GeneratePlanInput | null): NormalizedInput {
  const days = Math.min(Math.max(body?.days ?? 3, 1), LESSON_PLAN_CONFIG.maxDays);
  
  // Ensure standards is always a valid array
  const standards = body?.standards && Array.isArray(body.standards) && body.standards.length > 0
    ? body.standards
    : ['CCSS.ELA-LITERACY.RI.9-10.1'];
  
  return {
    gradeLevel: body?.gradeLevel ?? '10',
    subject: body?.subject ?? 'ELA',
    durationMinutes: body?.durationMinutes ?? 90,
    topic: body?.topic ?? 'Citing Textual Evidence to Support a Claim',
    standards,
    days,
    brandName: body?.brandName ?? 'Root Work Framework',
    in
