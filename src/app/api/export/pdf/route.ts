// src/app/api/export/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { LessonPlanSchema, type LessonPlan } from '@/lib/lessonSchema';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LessonPlanSchema.safeParse(body?.lessonPlan);
    const variant = (body?.variant as 'teacher'|'student'|'print') || 'print';
    if (!parsed.success) return NextResponse.json({ error: 'Invalid lesson JSON' }, { status: 400 });
    const lp: LessonPlan = parsed.data;

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const page = pdf.addPage([612, 792]); // Letter
    let y = 760;

    const colorBrand = hexToRgb(lp.meta.branding.palette.brand || '#4f46e5');

    const draw = (text: string, opts: { bold?: boolean; size?: number } = {}) => {
      const size = opts.size ?? 12;
      const usedFont = opts.bold ? fontBold : font;
      page.drawText(text, { x: 48, y, size, font: usedFont, color: rgb(0,0,0) });
      y -= size + 6;
      if (y < 72) {
        // new page
      }
    };

    // Brand bar
    page.drawRectangle({ x: 0, y: 780, width: 612, height: 12, color: rgb(colorBrand.r, colorBrand.g, colorBrand.b) });

    draw(`${lp.meta.unitTitle} — ${variant === 'student' ? 'Student Edition' : 'Teacher Edition'}`, { bold: true, size: 18 });
    draw(`Grade: ${lp.meta.gradeLevel}   Subjects: ${lp.meta.subjects.join(', ')}`);
    draw(`Duration: ${lp.meta.durationDays} day(s), ${lp.meta.blockMinutes} min/day}`);
    draw(` `);

    for (const d of lp.days) {
      draw(`Day ${d.dayNumber}: ${d.title}`, { bold: true, size: 14 });
      draw(`Essential Question: ${d.essentialQuestion}`);
      draw(`Learning Target: ${d.learningTarget}`);
      for (const s of d.steps) {
        draw(`${s.label} (${s.minutes} min)`, { bold: true });
        draw(s.description);
        if (variant !== 'student') draw(`[Teacher Note:] ${s.teacherNote}`);
        draw(`[Student Note:] ${s.studentNote}`);
      }
      draw(`—`);
    }

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${sanitize(`${lp.meta.unitTitle}-${variant}.pdf`)}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'PDF export failed' }, { status: 500 });
  }
}

function sanitize(s: string) { return s.replace(/[^\w\-.]+/g, '_'); }

function hexToRgb(hex: string) {
  const m = hex.replace('#','').match(/.{1,2}/g);
  const [r,g,b] = (m || ['4f','46','e5']).map(h => parseInt(h, 16) / 255);
  return { r, g, b };
}
