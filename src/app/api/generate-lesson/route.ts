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
    } catch { /* ignore */ }
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
      const o: Record<string,string> = {};
      for (const [k,v] of form.entries()) if (typeof v === 'string') o[k] = v;
      return normalizeShape(o);
    } catch {}
  }
  return null;
}

function getSubjectAbbreviation(subject: string): string {
  const map: Record<string,string> = {
    'English Language Arts': 'ELA', 'Mathematics': 'MATH', 'Science': 'SCI', 'Social Studies': 'SOC',
    'STEAM (Integrated)': 'STEAM', 'Special Education': 'SPED', 'Agriculture': 'AGSCI', 'Environmental Science': 'ENVSCI',
    'Life Skills': 'LIFE', 'Social-Emotional Learning': 'SEL', 'Art': 'ART', 'Music': 'MUS', 'Physical Education': 'PE',
    'Career & Technical Education': 'CTE', 'World Languages': 'WL'
  };
  // Use first subject if CSV list
  const key = (subject.split(',')[0] || '').trim();
  return map[key] || 'GEN';
}

function processTopicForReadability(topic: string): string {
  let clean = topic.trim();
  if (clean.length > 60) {
    const words = clean.split(' ');
    clean = words.slice(0, 8).join(' ');
  }
  return clean.replace(/\s+/g,' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * We instruct the model to use simple Markdown headings and pipe tables (no literal “LEVEL I HEADING”).
 * Our formatter then upgrades Markdown to the full styled HTML you want.
 */
function buildPrompt(data: MasterPromptRequest): string {
  const days = parseInt(data.numberOfDays || '5');
  const minutes = parseInt(data.duration?.match(/\d+/)?.[0] || '90');
  const topic = processTopicForReadability(data.topic);

  return `
You are a master curriculum designer using the Root Work Framework (5 Rs: Relationships, Routines, Relevance, Rigor, Reflection) with trauma-informed, healing-centered pedagogy.

OUTPUT STRICTLY AS MARKDOWN (no code fences). Use:
- # for top headings, ## for section headings, ### for sub-sections.
- Use GitHub-style pipe tables wherever a table is requested (no text like "CREATE TABLE:").
- Always include clear “Teacher Note:” and “Student Note:” blocks inline in each 5R subsection.

Do NOT include literal text such as “LEVEL I HEADING” or “CREATE TABLE:”.
Do NOT include placeholders like “[the guide would continue…]”. Always complete sections.

---
# TRAUMA-INFORMED STEAM LESSON PLAN
**Grade:** ${data.gradeLevel}  
**Subject(s):** ${data.subject}  
**Topic:** ${topic}  
**Duration:** ${data.duration} per day over ${days} days  
**Location:** ${data.location || 'Savannah, Georgia'}

## LESSON OVERVIEW
(2–4 sentences describing the unit’s purpose and student outcomes.)

## UNIT ESSENTIAL QUESTION
(One overarching question for the whole unit.)

## UNIT LEARNING TARGETS
- I can … (DOK 2)
- I can … (DOK 3)
- I can … (DOK 4)

${Array.from({length: days}, (_, i) => {
  const d = i + 1;
  const focus = ['Foundation','Exploration','Analysis','Application','Synthesis'][i] || `Advanced Application ${d}`;
  return `
# Day ${d}: ${focus}

## Daily Essential Question
(A question that builds toward the unit EQ.)

## Daily Learning Target
(I can … with DOK appropriate to this day.)

## Standards Alignment
| Standard Type | Code | Description |
|---|---|---|
| Primary Standard | (enter actual code) | (brief description) |
| SEL Integration | CASEL | (specific competency) |
| Cross-Curricular | (Subject) | (integration description) |

## Materials Needed
- Specific materials

## Root Work Framework — 5 Rs
### Relationships (${Math.round(minutes*0.15)} minutes)
Opening activity connecting ${topic} and today’s focus.  
**Teacher Note:** …  
**Student Note:** …

### Routines (${Math.round(minutes*0.10)} minutes)
Agenda & success criteria.  
**Teacher Note:** …  
**Student Note:** …

### Relevance (${Math.round(minutes*0.25)} minutes)
Local/community connection.  
**Teacher Note:** …  
**Student Note:** …

### Rigor (${Math.round(minutes*0.35)} minutes)
I Do (model) → We Do (guided) → You Do Together (collab).  
**Teacher Note:** …  
**Student Note:** …

### Reflection (${Math.round(minutes*0.15)} minutes)
Processing & preview of tomorrow.  
**Teacher Note:** …  
**Student Note:** …

## Day ${d} Implementation Supports (MTSS)
| Support Tier | Target Population | Specific Strategies |
|---|---|---|
| Tier 1 Universal | All Students | … |
| Tier 2 Targeted | Some Students | … |
| Tier 3 Intensive | Few Students | … |
| 504 Accommodations | Students with Disabilities | … |
| Gifted Extensions | Advanced Learners | … |
| SPED Modifications | Students with IEPs | … |

## Day ${d} Assessment
| Assessment Type | Method | Purpose |
|---|---|---|
| Formative | … | Monitor learning |
| Summative | … | Evaluate mastery |

## SEL Integration
(embedded SEL for the day)

## Trauma-Informed Considerations
(specific supports for emotional safety)
`;
}).join('\n')}
---
Complete all sections with concrete, classroom-ready detail. Use professional tone and consistent structure.`;
}

/** Clean smart-quote mojibake, etc. */
function cleanText(s: string): string {
  return (s || '')
    .replace(/\u00A0/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/–/g, '—')
    .replace(/\r/g, '');
}

/** Convert Markdown -> styled HTML that matches the brand and keeps logo at top */
function mdToStyledHtml(md: string, meta: MasterPromptRequest): string {
  // Very light MD → HTML (headings, bold/italics, lists, tables). For a production site you’d use a parser,
  // but we keep it dependency-free here and handle the structures we emit in the prompt.
  let html = cleanText(md);

  // Escape then rebuild minimal HTML
  html = html
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');

  // Headings
  html = html
    .replace(/^###\s+(.*)$/gm, '<h3 class="level-3-heading">$1</h3>')
    .replace(/^##\s+(.*)$/gm, '<h2 class="level-2-heading">$1</h2>')
    .replace(/^#\s+(.*)$/gm, '<h1 class="level-1-heading">$1</h1>');

  // Bold / italics
  html = html
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Lists
  html = html
    .replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<div class="bulleted-list"><ul>${m}</ul></div>`);

  // Teacher/Student Notes (already bolded by the model). Preserve line following the label.
  html = html
    .replace(/(^|\n)\*\*Teacher Note:\*\*\s*(.*)/g, '\n<div class="note teacher-note"><strong>Teacher Note:</strong> $2</div>')
    .replace(/(^|\n)\*\*Student Note:\*\*\s*(.*)/g, '\n<div class="note student-note"><strong>Student Note:</strong> $2</div>')
    .replace(/(^|\n)Teacher Note:\s*(.*)/g, '\n<div class="note teacher-note"><strong>Teacher Note:</strong> $2</div>')
    .replace(/(^|\n)Student Note:\s*(.*)/g, '\n<div class="note student-note"><strong>Student Note:</strong> $2</div>');

  // Pipe tables → HTML tables
  html = html.replace(
    /(^|\n)\|([^\n]+)\|\n\|(?:[-:]+\|)+\n((?:\|[^\n]+\|\n?)+)/g,
    (_m: string, _lead: string, headerRow: string, bodyBlock: string) => {
      const headers = headerRow.split('|').map(s => s.trim()).filter(Boolean);
      const rows = bodyBlock.trim().split('\n')
        .map((line: string) => line.split('|').map(s => s.trim()).filter(Boolean))
        .filter((cells: string[]) => cells.length > 0);
      let t = '<table><thead><tr>';
      headers.forEach((h: string) => { t += `<th>${h}</th>`; });
      t += '</tr></thead><tbody>';
      rows.forEach((cells: string[]) => {
        t += '<tr>';
        cells.forEach((c: string) => { t += `<td>${c}</td>`; });
        t += '</tr>';
      });
      t += '</tbody></table>';
      return `\n${t}\n`;
    }
  );

  // Paragraph wrapper: turn stray lines into <p>
  html = html
    .replace(/^(?!<h1|<h2|<h3|<div|<table|<ul|<li|<\/|<p)(.+)$/gm, '<p>$1</p>')
    .replace(/\n{2,}/g, '\n');

  const topic = processTopicForReadability(meta.topic);

  const shell = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${topic} — Grade ${meta.gradeLevel} Lesson Plan</title>
<style>
@page {
  margin: 0.75in;
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
.bulleted-list { margin: 0 16pt; background:#F8F9FA; padding:10pt; border-left:3pt solid #D4C862; border-radius:6pt; }
.note { margin:10pt 16pt; padding:12pt; border-radius:8pt; font-size:10pt; border-left:4pt solid; }
.teacher-note { background:#F0F7FF; border-left-color:#2E86AB; color:#1B365D; }
.student-note { background:#F3FFF0; border-left-color:#28A745; color:#155724; }
table { width:calc(100% - 32pt); margin:12pt 16pt; border-collapse:collapse; background:#fff; border-radius:8pt; overflow:hidden; box-shadow:0 2pt 8pt rgba(0,0,0,0.05); }
th, td { border:1pt solid #E0E0E0; padding:8pt 12pt; text-align:left; vertical-align:top; }
th { background:linear-gradient(135deg,#1B365D 0%, #2E86AB 100%); color:#fff; font-weight:800; }
tr:nth-child(even) { background:#F8F9FA; }
.content { margin: 0 16pt 24pt; }
.meta { color:#3B523A; margin-top:6pt; }
.footer { margin:24pt 16pt; padding-top:12pt; border-top:2pt solid #F2F4CA; text-align:center; color:#666; font-size:10pt; }
</style>
</head>
<body>
<div class="header">
  <img src="/logo.png" alt="Root Work Framework" />
  <div>
    <div style="font-size:20pt;font-weight:800;color:#082A19;margin-bottom:4pt">Root Work Framework Lesson Plan</div>
    <div class="meta"><b>Topic:</b> ${topic} &nbsp; • &nbsp; <b>Grade:</b> ${meta.gradeLevel} &nbsp; • &nbsp; <b>Subject(s):</b> ${meta.subject} &nbsp; • &nbsp; <b>Duration:</b> ${meta.duration} × ${meta.numberOfDays} days</div>
  </div>
</div>
<div class="content">
${html}
</div>
<div class="footer">
  Generated by Root Work Framework — ${new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}
</div>
</body>
</html>`;
  return shell;
}

function buildFallback(data: MasterPromptRequest) {
  const md = `# TRAUMA-INFORMED STEAM LESSON PLAN

**Grade:** ${data.gradeLevel}  
**Subject(s):** ${data.subject}  
**Topic:** ${processTopicForReadability(data.topic)}  
**Duration:** ${data.duration} per day over ${data.numberOfDays} days

## LESSON OVERVIEW
This multi-day unit explores core concepts through the Root Work Framework.

## UNIT ESSENTIAL QUESTION
How does this topic shape our understanding of ourselves and our community?

## UNIT LEARNING TARGETS
- I can identify key concepts. (DOK 2)
- I can analyze relationships and apply strategies. (DOK 3)
- I can synthesize ideas to create solutions. (DOK 4)

# Day 1: Foundation
## Daily Essential Question
What is most important to understand at the start?

## Standards Alignment
| Standard Type | Code | Description |
|---|---|---|
| Primary Standard | TBD | Unit-aligned description |
| SEL Integration | CASEL | Self-awareness |
| Cross-Curricular | ELA | Academic vocabulary in context |

## Materials Needed
- Teacher slides
- Student journals

## Root Work Framework — 5 Rs
### Relationships (15 minutes)
Community circle.  
**Teacher Note:** Build psychological safety.  
**Student Note:** Share and listen with care.

### Routines (10 minutes)
Agenda and success criteria.  
**Teacher Note:** Preview the day’s flow.  
**Student Note:** Organize materials.

### Relevance (25 minutes)
Connect to lived experiences.  
**Teacher Note:** Honor cultural assets.  
**Student Note:** Make personal connections.

### Rigor (35 minutes)
I Do → We Do → You Do Together.  
**Teacher Note:** Scaffold thoughtfully.  
**Student Note:** Try strategies and ask for help.

### Reflection (15 minutes)
Journaling + preview.  
**Teacher Note:** Normalize growth.  
**Student Note:** Name wins and next steps.

## Day 1 Implementation Supports (MTSS)
| Support Tier | Target Population | Specific Strategies |
|---|---|---|
| Tier 1 Universal | All Students | Clear success criteria; visuals; choice |
| Tier 2 Targeted | Some Students | Guided notes; small-group support |
| Tier 3 Intensive | Few Students | 1:1 conferencing; modified tasks |
| 504 Accommodations | Disabilities | Extended time; assistive tech |
| Gifted Extensions | Advanced | Deeper analysis; leadership |
| SPED Modifications | IEPs | Simplified language; chunking |

## Day 1 Assessment
| Assessment Type | Method | Purpose |
|---|---|---|
| Formative | Exit prompt | Monitor learning |
| Summative | Product rubric | Evaluate mastery

## SEL Integration
Self-awareness through reflection.

## Trauma-Informed Considerations
Predictability, choice, and strengths-based feedback.`;

  return md;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseLessonRequest(request);
    const r = parsed ?? {};

    const subject = (r as any).subject?.trim?.() || 'General Studies';
    const gradeLevel = (r as any).gradeLevel?.trim?.() || '6';
    const topic = (r as any).topic?.trim?.() || 'Core Concept';
    const duration = (r as any).duration?.trim?.() || '90 minutes';
    const numberOfDays = (r as any).numberOfDays?.trim?.() || '5';

    const data: MasterPromptRequest = {
      subject, gradeLevel, topic, duration, numberOfDays,
      learningObjectives: (r as any).learningObjectives ?? '',
      specialNeeds: (r as any).specialNeeds ?? '',
      availableResources: (r as any).availableResources ?? '',
      location: (r as any).location ?? 'Savannah, Georgia',
      unitContext: (r as any).unitContext ?? '',
      lessonType: (r as any).lessonType ?? 'comprehensive_multi_day',
      specialInstructions: (r as any).specialInstructions ?? ''
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const prompt = buildPrompt(data);

    // If no key, provide a styled fallback
    if (!apiKey) {
      const md = buildFallback(data);
      const html = mdToStyledHtml(md, data);
      return okJson({ success: true, fallback: true, lessonPlan: cleanText(md), htmlVersion: html });
    }

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 7000,
        temperature: 0.35,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!resp.ok) {
      const md = buildFallback(data);
      const html = mdToStyledHtml(md, data);
      return okJson({ success: true, fallback: true, lessonPlan: cleanText(md), htmlVersion: html, warning: `API error ${resp.status}` });
    }

    const payload = await resp.json();
    let text = '';
    if (Array.isArray(payload?.content) && payload.content[0]?.type === 'text') {
      text = String(payload.content[0].text || '');
    } else if (typeof payload?.content?.[0]?.text === 'string') {
      text = payload.content[0].text;
    }
    text = cleanText(text).trim();

    // Safety: ensure it’s not truncated or using disallowed scaffolding text
    if (!text || /\[(?:the guide would continue|continued)\]/i.test(text)) {
      const md = buildFallback(data);
      const html = mdToStyledHtml(md, data);
      return okJson({ success: true, fallback: true, lessonPlan: cleanText(md), htmlVersion: html, warning: 'Model returned incomplete content; used fallback.' });
    }

    const html = mdToStyledHtml(text, data);
    return okJson({ success: true, lessonPlan: text, htmlVersion: html });

  } catch (err: any) {
    const fallbackData: MasterPromptRequest = {
      subject: 'General Studies',
      gradeLevel: '6',
      topic: 'Learning Together',
      duration: '90 minutes',
      numberOfDays: '5'
    };
    const md = buildFallback(fallbackData);
    const html = mdToStyledHtml(md, fallbackData);
    return okJson({
      success: true,
      fallback: true,
      lessonPlan: cleanText(md),
      htmlVersion: html,
      error: err?.message || 'Unknown error'
    });
  }
}
