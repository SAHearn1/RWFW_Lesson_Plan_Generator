import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type LessonPlanData = {
  meta: { unitTitle: string; gradeLevel: string; subjects: string[]; durationDays: number };
};

function escHtml(s = '') {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function renderBrandHeader(meta: LessonPlanData['meta']) {
  return `
  <div style="padding:16px 20px;margin-bottom:10px;border-radius:12px;
              background:linear-gradient(135deg,#3b82f6,#7c3aed);color:#fff;">
    <div style="font-weight:700;font-size:14px;margin-bottom:6px">
      🌱 Root Work Framework — Ready to Teach
    </div>
    <div style="font-size:20px;font-weight:800;letter-spacing:.3px">${escHtml(meta.unitTitle)}</div>
    <div style="opacity:.9;margin-top:6px;font-size:12px">
      Grade: ${escHtml(meta.gradeLevel)} • Subjects: ${escHtml(meta.subjects.join(', '))} • Duration: ${meta.durationDays} day(s)
    </div>
  </div>`;
}

function mdToHtml(md: string) {
  // ultra-simple Markdown to HTML (bold, italics, headers, lists, code blocks, paragraphs)
  let html = escHtml(md);

  // code blocks
  html = html.replace(/```([\s\S]*?)```/g, (_m, code) => `<pre style="background:#f6f8fa;padding:12px;border-radius:8px;"><code>${escHtml(code)}</code></pre>`);
  // headers
  html = html.replace(/^###### (.*)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.*)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.*)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');
  // bold / italics
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // lists
  html = html.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)(\s*(?!<li>))/gms, '<ul>$1</ul>$2');
  // paragraphs
  html = html.replace(/^(?!<h\d|<ul|<li|<pre|<p|<\/)(.+)$/gm, '<p>$1</p>');

  return html;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lp = body?.lessonPlan as LessonPlanData | undefined;
    const variant = (body?.variant as string) || 'teacher';
    const teacherMd = body?.markdown?.teacher as string | undefined;
    const studentMd = body?.markdown?.student as string | undefined;

    if (!lp?.meta) {
      return NextResponse.json({ error: 'Missing lessonPlan.meta' }, { status: 400 });
    }

    // Prefer client-provided markdown if present
    const mainMd =
      variant === 'student' ? studentMd ?? '(Student view not provided)' : teacherMd ?? '(Teacher view not provided)';

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escHtml(lp.meta.unitTitle)} — ${variant}</title>
  <style>
    body{font-family:Helvetica,Arial,sans-serif;line-height:1.45;color:#111;margin:24px}
    h1,h2,h3{color:#111;margin:18px 0 8px}
    h1{font-size:24px} h2{font-size:20px} h3{font-size:18px}
    p{margin:8px 0}
    ul{margin:8px 0 8px 24px}
    .badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;background:#eef2ff;color:#3730a3}
    .hr{height:1px;background:#e5e7eb;margin:16px 0}
  </style>
</head>
<body>
  ${renderBrandHeader(lp.meta)}
  <div class="badge">${variant === 'student' ? 'Student-Facing' : 'Teacher-Facing'}</div>
  <div class="hr"></div>
  ${mdToHtml(mainMd || '')}
</body>
</html>`;

    const filename = `${lp.meta.unitTitle.replace(/[^\w\d-_]+/g, '_')}-${variant}.doc`;
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'application/msword; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Export failed' }, { status: 500 });
  }
}
