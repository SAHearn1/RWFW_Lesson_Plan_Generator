// src/app/api/generate-lesson/route.ts - Simplified approach to ensure all days generate

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

function cleanContent(content: string): string {
  return (content || '')
    .replace(/â€"|—/g, '—')
    .replace(/â€œ|â€|"|"/g, '"')
    .replace(/â€˜|â€™|'/g, "'")
    .replace(/Â/g, ' ')
    .replace(/Ã—/g, '×')
    .replace(/\u00A0/g, ' ')
    .replace(/^[\s•\-]+\s*/gm, match => match.includes('•') ? '• ' : match.trim() ? match : '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** MUCH SIMPLER prompt that focuses on getting all days generated */
function buildSimplifiedMasterPrompt(data: MasterPromptRequest): string {
  const numberOfDays = parseInt(data.numberOfDays || '5');
  const cleanTopic = processTopicForReadability(data.topic);

  return `
Create a complete ${numberOfDays}-day lesson plan for Grade ${data.gradeLevel} ${data.subject} on "${cleanTopic}".

CRITICAL: You must generate every single day from Day 1 to Day ${numberOfDays}. Do not stop until all ${numberOfDays} days are complete.

LEVEL I HEADING: TRAUMA-INFORMED STEAM LESSON PLAN
Grade: ${data.gradeLevel}
Subject: ${data.subject}  
Topic: ${cleanTopic}
Duration: ${data.duration} per day over ${numberOfDays} days
Location: ${data.location || 'Savannah, Georgia'}
Unit Title: Evidence-Based Learning: ${cleanTopic}

LEVEL I HEADING: LESSON OVERVIEW
This ${numberOfDays}-day unit teaches students to understand and apply ${cleanTopic} through evidence-based learning, collaborative activities, and real-world connections.

LEVEL I HEADING: UNIT ESSENTIAL QUESTION
How can students effectively use ${cleanTopic} to analyze information and support their ideas with evidence?

LEVEL I HEADING: UNIT LEARNING TARGETS
- I can identify key concepts related to ${cleanTopic} (DOK 2)
- I can analyze and evaluate examples of ${cleanTopic} (DOK 3)  
- I can create original work demonstrating ${cleanTopic} mastery (DOK 4)

LEVEL I HEADING: DAY 1: Introduction and Foundation Building

LEVEL II HEADING: Daily Essential Question
What is ${cleanTopic} and why is it important for effective communication?

LEVEL II HEADING: Daily Learning Target
I can define ${cleanTopic} and identify examples in various texts (DOK 2)

LEVEL II HEADING: Standards Alignment
CREATE TABLE:
Standard Type | Standard Code | Description
Primary Standard | ELAGSE9-10.RST.1 | Cite specific textual evidence to support analysis of science and technical texts
SEL Integration | CASEL.SA | Self-awareness through reflection on learning process
Cross-Curricular | Social Studies | Analyzing historical documents and sources

LEVEL II HEADING: Materials Needed
- Student journals
- Sample texts for analysis
- Graphic organizers
- Chart paper and markers

LEVEL II HEADING: Root Work Framework 5 Rs Structure

LEVEL III HEADING: RELATIONSHIPS (14 minutes)
Opening Activity: Students share examples of times they had to prove something was true using evidence.

Teacher Note: Create a safe space where all students feel comfortable sharing.
Student Note: Listen respectfully to classmates' examples and think about your own experiences.

LEVEL III HEADING: ROUTINES (9 minutes)
Day 1 Agenda:
1. Opening sharing circle
2. Introduction to ${cleanTopic}
3. Guided practice with examples
4. Exit ticket reflection

Success Criteria:
- Define ${cleanTopic} in my own words
- Identify one example of ${cleanTopic}

Teacher Note: Post agenda and success criteria where all students can see them.
Student Note: Track your progress on the success criteria throughout the lesson.

LEVEL III HEADING: RELEVANCE (23 minutes)
Connection Activity: Examine how ${cleanTopic} appears in social media, news articles, and everyday conversations in Savannah.

Teacher Note: Use local examples that students can relate to and understand.
Student Note: Think about how you already use evidence in your daily life.

LEVEL III HEADING: RIGOR (31 minutes)
I Do: Teacher models identifying ${cleanTopic} in a sample text (10 minutes)
Think-Aloud: "When I read this passage, I'm looking for..."

We Do: Class works together to analyze another text (15 minutes)
Scaffolding: Provide sentence frames and graphic organizers

You Do Together: Pairs analyze a third text (6 minutes)

Teacher Note: Monitor pairs and provide support as needed.
Student Note: Work collaboratively and ask questions when confused.

LEVEL III HEADING: REFLECTION (13 minutes)
Students complete exit ticket: "One thing I learned about ${cleanTopic} today is..."

Teacher Note: Review exit tickets to plan tomorrow's lesson.
Student Note: Be honest about your learning and any remaining questions.

LEVEL II HEADING: Day 1 Assessment
CREATE TABLE:
Assessment Type | Method | Purpose
Formative | Exit ticket and observation | Check understanding of basic concepts
Summative | Unit portfolio (ongoing) | Track progress toward unit goals

PAGE BREAK

LEVEL I HEADING: DAY 2: Exploration and Investigation

LEVEL II HEADING: Daily Essential Question
How can I evaluate the quality and relevance of evidence in different types of texts?

LEVEL II HEADING: Daily Learning Target
I can assess the strength of evidence and explain why some evidence is more convincing than others (DOK 3)

LEVEL II HEADING: Standards Alignment
CREATE TABLE:
Standard Type | Standard Code | Description
Primary Standard | ELAGSE9-10.RI.8 | Delineate and evaluate argument and claims in a text
SEL Integration | CASEL.SM | Self-management through focused analysis work
Cross-Curricular | Science | Evaluating evidence in scientific claims

LEVEL II HEADING: Materials Needed
- Multiple text samples with varying evidence quality
- Evidence evaluation rubric
- Collaborative workspace materials

LEVEL II HEADING: Root Work Framework 5 Rs Structure

LEVEL III HEADING: RELATIONSHIPS (14 minutes)
Opening: Students share one example of strong evidence from yesterday's work.

Teacher Note: Build on yesterday's learning and celebrate student insights.
Student Note: Listen for good examples from classmates to learn from.

LEVEL III HEADING: ROUTINES (9 minutes)
Day 2 Agenda:
1. Review of Day 1 concepts
2. Introduction to evidence evaluation
3. Practice with evidence ranking
4. Reflection and preview

Success Criteria:
- Explain what makes evidence strong or weak
- Rank evidence from strongest to weakest

Teacher Note: Connect today's learning to yesterday's foundation.
Student Note: Build on what you learned yesterday about ${cleanTopic}.

LEVEL III HEADING: RELEVANCE (23 minutes)
Activity: Analyze evidence in local news stories about Savannah issues.

Teacher Note: Choose current, appropriate local examples students care about.
Student Note: Consider how evidence quality affects your opinion on local issues.

LEVEL III HEADING: RIGOR (31 minutes)
I Do: Teacher demonstrates evaluating evidence quality (10 minutes)
We Do: Class evaluates evidence together using rubric (15 minutes)
You Do Together: Small groups rank evidence samples (6 minutes)

Teacher Note: Provide clear criteria for evidence evaluation.
Student Note: Use the rubric to guide your thinking about evidence quality.

LEVEL III HEADING: REFLECTION (13 minutes)
Students reflect on how evidence evaluation applies to their daily lives.

Teacher Note: Help students make connections to real-world applications.
Student Note: Think about times when evidence quality mattered to you.

LEVEL II HEADING: Day 2 Assessment
CREATE TABLE:
Assessment Type | Method | Purpose
Formative | Evidence ranking activity | Check ability to evaluate evidence quality
Summative | Unit portfolio entry | Document learning progress

PAGE BREAK

${numberOfDays >= 3 ? `
LEVEL I HEADING: DAY 3: Analysis and Critical Thinking

LEVEL II HEADING: Daily Essential Question  
How can I use ${cleanTopic} to build convincing arguments about important topics?

LEVEL II HEADING: Daily Learning Target
I can construct an argument using multiple pieces of relevant evidence (DOK 4)

LEVEL II HEADING: Standards Alignment
CREATE TABLE:
Standard Type | Standard Code | Description
Primary Standard | ELAGSE9-10.W.1 | Write arguments to support claims with clear reasons and relevant evidence
SEL Integration | CASEL.RDM | Responsible decision-making through evidence-based reasoning
Cross-Curricular | Social Studies | Constructing historical arguments

LEVEL II HEADING: Materials Needed
- Argument planning templates
- Research materials
- Peer review sheets

LEVEL II HEADING: Root Work Framework 5 Rs Structure

LEVEL III HEADING: RELATIONSHIPS (14 minutes)
Opening: Students share their strongest piece of evidence from Day 2.

Teacher Note: Celebrate student growth and build confidence.
Student Note: Be proud of your learning progress and support classmates.

LEVEL III HEADING: ROUTINES (9 minutes)
Day 3 Agenda:
1. Review evidence evaluation skills
2. Learn argument construction
3. Practice building arguments
4. Peer feedback session

Success Criteria:
- Create an argument with supporting evidence
- Give helpful feedback to a peer

Teacher Note: Emphasize the building nature of the unit.
Student Note: See how your learning builds from day to day.

LEVEL III HEADING: RELEVANCE (23 minutes)
Activity: Choose a relevant school or community issue to build an argument about.

Teacher Note: Guide students toward appropriate, engaging topics.
Student Note: Pick an issue you genuinely care about for your argument.

LEVEL III HEADING: RIGOR (31 minutes)
I Do: Teacher models constructing an argument (10 minutes)
We Do: Class builds argument together (15 minutes)  
You Do Together: Pairs create arguments (6 minutes)

Teacher Note: Provide argument structure templates for support.
Student Note: Use evidence evaluation skills from yesterday to select strong support.

LEVEL III HEADING: REFLECTION (13 minutes)
Students reflect on their argument construction process and give peer feedback.

Teacher Note: Facilitate constructive peer feedback.
Student Note: Give specific, helpful feedback to help classmates improve.

LEVEL II HEADING: Day 3 Assessment
CREATE TABLE:
Assessment Type | Method | Purpose
Formative | Peer feedback on arguments | Practice giving and receiving constructive criticism
Summative | Argument construction | Assess ability to use evidence effectively

PAGE BREAK
` : ''}

${numberOfDays >= 4 ? `
LEVEL I HEADING: DAY 4: Application and Creation

LEVEL II HEADING: Daily Essential Question
How can I present my evidence-based argument effectively to different audiences?

LEVEL II HEADING: Daily Learning Target
I can adapt my presentation of ${cleanTopic} for different audiences and purposes (DOK 4)

LEVEL II HEADING: Standards Alignment
CREATE TABLE:
Standard Type | Standard Code | Description
Primary Standard | ELAGSE9-10.SL.4 | Present information clearly and concisely
SEL Integration | CASEL.RS | Relationship skills through effective communication
Cross-Curricular | Technology | Using digital tools for presentations

LEVEL II HEADING: Root Work Framework 5 Rs Structure

LEVEL III HEADING: RELATIONSHIPS (14 minutes)
Opening: Students practice presenting their arguments in pairs.

Teacher Note: Create supportive environment for presentation practice.
Student Note: Support your partner and practice active listening.

LEVEL III HEADING: ROUTINES (9 minutes)
Day 4 Agenda:
1. Presentation skills mini-lesson
2. Audience adaptation practice
3. Final argument presentations
4. Celebration and reflection

LEVEL III HEADING: RELEVANCE (23 minutes)
Activity: Adapt arguments for different audiences (peers, parents, community leaders).

Teacher Note: Help students understand audience awareness.
Student Note: Think about how your message changes for different listeners.

LEVEL III HEADING: RIGOR (31 minutes)
I Do: Teacher demonstrates audience adaptation (10 minutes)
We Do: Class practices together (15 minutes)
You Do: Individual presentations (6 minutes)

LEVEL III HEADING: REFLECTION (13 minutes)
Students reflect on their growth in using ${cleanTopic} and set future goals.

LEVEL II HEADING: Day 4 Assessment
CREATE TABLE:
Assessment Type | Method | Purpose
Formative | Presentation feedback | Assess communication skills
Summative | Final argument presentation | Evaluate overall unit mastery

PAGE BREAK
` : ''}

${numberOfDays >= 5 ? `
LEVEL I HEADING: DAY 5: Synthesis and Reflection

LEVEL II HEADING: Daily Essential Question
How will I continue using ${cleanTopic} in my future learning and life?

LEVEL II HEADING: Daily Learning Target
I can reflect on my learning about ${cleanTopic} and plan for future application (DOK 4)

LEVEL II HEADING: Standards Alignment
CREATE TABLE:
Standard Type | Standard Code | Description
Primary Standard | ELAGSE9-10.SL.1 | Engage in collaborative discussions
SEL Integration | CASEL.SA | Self-awareness through metacognitive reflection
Cross-Curricular | All subjects | Transfer skills across disciplines

LEVEL II HEADING: Root Work Framework 5 Rs Structure

LEVEL III HEADING: RELATIONSHIPS (14 minutes)
Opening: Celebration circle sharing unit highlights and growth.

LEVEL III HEADING: ROUTINES (9 minutes)
Day 5 Agenda:
1. Unit review and reflection
2. Future application planning
3. Portfolio completion
4. Celebration of learning

LEVEL III HEADING: RELEVANCE (23 minutes)
Activity: Plan how to use ${cleanTopic} skills in other classes and life situations.

LEVEL III HEADING: RIGOR (31 minutes)
Portfolio completion and peer sharing of growth evidence.

LEVEL III HEADING: REFLECTION (13 minutes)
Final unit reflection and goal setting for continued learning.

LEVEL II HEADING: Day 5 Assessment
CREATE TABLE:
Assessment Type | Method | Purpose
Summative | Complete unit portfolio | Demonstrate comprehensive learning
Reflection | Metacognitive reflection essay | Document learning process and growth

PAGE BREAK
` : ''}

LEVEL I HEADING: COMPREHENSIVE RESOURCE GENERATION

LEVEL II HEADING: 1. Student Workbook
File: RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}_${data.gradeLevel}${getSubjectAbbreviation(data.subject)}_StudentWorkbook.pdf

COMPLETE CONTENT:
Daily learning target tracking sheets, graphic organizers for ${cleanTopic}, reflection prompts, vocabulary pages, assessment rubrics, and reference materials.

LEVEL II HEADING: 2. Teacher Implementation Guide
File: RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}_${data.gradeLevel}${getSubjectAbbreviation(data.subject)}_TeacherGuide.pdf

COMPLETE CONTENT:
Daily preparation checklists, differentiation strategies, assessment rubrics, extension activities, intervention support, and implementation tips for ${cleanTopic} instruction.

ALL ${numberOfDays} DAYS COMPLETED
`.trim();
}

/** Same HTML formatting function */
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

  // Fix PAGE BREAK handling
  html = html.replace(/PAGE BREAK/g, '</section>');

  // Close any remaining sections
  const sectionCount = (html.match(/<section class="day-section">/g) || []).length;
  const closingSectionCount = (html.match(/<\/section>/g) || []).length;
  if (sectionCount > closingSectionCount) {
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

  // CREATE TABLE blocks
  html = html.replace(/CREATE TABLE:\s*\n((?:[^\n]+\|[^\n]+\|[^\n]+\n?)+)/g, (_m: string, tableBlock: string) => {
    const lines: string[] = tableBlock.trim().split('\n').filter((l: string) => l.trim());
    if (!lines.length) return '';
    const [headerLine, ...dataLines] = lines;
    const headers: string[] = headerLine.split('|').map((s: string) => s.trim()).filter(h => h);
    let out = '<table><thead><tr>';
    headers.forEach((h: string) => { out += `<th>${h}</th>`; });
    out += '</tr></thead><tbody>';
    dataLines.forEach((line: string) => {
      const cells: string[] = line.split('|').map((s: string) => s.trim()).filter(c => c);
      if (cells.length >= headers.length) {
        out += '<tr>' + cells.slice(0, headers.length).map((c: string) => `<td>${c}</td>`).join('') + '</tr>';
      }
    });
    out += '</tbody></table>';
    return out;
  });

  // Lists
  html = html.replace(/(^|\n)\s*[-•]\s+(.+)/g, '$1<li>$2</li>');
  html = html.replace(/(?:<li>[\s\S]*?<\/li>\s*)+/g, (match: string) => `<div class="bulleted-list"><ul>${match}</ul></div>`);

  // Close rs-sections
  html = html.replace(/(<div class="rs-section">[\s\S]*?)(?=<\/div><div class="rs-section">|<h[123]|<\/section>|$)/g, (m: string) => {
    return m.endsWith('</div>') ? m : m + '</div>';
  });

  // Resource section
  html = html.replace(/<h1 class="level-1-heading">COMPREHENSIVE RESOURCE GENERATION<\/h1>/g,
    `<div class="resource-section"><h1 class="level-1-heading">COMPREHENSIVE RESOURCE GENERATION</h1>`);

  if (html.includes('class="resource-section"') && !html.match(/<\/div>\s*<div class="footer">/)) {
    html = html.replace(/(<div class="footer">)/, '</div>$1');
  }

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

function validateLessonPlan(content: string, data: MasterPromptRequest) {
  const missing: string[] = [];
  const expectedDays = parseInt(data.numberOfDays || '5');
  
  const dayMatches = content.match(/DAY\s+(\d+):/g) || [];
  const foundDays = dayMatches.length;
  if (foundDays < expectedDays) {
    missing.push(`Complete days (found ${foundDays}, expected ${expectedDays})`);
  }
  
  return { isValid: missing.length === 0, missingComponents: missing };
}

function buildEnhancedFallback(data: MasterPromptRequest) {
  const cleanTopic = processTopicForReadability(data.topic);
  const content = `LEVEL I HEADING: FALLBACK LESSON PLAN\nBasic content for ${cleanTopic}`;
  const cleanVersion = cleanContent(content);
  const htmlVersion = formatAsEnhancedHTML(content, data);
  return { content, htmlVersion, cleanVersion };
}

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseLessonRequest(request);
    const received = parsed ?? {};

    const warnings: string[] = [];
    const subject = (received as any).subject?.trim?.() || 'General Studies';
    const gradeLevel = (received as any).gradeLevel?.trim?.() || '6';
    const topic = (received as any).topic?.trim?.() || 'Core Concept';
    const duration = (received as any).duration?.trim?.() || '90 minutes';
    const numberOfDays = (received as any).numberOfDays?.trim?.() || '5';

    const data: MasterPromptRequest = {
      subject, gradeLevel, topic, duration, numberOfDays,
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
        warnings: ['Used fallback due to missing API key']
      });
    }

    const prompt = buildSimplifiedMasterPrompt(data);

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 30000, // MUCH HIGHER for complete generation
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
        warnings: [`API error ${resp.status}`]
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

    lessonContent = lessonContent.replace(/```(?:markdown)?\s*|```/gi, '').trim();

    if (!lessonContent || lessonContent.length < 1000) {
      const fallback = buildEnhancedFallback(data);
      return okJson({
        lessonPlan: fallback.cleanVersion,
        htmlVersion: fallback.htmlVersion,
        plainText: fallback.content,
        fallback: true,
        success: true,
        warnings: ['Generated content too short']
      });
    }

    const validation = validateLessonPlan(lessonContent, data);
    const cleanedContent = cleanContent(lessonContent);
    const htmlVersion = formatAsEnhancedHTML(lessonContent, data);
    const resources = generateDownloadableResources(lessonContent, data);

    return okJson({
      lessonPlan: cleanedContent,
      htmlVersion,
      plainText: cleanedContent,
      resources,
      success: true,
      warnings,
      validation
    });

  } catch (err) {
    const fallback = buildEnhancedFallback({ subject: 'General', gradeLevel: '6', topic: 'Learning', duration: '90 minutes', numberOfDays: '5' });
    return okJson({
      lessonPlan: fallback.cleanVersion,
      htmlVersion: fallback.htmlVersion,
      plainText: fallback.content,
      fallback: true,
      success: true,
      warnings: ['System error'],
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}
