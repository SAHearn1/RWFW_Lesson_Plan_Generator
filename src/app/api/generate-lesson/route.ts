// src/app/api/generate-lesson/route.ts
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
  const trimmed = (topic || '').trim();
  if (!trimmed) return 'Core Concept';
  if (trimmed.length <= 60) return trimmed.replace(/\s+/g, ' ');
  const words = trimmed.split(/\s+/);
  return words.slice(0, 8).join(' ');
}

/** Clean odd encodings and normalize */
function cleanContent(content: string): string {
  return (content || '')
    .replace(/\u00A0/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/–/g, '—')
    .replace(/\r/g, '')
    .replace(/\t/g, '  ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Build a prompt that avoids literal “CREATE TABLE” and heading tokens in the model output */
function buildEnhancedMasterPrompt(d: MasterPromptRequest): string {
  const days = parseInt(d.numberOfDays || '5', 10) || 5;
  const durationMinutes = parseInt(d.duration?.match(/\d+/)?.[0] || '90', 10);
  const topic = processTopicForReadability(d.topic);
  const subject = d.subject;
  const grade = d.gradeLevel;
  const location = d.location || 'Savannah, Georgia';

  return `
You are generating a professional multi-day lesson plan using the Root Work Framework (5 Rs: Relationships, Routines, Relevance, Rigor, Reflection).

STRICT OUTPUT RULES:
- DO NOT write the phrases “LEVEL I HEADING”, “LEVEL II HEADING”, “LEVEL III HEADING”, or “CREATE TABLE”.
- When you need a heading, just write the heading text.
- When you need a table, output a Markdown pipe table with a header row and data rows. Examples:
  | Column A | Column B |
  | --- | --- |
  | a1 | b1 |
- Include mandatory **Teacher Note:** and **Student Note:** for each 5 Rs block.
- Place “Implementation Supports” (MTSS) inside EACH Day section (not at the very top).
- Include **Assessment** inside EACH Day, with a Markdown pipe table.

CONTEXT
Subject: ${subject}
Grade Level: ${grade}
Topic: ${topic}
Duration per day: ${d.duration}
Days: ${days}
Location: ${location}
${d.unitContext ? `Unit context: ${d.unitContext}` : ''}
${d.learningObjectives ? `Learning objectives and standards to integrate: ${d.learningObjectives}` : '' }
${d.specialNeeds ? `Special considerations: ${d.specialNeeds}` : '' }
${d.availableResources ? `Available resources: ${d.availableResources}` : '' }

STRUCTURE
# Trauma-Informed STEAM Lesson Plan
## Overview
(2–3 sentences)

## Unit Essential Question
(1 question)

## Unit Learning Targets
- I can …
- I can …
- I can …

${Array.from({ length: days }, (_ , i) => {
  const day = i + 1;
  const focus = ['Foundation', 'Investigation', 'Analysis', 'Application', 'Synthesis'][i] || `Day ${day} Focus`;
  return `
# Day ${day}: ${focus}
## Daily Essential Question
(One question that builds toward the unit EQ)

## Daily Learning Target
I can …

## Standards Alignment
| Standard Type | Standard Code | Description |
| --- | --- | --- |
| Primary Standard |  |  |
| SEL Integration | CASEL |  |
| Cross-Curricular |  |  |

## Materials Needed
- …

## Root Work Framework 5 Rs
### RELATIONSHIPS (${Math.round(durationMinutes * 0.15)} minutes)
Activity details…
**Teacher Note:** …
**Student Note:** …

### ROUTINES (${Math.round(durationMinutes * 0.1)} minutes)
Agenda and success criteria…
**Teacher Note:** …
**Student Note:** …

### RELEVANCE (${Math.round(durationMinutes * 0.25)} minutes)
Connection to lived experiences…
**Teacher Note:** …
**Student Note:** …

### RIGOR (${Math.round(durationMinutes * 0.35)} minutes)
I Do (modeling), We Do (guided practice), You Do Together (collab)…
**Teacher Note:** …
**Student Note:** …

### REFLECTION (${Math.round(durationMinutes * 0.15)} minutes)
Processing and preview…
**Teacher Note:** …
**Student Note:** …

## Implementation Supports (MTSS)
| Support Tier | Target Population | Specific Strategies |
| --- | --- | --- |
| Tier 1 Universal | All Students |  |
| Tier 2 Targeted | Some Students |  |
| Tier 3 Intensive | Few Students |  |
| 504 Accommodations | Students with Disabilities |  |
| Gifted Extensions | Advanced Learners |  |
| SPED Modifications | Students with IEPs |  |

## Assessment
| Assessment Type | Method | Purpose |
| --- | --- | --- |
| Formative |  |  |
| Summative |  |  |

## SEL Integration
(brief)

## Trauma-Informed Considerations
(brief)
`.trim();
}).join('\n\n')}
  `.trim();
}

/** Convert our structured text into styled HTML similar to your best examples */
function formatAsEnhancedHTML(content: string, data: MasterPromptRequest): string {
  // Sanitize the model output
  let txt = cleanContent(content);

  // Ensure no stray “CREATE TABLE” or “LEVEL X HEADING” slipped through
  txt = txt.replace(/^\s*CREATE TABLE:?\s*$/gmi, ''); // remove any lone directives
  txt = txt.replace(/LEVEL\s+I{1,3}\s+HEADING:\s*/gmi, ''); // drop leftover tokens

  // Convert headings (#, ##, ###) => our styled classes
  let html = txt
    // H3
    .replace(/^[ \t]*#{3}[ \t]+(.+)$/gmi, '<h3 class="level-3-heading">$1</h3>')
    // H2
    .replace(/^[ \t]*#{2}[ \t]+(.+)$/gmi, '<h2 class="level-2-heading">$1</h2>')
    // H1
    .replace(/^[ \t]*#[ \t]+(.+)$/gmi, '<h1 class="level-1-heading">$1</h1>');

  // Wrap Day sections to avoid page-break issues
  html = html.replace(/<h1 class="level-1-heading">Day (\d+):([^<]+)<\/h1>/g, (_m, dNum: string, rest: string) => {
    return `<section class="day-section"><h1 class="level-1-heading">Day ${dNum}:${rest}</h1>`;
  });
  // Close any opened day-section when next day or end appears
  html = html.replace(/(?=<h1 class="level-1-heading">Day \d+:)|$/g, '</section>');

  // Teacher/Student notes: bold labels and nice blocks
  html = html
    .replace(/\*\*Teacher Note:\*\*\s?(.*)/g, '<div class="note teacher"><b>Teacher Note:</b> $1</div>')
    .replace(/\*\*Student Note:\*\*\s?(.*)/g, '<div class="note student"><b>Student Note:</b> $1</div>')
    .replace(/Teacher Note:\s?(.*)/g, '<div class="note teacher"><b>Teacher Note:</b> $1</div>')
    .replace(/Student Note:\s?(.*)/g, '<div class="note student"><b>Student Note:</b> $1</div>');

  // Bulleted lines that aren’t already HTML
  html = html.replace(/^\s*[-*]\s+(.+)$/gmi, '<li>$1</li>');
  html = html.replace(/(?:<li>[\s\S]*?<\/li>)/gms, (block) => `<div class="bulleted-list"><ul>${block}</ul></div>`);

  // Convert Markdown pipe tables (supports 2–6 columns)
  html = html.replace(
    /((?:^\|.*\|\s*\n)+)/gms,
    (tableBlock) => {
      // split lines
      const lines = tableBlock
        .trim()
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('|') && l.endsWith('|'));

      if (!lines.length) return tableBlock;

      // Remove optional delimiter line (| --- | --- |)
      const header = lines[0];
      const maybeDelim = lines[1] || '';
      const hasDelim = /^\|\s*:?-{3,}\s*(\|\s*:?-{3,}\s*)+\|$/.test(maybeDelim);
      const dataLines = hasDelim ? lines.slice(2) : lines.slice(1);

      const headers = header
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      const rows = dataLines.map((dl) =>
        dl
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim())
      );

      let out = '<table><thead><tr>';
      headers.forEach((h) => (out += `<th>${h || '&nbsp;'}</th>`));
      out += '</tr></thead><tbody>';
      rows.forEach((cells) => {
        if (!cells.length) return;
        out += '<tr>';
        headers.forEach((_h, idx) => {
          out += `<td>${cells[idx] ?? ''}</td>`;
        });
        out += '</tr>';
      });
      out += '</tbody></table>';
      return out;
    }
  );

  // 5 Rs blocks: style them (if headings present in text form)
  html = html
    .replace(/<h3 class="level-3-heading">RELATIONSHIPS \((\d+) minutes\)<\/h3>/g, '<div class="rs-block"><div class="rs-header">RELATIONSHIPS ($1 minutes)</div>')
    .replace(/<h3 class="level-3-heading">ROUTINES \((\d+) minutes\)<\/h3>/g, '</div><div class="rs-block"><div class="rs-header">ROUTINES ($1 minutes)</div>')
    .replace(/<h3 class="level-3-heading">RELEVANCE \((\d+) minutes\)<\/h3>/g, '</div><div class="rs-block"><div class="rs-header">RELEVANCE ($1 minutes)</div>')
    .replace(/<h3 class="level-3-heading">RIGOR \((\d+) minutes\)<\/h3>/g, '</div><div class="rs-block"><div class="rs-header">RIGOR ($1 minutes)</div>')
    .replace(/<h3 class="level-3-heading">REFLECTION \((\d+) minutes\)<\/h3>/g, '</div><div class="rs-block"><div class="rs-header">REFLECTION ($1 minutes)</div>') + '</div>';

  const cleanTopic = processTopicForReadability(data.topic);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${cleanTopic} — Grade ${data.gradeLevel} Lesson Plan</title>
<style>
@page {
  margin: 0.75in;
  @bottom-center {
    content: "Page " counter(page) " of " counter(pages);
    font-size: 10pt;
    color: #666;
  }
}
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; line-height: 1.45; color:#2B2B2B; margin:0; padding:0; background:#fff; }
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
.level-2-heading { font-size:14pt; font-weight:800; color:#2E86AB; margin:18pt 16pt 8pt; padding-bottom:6pt; border-bottom:2pt solid #2E86AB; }
.level-3-heading { font-size:12pt; font-weight:800; color:#3B523A; margin:12pt 16pt 6pt; padding:6pt 10pt; background:#F2F4CA; border-left:6pt solid #3B523A; border-radius:6pt; }
.day-section {
  margin:16pt; padding:16pt; background:#FEFEFE; border:1pt solid #E0E0E0; border-radius:12pt; box-shadow:0 4pt 12pt rgba(0,0,0,0.06);
}
.rs-block { margin:12pt 16pt; padding:12pt; border-left:6pt solid #D4C862; background:#F8F9FA; border-radius:0 8pt 8pt 0; }
.rs-header { font-size:12pt; font-weight:800; color:#1B365D; margin-bottom:8pt; }
.note { margin:10pt 16pt; padding:12pt; border-radius:8pt; font-size:10pt; border-left:4pt solid; }
.teacher { background:linear-gradient(135deg,#E8F4FD 0%, #F0F8FF 100%); border-left-color:#2E86AB; color:#1B365D; }
.student { background:linear-gradient(135deg,#F0F9E8 0%, #F8FFF8 100%); border-left-color:#28A745; color:#155724; }
table { width:calc(100% - 32pt); margin:12pt 16pt; border-collapse:collapse; background:#fff; border-radius:8pt; overflow:hidden; box-shadow:0 2pt 8pt rgba(0,0,0,0.05); }
th, td { border:1pt solid #E0E0E0; padding:8pt 12pt; text-align:left; vertical-align:top; }
th { background:linear-gradient(135deg,#1B365D 0%, #2E86AB 100%); color:#fff; font-weight:800; }
tr:nth-child(even) { background:#F8F9FA; }
.content { margin: 0 16pt 24pt; }
.footer { margin: 24pt 16pt; padding-top:12pt; border-top:2pt solid #F2F4CA; text-align:center; color:#666; font-size:10pt; }
@media print {
  .day-section, .rs-block, .level-1-heading, .level-2-heading, .level-3-heading, table { page-break-inside: avoid; }
}
</style>
</head>
<body>
<div class="header">
  <img src="/logo.png" alt="Root Work Framework" />
  <div>
    <div style="font-size:20pt;font-weight:800;color:#082A19;margin-bottom:4pt">Root Work Framework Lesson Plan</div>
    <div style="color:#3B523A">Professional, trauma-informed learning design</div>
    <div style="margin-top:6pt;color:#3B523A">
      <b>Topic:</b> ${cleanTopic} &nbsp; • &nbsp; <b>Grade:</b> ${data.gradeLevel} &nbsp; • &nbsp; <b>Subject:</b> ${data.subject} &nbsp; • &nbsp; <b>Duration:</b> ${data.duration} × ${data.numberOfDays} days
    </div>
  </div>
</div>
<div class="content">
${html}
</div>
<div class="footer">
  Generated by Root Work Framework — ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
</div>
</body>
</html>`;
}

function validateLessonPlan(content: string, d: MasterPromptRequest) {
  const teacherNotes = (content.match(/Teacher Note:/gi) || []).length;
  const studentNotes = (content.match(/Student Note:/gi) || []).length;
  const days = parseInt(d.numberOfDays || '5', 10) || 5;
  const expected = days * 5; // 5 Rs blocks per day
  const missing: string[] = [];
  if (teacherNotes < expected) missing.push(`Teacher Notes (found ${teacherNotes}, need ≥ ${expected})`);
  if (studentNotes < expected) missing.push(`Student Notes (found ${studentNotes}, need ≥ ${expected})`);
  return { ok: missing.length === 0, missing };
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseLessonRequest(request);
    const r = parsed ?? {};

    const warnings: string[] = [];
    const subject = (r as any).subject?.trim?.() || (warnings.push('Defaulted subject to "General Studies"'), 'General Studies');
    const gradeLevel = (r as any).gradeLevel?.trim?.() || (warnings.push('Defaulted gradeLevel to "6"'), '6');
    const topic = (r as any).topic?.trim?.() || (warnings.push('Defaulted topic to "Core Concept"'), 'Core Concept');
    const duration = (r as any).duration?.trim?.() || (warnings.push('Defaulted duration to "90 minutes"'), '90 minutes');
    const numberOfDays = (r as any).numberOfDays?.trim?.() || (warnings.push('Defaulted numberOfDays to "5"'), '5');

    const data: MasterPromptRequest = {
      subject,
      gradeLevel,
      topic,
      duration,
      numberOfDays,
      learningObjectives: (r as any).learningObjectives ?? '',
      specialNeeds: (r as any).specialNeeds ?? '',
      availableResources: (r as any).availableResources ?? '',
      location: (r as any).location ?? 'Savannah, Georgia',
      unitContext: (r as any).unitContext ?? '',
      lessonType: (r as any).lessonType ?? 'comprehensive_multi_day',
      specialInstructions: (r as any).specialInstructions ?? '',
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const prompt = buildEnhancedMasterPrompt(data);

    // If no key, return fallback skeleton styled for consistency
    if (!apiKey) {
      const styled = formatAsEnhancedHTML(prompt.replace(/\n{2,}/g, '\n'), data);
      return okJson({
        lessonPlan: cleanContent(prompt),
        htmlVersion: styled,
        plainText: prompt,
        success: true,
        fallback: true,
        warnings: [...warnings, 'Used fallback (missing API key)'],
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
      const text = await resp.text().catch(() => '');
      const styled = formatAsEnhancedHTML(prompt, data);
      return okJson({
        lessonPlan: cleanContent(prompt),
        htmlVersion: styled,
        plainText: prompt,
        success: true,
        fallback: true,
        warnings: [...warnings, `API error ${resp.status}: ${text.slice(0, 200)}`],
      });
    }

    const payload = await resp.json();
    let out = '';
    if (Array.isArray(payload?.content) && payload.content[0]?.type === 'text') {
      out = String(payload.content[0].text || '');
    } else if (typeof payload?.content === 'string') {
      out = payload.content;
    }

    out = cleanContent(out);

    // Basic guard against truncated outputs like “The guide would continue…”
    if (/would continue/i.test(out) || out.length < 1500) {
      warnings.push('Model output looked incomplete; returning styled but may need regeneration.');
    }

    const { ok, missing } = validateLessonPlan(out, data);
    if (!ok) warnings.push(...missing);

    const htmlVersion = formatAsEnhancedHTML(out, data);

    return okJson({
      lessonPlan: out,
      htmlVersion,
      plainText: out,
      success: true,
      warnings,
    });
  } catch (err: any) {
    return okJson(
      {
        success: false,
        error: err?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
