// /src/app/api/generate-lesson/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type MasterPromptRequest = {
  subject: string;
  gradeLevel: string;
  topic: string;
  duration: string;
  numberOfDays: string;
  learningObjectives?: string;
  specialNeeds?: string;
  availableResources?: string;
  location?: string;
  unitContext?: string;
  lessonType?: string;
  specialInstructions?: string;
};

type GeneratedResource = {
  filename: string;
  content: string;
  type: string;
};

function okJson(data: unknown, init: ResponseInit = {}) {
  return NextResponse.json(data, { ...init, headers: { 'Cache-Control': 'no-store' } });
}

function normalizeShape(input: any): Partial<MasterPromptRequest> {
  if (!input || typeof input !== 'object') return input;
  if (input.payload && typeof input.payload === 'object') return input.payload;
  if (typeof input.body === 'string') {
    try {
      const parsed = JSON.parse(input.body);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}
  }
  if (input.data && typeof input.data === 'object') return input.data;
  return input;
}

async function parseLessonRequest(req: NextRequest): Promise<Partial<MasterPromptRequest> | null> {
  const ct = req.headers.get('content-type') || '';

  if (ct.includes('application/json')) {
    try {
      const json = await req.json();
      return normalizeShape(json);
    } catch {}
  }

  try {
    const raw = await req.text();
    if (raw && raw.trim().startsWith('{')) {
      const json = JSON.parse(raw);
      return normalizeShape(json);
    }
  } catch {}

  if (ct.includes('application/x-www-form-urlencoded')) {
    try {
      const form = await req.formData();
      const o: Record<string, string> = {};
      for (const [k, v] of form.entries()) if (typeof v === 'string') o[k] = v;
      return normalizeShape(o);
    } catch {}
  }

  return null;
}

function getSubjectAbbreviation(subject: string): string {
  const map: Record<string, string> = {
    'English Language Arts': 'ELA',
    Mathematics: 'MATH',
    Science: 'SCI',
    'Social Studies': 'SOC',
    'STEAM (Integrated)': 'STEAM',
    'Special Education': 'SPED',
    Agriculture: 'AGSCI',
    'Environmental Science': 'ENVSCI',
    'Life Skills': 'LIFE',
    'Social-Emotional Learning': 'SEL',
    Art: 'ART',
    Music: 'MUS',
    'Physical Education': 'PE',
    'Career & Technical Education': 'CTE',
    'World Languages': 'WL',
  };
  return map[subject] || 'GEN';
}

function processTopicForReadability(topic: string): string {
  let t = (topic || '').trim();
  if (!t) return 'Core Concept';
  if (t.length > 60) t = t.split(' ').slice(0, 8).join(' ');
  return t
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function cleanContent(content: string): string {
  return (content || '')
    .replace(/â€"/g, '—')
    .replace(/â€œ|â€/g, '"')
    .replace(/â€™/g, "'")
    .replace(/Ã—/g, '×')
    .replace(/â€¦/g, '...')
    .replace(/Â/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/#{1,6}\s*/g, '')               // remove markdown heads
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1') // bold/italics
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links -> text
    .replace(/`{1,3}([^`]+)`{1,3}/g, '$1')   // inline code
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Convert our directive-style text into a styled, printable HTML page */
function formatAsEnhancedHTML(content: string, data: MasterPromptRequest): string {
  const cleaned = cleanContent(content);
  const topic = processTopicForReadability(data.topic);

  const css = `
@page {
  margin: 0.75in;
  @bottom-center {
    content: "Page " counter(page) " of " counter(pages);
    font-size: 10pt;
    color: #666;
  }
}
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 11pt; line-height: 1.45; color:#2B2B2B; margin:0; padding:0; background:#fff;
}
.header {
  display:flex; gap:12pt; align-items:center; padding:16pt; margin:16pt;
  border:2pt solid #D4C862; border-radius:12pt; background:linear-gradient(135deg,#F2F4CA,#E8ECBF);
}
.header img { width:56px; height:56px; object-fit:contain; border-radius:50%; border:2pt solid #D4C862; background:#fff; }
.level-1-heading {
  font-size:18pt; font-weight:800; color:#ffffff;
  margin:24pt 16pt 12pt; padding:10pt 12pt; border-radius:8pt;
  background:linear-gradient(135deg,#1B365D 0%, #2E86AB 100%);
}
.level-2-heading {
  font-size:14pt; font-weight:800; color:#2E86AB;
  margin:18pt 16pt 8pt; padding-bottom:6pt; border-bottom:2pt solid #2E86AB;
}
.level-3-heading {
  font-size:12pt; font-weight:800; color:#3B523A;
  margin:12pt 16pt 6pt; padding:6pt 10pt; background:#F2F4CA; border-left:6pt solid #3B523A; border-radius:6pt;
}
.day-section {
  margin: 16pt; padding: 16pt; background:#FEFEFE; border:1pt solid #E0E0E0; border-radius:12pt; box-shadow:0 4pt 12pt rgba(0,0,0,0.06);
}
.rs-block { margin:12pt 0; padding:12pt; border-left:6pt solid #D4C862; background:#F8F9FA; border-radius:0 8pt 8pt 0; }
.note { margin:10pt 16pt; padding:12pt; border-radius:8pt; font-size:10pt; border-left:4pt solid; }
.teacher { background:linear-gradient(135deg,#E8F4FD 0%, #F0F8FF 100%); border-left-color:#2E86AB; color:#1B365D; }
.student { background:linear-gradient(135deg,#F0F9E8 0%, #F8FFF8 100%); border-left-color:#28A745; color:#155724; }
table { width:calc(100% - 32pt); margin:12pt 16pt; border-collapse:collapse; background:#fff; border-radius:8pt; overflow:hidden; box-shadow:0 2pt 8pt rgba(0,0,0,0.05); }
th, td { border:1pt solid #E0E0E0; padding:8pt 12pt; text-align:left; vertical-align:top; }
th { background:linear-gradient(135deg,#1B365D 0%, #2E86AB 100%); color:#fff; font-weight:800; }
tr:nth-child(even) { background:#F8F9FA; }
.content { margin: 0 16pt 24pt; }
.footer { margin: 24pt 16pt; padding-top:12pt; border-top:2pt solid #F2F4CA; text-align:center; color:#666; font-size:10pt; }
  `.trim();

  // Convert directive text to HTML fragments
  let html = cleaned;

  // 1) Heading hierarchy (fix groups to $1)
  html = html.replace(/LEVEL I HEADING:\s*(.+)/g, '<h1 class="level-1-heading">$1</h1>');
  html = html.replace(/LEVEL II HEADING:\s*(.+)/g, '<h2 class="level-2-heading">$1</h2>');
  html = html.replace(/LEVEL III HEADING:\s*(.+)/g, '<h3 class="level-3-heading">$1</h3>');

  // 2) Day sections
  html = html.replace(/(^|\n)DAY\s+(\d+):\s*([^\n]+)\n/g, (_m: string, p1: string, dayNum: string, title: string) =>
    `${p1}<div class="day-section"><h1 class="level-1-heading">DAY ${dayNum}: ${title}</h1>`
  );
  // Close day sections when a new LEVEL I or end reached
  html = html.replace(/<\/h1>\n(?=LEVEL I HEADING:|$)/g, '</h1></div>\n');

  // 3) 5Rs blocks
  html = html.replace(/RELATIONSHIPS\s*\((\d+)\s*minutes\)/g, '<div class="rs-block"><div class="level-3-heading">RELATIONSHIPS ($1 minutes)</div>');
  html = html.replace(/ROUTINES\s*\((\d+)\s*minutes\)/g, '</div><div class="rs-block"><div class="level-3-heading">ROUTINES ($1 minutes)</div>');
  html = html.replace(/RELEVANCE\s*\((\d+)\s*minutes\)/g, '</div><div class="rs-block"><div class="level-3-heading">RELEVANCE ($1 minutes)</div>');
  html = html.replace(/RIGOR\s*\((\d+)\s*minutes\)/g, '</div><div class="rs-block"><div class="level-3-heading">RIGOR ($1 minutes)</div>');
  html = html.replace(/REFLECTION\s*\((\d+)\s*minutes\)/g, '</div><div class="rs-block"><div class="level-3-heading">REFLECTION ($1 minutes)</div>');
  // Close any open rs-blocks when the next heading appears
  html = html.replace(/<\/div>\n(?=<h[123]|LEVEL I HEADING:|$)/g, '</div>\n');

  // 4) Notes
  html = html.replace(/Teacher Note:\s*([^\n]+)/g, '<div class="note teacher"><b>Teacher Note:</b> $1</div>');
  html = html.replace(/Student Note:\s*([^\n]+)/g, '<div class="note student"><b>Student Note:</b> $1</div>');

  // 5) CREATE TABLE blocks: pipe tables -> HTML table
  html = html.replace(
    /CREATE TABLE(?: FOR [A-Z\s]+)?:\s*\n((?:[^\n]*\|[^\n]*\|[^\n]*\n?)+)/g,
    (_m: string, tableBlock: string) => {
      const lines = tableBlock
        .trim()
        .split('\n')
        .filter((ln: string) => ln.trim().length > 0);
      if (!lines.length) return '';
      const [headerLine, ...dataLines] = lines;
      const headers = headerLine.split('|').map((s: string) => s.trim());
      let out = '<table><thead><tr>';
      headers.forEach((h: string) => (out += `<th>${h}</th>`));
      out += '</tr></thead><tbody>';
      dataLines.forEach((line: string) => {
        const cells = line.split('|').map((s: string) => s.trim());
        if (cells.filter(Boolean).length) {
          out += '<tr>' + cells.map((c: string) => `<td>${c}</td>`).join('') + '</tr>';
        }
      });
      out += '</tbody></table>';
      return out;
    }
  );

  // 6) Simple bullet conversion for lines that start with "- "
  html = html.replace(/(?:^|\n)-\s+(.+?)(?=\n(?!- )|$)/gs, (_m: string, group: string) => {
    const items = group
      .split('\n')
      .map((ln: string) => ln.trim())
      .filter((ln: string) => ln.startsWith('- '))
      .map((ln: string) => `<li>${ln.replace(/^- /, '')}</li>`)
      .join('');
    return items ? `\n<ul>${items}</ul>` : _m;
  });

  const header = `
<div class="header">
  <img src="/logo.png" alt="Root Work Framework" />
  <div>
    <div style="font-size:20pt;font-weight:800;color:#082A19;margin-bottom:4pt">Root Work Framework Lesson Plan</div>
    <div style="color:#3B523A">Professional, trauma-informed learning design</div>
    <div style="margin-top:6pt;color:#3B523A"><b>Topic:</b> ${topic} &nbsp; • &nbsp; <b>Grade:</b> ${data.gradeLevel} &nbsp; • &nbsp; <b>Subject:</b> ${data.subject} &nbsp; • &nbsp; <b>Duration:</b> ${data.duration} × ${data.numberOfDays} days</div>
  </div>
</div>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${topic} — Grade ${data.gradeLevel}</title>
<style>${css}</style>
</head>
<body>
${header}
<div class="content">
${html}
</div>
<div class="footer">
  Generated by Root Work Framework — ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
</div>
</body>
</html>`;
}

/** Extract simple text resources from the content (first run teacher helpers) */
function generateDownloadableResources(content: string, data: MasterPromptRequest): { textResources: GeneratedResource[] } {
  const topic = processTopicForReadability(data.topic);
  const code = `RootedIn${topic.replace(/[^A-Za-z]/g, '')}_${data.gradeLevel}${getSubjectAbbreviation(data.subject)}`;

  const res: GeneratedResource[] = [];

  // A light set of artifacts teachers can use immediately
  const exitTicket = `EXIT TICKET — ${topic}\n\nOne thing I learned today:\n_____________________________\n\nOne question I still have:\n_____________________________\n\nHow confident do I feel (1–5): ____`;
  res.push({ filename: `${code}_ExitTicket.txt`, content: exitTicket, type: 'text/plain' });

  const reflection = `REFLECTION PROMPTS — ${topic}\n\n• What was most challenging today and how did you work through it?\n• Where did you see relevance to your life or community?\n• What’s a strategy you want to try tomorrow?`;
  res.push({ filename: `${code}_ReflectionPrompts.txt`, content: reflection, type: 'text/plain' });

  const rubric = `QUICK RUBRIC — ${topic}\n\nCriterion | Developing | Proficient | Advanced\nClarity of Ideas | Needs focus | Clear & organized | Insightful & compelling\nUse of Evidence | Limited | Appropriate | Strong & varied\nCollaboration | Uneven | Consistent | Leadership & support`;
  res.push({ filename: `${code}_QuickRubric.txt`, content: rubric, type: 'text/plain' });

  return { textResources: res };
}

function buildEnhancedFallback(data: MasterPromptRequest): { content: string; htmlVersion: string; cleanVersion: string } {
  // A short but well-structured fallback (still converts to HTML nicely)
  const content = `
LEVEL I HEADING: TRAUMA-INFORMED STEAM LESSON PLAN
Grade: ${data.gradeLevel}
Subject: ${data.subject}
Topic: ${data.topic}
Duration: ${data.duration} per day over ${data.numberOfDays} days
Location: ${data.location || 'Savannah, Georgia'}

LEVEL I HEADING: LESSON OVERVIEW
This unit develops belonging and rigorous thinking while connecting learning to students' lives and community.

LEVEL I HEADING: UNIT ESSENTIAL QUESTION
How does ${data.topic} help us understand ourselves and our world?

LEVEL I HEADING: UNIT LEARNING TARGETS
- I can explain key concepts of ${data.topic} (DOK 2)
- I can apply understanding in new contexts (DOK 3)
- I can evaluate impacts and propose solutions (DOK 4)

LEVEL I HEADING: DAY 1: Foundation
LEVEL II HEADING: Standards Alignment
CREATE TABLE:
Standard Type | Standard Code | Description
Primary Standard | Content Standard | Core expectations for today
SEL Integration | CASEL | Self-Awareness
Cross-Curricular | STEAM | Connections across disciplines

LEVEL II HEADING: Root Work Framework 5 Rs Structure
RELATIONSHIPS (12 minutes)
Teacher Note: Greet students, community circle, identity-affirming norms.
Student Note: Share a connection to today's topic.

ROUTINES (8 minutes)
Teacher Note: Preview agenda and success criteria.
Student Note: Get organized and ready.

RELEVANCE (15 minutes)
Teacher Note: Bridge to local/community examples.
Student Note: Where do you see this in your world?

RIGOR (30 minutes)
Teacher Note: I Do/We Do/You Do Together sequence with scaffolds.
Student Note: Use sentence stems and graphic organizer.

REFLECTION (10 minutes)
Teacher Note: Guided processing and forward look.
Student Note: What did you learn? What’s next?

LEVEL II HEADING: Day 1 Implementation Supports
CREATE TABLE:
Support Tier | Target Population | Specific Strategies
Tier 1 Universal | All Students | Visuals • Choice • Clear criteria
Tier 2 Targeted | Some Students | Small group • Checks • Graphic organizers
Tier 3 Intensive | Few Students | 1:1 support • Modified task
504 Accommodations | Students w/ disabilities | Time • AT • Seating
Gifted Extensions | Advanced Learners | Open-ended inquiry
SPED Modifications | IEPs | Simplified language • Step-wise tasks

LEVEL II HEADING: Day 1 Assessment
CREATE TABLE:
Assessment Type | Method | Purpose
Formative | Exit Ticket | Gauge understanding
Summative | Product/Performance | Synthesize learning
`;

  const cleanVersion = cleanContent(content);
  const htmlVersion = formatAsEnhancedHTML(content, data);
  return { content, htmlVersion, cleanVersion };
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseLessonRequest(request);
    const received = parsed ?? {};

    const warnings: string[] = [];
    const subject = (received as any).subject?.trim?.() || (warnings.push('Defaulted subject to "General Studies"'), 'General Studies');
    const gradeLevel = (received as any).gradeLevel?.trim?.() || (warnings.push('Defaulted gradeLevel to "6"'), '6');
    const topic = (received as any).topic?.trim?.() || (warnings.push('Defaulted topic to "Core Concept"'), 'Core Concept');
    const duration = (received as any).duration?.trim?.() || (warnings.push('Defaulted duration to "90 minutes"'), '90 minutes');
    const numberOfDays = (received as any).numberOfDays?.trim?.() || (warnings.push('Defaulted numberOfDays to "5"'), '5');

    const data: MasterPromptRequest = {
      subject,
      gradeLevel,
      topic,
      duration,
      numberOfDays,
      learningObjectives: (received as any).learningObjectives ?? '',
      specialNeeds: (received as any).specialNeeds ?? '',
      availableResources: (received as any).availableResources ?? '',
      location: (received as any).location ?? 'Savannah, Georgia',
      unitContext: (received as any).unitContext ?? '',
      lessonType: (received as any).lessonType ?? 'comprehensive_multi_day',
      specialInstructions: (received as any).specialInstructions ?? '',
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      const fb = buildEnhancedFallback(data);
      const resources = generateDownloadableResources(fb.cleanVersion, data);
      return okJson({
        lessonPlan: fb.cleanVersion,
        htmlVersion: fb.htmlVersion,
        plainText: fb.content,
        resources,
        fallback: true,
        success: true,
        warnings: [...warnings, 'Used fallback because ANTHROPIC_API_KEY is not set.'],
      });
    }

    // Build master prompt
    const number = parseInt(numberOfDays || '5', 10);
    const prompt = `
You are an expert RWFW curriculum designer.
Return a SINGLE plain text document that strictly follows these conventions:
- Use explicit section markers: "LEVEL I HEADING:", "LEVEL II HEADING:", "LEVEL III HEADING:" (do not include markdown).
- Use "CREATE TABLE:" before any pipe-separated table to signal table conversion.
- Daily structure must include 5 Rs with [Teacher Note:] and [Student Note:] lines.

CONTEXT:
Subject: ${subject}
Grade Level: ${gradeLevel}
Topic: ${topic}
Duration per day: ${duration}
Days: ${number}
Location: ${data.location || 'Savannah, Georgia'}
${data.learningObjectives ? `Learning Objectives:\n${data.learningObjectives}\n` : ''}

Now produce a comprehensive ${number}-day plan with unique daily content, MTSS supports table, and assessment tables. End without meta commentary.
`.trim();

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 8000,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) {
      const fb = buildEnhancedFallback(data);
      const resources = generateDownloadableResources(fb.cleanVersion, data);
      return okJson({
        lessonPlan: fb.cleanVersion,
        htmlVersion: fb.htmlVersion,
        plainText: fb.content,
        resources,
        fallback: true,
        success: true,
        warnings: [...warnings, `API error ${resp.status}, served fallback.`],
      });
    }

    const payload = await resp.json();
    let text = '';
    if (Array.isArray(payload?.content) && payload.content[0]?.type === 'text') {
      text = String(payload.content[0].text || '');
    }
    // Strip code fences if present
    text = text.replace(/```(?:markdown)?\s*/gi, '').replace(/```\s*$/gi, '').trim();

    if (!text || text.length < 1800) {
      const fb = buildEnhancedFallback(data);
      const resources = generateDownloadableResources(fb.cleanVersion, data);
      return okJson({
        lessonPlan: fb.cleanVersion,
        htmlVersion: fb.htmlVersion,
        plainText: fb.content,
        resources,
        fallback: true,
        success: true,
        warnings: [...warnings, 'Generated content was too short; served fallback.'],
      });
    }

    const cleaned = cleanContent(text);
    const htmlVersion = formatAsEnhancedHTML(text, data);
    const resources = generateDownloadableResources(cleaned, data);

    return okJson({
      lessonPlan: cleaned,
      htmlVersion,
      plainText: cleaned,
      resources,
      success: true,
      warnings,
    });
  } catch (err) {
    const fbData: MasterPromptRequest = {
      subject: 'General Studies',
      gradeLevel: '6',
      topic: 'Learning Together',
      duration: '90 minutes',
      numberOfDays: '5',
    };
    const fb = buildEnhancedFallback(fbData);
    const resources = generateDownloadableResources(fb.cleanVersion, fbData);
    return okJson({
      lessonPlan: fb.cleanVersion,
      htmlVersion: fb.htmlVersion,
      plainText: fb.content,
      fallback: true,
      success: true,
      resources,
      warnings: ['Emergency fallback due to system error'],
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
}
