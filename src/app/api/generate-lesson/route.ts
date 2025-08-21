// src/app/api/generate-lesson/route.ts — Robust formatter (tables, headings, notes) + RWFW polish

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

function okJson(data: unknown, init: ResponseInit = {}) {
  return NextResponse.json(data, { ...init, headers: { 'Cache-Control': 'no-store' } });
}

// ——— small utilities ———

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
  if (t.length > 80) t = t.slice(0, 80).replace(/\s+\S*$/, '');
  return t
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function cleanSmartQuotes(s: string): string {
  return s
    .replace(/â€"/g, '—')
    .replace(/â€œ|â€\u009d|“/g, '"')
    .replace(/â€\u0099|â€™|’/g, "'")
    .replace(/Ã—/g, '×')
    .replace(/â€¦/g, '...')
    .replace(/Â/g, ' ')
    .replace(/\u00A0/g, ' ');
}

// Remove directive tokens that slip through (case-insensitive)
function stripDirectiveTokens(s: string): string {
  return s
    .replace(/^\s*LEVEL\s*I\s*HEADING:\s*/gim, '')
    .replace(/^\s*LEVEL\s*II\s*HEADING:\s*/gim, '')
    .replace(/^\s*LEVEL\s*III\s*HEADING:\s*/gim, '')
    .trim();
}

// ——— content parser to HTML ———

function renderEnhancedHtml(content: string, data: MasterPromptRequest): string {
  const cleanTopic = processTopicForReadability(data.topic);
  const lines = stripDirectiveTokens(cleanSmartQuotes(content)).split(/\r?\n/);

  let html: string[] = [];
  const push = (x: string) => html.push(x);

  // header
  push(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">`);
  push(`<title>${cleanTopic} — Grade ${data.gradeLevel} Lesson Plan</title>`);
  push(`<style>
@page { margin: 0.75in; }
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; line-height: 1.5; color:#2B2B2B; background:#FFF; margin:0; padding:24pt; }
.level-1 { font-size: 18pt; font-weight: 800; margin: 20pt 0 10pt; background: linear-gradient(135deg,#1B365D,#2E86AB); color:#fff; padding:10pt 12pt; border-radius:8pt; }
.level-2 { font-size: 14pt; font-weight: 700; color:#2E86AB; margin:16pt 0 8pt; border-bottom:2pt solid #2E86AB; padding-bottom:4pt; }
.level-3 { font-size: 12pt; font-weight: 700; color:#3B523A; margin:12pt 0 6pt; background:#F2F4CA; border-left:5pt solid #3B523A; padding:6pt 10pt; border-radius:4pt; }
.header { text-align:center; margin-bottom:24pt; padding:16pt; background: linear-gradient(135deg,#F2F4CA,#E8ECBF); border:2pt solid #D4C862; border-radius:12pt; }
.meta { display:grid; grid-template-columns:1fr 1fr; gap:10pt; margin-top:12pt; }
.meta-item { padding:8pt; background:#fff; border-left:4pt solid #2E86AB; border-radius:6pt; }
.meta-label { font-weight:700; color:#1B365D; }
.day { margin:24pt 0; padding:14pt; background:#fff; border:1pt solid #E0E0E0; border-radius:10pt; }
.rs { margin:12pt 0; padding:12pt; border-left:6pt solid #D4C862; background:#FAFAFA; border-radius:0 8pt 8pt 0; }
.rs-h { font-size: 12pt; font-weight:700; color:#1B365D; margin-bottom:8pt; }
.note { margin:10pt 0; padding:10pt; border-radius:8pt; font-size:10pt; border-left:4pt solid; }
.teacher { background:#F0F7FF; border-left-color:#2E86AB; color:#1B365D; }
.student { background:#F3FFF0; border-left-color:#28A745; color:#155724; }
table { width:100%; border-collapse:collapse; margin:12pt 0; background:#fff; border-radius:6pt; overflow:hidden; }
th, td { border:1pt solid #E0E0E0; padding:8pt 10pt; text-align:left; vertical-align:top; }
th { background: linear-gradient(135deg,#1B365D,#2E86AB); color:#fff; font-weight:700; font-size:10pt; }
tr:nth-child(even) { background:#F8F9FA; }
ul { margin:8pt 0; padding-left:20pt; }
.footer { margin-top:24pt; padding-top:12pt; border-top:2pt solid #F2F4CA; text-align:center; color:#666; font-size:9pt; }
@media print { body{padding:0.5in} .day,.rs,.level-1,.level-2,.level-3,table{ page-break-inside:avoid; } }
</style></head><body>`);

  // header block
  push(`<div class="header">
  <h1>Root Work Framework Lesson Plan</h1>
  <div class="meta">
    <div class="meta-item"><div class="meta-label">Topic:</div><div>${cleanTopic}</div></div>
    <div class="meta-item"><div class="meta-label">Grade Level:</div><div>${data.gradeLevel}</div></div>
    <div class="meta-item"><div class="meta-label">Subject:</div><div>${data.subject}</div></div>
    <div class="meta-item"><div class="meta-label">Duration:</div><div>${data.duration} × ${data.numberOfDays} days</div></div>
  </div>
</div>`);

  // state while parsing
  let inDay = false;
  let inRs = false;
  let inList = false;
  let pendingTable: string[] | null = null;

  function closeList() {
    if (inList) {
      push('</ul>');
      inList = false;
    }
  }
  function closeRs() {
    if (inRs) {
      push('</div>');
      inRs = false;
    }
  }
  function closeDay() {
    closeRs();
    if (inDay) {
      push('</section>');
      inDay = false;
    }
  }
  function flushTable() {
    if (!pendingTable || pendingTable.length === 0) return;
    const rows = pendingTable.map((l) => l.split('|').map((c) => c.trim()));
    pendingTable = null;
    if (rows.length === 0) return;
    push('<table><thead><tr>');
    const header = rows[0];
    header.forEach((h) => push(`<th>${h}</th>`));
    push('</tr></thead><tbody>');
    rows.slice(1).forEach((r) => {
      if (r.every((c) => c === '')) return;
      push('<tr>');
      r.forEach((c) => push(`<td>${c}</td>`));
      push('</tr>');
    });
    push('</tbody></table>');
  }

  const isH1 = (s: string) => /^LEVEL\s*I\s*HEADING\s*:?\s*/i.test(s);
  const isH2 = (s: string) => /^LEVEL\s*II\s*HEADING\s*:?\s*/i.test(s);
  const isH3 = (s: string) => /^LEVEL\s*III\s*HEADING\s*:?\s*/i.test(s);
  const isDay = (s: string) => /^\s*DAY\s+\d+\s*:/i.test(s);
  const isRsHeader = (s: string) =>
    /^\s*(RELATIONSHIPS|ROUTINES|RELEVANCE|RIGOR|REFLECTION)\s*\(\s*\d+\s*minutes?\s*\)\s*$/i.test(s);
  const isTeacherNote = (s: string) => /^\s*Teacher Note\s*:\s*/i.test(s);
  const isStudentNote = (s: string) => /^\s*Student Note\s*:\s*/i.test(s);
  const isPipeLine = (s: string) => /\|/.test(s) && s.split('|').length >= 2;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i] ?? '';
    const raw = line;

    // normalize whitespace
    line = line.replace(/\t/g, '  ').trimRight();

    // blank line: flush blocks
    if (!line.trim()) {
      closeList();
      flushTable();
      continue;
    }

    // table accumulation: collect contiguous pipe lines regardless of marker
    if (isPipeLine(line)) {
      if (!pendingTable) pendingTable = [];
      pendingTable.push(line);
      continue;
    } else {
      // a non-pipe line flushes any pending table
      flushTable();
    }

    // headings & structure
    if (isDay(line)) {
      closeDay();
      const title = raw.replace(/^\s*DAY\s+/i, '').trim();
      push(`<section class="day"><h1 class="level-1">DAY ${title}</h1>`);
      inDay = true;
      continue;
    }
    if (isH1(line)) {
      closeDay();
      const title = raw.replace(/^LEVEL\s*I\s*HEADING\s*:?\s*/i, '').trim();
      push(`<h1 class="level-1">${title}</h1>`);
      continue;
    }
    if (isH2(line)) {
      closeList();
      closeRs();
      const title = raw.replace(/^LEVEL\s*II\s*HEADING\s*:?\s*/i, '').trim();
      push(`<h2 class="level-2">${title}</h2>`);
      continue;
    }
    if (isH3(line)) {
      closeList();
      const title = raw.replace(/^LEVEL\s*III\s*HEADING\s*:?\s*/i, '').trim();
      push(`<h3 class="level-3">${title}</h3>`);
      continue;
    }

    // 5 Rs section header
    if (isRsHeader(line)) {
      closeList();
      closeRs();
      const label = raw.replace(/\(\s*\d+\s*minutes?\s*\)\s*$/i, '').trim();
      const mins = (raw.match(/\((\d+)\s*minutes?/i)?.[1] as string) || '';
      push(`<div class="rs"><div class="rs-h">${label.toUpperCase()}${mins ? ` (${mins} minutes)` : ''}</div>`);
      inRs = true;
      continue;
    }

    // notes
    if (isTeacherNote(line)) {
      const body = raw.replace(/^\s*Teacher Note\s*:\s*/i, '').trim();
      push(`<div class="note teacher"><strong>Teacher Note:</strong> ${body}</div>`);
      continue;
    }
    if (isStudentNote(line)) {
      const body = raw.replace(/^\s*Student Note\s*:\s*/i, '').trim();
      push(`<div class="note student"><strong>Student Note:</strong> ${body}</div>`);
      continue;
    }

    // list items: lines starting with "- " or "• "
    if (/^\s*[-•]\s+/.test(line)) {
      const text = raw.replace(/^\s*[-•]\s+/, '').trim();
      if (!inList) {
        push('<ul>');
        inList = true;
      }
      push(`<li>${text}</li>`);
      continue;
    }

    // default paragraph
    closeList();
    push(`<p>${raw.trim()}</p>`);
  }

  // flush any pending blocks
  closeList();
  flushTable();
  closeDay();

  // footer
  push(`<div class="footer">
  <p><strong>Generated by Root Work Framework</strong> — Professional, trauma-informed learning design</p>
  <p>Generated: ${new Date().toLocaleDateString()}</p>
</div>`);

  push(`</body></html>`);
  return html.join('');
}

// quick validity check (optional; keeps your logic light)
function validateTextHasCorePieces(text: string) {
  const must = ['RELATIONSHIPS', 'ROUTINES', 'RELEVANCE', 'RIGOR', 'REFLECTION'];
  return must.every((m) => new RegExp(m, 'i').test(text));
}

// ——— request parsing ———

async function parseLessonRequest(req: NextRequest): Promise<Partial<MasterPromptRequest> | null> {
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try {
      const json = await req.json();
      return json && typeof json === 'object' ? json : null;
    } catch {}
  }
  try {
    const raw = await req.text();
    if (raw && raw.trim().startsWith('{')) return JSON.parse(raw);
  } catch {}
  if (ct.includes('application/x-www-form-urlencoded')) {
    try {
      const form = await req.formData();
      const o: Record<string, string> = {};
      for (const [k, v] of form.entries()) if (typeof v === 'string') o[k] = v;
      return o;
    } catch {}
  }
  return null;
}

// ——— route ———

export async function POST(request: NextRequest) {
  try {
    const received = (await parseLessonRequest(request)) ?? {};
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
    const prompt = buildPrompt(data);

    // If no key, produce a styled fallback for dev
    if (!apiKey) {
      const fallback = minimalFallback(data);
      return okJson({
        lessonPlan: cleanSmartQuotes(fallback),
        htmlVersion: renderEnhancedHtml(fallback, data),
        plainText: fallback,
        fallback: true,
        success: true,
        warnings: [...warnings, 'Used fallback due to missing ANTHROPIC_API_KEY'],
      });
    }

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
      const fallback = minimalFallback(data);
      return okJson({
        lessonPlan: cleanSmartQuotes(fallback),
        htmlVersion: renderEnhancedHtml(fallback, data),
        plainText: fallback,
        fallback: true,
        success: true,
        warnings: [...warnings, `Anthropic API error ${resp.status} — using fallback`],
      });
    }

    const payload = await resp.json();
    let lessonText = '';

    if (Array.isArray(payload?.content) && payload.content[0]?.type === 'text') {
      lessonText = String(payload.content[0].text || '');
    } else if (typeof payload?.content === 'string') {
      lessonText = String(payload.content);
    }

    // scrub fences
    lessonText = lessonText.replace(/```[a-z]*\s*/gi, '').trim();

    // if too short or missing core pieces, fallback
    if (lessonText.length < 1500 || !validateTextHasCorePieces(lessonText)) {
      const fallback = minimalFallback(data);
      return okJson({
        lessonPlan: cleanSmartQuotes(fallback),
        htmlVersion: renderEnhancedHtml(fallback, data),
        plainText: fallback,
        fallback: true,
        success: true,
        warnings: [...warnings, 'Model output incomplete — using fallback'],
      });
    }

    const cleaned = cleanSmartQuotes(lessonText);
    const html = renderEnhancedHtml(cleaned, data);

    return okJson({
      lessonPlan: cleaned,       // plain text (kept for your current UI)
      htmlVersion: html,         // print-ready HTML (available if you want to switch views)
      plainText: cleaned,
      success: true,
      warnings,
    });
  } catch (err: any) {
    const data: MasterPromptRequest = {
      subject: 'General Studies',
      gradeLevel: '6',
      topic: 'Learning Together',
      duration: '90 minutes',
      numberOfDays: '5',
    };
    const fb = minimalFallback(data);
    return okJson({
      lessonPlan: cleanSmartQuotes(fb),
      htmlVersion: renderEnhancedHtml(fb, data),
      plainText: fb,
      fallback: true,
      success: true,
      warnings: ['Emergency fallback due to system error'],
      error: String(err?.message || err),
    });
  }
}

// ——— Prompt builder (keeps your structure & table guidance) ———
function buildPrompt(d: MasterPromptRequest) {
  const days = parseInt(d.numberOfDays || '5', 10) || 5;
  const dur = parseInt(d.duration.match(/\d+/)?.[0] || '90', 10) || 90;
  const chunk = (p: number) => Math.round(dur * p);

  return `
Create a ${days}-day, trauma-informed, Root Work Framework lesson plan for:
- Subject(s): ${d.subject}
- Grade: ${d.gradeLevel}
- Topic: ${d.topic}
- Duration per day: ${d.duration}
- Location context: ${d.location || 'Savannah, Georgia'}

CRITICAL RULES:
- Do NOT include directive labels (e.g., “LEVEL I HEADING”). Output only human-facing content.
- For tables (Standards Alignment, Implementation Supports, Assessments) use pipe tables:
  Header 1 | Header 2 | Header 3
  row a1   | row a2   | row a3
  row b1   | row b2   | row b3
- Every 5 Rs section must include **Teacher Note:** and **Student Note:**
- Voice must be healing-centered and classroom-ready.
${d.specialInstructions || ''}

SECTIONS:
LEVEL I HEADING: TRAUMA-INFORMED STEAM LESSON PLAN
LEVEL I HEADING: LESSON OVERVIEW
LEVEL I HEADING: UNIT ESSENTIAL QUESTION
LEVEL I HEADING: UNIT LEARNING TARGETS

${Array.from({ length: days }, (_, i) => {
    const n = i + 1;
    const focus = ['Foundation', 'Investigation', 'Analysis', 'Application', 'Synthesis'][i] || `Learning ${n}`;
    return `
LEVEL I HEADING: DAY ${n}: ${focus}

LEVEL II HEADING: Daily Essential Question
[1–2 sentence EQ]

LEVEL II HEADING: Daily Learning Target
I can … (DOK ${n <= 2 ? 2 : n <= 4 ? 3 : 4})

LEVEL II HEADING: Standards Alignment
Standard Type | Standard Code | Description
Primary | [actual code] | [student-friendly description]
SEL (CASEL) | [competency] | [how it shows up today]
Cross-Curricular | [area] | [integration description]

LEVEL II HEADING: Materials Needed
- [specific]
- [specific]
- [specific]

LEVEL II HEADING: Root Work Framework 5 Rs Structure
LEVEL III HEADING: RELATIONSHIPS (${chunk(0.15)} minutes)
Teacher Note: ...
Student Note: ...

LEVEL III HEADING: ROUTINES (${chunk(0.1)} minutes)
Teacher Note: ...
Student Note: ...

LEVEL III HEADING: RELEVANCE (${chunk(0.25)} minutes)
Teacher Note: ...
Student Note: ...

LEVEL III HEADING: RIGOR (${chunk(0.35)} minutes)
I Do (teacher modeling): ...
We Do (guided practice): ...
You Do Together (collab): ...
Teacher Note: ...
Student Note: ...

LEVEL III HEADING: REFLECTION (${chunk(0.15)} minutes)
Teacher Note: ...
Student Note: ...

LEVEL II HEADING: Day ${n} Implementation Supports
Support Tier | Target Population | Specific Strategies
Tier 1 Universal | All Students | [3 supports]
Tier 2 Targeted | Some Students | [3 supports]
Tier 3 Intensive | Few Students | [3 supports]
504 Accommodations | Students w/ disabilities | [specific]
Gifted Extensions | Advanced Learners | [specific]
SPED Modifications | IEPs | [specific]

LEVEL II HEADING: Day ${n} Assessment
Assessment Type | Method | Purpose
Formative | [check for understanding] | [purpose]
Summative | [performance or product] | [purpose]

LEVEL II HEADING: SEL Integration
[brief]

LEVEL II HEADING: Trauma-Informed Considerations
[brief]
`;
  }).join('\n')}
`.trim();
}

// ——— Minimal fallback text (keeps it clean & parseable) ———
function minimalFallback(d: MasterPromptRequest) {
  const days = parseInt(d.numberOfDays || '3', 10) || 3;
  const block = (title: string) => `LEVEL I HEADING: ${title}\n`;
  let s = '';
  s += block('TRAUMA-INFORMED STEAM LESSON PLAN');
  s += `Grade: ${d.gradeLevel}\nSubject: ${d.subject}\nTopic: ${d.topic}\nDuration: ${d.duration} per day over ${d.numberOfDays} days\nLocation: ${d.location}\n\n`;
  s += block('LESSON OVERVIEW') + `Brief overview…\n\n`;
  s += block('UNIT ESSENTIAL QUESTION') + `How does ${d.topic} shape our community and choices?\n\n`;
  s += block('UNIT LEARNING TARGETS') + `- I can describe...\n- I can apply...\n- I can evaluate...\n\n`;

  for (let i = 1; i <= days; i++) {
    s += `LEVEL I HEADING: DAY ${i}: Learning Focus\n\n`;
    s += `LEVEL II HEADING: Daily Essential Question\nEQ goes here\n\n`;
    s += `LEVEL II HEADING: Daily Learning Target\nI can … (DOK ${i <= 2 ? 2 : i <= 4 ? 3 : 4})\n\n`;
    s += `LEVEL II HEADING: Standards Alignment\n`;
    s += `Standard Type | Standard Code | Description\n`;
    s += `Primary | CODE.${i} | Description of today’s alignment\n`;
    s += `SEL (CASEL) | Self-Management | Practice routines and reflection\n\n`;
    s += `LEVEL II HEADING: Materials Needed\n- Chart paper\n- Markers\n- Exit tickets\n\n`;
    s += `LEVEL II HEADING: Root Work Framework 5 Rs Structure\n`;
    s += `LEVEL III HEADING: RELATIONSHIPS (10 minutes)\nTeacher Note: Welcome...\nStudent Note: You belong...\n\n`;
    s += `LEVEL III HEADING: ROUTINES (8 minutes)\nTeacher Note: Post agenda...\nStudent Note: Review success criteria…\n\n`;
    s += `LEVEL III HEADING: RELEVANCE (20 minutes)\nTeacher Note: Connect to lived experiences…\nStudent Note: Share a connection…\n\n`;
    s += `LEVEL III HEADING: RIGOR (30 minutes)\nI Do: Model...\nWe Do: Guided practice...\nYou Do Together: Collaborative task...\nTeacher Note: Scaffold as needed…\nStudent Note: Use sentence starters…\n\n`;
    s += `LEVEL III HEADING: REFLECTION (12 minutes)\nTeacher Note: Facilitate circle…\nStudent Note: What did I learn?\n\n`;
    s += `LEVEL II HEADING: Day ${i} Implementation Supports\n`;
    s += `Support Tier | Target Population | Specific Strategies\n`;
    s += `Tier 1 Universal | All Students | Visuals; Clear criteria; Choice\n`;
    s += `Tier 2 Targeted | Some Students | Guided notes; Small group; Pre-teach vocab\n\n`;
    s += `LEVEL II HEADING: Day ${i} Assessment\n`;
    s += `Assessment Type | Method | Purpose\n`;
    s += `Formative | Exit Ticket | Check understanding\n\n`;
    s += `LEVEL II HEADING: SEL Integration\nBrief…\n\n`;
    s += `LEVEL II HEADING: Trauma-Informed Considerations\nBrief…\n\n`;
  }
  return s;
}
