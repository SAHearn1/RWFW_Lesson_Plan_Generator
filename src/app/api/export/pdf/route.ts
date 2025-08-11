import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type LessonPlanData = {
  meta: { unitTitle: string; gradeLevel: string; subjects: string[]; durationDays: number };
};

function stripMd(md = ''): string {
  // basic Markdown → text; keeps lines
  return md
    .replace(/```[\s\S]*?```/g, s => s.replace(/```/g, '')) // keep code text
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)')
    .replace(/^\s*-\s+/gm, '• ')
    .replace(/\r/g, '');
}

function wrapText(text: string, max = 88) {
  const out: string[] = [];
  for (const line of text.split('\n')) {
    if (line.length <= max) {
      out.push(line);
      continue;
    }
    let start = 0;
    while (start < line.length) {
      out.push(line.slice(start, start + max));
      start += max;
    }
  }
  return out;
}

/** Creates a tiny, valid PDF with Helvetica, single page or multiple if needed. */
function makePdf(title: string, text: string): Uint8Array {
  // Page size: Letter 612x792
  const pageWidth = 612;
  const pageHeight = 792;
  const marginLeft = 54;
  const marginTop = 54;
  const lineHeight = 14; // pts
  const startY = pageHeight - marginTop;
  const linesPerPage = Math.floor((pageHeight - marginTop * 2) / lineHeight) - 2;

  const wrapped = wrapText(text, 88);
  const pages: string[][] = [];
  for (let i = 0; i < wrapped.length; i += linesPerPage) {
    pages.push(wrapped.slice(i, i + linesPerPage));
  }
  if (pages.length === 0) pages.push(['(empty)']);

  const objects: string[] = [];
  const xref: number[] = [];
  let offset = 0;
  const addObj = (s: string) => {
    xref.push(offset);
    objects.push(s);
    offset += Buffer.byteLength(s, 'utf8');
  };

  const header = `%PDF-1.4\n`;
  offset += Buffer.byteLength(header, 'utf8');

  // 1: Catalog
  addObj(`1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
`);

  // 2: Pages
  const kids = pages.map((_, i) => `${3 + i * 2} 0 R`).join(' ');
  addObj(`2 0 obj
<< /Type /Pages /Count ${pages.length} /Kids [ ${kids} ] >>
endobj
`);

  // For each page: Page (3,5,7,...) and Contents (4,6,8,...)
  const contentIds: number[] = [];
  pages.forEach((_p, idx) => {
    const pageId = 3 + idx * 2;
    const contentId = 4 + idx * 2;
    contentIds.push(contentId);

    addObj(`${pageId} 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}]
/Resources << /Font << /F1  ${3 + pages.length * 2} 0 R >> >>
/Contents ${contentId} 0 R >>
endobj
`);
  });

  // Font object (after pages): Helvetica
  const fontObjId = 3 + pages.length * 2;
  addObj(`${fontObjId} 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
`);

  // Content streams
  pages.forEach((lines, idx) => {
    const textOps: string[] = [];
    textOps.push(`BT`);
    textOps.push(`/F1 12 Tf`);
    textOps.push(`${marginLeft} ${startY} Td`);
    textOps.push(`(${escapePdfText(title)}) Tj`);
    textOps.push(`T*`);
    textOps.push(`T*`);
    for (const ln of lines) {
      textOps.push(`(${escapePdfText(ln)}) Tj`);
      textOps.push(`T*`);
    }
    textOps.push(`ET`);

    const stream = textOps.join('\n');
    const len = Buffer.byteLength(stream, 'utf8');

    addObj(`${4 + idx * 2} 0 obj
<< /Length ${len} >>
stream
${stream}
endstream
endobj
`);
  });

  // xref table
  const xrefStart = offset;
  let xrefStr = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  let runningOffset = Buffer.byteLength(header, 'utf8');
  for (let i = 0; i < objects.length; i++) {
    const off = xref[i] ?? 0;
    xrefStr += `${String(off).padStart(10, '0')} 00000 n \n`;
    runningOffset += Buffer.byteLength(objects[i], 'utf8');
  }

  const trailer = `trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${xrefStart}
%%EOF`;

  const parts = [header, ...objects, xrefStr, trailer];
  const pdf = Buffer.from(parts.join(''), 'utf8');
  return new Uint8Array(pdf);
}

function escapePdfText(s: string) {
  return s.replace(/([()\\])/g, '\\$1');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lp = body?.lessonPlan as LessonPlanData | undefined;
    const variant = (body?.variant as string) || 'print';
    const teacherMd = body?.markdown?.teacher as string | undefined;
    const studentMd = body?.markdown?.student as string | undefined;

    if (!lp?.meta) {
      return NextResponse.json({ error: 'Missing lessonPlan.meta' }, { status: 400 });
    }

    // Prefer provided markdown; otherwise fall back to a basic summary
    let md =
      variant === 'student'
        ? studentMd ?? ''
        : teacherMd ?? '';

    if (!md) {
      md = `Unit: ${lp.meta.unitTitle}\nGrade: ${lp.meta.gradeLevel}\nSubjects: ${lp.meta.subjects.join(
        ', ',
      )}\nDuration: ${lp.meta.durationDays} day(s)\n\n(Printable content not provided; regenerate to include teacher/student markdown.)`;
    }

    const text = stripMd(md);
    const bytes = makePdf(`${lp.meta.unitTitle} — ${variant.toUpperCase()}`, text);
    const filename = `${lp.meta.unitTitle.replace(/[^\w\d-_]+/g, '_')}-${variant}.pdf`;

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'PDF export failed' }, { status: 500 });
  }
}
