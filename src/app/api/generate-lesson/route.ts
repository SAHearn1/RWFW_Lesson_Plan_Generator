// src/app/api/generate-lesson/route.ts - Clean HTML formatting & stable parsing (TS fixes)

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

type ImagePrompt = {
  filename: string;
  prompt: string;
  type: string;
};

function okJson(data: unknown, init: ResponseInit = {}) {
  return NextResponse.json(data, { ...init, headers: { 'Cache-Control': 'no-store' } });
}

/** ---- Flexible body parsing (accepts JSON, text JSON, form POST, or nested payload) ---- */
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
    } catch { /* fall through */ }
  }

  try {
    const raw = await req.text();
    if (raw && raw.trim().startsWith('{')) {
      const json = JSON.parse(raw);
      return normalizeShape(json);
    }
  } catch { /* fall through */ }

  if (ct.includes('application/x-www-form-urlencoded')) {
    try {
      const form = await req.formData();
      const o: Record<string, string> = {};
      for (const [k, v] of form.entries()) if (typeof v === 'string') o[k] = v;
      return normalizeShape(o);
    } catch { /* ignore */ }
  }

  return null;
}

/** ---- Helpers ---- */
function getSubjectAbbreviation(subject: string): string {
  const abbreviations: Record<string, string> = {
    'English Language Arts': 'ELA',
    'Mathematics': 'MATH',
    'Science': 'SCI',
    'Social Studies': 'SOC',
    'STEAM (Integrated)': 'STEAM',
    'Special Education': 'SPED',
    'Agriculture': 'AGSCI',
    'Environmental Science': 'ENVSCI',
    'Life Skills': 'LIFE',
    'Social-Emotional Learning': 'SEL',
    'Art': 'ART',
    'Music': 'MUS',
    'Physical Education': 'PE',
    'Career & Technical Education': 'CTE',
    'World Languages': 'WL'
  };
  return abbreviations[subject] || 'GEN';
}

function processTopicForReadability(topic: string): string {
  let cleanTopic = (topic || '').trim();
  if (cleanTopic.length > 60) {
    const patterns = [
      /^(.*?)\s+(?:A Two-Week|Research Project|That Will Change)/i,
      /^(.*?)\s+(?:Understanding|Exploring|Learning|Studying)/i,
      /^(?:Understanding|Exploring|Learning|Studying)\s+(.*?)(?:\s+(?:A|The|Research|Project))/i,
      /^(.*?)(?:\s+(?:Impact|Effect|Influence).*)$/i
    ];
    for (const pattern of patterns) {
      const m = cleanTopic.match(pattern);
      if (m?.[1] && m[1].length > 10 && m[1].length < 50) { cleanTopic = m[1].trim(); break; }
    }
    if (cleanTopic.length > 60) {
      const words = cleanTopic.split(' ');
      cleanTopic = words.slice(0, Math.min(6, words.length)).join(' ');
    }
  }
  return cleanTopic.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/**
 * Clean up mojibake, but DO NOT renumber ordered lists or strip structural tokens we intend to transform.
 * We keep "LEVEL I/II/III HEADING", "CREATE TABLE:", etc., so the HTML transformer can convert them.
 */
function cleanContent(content: string): string {
  return (content || '')
    .replace(/â€”|—/g, '—')
    .replace(/â€œ|â€|“|”/g, '"')
    .replace(/â€˜|â€™|’/g, "'")
    .replace(/Â/g, ' ')
    .replace(/Ã—/g, '×')
    .replace(/\u00A0/g, ' ')
    // common bullets that sometimes render weirdly
    .replace(/^[\s•\-]+\s*/gm, match => match.includes('•') ? '• ' : match.trim() ? match : '')
    // collapse excessive blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Build the master prompt that yields structured (but human-readable) text we then post-process into HTML */
function buildEnhancedMasterPrompt(data: MasterPromptRequest): string {
  const numberOfDays = parseInt(data.numberOfDays || '5');
  const durationMinutes = parseInt(data.duration?.match(/\d+/)?.[0] || '90');
  const cleanTopic = processTopicForReadability(data.topic);
  const subjectAbbr = getSubjectAbbreviation(data.subject);

  const dayFoci = [
    'Introduction and Foundation Building',
    'Exploration and Investigation',
    'Analysis and Critical Thinking',
    'Application and Creation',
    'Synthesis and Reflection'
  ];

  return `
PROFESSIONAL LESSON PLAN GENERATOR - STRUCTURED OUTPUT

Create a comprehensive ${numberOfDays}-day lesson plan with clear content hierarchy and professional formatting. Use the heading tokens literally as labels for sections so they can be transformed into HTML later.

LESSON PARAMETERS:
- Subject: ${data.subject}
- Grade Level: ${data.gradeLevel}
- Topic: ${cleanTopic}
- Duration: ${data.duration} per day
- Location: ${data.location || 'Savannah, Georgia'}
- Days: ${numberOfDays}

LEVEL I HEADING: TRAUMA-INFORMED STEAM LESSON PLAN
Grade: ${data.gradeLevel}
Subject: ${data.subject}
Topic: ${cleanTopic}
Duration: ${data.duration} per day over ${numberOfDays} days
Location: ${data.location || 'Savannah, Georgia'}
Unit Title: [Create compelling 4-6 word title using "${cleanTopic}"]

LEVEL I HEADING: LESSON OVERVIEW
[Write 2-3 sentences describing the unit's purpose and student outcomes]

LEVEL I HEADING: UNIT ESSENTIAL QUESTION
[One overarching question that spans all ${numberOfDays} days]

LEVEL I HEADING: UNIT LEARNING TARGETS
- I can [specific measurable outcome 1] (DOK 2)
- I can [specific measurable outcome 2] (DOK 3)
- I can [specific measurable outcome 3] (DOK 4)

${Array.from({ length: numberOfDays }, (_, i) => {
  const dayNumber = i + 1;
  const focus = dayFoci[i] || `Advanced Application ${dayNumber}`;
  return `
LEVEL I HEADING: DAY ${dayNumber}: ${focus}

LEVEL II HEADING: Daily Essential Question
[Specific question for Day ${dayNumber} that builds toward unit question]

LEVEL II HEADING: Daily Learning Target
I can [specific skill for Day ${dayNumber} related to ${cleanTopic}] (DOK ${dayNumber <= 2 ? 2 : dayNumber <= 4 ? 3 : 4})

LEVEL II HEADING: Standards Alignment
CREATE TABLE:
Standard Type | Standard Code | Description
Primary Standard | [Specific ${data.subject} standard] | [Brief description]
SEL Integration | CASEL | [Specific competency for Day ${dayNumber}]
Cross-Curricular | [Subject areas] | [Integration description]

LEVEL II HEADING: Materials Needed
- [Specific materials for Day ${dayNumber}]

LEVEL II HEADING: Root Work Framework 5 Rs Structure

LEVEL III HEADING: RELATIONSHIPS (${Math.round(durationMinutes * 0.15)} minutes)
Opening Activity for Day ${dayNumber}:
[Community building activity for Day ${dayNumber}]

Teacher Note: [Guidance for Day ${dayNumber} relationships]
Student Note: [Encouragement for Day ${dayNumber} relationships]

LEVEL III HEADING: ROUTINES (${Math.round(durationMinutes * 0.1)} minutes)
Day ${dayNumber} Agenda:
1. [Agenda step]
2. [Agenda step]
3. [Agenda step]

Success Criteria:
- [Criterion]
- [Criterion]

Teacher Note: [Routine guidance Day ${dayNumber}]
Student Note: [Organization tip Day ${dayNumber}]

LEVEL III HEADING: RELEVANCE (${Math.round(durationMinutes * 0.25)} minutes)
Day ${dayNumber} Connection Activity:
[Connection activity for ${cleanTopic}]

Real-World Bridge:
[Community/current events tie for Day ${dayNumber}]

Teacher Note: [Relevance guidance Day ${dayNumber}]
Student Note: [Relevance encouragement Day ${dayNumber}]

LEVEL III HEADING: RIGOR (${Math.round(durationMinutes * 0.35)} minutes)
I Do: Teacher Modeling (${Math.round(durationMinutes * 0.1)} minutes)
[Demonstration]

Think-Aloud Script:
"[Brief think aloud]"

Teacher Note: [Modeling guidance Day ${dayNumber}]
Student Note: [Listening strategy Day ${dayNumber}]

We Do: Guided Practice (${Math.round(durationMinutes * 0.15)} minutes)
[Collaborative activity]

Scaffolding Supports:
- [Support]
- [Support]

Teacher Note: [Scaffolding guidance Day ${dayNumber}]
Student Note: [Collaboration strategies Day ${dayNumber}]

You Do Together: Collaborative Application (${Math.round(durationMinutes * 0.1)} minutes)
[Group task]
Choice Options:
- [Option]
- [Option]

Teacher Note: [Monitoring guidance Day ${dayNumber}]
Student Note: [Teamwork strategies Day ${dayNumber}]

LEVEL III HEADING: REFLECTION (${Math.round(durationMinutes * 0.15)} minutes)
Day ${dayNumber} Processing:
[Reflection activity]

Tomorrow's Preview:
[Preview]

Teacher Note: [Reflection guidance Day ${dayNumber}]
Student Note: [Metacognition prompts Day ${dayNumber}]

LEVEL II HEADING: Day ${dayNumber} Implementation Supports
CREATE TABLE:
Support Tier | Target Population | Specific Strategies
Tier 1 Universal | All Students | [3 supports]
Tier 2 Targeted | Students Needing Additional Support | [3 supports]
Tier 3 Intensive | Students Needing Significant Support | [3 supports]
504 Accommodations | Students with Disabilities | [Accommodations]
Gifted Extensions | Advanced Learners | [Extensions]
SPED Modifications | Students with IEPs | [Modifications]

LEVEL II HEADING: Day ${dayNumber} Assessment
CREATE TABLE:
Assessment Type | Method | Purpose
Formative | [Specific check] | Monitor progress
Summative | [Culmination] | Evaluate mastery

LEVEL II HEADING: SEL Integration
[SEL specifics Day ${dayNumber}]

LEVEL II HEADING: Trauma-Informed Considerations
[Trauma-informed notes Day ${dayNumber}]

PAGE BREAK
`.trim();
}).join('\n\n')}

LEVEL I HEADING: COMPREHENSIVE RESOURCE GENERATION

LEVEL II HEADING: 1. Student Workbook
File: RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}_${data.gradeLevel}${subjectAbbr}_StudentWorkbook.pdf

COMPLETE CONTENT:
[Write out all student-facing workbook pages for the unit]

LEVEL II HEADING: 2. Teacher Implementation Guide
File: RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}_${data.gradeLevel}${subjectAbbr}_TeacherGuide.pdf

COMPLETE CONTENT:
[Write a detailed teacher guide, prep checklists, day-by-day tips, anticipated challenges, differentiation, and rubrics]
`.trim();
}

/** Convert the structured tokens to styled HTML (no "LEVEL I HEADING" strings will remain) */
function formatAsEnhancedHTML(content: string, data: MasterPromptRequest): string {
  const cleaned = cleanContent(content);
  const cleanTopic = processTopicForReadability(data.topic);

  const css = `
@page { margin: 0.75in; }
body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 11pt; line-height: 1.5; color: #2B2B2B; background: #FFF; margin:0; padding:24pt;
}
.level-1-heading {
  font-size: 18pt; font-weight: 800; margin: 20pt 0 10pt;
  background: linear-gradient(135deg, #1B365D, #2E86AB); color: #fff; padding: 10pt 12pt; border-radius: 8pt;
}
.level-2-heading {
  font-size: 14pt; font-weight: 700; color: #2E86AB; margin: 16pt 0 8pt; border-bottom: 2pt solid #2E86AB; padding-bottom: 4pt;
}
.level-3-heading {
  font-size: 12pt; font-weight: 700; color: #3B523A; margin: 12pt 0 6pt; background: #F2F4CA; border-left: 5pt solid #3B523A; padding: 6pt 10pt; border-radius: 4pt;
}
.header {
  text-align: center; margin-bottom: 24pt; padding: 16pt;
  background: linear-gradient(135deg, #F2F4CA, #E8ECBF); border: 2pt solid #D4C862; border-radius: 12pt;
}
.meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10pt; margin-top: 12pt; }
.meta-item { padding: 8pt; background: #fff; border-left: 4pt solid #2E86AB; border-radius: 6pt; }
.meta-label { font-weight: 700; color: #1B365D; }
.day-section { margin: 24pt 0; padding: 14pt; background:#fff; border:1pt solid #E0E0E0; border-radius: 10pt; }
.rs-section { margin: 12pt 0; padding: 12pt; border-left: 6pt solid #D4C862; background: #FAFAFA; border-radius: 0 8pt 8pt 0; }
.rs-header { font-size: 12pt; font-weight: 700; color: #1B365D; margin-bottom: 8pt; }
.note { margin: 10pt 0; padding: 10pt; border-radius: 8pt; font-size: 10pt; border-left: 4pt solid; }
.teacher-note { background: #F0F7FF; border-left-color: #2E86AB; color: #1B365D; }
.student-note { background: #F3FFF0; border-left-color: #28A745; color: #155724; }
table { width: 100%; border-collapse: collapse; margin: 12pt 0; background:#fff; border-radius: 6pt; overflow: hidden; }
th, td { border: 1pt solid #E0E0E0; padding: 8pt 10pt; text-align: left; vertical-align: top; }
th { background: linear-gradient(135deg, #1B365D, #2E86AB); color: #fff; font-weight: 700; font-size: 10pt; }
tr:nth-child(even) { background: #F8F9FA; }
ul { margin: 8pt 0; padding-left: 20pt; }
.bulleted-list { background: #F8F9FA; padding: 10pt; border-radius: 6pt; border-left: 3pt solid #D4C862; }
.resource-section { background: #FFFDF2; padding: 16pt; border-radius: 10pt; border:2pt solid #D4C862; margin: 20pt 0; }
.footer { margin-top: 24pt; padding-top: 12pt; border-top: 2pt solid #F2F4CA; text-align: center; color: #666; font-size: 9pt; }
@media print {
  body { padding: 0.5in; }
  .day-section, .rs-section, .level-1-heading, .level-2-heading, .level-3-heading, table { page-break-inside: avoid; }
}
`.trim();

  let html = cleaned;

  // HEADING TOKENS → SEMANTIC HEADINGS
  html = html.replace(/^LEVEL I HEADING:\s*(.+)$/gmi, '<h1 class="level-1-heading">$1</h1>');
  html = html.replace(/^LEVEL II HEADING:\s*(.+)$/gmi, '<h2 class="level-2-heading">$1</h2>');
  html = html.replace(/^LEVEL III HEADING:\s*(.+)$/gmi, '<h3 class="level-3-heading">$1</h3>');

  // DAY sections: wrap "DAY X: Title" in a section
  html = html.replace(/<h1 class="level-1-heading">DAY\s+(\d+):\s*([^<]+)<\/h1>/g, (_m: string, d: string, title: string) => {
    return `<section class="day-section"><h1 class="level-1-heading">DAY ${d}: ${title}</h1>`;
  });

  // Ensure PAGE BREAK tokens become section boundaries
  html = html.replace(/\n?PAGE BREAK\n?/g, '</section><div style="page-break-before: always;"></div>');

  // Close any open <section> at the end (if missing)
  if (!html.trim().endsWith('</section>')) {
    html += '</section>';
  }

  // 5 Rs → styled blocks
  html = html
    .replace(/<h3 class="level-3-heading">RELATIONSHIPS \((\d+)\s*minutes\)<\/h3>/g, `<div class="rs-section"><div class="rs-header">RELATIONSHIPS ($1 minutes)</div>`)
    .replace(/<h3 class="level-3-heading">ROUTINES \((\d+)\s*minutes\)<\/h3>/g, `</div><div class="rs-section"><div class="rs-header">ROUTINES ($1 minutes)</div>`)
    .replace(/<h3 class="level-3-heading">RELEVANCE \((\d+)\s*minutes\)<\/h3>/g, `</div><div class="rs-section"><div class="rs-header">RELEVANCE ($1 minutes)</div>`)
    .replace(/<h3 class="level-3-heading">RIGOR \((\d+)\s*minutes\)<\/h3>/g, `</div><div class="rs-section"><div class="rs-header">RIGOR ($1 minutes)</div>`)
    .replace(/<h3 class="level-3-heading">REFLECTION \((\d+)\s*minutes\)<\/h3>/g, `</div><div class="rs-section"><div class="rs-header">REFLECTION ($1 minutes)</div>`);

  // Teacher / Student Notes
  html = html
    .replace(/(^|\n)Teacher Note:\s*([^\n<][^\n]*)/g, `$1<div class="note teacher-note"><strong>Teacher Note:</strong> $2</div>`)
    .replace(/(^|\n)Student Note:\s*([^\n<][^\n]*)/g, `$1<div class="note student-note"><strong>Student Note:</strong> $2</div>`);

  // CREATE TABLE blocks: convert pipe tables to HTML tables
  html = html.replace(/CREATE TABLE:\s*\n((?:[^\n]+\|[^\n]+\|[^\n]+\n?)+)/g, (_m: string, tableBlock: string) => {
    const lines: string[] = tableBlock.trim().split('\n').filter((l: string) => l.trim());
    if (!lines.length) return '';
    const [headerLine, ...dataLines] = lines;
    const headers: string[] = headerLine.split('|').map((s: string) => s.trim());
    let out = '<table><thead><tr>';
    headers.forEach((h: string) => { out += `<th>${h}</th>`; });
    out += '</tr></thead><tbody>';
    dataLines.forEach((line: string) => {
      const cells: string[] = line.split('|').map((s: string) => s.trim());
      if (cells.length) {
        out += '<tr>' + cells.map((c: string) => `<td>${c}</td>`).join('') + '</tr>';
      }
    });
    out += '</tbody></table>';
    return out;
  });

  // Turn hyphen bullets into lists (lightweight)
  // Step 1: wrap bullet lines
  html = html.replace(/(^|\n)\s*[-•]\s+(.+)/g, '$1<li>$2</li>');
  // Step 2: wrap consecutive li into a UL
  html = html.replace(/(?:<li>[\s\S]*?<\/li>\s*)+/g, (match: string) => `<div class="bulleted-list"><ul>${match}</ul></div>`);

  // Close any rs-section that was left open before a new heading or section
  html = html.replace(/(<div class="rs-section">[\s\S]*?)(?=<h[123]|<section|<\/section>|$)/g, (m: string) => {
    return m.endsWith('</div>') ? m : m + '</div>';
  });

  // Resource block header
  html = html.replace(/<h1 class="level-1-heading">COMPREHENSIVE RESOURCE GENERATION<\/h1>/g,
    `<div class="resource-section"><h1 class="level-1-heading">COMPREHENSIVE RESOURCE GENERATION</h1>`);

  // Ensure resource block closes
  html = html.replace(/(<div class="resource-section">[\s\S]*?)$/g, '$1</div>');

  // Basic header wrap with meta
  const header = `
<div class="header">
  <h1>Root Work Framework Lesson Plan</h1>
  <div class="meta-grid">
    <div class="meta-item"><div class="meta-label">Topic:</div><div>${cleanTopic}</div></div>
    <div class="meta-item"><div class="meta-label">Grade Level:</div><div>${data.gradeLevel}</div></div>
    <div class="meta-item"><div class="meta-label">Subject:</div><div>${data.subject}</div></div>
    <div class="meta-item"><div class="meta-label">Duration:</div><div>${data.duration} × ${data.numberOfDays} days</div></div>
  </div>
</div>`.trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${cleanTopic} — Grade ${data.gradeLevel} Lesson Plan</title>
<style>${css}</style>
</head>
<body>
${header}
${html}
<div class="footer">
  <p><strong>Generated by Root Work Framework</strong> — Professional, trauma-informed learning design</p>
  <p>Generated: ${new Date().toLocaleDateString()}</p>
</div>
</body>
</html>`;
}

/** Extract downloadable text resources (from "COMPLETE CONTENT:" blocks) */
function generateDownloadableResources(content: string, data: MasterPromptRequest): {textResources: GeneratedResource[], imagePrompts: ImagePrompt[]} {
  const cleanTopic = processTopicForReadability(data.topic);
  const lessonCode = `RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}`;
  const subjectAbbr = getSubjectAbbreviation(data.subject);

  const matches = content.match(/COMPLETE CONTENT:\s*([\s\S]*?)(?=\nLEVEL II HEADING:|\nLEVEL I HEADING:|$)/g) || [];
  const textResources: GeneratedResource[] = matches.map((m: string, i: number) => ({
    filename: `${lessonCode}_${data.gradeLevel}${subjectAbbr}_Resource${i + 1}.txt`,
    content: cleanContent(m.replace(/^COMPLETE CONTENT:\s*/i, '')),
    type: 'text/plain'
  }));

  return { textResources, imagePrompts: [] };
}

/** Validate presence of key components */
function validateLessonPlan(content: string, data: MasterPromptRequest) {
  const missing: string[] = [];
  const teacherNoteCount = (content.match(/Teacher Note:/g) || []).length;
  const studentNoteCount = (content.match(/Student Note:/g) || []).length;
  const expectedNotes = parseInt(data.numberOfDays || '5') * 6; // rough expectation

  if (teacherNoteCount < expectedNotes) missing.push(`Teacher Notes (found ${teacherNoteCount}, expected ~${expectedNotes})`);
  if (studentNoteCount < expectedNotes) missing.push(`Student Notes (found ${studentNoteCount}, expected ~${expectedNotes})`);
  ['RELATIONSHIPS','ROUTINES','RELEVANCE','RIGOR','REFLECTION'].forEach((k: string) => {
    if (!content.includes(k)) missing.push(`${k} component`);
  });
  if (!content.includes('CREATE TABLE')) missing.push('Structured tables');
  if (!content.includes('COMPLETE CONTENT:')) missing.push('Generated resource content');

  return { isValid: missing.length === 0, missingComponents: missing };
}

/** Emergency fallback content when API key or generation fails */
function buildEnhancedFallback(data: MasterPromptRequest) {
  const cleanTopic = processTopicForReadability(data.topic);
  const content = `
LEVEL I HEADING: TRAUMA-INFORMED STEAM LESSON PLAN
Grade: ${data.gradeLevel}
Subject: ${data.subject}
Topic: ${cleanTopic}
Duration: ${data.duration} per day over ${data.numberOfDays} days
Location: ${data.location || 'Savannah, Georgia'}

LEVEL I HEADING: LESSON OVERVIEW
This multi-day sequence explores ${cleanTopic} with RWFW (5 Rs), MTSS supports, SEL, and clear assessment.

LEVEL I HEADING: UNIT ESSENTIAL QUESTION
How does ${cleanTopic} connect to our lives, community, and future?

LEVEL I HEADING: UNIT LEARNING TARGETS
- I can describe key concepts of ${cleanTopic}. (DOK 2)
- I can apply ${cleanTopic} ideas in real-world contexts. (DOK 3)
- I can evaluate impacts of ${cleanTopic} and propose solutions. (DOK 4)

LEVEL I HEADING: DAY 1: Introduction and Foundation Building
LEVEL II HEADING: Daily Essential Question
What matters most about ${cleanTopic} to our community?

LEVEL II HEADING: Standards Alignment
CREATE TABLE:
Standard Type | Standard Code | Description
Primary Standard | [Subject std] | Analyze and apply concepts of ${cleanTopic}
SEL Integration | CASEL | Self-awareness & Social awareness
Cross-Curricular | STEAM | Integrate science/tech/arts/maths

LEVEL II HEADING: Root Work Framework 5 Rs Structure
LEVEL III HEADING: RELATIONSHIPS (15 minutes)
Opening Activity for Day 1:
Community circle

Teacher Note: Welcome every voice.
Student Note: Share at your pace.

LEVEL III HEADING: ROUTINES (10 minutes)
Day 1 Agenda:
1. Community circle
2. Mini-lesson
3. Practice

Success Criteria:
- Identify key terms
- Engage in discussion
- Reflect

Teacher Note: Post agenda visually.
Student Note: Track your questions.

LEVEL III HEADING: RELEVANCE (20 minutes)
Day 1 Connection Activity:
Local tie to ${cleanTopic}

Teacher Note: Draw community links.
Student Note: Add personal examples.

LEVEL III HEADING: RIGOR (35 minutes)
I Do: Teacher Modeling (10 minutes)
Think-Aloud Script:
"Watch how I..."

Teacher Note: Model strategies.
Student Note: Note key moves.

We Do: Guided Practice (15 minutes)
Scaffolding Supports:
- Graphic organizers
- Sentence starters

Teacher Note: Right-sized help.
Student Note: Collaborate.

You Do Together: Collaborative Application (10 minutes)
Choice Options:
- Create
- Explain

Teacher Note: Monitor equity.
Student Note: Share roles.

LEVEL III HEADING: REFLECTION (10 minutes)
Day 1 Processing:
Quick write; share

Teacher Note: Celebrate growth.
Student Note: Set a goal.

LEVEL II HEADING: Day 1 Assessment
CREATE TABLE:
Assessment Type | Method | Purpose
Formative | Exit Ticket | Gauge understanding

PAGE BREAK

LEVEL I HEADING: COMPREHENSIVE RESOURCE GENERATION
LEVEL II HEADING: 1. Student Workbook
File: RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}_${data.gradeLevel}${getSubjectAbbreviation(data.subject)}_StudentWorkbook.pdf

COMPLETE CONTENT:
[Student pages]
`.trim();

  const cleanVersion = cleanContent(content);
  const htmlVersion = formatAsEnhancedHTML(content, data);
  return { content, htmlVersion, cleanVersion };
}

/** ---- POST handler ---- */
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
      specialInstructions: (received as any).specialInstructions ?? ''
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      const fallback = buildEnhancedFallback(data);
      return okJson({
        lessonPlan: fallback.cleanVersion,
        htmlVersion: fallback.htmlVersion,
        plainText: fallback.content,
        fallback: true,
        success: true,
        warnings: [...warnings, 'Used enhanced fallback due to missing API key']
      });
    }

    const prompt = buildEnhancedMasterPrompt(data);

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 8000,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!resp.ok) {
      const fallback = buildEnhancedFallback(data);
      return okJson({
        lessonPlan: fallback.cleanVersion,
        htmlVersion: fallback.htmlVersion,
        plainText: fallback.content,
        fallback: true,
        success: true,
        warnings: [...warnings, `API error ${resp.status}, used enhanced fallback`]
      });
    }

    const payload = await resp.json();
    let lessonContent = '';

    if (Array.isArray(payload?.content)) {
      const firstText = payload.content.find((c: any) => c?.type === 'text');
      if (firstText?.text) lessonContent = String(firstText.text);
    } else if (typeof payload?.content === 'string') {
      lessonContent = payload.content;
    }

    // Strip code fences if the model wrapped output
    lessonContent = lessonContent.replace(/```(?:markdown)?\s*|```/gi, '').trim();

    if (!lessonContent || lessonContent.length < 2000) {
      const fallback = buildEnhancedFallback(data);
      return okJson({
        lessonPlan: fallback.cleanVersion,
        htmlVersion: fallback.htmlVersion,
        plainText: fallback.content,
        fallback: true,
        success: true,
        warnings: [...warnings, 'Generated content too short, used enhanced fallback']
      });
    }

    const validation = validateLessonPlan(lessonContent, data);
    const cleanedContent = cleanContent(lessonContent);
    const htmlVersion = formatAsEnhancedHTML(lessonContent, data);
    const resources = generateDownloadableResources(lessonContent, data);

    return okJson({
      lessonPlan: cleanedContent,  // raw text (cleaned) for copy/RTF
      htmlVersion,                 // fully formatted HTML for UI/PDF
      plainText: cleanedContent,
      resources,
      success: true,
      warnings,
      validation
    });

  } catch (err) {
    const fallbackData: MasterPromptRequest = {
      subject: 'General Studies',
      gradeLevel: '6',
      topic: 'Learning Together',
      duration: '90 minutes',
      numberOfDays: '5'
    };
    const fallback = buildEnhancedFallback(fallbackData);
    return okJson({
      lessonPlan: fallback.cleanVersion,
      htmlVersion: fallback.htmlVersion,
      plainText: fallback.content,
      fallback: true,
      success: true,
      warnings: ['Emergency fallback due to system error'],
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}
