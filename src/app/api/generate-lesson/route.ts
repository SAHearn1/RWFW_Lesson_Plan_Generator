// src/app/api/generate-lesson/route.ts - Focused prompt, no placeholders, correct heading transforms

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
    } catch {
      /* ignore */
    }
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
  const abbreviations: Record<string, string> = {
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
  return abbreviations[subject] || 'GEN';
}

function processTopicForReadability(topic: string): string {
  let cleanTopic = (topic || '').trim();
  if (!cleanTopic) return 'Core Concept';

  if (cleanTopic.length > 60) {
    const patterns = [
      /^(.*?)\s+(?:A Two-Week|Research Project|That Will Change)/i,
      /^(.*?)\s+(?:Understanding|Exploring|Learning|Studying)/i,
      /^(?:Understanding|Exploring|Learning|Studying)\s+(.*?)(?:\s+(?:A|The|Research|Project))/i,
      /^(.*?)\s+(?:Impact|Effect|Influence)/i,
    ];
    for (const p of patterns) {
      const m = cleanTopic.match(p);
      if (m?.[1] && m[1].length > 10 && m[1].length < 50) {
        cleanTopic = m[1].trim();
        break;
      }
    }
    if (cleanTopic.length > 60) {
      const words = cleanTopic.split(' ');
      cleanTopic = words.slice(0, Math.min(6, words.length)).join(' ');
    }
  }

  return cleanTopic
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function cleanContent(content: string): string {
  return (content || '')
    // fix common encoding artifacts
    .replace(/â€"/g, '—')
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€™/g, "'")
    .replace(/Ã—/g, '×')
    .replace(/Ã¢â‚¬â€/g, '—')
    .replace(/Ã¢â‚¬Å"/g, '"')
    .replace(/Ã¢â‚¬â„¢/g, "'")
    .replace(/â€¦/g, '...')
    .replace(/Â/g, ' ')
    .replace(/\u00A0/g, ' ')
    // de-markdownify emphasis/code artifacts
    .replace(/`{1,3}([^`]+)`{1,3}/g, '$1')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // bullets & numbers
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildEnhancedMasterPrompt(data: MasterPromptRequest): string {
  const numberOfDays = parseInt(data.numberOfDays || '5', 10);
  const durationMinutes = parseInt(data.duration?.match(/\d+/)?.[0] || '90', 10);
  const cleanTopic = processTopicForReadability(data.topic);
  const subject = data.subject;

  // Focus: produce only the full plan. No placeholder text, no “would continue”.
  return `
You are an instructional design expert. Produce a COMPLETE, ready-to-teach, multi-day lesson plan following the Root Work Framework with *no* placeholders or meta commentary. Do NOT write lines like "[The guide would continue…]". Finish every section you start.

OUTPUT STYLE:
- Use the exact tokens "LEVEL I HEADING:", "LEVEL II HEADING:", and "LEVEL III HEADING:" as section markers only (we convert these into styled headings). Do not show markdown hashes (#) and do not include code fences.
- Use clear, concise, professional language. Provide bulleted lists where useful.
- Every 5 Rs component must include both a "Teacher Note:" and a "Student Note:" line with concrete guidance.

CONTEXT
Subject: ${subject}
Grade Level: ${data.gradeLevel}
Topic: ${cleanTopic}
Duration: ${data.duration} per day
Location: ${data.location || 'Savannah, Georgia'}
Days: ${numberOfDays}
Unit Context (if provided): ${data.unitContext || 'N/A'}
Learning Objectives (if provided): ${data.learningObjectives || 'N/A'}
Special Considerations (if provided): ${data.specialNeeds || 'N/A'}
Available Resources (if provided): ${data.availableResources || 'N/A'}

TOP-LEVEL SECTIONS (use LEVEL I HEADING markers):
1) TRAUMA-INFORMED STEAM LESSON PLAN
   - Plain lines for Grade, Subject, Topic, Duration, Location, Unit Title (create a strong 4–6 word title)
2) LESSON OVERVIEW (2–3 sentences on purpose and outcomes)
3) UNIT ESSENTIAL QUESTION (one compelling question)
4) UNIT LEARNING TARGETS
   - 3 bullet "I can…" targets with DOK levels (2, 3, 4)

FOR EACH DAY ${numberOfDays} (use LEVEL I HEADING: DAY N: <Focus>):
- Pick a focus arc that progresses across the unit (e.g., Foundation; Investigation; Analysis; Application; Synthesis).
- Include these LEVEL II HEADING blocks, fully completed:
  • Daily Essential Question
  • Daily Learning Target (include DOK)
  • Standards Alignment
    CREATE TABLE:
    Standard Type | Standard Code | Description
    Primary Standard | [specific ${subject} standard] | [description]
    SEL Integration | CASEL | [daily SEL competency]
    Cross-Curricular | [areas] | [integration]
  • Materials Needed (bulleted, specific)
  • Root Work Framework 5 Rs Structure
    LEVEL III HEADING: RELATIONSHIPS (${Math.round(durationMinutes * 0.15)} minutes)
    LEVEL III HEADING: ROUTINES (${Math.round(durationMinutes * 0.1)} minutes)
    LEVEL III HEADING: RELEVANCE (${Math.round(durationMinutes * 0.25)} minutes)
    LEVEL III HEADING: RIGOR (${Math.round(durationMinutes * 0.35)} minutes)
      Include I Do (modeling with a short think-aloud), We Do (guided), You Do Together (collaborative options)
    LEVEL III HEADING: REFLECTION (${Math.round(durationMinutes * 0.15)} minutes)
    - Each sub-section includes both "Teacher Note:" and "Student Note:" lines with concrete, day-specific guidance.
  • Day N Implementation Supports
    CREATE TABLE:
    Support Tier | Target Population | Specific Strategies
    Tier 1 Universal | All Students | [3 specific supports]
    Tier 2 Targeted | Students Needing Additional Support | [3 interventions]
    Tier 3 Intensive | Students Needing Significant Support | [3 modifications]
    504 Accommodations | Students with Disabilities | [accommodations]
    Gifted Extensions | Advanced Learners | [extensions]
    SPED Modifications | Students with IEPs | [modifications]
  • Day N Assessment
    CREATE TABLE:
    Assessment Type | Method | Purpose
    Formative | [check for understanding] | [purpose]
    Summative | [how this day feeds the unit] | [purpose]
  • SEL Integration (1 short paragraph)
  • Trauma-Informed Considerations (1 short paragraph)

IMPORTANT:
- No meta text, no ellipses for missing parts, no TODOs, and do not say you will provide something later.
- Produce complete, specific content for all sections and days.
`.trim();
}

function processContentForEnhancedHTML(raw: string): string {
  let html = cleanContent(raw || '');

  // Convert headings (use correct capture groups)
  html = html.replace(/LEVEL I HEADING:\s*(.+)/g, '<h1 class="level-1-heading">$1</h1>');
  html = html.replace(/LEVEL II HEADING:\s*(.+)/g, '<h2 class="level-2-heading">$1</h2>');
  html = html.replace(/LEVEL III HEADING:\s*(.+)/g, '<h3 class="level-3-heading">$1</h3>');

  // Wrap DAY sections (open a section for each match; we close at the end)
  html = html.replace(
    /<h1 class="level-1-heading">DAY (\d+): ([^<]+)<\/h1>/g,
    '<section class="day-section"><h1 class="level-1-heading">DAY $1: $2</h1>'
  );

  // CREATE TABLE blocks: convert pipe tables to HTML tables
  html = html.replace(/CREATE TABLE:\s*\n((?:[^\n]+\|[^\n]+\|[^\n]+\n?)+)/g, (_m: string, tableBlock: string) => {
    const lines = tableBlock
      .trim()
      .split('\n')
      .filter((l: string) => l.trim());
    if (!lines.length) return '';
    const [headerLine, ...dataLines] = lines;
    const headers = headerLine.split('|').map((s: string) => s.trim());

    let out = '<table><thead><tr>';
    headers.forEach((h: string) => (out += `<th>${h}</th>`));
    out += '</tr></thead><tbody>';

    dataLines.forEach((line: string) => {
      const cells = line.split('|').map((s: string) => s.trim());
      if (!cells.filter(Boolean).length) return;
      out += '<tr>';
      headers.forEach((_, idx) => {
        out += `<td>${cells[idx] ?? ''}</td>`;
      });
      out += '</tr>';
    });

    out += '</tbody></table>';
    return out;
  });

  // Notes styling
  html = html.replace(
    /(^|\n)Teacher Note:\s*([^\n]+)/g,
    '$1<div class="note teacher-note"><strong>Teacher Note:</strong> $2</div>'
  );
  html = html.replace(
    /(^|\n)Student Note:\s*([^\n]+)/g,
    '$1<div class="note student-note"><strong>Student Note:</strong> $2</div>'
  );

  // Simple bullet block wrapper (lines starting with • )
  // Wrap contiguous bullet lines with a styled container and <ul>
  html = html.replace(
    /(?:^|\n)(?:• .+(?:\n|$))+?/g,
    (block: string) => {
      const items = block
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('• '))
        .map((l) => `<li>${l.replace(/^•\s*/, '')}</li>`)
        .join('');
      return items ? `<div class="bulleted-list"><ul>${items}</ul></div>\n` : block;
    }
  );

  // Page breaks keyword
  html = html.replace(/\bPAGE BREAK\b/g, '<div style="page-break-before: always;"></div>');

  // Close any unclosed day-section at the end
  if (html.includes('<section class="day-section">')) {
    html += '</section>';
  }

  return html;
}

function formatAsEnhancedHTML(content: string, data: MasterPromptRequest): string {
  const cleanTopic = processTopicForReadability(data.topic);
  const body = processContentForEnhancedHTML(content);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${cleanTopic} — Grade ${data.gradeLevel} Lesson Plan</title>
<style>
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
.footer { margin-top: 24pt; padding-top: 12pt; border-top: 2pt solid #F2F4CA; text-align: center; color: #666; font-size: 9pt; }
@media print {
  body { padding: 0.5in; }
  .day-section, .rs-section, .level-1-heading, .level-2-heading, .level-3-heading, table { page-break-inside: avoid; }
}
</style>
</head>
<body>
<div class="header">
  <h1>Root Work Framework Lesson Plan</h1>
  <div class="meta-grid">
    <div class="meta-item"><div class="meta-label">Topic:</div><div>${cleanTopic}</div></div>
    <div class="meta-item"><div class="meta-label">Grade Level:</div><div>${data.gradeLevel}</div></div>
    <div class="meta-item"><div class="meta-label">Subject:</div><div>${data.subject}</div></div>
    <div class="meta-item"><div class="meta-label">Duration:</div><div>${data.duration} × ${data.numberOfDays} days</div></div>
  </div>
</div>
${body}
<div class="footer">
  <p><strong>Generated by Root Work Framework</strong> — Professional, trauma-informed learning design</p>
  <p>Generated: ${new Date().toLocaleDateString('en-US')}</p>
</div>
</body>
</html>`;
}

function validateLessonPlan(content: string, data: MasterPromptRequest): { isValid: boolean; missing: string[] } {
  const missing: string[] = [];
  const teacherNoteCount = (content.match(/Teacher Note:/g) || []).length;
  const studentNoteCount = (content.match(/Student Note:/g) || []).length;
  const days = parseInt(data.numberOfDays || '5', 10);
  const minNotes = days * 6; // rough minimum across the 5 Rs sections

  if (teacherNoteCount < minNotes) missing.push(`Teacher Notes (found ${teacherNoteCount}, need ≥ ${minNotes})`);
  if (studentNoteCount < minNotes) missing.push(`Student Notes (found ${studentNoteCount}, need ≥ ${minNotes})`);

  ['RELATIONSHIPS', 'ROUTINES', 'RELEVANCE', 'RIGOR', 'REFLECTION'].forEach((k) => {
    if (!content.includes(k)) missing.push(k);
  });

  if (!/UNIT LEARNING TARGETS/i.test(content)) missing.push('Unit Learning Targets');
  if (!/UNIT ESSENTIAL QUESTION/i.test(content)) missing.push('Unit Essential Question');

  return { isValid: missing.length === 0, missing };
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseLessonRequest(request);
    const received = parsed ?? {};

    const warnings: string[] = [];
    const subject =
      (received as any).subject?.trim?.() || (warnings.push('Defaulted subject to "General Studies"'), 'General Studies');
    const gradeLevel =
      (received as any).gradeLevel?.trim?.() || (warnings.push('Defaulted gradeLevel to "6"'), '6');
    const topic =
      (received as any).topic?.trim?.() || (warnings.push('Defaulted topic to "Core Concept"'), 'Core Concept');
    const duration =
      (received as any).duration?.trim?.() || (warnings.push('Defaulted duration to "90 minutes"'), '90 minutes');
    const numberOfDays =
      (received as any).numberOfDays?.trim?.() || (warnings.push('Defaulted numberOfDays to "5"'), '5');

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
    const prompt = buildEnhancedMasterPrompt(data);

    if (!apiKey) {
      // Fallback minimal content (complete but generic)
      const fallback = `
LEVEL I HEADING: TRAUMA-INFORMED STEAM LESSON PLAN
Grade: ${data.gradeLevel}
Subject: ${data.subject}
Topic: ${processTopicForReadability(data.topic)}
Duration: ${data.duration} per day over ${data.numberOfDays} days
Location: ${data.location || 'Savannah, Georgia'}
Unit Title: A Connected Study of ${processTopicForReadability(data.topic)}

LEVEL I HEADING: LESSON OVERVIEW
This unit connects rigorous academic learning with student experience through the Root Work Framework.

LEVEL I HEADING: UNIT ESSENTIAL QUESTION
How does understanding ${processTopicForReadability(data.topic)} help us act with knowledge and care?

LEVEL I HEADING: UNIT LEARNING TARGETS
• I can explain core ideas about ${processTopicForReadability(data.topic)} (DOK 2)
• I can apply those ideas to real situations (DOK 3)
• I can evaluate outcomes and propose improvements (DOK 4)

LEVEL I HEADING: DAY 1: Foundation and Belonging
LEVEL II HEADING: Daily Essential Question
What is ${processTopicForReadability(data.topic)} and why does it matter in our lives?
LEVEL II HEADING: Daily Learning Target
I can identify and describe key features of ${processTopicForReadability(data.topic)} (DOK 2)
LEVEL II HEADING: Standards Alignment
CREATE TABLE:
Standard Type | Standard Code | Description
Primary Standard | Content-1 | Build foundational understanding through analysis
SEL Integration | CASEL | Self-awareness: naming emotions and goals
Cross-Curricular | STEAM | Links to technology and design
LEVEL II HEADING: Materials Needed
• Visuals, organizers, and exemplars
• Student journals
• Chart paper and markers
LEVEL II HEADING: Root Work Framework 5 Rs Structure
LEVEL III HEADING: RELATIONSHIPS (14 minutes)
Opening circle with strengths-based share related to the topic.
Teacher Note: Greet by name; normalize different background knowledge.
Student Note: Your voice matters—share what you notice or wonder.
LEVEL III HEADING: ROUTINES (9 minutes)
Agenda, success criteria, materials check.
Teacher Note: Model organization to reduce uncertainty.
Student Note: Review success criteria and ask clarifying questions.
LEVEL III HEADING: RELEVANCE (23 minutes)
Connect topic to familiar examples and community experiences.
Teacher Note: Validate diverse connections; surface assets.
Student Note: Add your own example in your journal.
LEVEL III HEADING: RIGOR (31 minutes)
I Do (9): Model analysis with think-aloud.
Teacher Note: Verbalize decision points and why they matter.
Student Note: Track steps you can reuse later.
We Do (14): Guided analysis with prompts.
Teacher Note: Gradually release; invite multiple ideas.
Student Note: Build on peers’ thinking.
You Do Together (8): Partners apply analysis to a new case.
Teacher Note: Offer options for demonstration.
Student Note: Choose a format that fits your strengths.
LEVEL III HEADING: REFLECTION (14 minutes)
Quick write: biggest insight + one question; pair share.
Teacher Note: Celebrate risk-taking and learning moves.
Student Note: Name one strategy you’ll reuse tomorrow.
LEVEL II HEADING: Day 1 Implementation Supports
CREATE TABLE:
Support Tier | Target Population | Specific Strategies
Tier 1 Universal | All Students | Visuals; choices; clear success criteria
Tier 2 Targeted | Students Needing Additional Support | Graphic organizers; small-group check-ins; sentence frames
Tier 3 Intensive | Students Needing Significant Support | 1:1 conferencing; chunked tasks; alternative output
504 Accommodations | Students with Disabilities | Extended time; AT supports; preview materials
Gifted Extensions | Advanced Learners | Extension prompts; leadership roles; complexity layers
SPED Modifications | Students with IEPs | Simplified texts; scaffolded language; individualized goals
LEVEL II HEADING: Day 1 Assessment
CREATE TABLE:
Assessment Type | Method | Purpose
Formative | Exit ticket | Monitor understanding
Summative | Portfolio artifact | Build toward unit evidence
LEVEL II HEADING: SEL Integration
Daily routines include emotional check-ins and feedback protocols.
LEVEL II HEADING: Trauma-Informed Considerations
Predictable structure, student choice, and strengths-based feedback throughout.
`.trim();

      const htmlVersion = formatAsEnhancedHTML(fallback, data);
      return okJson({
        lessonPlan: cleanContent(fallback),
        htmlVersion,
        plainText: fallback,
        success: true,
        fallback: true,
        warnings: [...warnings, 'Used fallback content because no API key was found.'],
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
      const htmlVersion = formatAsEnhancedHTML(prompt, data);
      return okJson({
        lessonPlan: cleanContent(prompt),
        htmlVersion,
        plainText: prompt,
        success: true,
        fallback: true,
        warnings: [...warnings, `Anthropic error ${resp.status}: ${text.slice(0, 160)}`],
      });
    }

    const payload = await resp.json();
    let lessonContent = '';
    if (Array.isArray(payload?.content)) {
      const first = payload.content.find((c: any) => c?.type === 'text');
      lessonContent = String(first?.text || '');
    }

    lessonContent = lessonContent
      .replace(/```(?:markdown)?\s*/gi, '')
      .replace(/```\s*$/gi, '')
      .trim();

    // Guard against placeholder/meta language
    if (/\bwould continue\b|\bplaceholder\b|\bto be completed\b/i.test(lessonContent)) {
      // strip any trailing meta sentences
      lessonContent = lessonContent.replace(/\[[^\]]*continue[^\]]*\]$/i, '').trim();
    }

    // Validate completeness
    const validation = validateLessonPlan(lessonContent, data);
    if (!validation.isValid) {
      warnings.push(`Missing components: ${validation.missing.join(', ')}`);
    }

    const cleaned = cleanContent(lessonContent);
    const htmlVersion = formatAsEnhancedHTML(cleaned, data);

    return okJson({
      lessonPlan: cleaned,
      htmlVersion,
      plainText: cleaned,
      success: true,
      warnings,
      validation,
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
