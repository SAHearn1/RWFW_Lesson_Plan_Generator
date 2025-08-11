// src/app/api/generatePlan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { LessonPlanSchema, type LessonPlan, Asset } from '@/lib/lessonSchema';
import { renderTeacherMarkdown, renderStudentMarkdown, renderTeacherHTML } from '@/lib/renderers';

export const runtime = 'nodejs';

const SYSTEM = `You are an expert K–12 curriculum designer (20+ years) specializing in STEAM, PBL, trauma-informed care, MTSS, CASEL SEL, and Gradual Release of Responsibility (GRR). 
Follow the Root Work Framework therapeutic context. 
ALWAYS include [Teacher Note:] and [Student Note:] in EVERY step (Opening, I Do, We Do, You Do Together, You Do Alone, Closing). 
Output STRICT JSON matching the provided schema and NO extra prose.`;

function buildUserPrompt(input: {
  gradeLevel: string;
  subjects: string[];
  durationDays: number;
  unitTitle?: string;
  standards?: string;
  focus?: string;
}) {
  const { gradeLevel, subjects, durationDays, unitTitle, standards, focus } = input;
  return `
Generate a JSON lesson plan for ${durationDays} days, 90 minutes per day, ${gradeLevel}, subjects: ${subjects.join(', ')}.
Unit Title: ${unitTitle || 'Rooted in Me: Exploring Culture, Identity, and Expression'}
Standards Input: ${standards || 'Align to common core or relevant state/NGSS; include SEL (CASEL).'}
Additional Focus: ${focus || 'None specified.'}

Constraints:
- For each day, include steps: Opening, I Do, We Do, You Do Together, You Do Alone, Closing (with minutes, descriptions, and mandatory [Teacher Note:] and [Student Note:]).
- Include MTSS tiers, assessments, SEL, rituals, choices, multimedia, reflection, extension.
- Build Appendix A assets using this naming convention: {LessonCode}_{GradeLevel}{SubjectAbbrev}_{DescriptiveTitle}.{filetype}.
- Incorporate garden/nature regulation rituals when appropriate.
- Student-facing language must be warm, empowering, and accessible.

Return JSON ONLY.
`.trim();
}

export async function POST(req: NextRequest) {
  const openai = new OpenAI();
  try {
    const body = await req.json().catch(() => ({}));
    const {
      gradeLevel = '',
      subjects = [],
      duration = '3',
      unitTitle = '',
      standards = '',
      focus = '',
    } = body || {};

    if (!gradeLevel || !Array.isArray(subjects) || subjects.length === 0) {
      return NextResponse.json({ error: 'gradeLevel and subjects[] are required.' }, { status: 400 });
    }

    const durationDays = Number(duration) || 3;

    // Ask the model for strict JSON (chat.completions, json_object)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: buildUserPrompt({
            gradeLevel,
            subjects,
            durationDays,
            unitTitle,
            standards,
            focus,
          }),
        },
        // Give the model the shape we expect (soft hint)
        {
          role: 'system',
          content:
            'Schema (fields & types) must align to: LessonPlan { meta, days[], appendixA[] }. Each day requires 6 steps and both notes per step.',
        },
      ],
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    // Validate with zod
    const parsed = LessonPlanSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid lesson JSON', issues: parsed.error.format(), raw },
        { status: 422 }
      );
    }

    // Tighten Appendix A entries: ensure minimum useful assets exist
    const lp: LessonPlan = ensureAppendixAssets(parsed.data);

    // Create branded Markdown/HTML
    const mdTeacher = renderTeacherMarkdown(lp);
    const mdStudent = renderStudentMarkdown(lp);
    const htmlTeacher = renderTeacherHTML(lp);

    return NextResponse.json(
      {
        lessonPlan: lp,
        markdown: {
          teacher: mdTeacher,
          student: mdStudent,
        },
        html: {
          teacher: htmlTeacher,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

/** Ensure Appendix A has core assets + consistent fields */
function ensureAppendixAssets(lp: LessonPlan): LessonPlan {
  const base: Asset[] = [
    {
      fileName: `RootedInMe_${lp.meta.gradeLevel}_${abbr(lp.meta.subjects[0])}_LessonCover.png`,
      type: 'image',
      description: 'Branded cover artwork (use for handouts/LMS tile).',
      altText: `Cover art for ${lp.meta.unitTitle}`,
      useInLesson: 'Front-matter / LMS',
      figure: 'Figure 1',
      generationPrompt:
        'High-quality cover with garden/nature + STEAM motifs, indigo/purple with emerald accents, no text.',
    },
    {
      fileName: `RootedInMe_${lp.meta.gradeLevel}_${abbr(lp.meta.subjects[0])}_RitualCard.png`,
      type: 'image',
      description: 'Breathing/grounding ritual visual (Opening).',
      altText: '4-7-8 breathing card with leaf silhouettes and step icons',
      useInLesson: 'Opening ritual (all days)',
      figure: 'Figure 2',
      generationPrompt:
        'Accessible infographic for 4-7-8 breathing; soft gradient, simple icons, sensory-friendly.',
    },
    {
      fileName: `RootedInMe_${lp.meta.gradeLevel}_${abbr(lp.meta.subjects[0])}_EvidenceToClaimOrganizer.docx`,
      type: 'docx',
      description: 'Graphic organizer: claim, evidence, reasoning.',
      altText: 'N/A (document)',
      useInLesson: 'We Do / You Do Together / Independent',
      figure: 'Figure 3',
    },
  ];

  const names = new Set(lp.appendixA.map(a => a.fileName));
  for (const a of base) if (!names.has(a.fileName)) lp.appendixA.push(a);
  return lp;
}

function abbr(subject: string): string {
  const map: Record<string, string> = {
    'English Language Arts': 'ELA',
    'Mathematics': 'MATH',
    'Science': 'SCI',
    'Social Studies': 'SOC',
    'Art': 'ART',
    'Music': 'MUS',
    'Physical Education': 'PE',
    'Special Education': 'SPED',
    'STEAM': 'STEAM',
    'Agriculture': 'AGSCI',
    'Career and Technical Education': 'CTE',
  };
  return map[subject] || subject?.toUpperCase()?.replace(/\W+/g, '').slice(0, 4);
}
