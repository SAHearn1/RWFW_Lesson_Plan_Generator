// src/lib/lessonSchema.ts
import { z } from 'zod';

export const StepSchema = z.object({
  label: z.enum(['Opening', 'I Do', 'We Do', 'You Do Together', 'You Do Alone', 'Closing']),
  minutes: z.number().int().positive(),
  description: z.string().min(10),
  teacherNote: z.string().min(5), // mandatory note
  studentNote: z.string().min(5), // mandatory note
});

export const MTSSSchema = z.object({
  tier1: z.array(z.string()).default([]),
  tier2: z.array(z.string()).default([]),
  tier3: z.array(z.string()).default([]),
});

export const DaySchema = z.object({
  dayNumber: z.number().int().positive(),
  title: z.string().min(3),
  essentialQuestion: z.string().min(5),
  learningTarget: z.string().min(5),
  standards: z.array(z.string()).default([]),
  steps: z.array(StepSchema).length(6),  // Opening, I Do, We Do, You Do Together, You Do Alone, Closing
  mtss: MTSSSchema,
  studentFacing: z.array(z.string()).default([]),
  facilitatorGuidance: z.array(z.string()).default([]),
  assessment: z.object({
    formative: z.array(z.string()).default([]),
    summative: z.array(z.string()).default([]),
  }),
  selCompetencies: z.array(z.string()).default([]),
  regulationRituals: z.array(z.string()).default([]),
  choices: z.array(z.string()).default([]),
  multimedia: z.array(z.string()).default([]),
  reflection: z.array(z.string()).default([]),
  extension: z.array(z.string()).default([]),
});

export const AssetSchema = z.object({
  fileName: z.string(),
  type: z.enum(['image','pdf','docx','md','csv','pptx']).default('image'),
  description: z.string(),
  altText: z.string().default(''),
  useInLesson: z.string().default(''),
  figure: z.string().optional(),
  generationPrompt: z.string().optional(),
});

export const LessonPlanSchema = z.object({
  meta: z.object({
    unitTitle: z.string(),
    gradeLevel: z.string(),
    subjects: z.array(z.string()).min(1),
    durationDays: z.number().int().positive(),
    blockMinutes: z.number().int().positive().default(90),
    standardsInput: z.string().default(''),
    focus: z.string().default(''),
    branding: z.object({
      product: z.literal('Root Work Framework'),
      tagline: z.string().default('S.T.E.A.M. Powered, Trauma Informed, Project Based'),
      palette: z.object({
        brand: z.string().default('#4f46e5'),
        accent: z.string().default('#10b981'),
      }).default({ brand: '#4f46e5', accent: '#10b981' }),
    }).default({
      product: 'Root Work Framework',
      tagline: 'S.T.E.A.M. Powered, Trauma Informed, Project Based',
      palette: { brand: '#4f46e5', accent: '#10b981' },
    }),
  }),
  days: z.array(DaySchema).min(1),
  appendixA: z.array(AssetSchema).default([]),
});

export type LessonPlan = z.infer<typeof LessonPlanSchema>;
export type Day = z.infer<typeof DaySchema>;
export type Step = z.infer<typeof StepSchema>;
export type Asset = z.infer<typeof AssetSchema>;
