// src/app/api/export/docx/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';
import { LessonPlanSchema, type LessonPlan } from '@/lib/lessonSchema';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LessonPlanSchema.safeParse(body?.lessonPlan);
    const variant = (body?.variant as 'teacher'|'student'|'print') || 'teacher';
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid lesson JSON' }, { status: 400 });
    }
    const lp: LessonPlan = parsed.data;

    const doc = new Document({
      creator: 'Root Work Framework',
      title: `${lp.meta.unitTitle} — ${variant.toUpperCase()}`,
      styles: {
        paragraphStyles: [
          {
            id: 'Heading2Brand',
            name: 'Heading2Brand',
            basedOn: 'Heading2',
            next: 'Normal',
          },
        ],
      },
    });

    const sections: Paragraph[] = [];

    sections.push(new Paragraph({
      text: `${lp.meta.unitTitle} — ${variant === 'student' ? 'Student Edition' : 'Teacher Edition'}`,
      heading: HeadingLevel.TITLE,
    }));
    sections.push(new Paragraph({
      children: [
        new TextRun({ text: `Grade: ${lp.meta.gradeLevel}   Subjects: ${lp.meta.subjects.join(', ')}`, bold: true }),
      ],
    }));
    sections.push(new Paragraph({ text: `Duration: ${lp.meta.durationDays} day(s), ${lp.meta.blockMinutes} min/day` }));

    for (const d of lp.days) {
      sections.push(new Paragraph({ text: `Day ${d.dayNumber}: ${d.title}`, heading: HeadingLevel.HEADING_2 }));
      sections.push(new Paragraph({ text: `Essential Question: ${d.essentialQuestion}` }));
      sections.push(new Paragraph({ text: `Learning Target: ${d.learningTarget}` }));
      if (variant !== 'student') sections.push(new Paragraph({ text: `Standards: ${d.standards.join('; ') || '—'}` }));

      for (const s of d.steps) {
        sections.push(new Paragraph({ text: `${s.label} (${s.minutes} min)`, heading: HeadingLevel.HEADING_3 }));
        sections.push(new Paragraph({ text: s.description }));
        if (variant !== 'student') sections.push(new Paragraph({ text: `[Teacher Note:] ${s.teacherNote}` }));
        sections.push(new Paragraph({ text: `[Student Note:] ${s.studentNote}` }));
      }

      if (variant !== 'student') {
        sections.push(new Paragraph({ text: `MTSS` , heading: HeadingLevel.HEADING_3 }));
        sections.push(new Paragraph({ text: `Tier 1: ${d.mtss.tier1.join('; ') || '—'}` }));
        sections.push(new Paragraph({ text: `Tier 2: ${d.mtss.tier2.join('; ') || '—'}` }));
        sections.push(new Paragraph({ text: `Tier 3: ${d.mtss.tier3.join('; ') || '—'}` }));
        sections.push(new Paragraph({ text: `Assessment — Formative: ${d.assessment.formative.join('; ') || '—'}` }));
        sections.push(new Paragraph({ text: `Assessment — Summative: ${d.assessment.summative.join('; ') || '—'}` }));
      }

      sections.push(new Paragraph({ text: `Reflection: ${d.reflection.join('; ') || '—'}` }));
      sections.push(new Paragraph({ text: `—` }));
    }

    // Appendix A
    sections.push(new Paragraph({ text: `Appendix A: Resource & Visual Asset Directory`, heading: HeadingLevel.HEADING_2 }));
    for (const a of lp.appendixA) {
      sections.push(new Paragraph({ text: `• ${a.fileName} (${a.type}) — ${a.description}` }));
      if (a.useInLesson) sections.push(new Paragraph({ text: `  Use: ${a.useInLesson}` }));
      if (a.altText) sections.push(new Paragraph({ text: `  Alt text: ${a.altText}` }));
      if (a.figure) sections.push(new Paragraph({ text: `  Figure: ${a.figure}` }));
      if (a.generationPrompt) sections.push(new Paragraph({ text: `  Prompt: ${a.generationPrompt}` }));
    }

    doc.addSection({ children: sections });

    const buffer = await Packer.toBuffer(doc);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${sanitize(
          `${lp.meta.unitTitle}-${variant}.docx`
        )}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Export failed' }, { status: 500 });
  }
}

function sanitize(s: string) {
  return s.replace(/[^\w\-.]+/g, '_');
}
