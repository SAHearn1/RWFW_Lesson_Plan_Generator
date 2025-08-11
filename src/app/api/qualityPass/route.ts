import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

// Reuse your OpenAI key + model
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const SYSTEM_PROMPT = `
ROLE: Senior editor for trauma-informed, STEAM-aligned K–12 lesson plans using the Root Work Framework (RWF).

TASK: Take a DRAFT lesson plan in Markdown and return a SINGLE, fully rewritten lesson plan in Markdown that:
- Preserves the original intent and constraints from the user's context (grade level, subjects, duration, unit title).
- Strictly follows the RWF protocol:
  • 3–5 day unit (unless otherwise specified)
  • GRR every day (Opening, I Do, We Do, You Do Together, You Do Alone, Closing) with minute allocations
  • Each component includes BOTH notes:
      [Teacher Note: ...] (1–3 sentences; pedagogy rationale, trauma-informed considerations, differentiation, assessment insight)
      [Student Note: ...] (1–2 sentences; warm second-person coaching; agency & regulation support)
  • MTSS Supports (Tier 1–3) per day
  • SEL competencies per day
  • Regulation rituals (garden/nature-based) per day
  • Student choice, assessments, multimodal resources per day
- Ends with a single "Appendix A: Resource & Visual Asset Directory" that:
  • Lists every referenced/generated asset in a GFM table with columns:
    | File Name | Type | Description/Purpose | Alt-text | How to Generate/Use | Link Placeholder | Media Source Instructions | Figure Ref |
  • Uses the naming convention:
    {LessonCode}_{GradeLevel}{SubjectAbbrev}_{DescriptiveTitle}.{ext}
  • Includes image generation prompts (natural language), alt-text, and where assets are used in the lesson.

STRICT RULES:
- Do NOT output any meta commentary or analysis—ONLY the final improved Markdown lesson plan.
- If any component is missing teacher/student notes, REGENERATE that component so both are present.
- Do not fabricate links; use placeholders like [Insert Flipgrid link here].
- Clean, professional formatting; use headings, lists, and tables consistently.
- Assume a 90-minute block if not otherwise specified.

QUALITY CHECK BEFORE RETURNING:
- GRR present daily with minute allocations.
- Opening / I Do / We Do / You Do Together / You Do Alone / Closing each have [Teacher Note:] and [Student Note:].
- MTSS, SEL, Regulation Rituals present each day.
- Appendix A exists with the asset table + prompts and follows naming convention.
- Output is Markdown only.
`.trim();

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is missing in environment variables.' },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    const lesson = (body?.lesson as string | undefined)?.trim();
    const context = body?.context as
      | {
          gradeLevel?: string;
          subjects?: string[];
          duration?: string | number;
          unitTitle?: string;
        }
      | undefined;

    if (!lesson) {
      return NextResponse.json({ error: 'Missing "lesson" in body.' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const userBlock = `
CONTEXT:
- Grade Level: ${context?.gradeLevel || '—'}
- Subjects: ${Array.isArray(context?.subjects) ? context?.subjects.join(', ') : '—'}
- Duration (days): ${context?.duration || '—'}
- Unit Title: ${context?.unitTitle || '—'}

DRAFT LESSON (Markdown):
\`\`\`markdown
${lesson}
\`\`\`

Rewrite per the system instructions and return ONLY the final Markdown.
`.trim();

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.4,
      max_tokens: 6000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userBlock },
      ],
    });

    const improved = completion.choices?.[0]?.message?.content?.trim() || '';
    if (!improved) {
      throw new Error('The model returned an empty response.');
    }

    return NextResponse.json({ lessonPlan: improved }, { status: 200 });
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error('qualityPass error:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
