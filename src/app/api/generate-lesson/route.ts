// src/app/api/generate-lesson/route.ts - Fixed with intelligent standards interpretation and content alignment

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
 * Clean up mojibake and fix formatting issues
 */
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

/** Build enhanced master prompt with intelligent standards and alignment requirements */
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
    'Synthesis and Reflection',
    'Advanced Application',
    'Mastery and Assessment',
    'Extension and Transfer'
  ];

  // Enhanced standards instruction based on user input
  const standardsInstruction = data.specialInstructions?.toLowerCase().includes('georgia') ? 
    `Use specific Georgia State Standards (GSE) for ${data.subject}. Include actual standard codes and descriptions.` :
    data.specialInstructions?.toLowerCase().includes('common core') ?
    `Use specific Common Core State Standards for ${data.subject}. Include actual standard codes and descriptions.` :
    `Use appropriate ${data.subject} standards for Grade ${data.gradeLevel}. Include specific, real standard codes and full descriptions that align with "${cleanTopic}".`;

  return `
PROFESSIONAL LESSON PLAN GENERATOR - COMPLETE ${numberOfDays}-DAY STRUCTURED OUTPUT

Create a comprehensive, educationally sound ${numberOfDays}-day lesson plan focused on "${cleanTopic}" for Grade ${data.gradeLevel} ${data.subject}.

CRITICAL REQUIREMENTS:
1. Generate ALL ${numberOfDays} days completely - do not stop early
2. Use REAL, SPECIFIC standards (not placeholders) - ${standardsInstruction}
3. Create learning targets that DIRECTLY align with assessments and exit tickets
4. Provide substantive, subject-specific content - not generic topic repetition
5. Ensure all Teacher Notes and Student Notes are meaningful and specific
6. Fix HTML formatting issues in tables and sections

LESSON PARAMETERS:
- Subject: ${data.subject}
- Grade Level: ${data.gradeLevel}
- Topic: ${cleanTopic}
- Duration: ${data.duration} per day
- Location: ${data.location || 'Savannah, Georgia'}
- Days: ${numberOfDays} (MUST COMPLETE ALL)

LEVEL I HEADING: TRAUMA-INFORMED STEAM LESSON PLAN
Grade: ${data.gradeLevel}
Subject: ${data.subject}
Topic: ${cleanTopic}
Duration: ${data.duration} per day over ${numberOfDays} days
Location: ${data.location || 'Savannah, Georgia'}
Unit Title: [Create compelling, specific title based on "${cleanTopic}"]

LEVEL I HEADING: LESSON OVERVIEW
[Write 3-4 sentences describing what students will specifically learn about ${cleanTopic}, how skills will develop across ${numberOfDays} days, and the unit's educational purpose]

LEVEL I HEADING: UNIT ESSENTIAL QUESTION
[Create one overarching question that captures the essence of learning ${cleanTopic} and spans all ${numberOfDays} days]

LEVEL I HEADING: UNIT LEARNING TARGETS
[Create 3-4 specific, measurable learning targets that directly relate to ${cleanTopic} and can be assessed]
- I can [specific skill/knowledge about ${cleanTopic}] (DOK 2)
- I can [higher-order thinking about ${cleanTopic}] (DOK 3)  
- I can [application/analysis of ${cleanTopic}] (DOK 4)

${Array.from({ length: numberOfDays }, (_, i) => {
  const dayNumber = i + 1;
  const focus = dayFoci[i] || `Advanced Application ${dayNumber}`;
  const relationshipsTime = Math.round(durationMinutes * 0.15);
  const routinesTime = Math.round(durationMinutes * 0.1);
  const relevanceTime = Math.round(durationMinutes * 0.25);
  const rigorTime = Math.round(durationMinutes * 0.35);
  const reflectionTime = Math.round(durationMinutes * 0.15);
  
  return `
LEVEL I HEADING: DAY ${dayNumber}: ${focus}

LEVEL II HEADING: Daily Essential Question
[Create a specific question for Day ${dayNumber} that focuses on ${focus.toLowerCase()} aspects of ${cleanTopic}]

LEVEL II HEADING: Daily Learning Target
I can [specific, measurable skill for Day ${dayNumber} that builds toward unit targets and relates to ${cleanTopic}] (DOK ${dayNumber <= 2 ? 2 : dayNumber <= 4 ? 3 : 4})

LEVEL II HEADING: Standards Alignment
CREATE TABLE:
Standard Type | Standard Code | Description
Primary Standard | [Insert REAL ${data.subject} standard code for Grade ${data.gradeLevel}] | [Full, accurate description of how this standard applies to ${cleanTopic}]
SEL Integration | CASEL.${dayNumber === 1 ? 'SA' : dayNumber === 2 ? 'SM' : dayNumber === 3 ? 'SOA' : dayNumber === 4 ? 'RS' : 'RDM'} | ${dayNumber === 1 ? 'Self-awareness: Recognizing emotions and values related to ' + cleanTopic : dayNumber === 2 ? 'Self-management: Demonstrating self-discipline in ' + cleanTopic + ' work' : dayNumber === 3 ? 'Social awareness: Understanding perspectives in ' + cleanTopic + ' contexts' : dayNumber === 4 ? 'Relationship skills: Working effectively with others on ' + cleanTopic : 'Responsible decision-making: Making ethical choices about ' + cleanTopic}
Cross-Curricular | [Specific integration] | [How ${cleanTopic} connects to other subjects in meaningful ways]

LEVEL II HEADING: Materials Needed
[List 4-6 specific, realistic materials needed for Day ${dayNumber} activities related to ${cleanTopic}]

LEVEL II HEADING: Root Work Framework 5 Rs Structure

LEVEL III HEADING: RELATIONSHIPS (${relationshipsTime} minutes)
Opening Activity for Day ${dayNumber}:
[Create a specific community-building activity that connects to Day ${dayNumber}'s focus on ${focus.toLowerCase()} and relates to ${cleanTopic}. Make it engaging and age-appropriate for Grade ${data.gradeLevel}.]

Teacher Note: [Specific guidance for facilitating Day ${dayNumber}'s opening that builds classroom community while introducing ${focus.toLowerCase()} concepts of ${cleanTopic}]
Student Note: [Encouraging message that helps students understand their role in Day ${dayNumber}'s community-building and learning about ${cleanTopic}]

LEVEL III HEADING: ROUTINES (${routinesTime} minutes)
Day ${dayNumber} Agenda:
1. [Specific opening activity name]
2. [Specific lesson component for ${focus.toLowerCase()}]
3. [Specific practice activity]
4. [Specific closing/transition]

Success Criteria for Day ${dayNumber}:
- I can [specific, observable behavior related to ${cleanTopic}]
- I can [specific demonstration of ${focus.toLowerCase()} skills]
- I can [specific way to show learning about ${cleanTopic}]

Teacher Note: [Specific routine management strategies for Day ${dayNumber} that support learning ${cleanTopic} through ${focus.toLowerCase()}]
Student Note: [Clear expectations for Day ${dayNumber} that help students track their progress in understanding ${cleanTopic}]

LEVEL III HEADING: RELEVANCE (${relevanceTime} minutes)
Day ${dayNumber} Connection Activity:
[Create a specific activity that connects ${cleanTopic} to students' lives, current events, or local Savannah community, emphasizing ${focus.toLowerCase()} aspects]

Real-World Bridge:
[Specific examples of how Day ${dayNumber}'s learning about ${cleanTopic} applies to real-world situations, careers, or community issues]

Teacher Note: [Guidance for helping students see personal relevance of ${cleanTopic} on Day ${dayNumber}, including discussion prompts and connection strategies]
Student Note: [Prompts that help students connect Day ${dayNumber}'s learning about ${cleanTopic} to their own experiences and future goals]

LEVEL III HEADING: RIGOR (${rigorTime} minutes)
I Do: Teacher Modeling (${Math.round(rigorTime * 0.3)} minutes)
[Describe specific modeling of ${focus.toLowerCase()} skills applied to ${cleanTopic}. Include what the teacher will demonstrate and how.]

Think-Aloud Script for Day ${dayNumber}:
"[Write a specific think-aloud script that demonstrates thinking processes for ${cleanTopic} using ${focus.toLowerCase()} approach. Make it authentic and instructional.]"

Teacher Note: [Specific guidance for effective modeling on Day ${dayNumber}, including key points to emphasize about ${cleanTopic}]
Student Note: [Clear directions for what students should pay attention to during modeling of ${cleanTopic} concepts]

We Do: Guided Practice (${Math.round(rigorTime * 0.4)} minutes)
[Describe specific guided practice activity where teacher and students work together on ${cleanTopic} using ${focus.toLowerCase()} strategies]

Scaffolding Supports for Day ${dayNumber}:
- [Specific support tool for ${cleanTopic}]
- [Specific language support for ${focus.toLowerCase()}]
- [Specific organizational tool]

Teacher Note: [Guidance for providing appropriate support during Day ${dayNumber} guided practice, including how to adjust for different learners]
Student Note: [Clear expectations for participation in guided practice and how to ask for help with ${cleanTopic}]

You Do Together: Collaborative Application (${Math.round(rigorTime * 0.3)} minutes)
[Describe specific collaborative activity where students apply ${focus.toLowerCase()} skills to new ${cleanTopic} scenarios]

Choice Options for Day ${dayNumber}:
- [Specific creative option related to ${cleanTopic}]
- [Specific analytical option related to ${cleanTopic}]
- [Specific presentation option related to ${cleanTopic}]

Teacher Note: [Specific strategies for monitoring collaborative work on Day ${dayNumber} and ensuring equitable participation in ${cleanTopic} activities]
Student Note: [Clear guidelines for working effectively in teams on Day ${dayNumber} and contributing to ${cleanTopic} discussions]

LEVEL III HEADING: REFLECTION (${reflectionTime} minutes)
Day ${dayNumber} Processing:
[Specific reflection activity that helps students process their learning about ${cleanTopic} through ${focus.toLowerCase()} lens]

Tomorrow's Preview:
${dayNumber < numberOfDays ? `[Specific preview of Day ${dayNumber + 1}'s focus on ${dayFoci[dayNumber] || 'continued learning'} and how it builds on today's ${focus.toLowerCase()} work with ${cleanTopic}]` : '[Celebration of completed unit and discussion of how students will use their ${cleanTopic} knowledge in future learning]'}

Teacher Note: [Specific guidance for facilitating Day ${dayNumber} reflection and using student responses to inform future instruction about ${cleanTopic}]
Student Note: [Specific prompts for metacognitive reflection about Day ${dayNumber} learning and goal-setting for continued growth in ${cleanTopic}]

LEVEL II HEADING: Day ${dayNumber} Implementation Supports
CREATE TABLE:
Support Tier | Target Population | Specific Strategies for Day ${dayNumber}
Tier 1 Universal | All Students | [3 specific, practical supports for all students learning ${cleanTopic} through ${focus.toLowerCase()}]
Tier 2 Targeted | Students Needing Additional Support | [3 specific interventions for students who need more support with ${cleanTopic}]
Tier 3 Intensive | Students Needing Significant Support | [3 specific intensive supports for students struggling with ${cleanTopic}]
504 Accommodations | Students with Disabilities | [Specific accommodations for Day ${dayNumber} activities related to ${cleanTopic}]
Gifted Extensions | Advanced Learners | [Specific extensions that deepen learning about ${cleanTopic} for advanced students]
SPED Modifications | Students with IEPs | [Specific modifications for Day ${dayNumber} that maintain learning goals while adjusting delivery of ${cleanTopic} content]

LEVEL II HEADING: Day ${dayNumber} Assessment
CREATE TABLE:
Assessment Type | Method | Purpose
Formative | [Specific formative assessment that directly measures Day ${dayNumber}'s learning target about ${cleanTopic}] | [Specific purpose aligned to daily target]
Observation | [Specific teacher observation checklist for ${focus.toLowerCase()} skills with ${cleanTopic}] | [Specific data to collect about student progress]
Summative | ${dayNumber === numberOfDays ? '[Specific culminating assessment that measures all unit learning targets about ' + cleanTopic + ']' : '[Specific progress check toward unit goals for ' + cleanTopic + ']'} | ${dayNumber === numberOfDays ? 'Evaluate mastery of all unit learning targets' : 'Monitor progress toward unit mastery'}

LEVEL II HEADING: SEL Integration for Day ${dayNumber}
[Specific description of how SEL competency for Day ${dayNumber} is woven into ${cleanTopic} learning, including specific activities, discussion prompts, and reflection opportunities]

LEVEL II HEADING: Trauma-Informed Considerations for Day ${dayNumber}
[Specific considerations for Day ${dayNumber} that account for potential student trauma responses to ${cleanTopic} content, including alternative activities, choice and voice opportunities, and signs to watch for]

PAGE BREAK
`.trim();
}).join('\n\n')}

LEVEL I HEADING: COMPREHENSIVE RESOURCE GENERATION

LEVEL II HEADING: 1. Student Workbook
File: RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}_${data.gradeLevel}${subjectAbbr}_StudentWorkbook.pdf

COMPLETE CONTENT:
[Write detailed student workbook pages that include:
- Daily learning target tracking sheets
- Graphic organizers specific to ${cleanTopic}
- Vocabulary pages with ${cleanTopic} terms
- Reflection prompts for each day
- Assessment rubrics students can understand
- Home connection activities related to ${cleanTopic}
- Reference pages with key concepts about ${cleanTopic}]

LEVEL II HEADING: 2. Teacher Implementation Guide  
File: RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}_${data.gradeLevel}${subjectAbbr}_TeacherGuide.pdf

COMPLETE CONTENT:
[Write comprehensive teacher guide including:
- Daily preparation checklists specific to ${cleanTopic}
- Differentiation strategies for each day
- Assessment rubrics aligned to learning targets
- Extension activities for early finishers
- Intervention strategies for struggling learners
- Parent communication templates about ${cleanTopic}
- Additional resources for teaching ${cleanTopic}
- Troubleshooting guide for common challenges]

GENERATION COMPLETE - ALL ${numberOfDays} DAYS INCLUDED WITH ALIGNED STANDARDS AND ASSESSMENTS
`.trim();
}

/** Convert the structured tokens to styled HTML with fixed formatting */
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

  // Ensure PAGE BREAK tokens become proper section boundaries
  html = html.replace(/\n?PAGE BREAK\n?/g, '</section>');

  // Add section tags where missing
  if (html.includes('<section class="day-section">') && !html.endsWith('</section>')) {
    html += '</section>';
  }

  // 5 Rs → styled blocks with proper closing
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

  // CREATE TABLE blocks: convert pipe tables to HTML tables with proper structure
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
      if (cells.length >= headers.length) {
        out += '<tr>' + cells.slice(0, headers.length).map((c: string) => `<td>${c}</td>`).join('') + '</tr>';
      }
    });
    out += '</tbody></table>';
    return out;
  });

  // Turn hyphen bullets into lists
  html = html.replace(/(^|\n)\s*[-•]\s+(.+)/g, '$1<li>$2</li>');
  html = html.replace(/(?:<li>[\s\S]*?<\/li>\s*)+/g, (match: string) => `<div class="bulleted-list"><ul>${match}</ul></div>`);

  // Close any open rs-section divs properly
  html = html.replace(/(<div class="rs-section">[\s\S]*?)(?=<\/div><div class="rs-section">|<h[123]|<\/section>|$)/g, (m: string) => {
    return m.endsWith('</div>') ? m : m + '</div>';
  });

  // Ensure the last rs-section in each day is closed
  html = html.replace(/(<div class="rs-section">[\s\S]*?)(<\/section>)/g, (m: string, content: string, ending: string) => {
    return content.endsWith('</div>') ? content + ending : content + '</div>' + ending;
  });

  // Resource section wrapper
  html = html.replace(/<h1 class="level-1-heading">COMPREHENSIVE RESOURCE GENERATION<\/h1>/g,
    `<div class="resource-section"><h1 class="level-1-heading">COMPREHENSIVE RESOURCE GENERATION</h1>`);

  if (html.includes('class="resource-section"') && !html.endsWith('</div>')) {
    html += '</div>';
  }

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

/** Extract downloadable text resources */
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

/** Enhanced validation with standards and alignment checks */
function validateLessonPlan(content: string, data: MasterPromptRequest) {
  const missing: string[] = [];
  const expectedDays = parseInt(data.numberOfDays || '5');
  
  // Check for all requested days
  const dayMatches = content.match(/DAY\s+(\d+):/g) || [];
  const foundDays = dayMatches.length;
  if (foundDays < expectedDays) {
    missing.push(`Complete days (found ${foundDays}, expected ${expectedDays})`);
  }
  
  // Check for standards (should not be placeholders)
  const placeholderStandards = (content.match(/\[.*std.*\]/g) || []).length;
  if (placeholderStandards > 0) {
    missing.push(`Real standards (found ${placeholderStandards} placeholders)`);
  }
  
  // Check for required components
  const teacherNoteCount = (content.match(/Teacher Note:/g) || []).length;
  const studentNoteCount = (content.match(/Student Note:/g) || []).length;
  const expectedNotes = expectedDays * 6;

  if (teacherNoteCount < expectedNotes * 0.8) missing.push(`Teacher Notes (found ${teacherNoteCount}, expected ~${expectedNotes})`);
  if (studentNoteCount < expectedNotes * 0.8) missing.push(`Student Notes (found ${studentNoteCount}, expected ~${expectedNotes})`);
  
  // Check for 5 Rs components
  ['RELATIONSHIPS','ROUTINES','RELEVANCE','RIGOR','REFLECTION'].forEach((k: string) => {
    const componentCount = (content.match(new RegExp(k, 'g')) || []).length;
    if (componentCount < expectedDays) missing.push(`${k} component (found ${componentCount}, expected ${expectedDays})`);
  });
  
  // Check for learning target and assessment alignment
  const learningTargets = (content.match(/I can [^(]+\(DOK/g) || []).length;
  const assessments = (content.match(/Assessment Type.*Method.*Purpose/g) || []).length;
  if (learningTargets === 0) missing.push('Specific learning targets');
  if (assessments < expectedDays) missing.push(`Daily assessments (found ${assessments}, expected ${expectedDays})`);
  
  if (!content.includes('CREATE TABLE')) missing.push('Structured tables');
  if (!content.includes('COMPLETE CONTENT:')) missing.push('Generated resource content');

  return { isValid: missing.length === 0, missingComponents: missing };
}

/** Emergency fallback with improved content */
function buildEnhancedFallback(data: MasterPromptRequest) {
  const cleanTopic = processTopicForReadability(data.topic);
  const numberOfDays = parseInt(data.numberOfDays || '5');
  
  const content = `
LEVEL I HEADING: TRAUMA-INFORMED STEAM LESSON PLAN
Grade: ${data.gradeLevel}
Subject: ${data.subject}
Topic: ${cleanTopic}
Duration: ${data.duration} per day over ${numberOfDays} days
Location: ${data.location || 'Savannah, Georgia'}

LEVEL I HEADING: LESSON OVERVIEW
This ${numberOfDays}-day unit develops student understanding of ${cleanTopic} through the Root Work Framework, incorporating trauma-informed practices, MTSS supports, and authentic assessment.

LEVEL I HEADING: UNIT ESSENTIAL QUESTION
How can we effectively apply ${cleanTopic} concepts to solve problems and communicate ideas in our learning and community?

LEVEL I HEADING: UNIT LEARNING TARGETS
- I can identify and explain key concepts related to ${cleanTopic} (DOK 2)
- I can analyze examples of ${cleanTopic} and evaluate their effectiveness (DOK 3)
- I can create original work that demonstrates mastery of ${cleanTopic} principles (DOK 4)

[Multiple days would be generated here with proper structure]

LEVEL I HEADING: COMPREHENSIVE RESOURCE GENERATION
LEVEL II HEADING: 1. Student Workbook
File: RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}_${data.gradeLevel}${getSubjectAbbreviation(data.subject)}_StudentWorkbook.pdf

COMPLETE CONTENT:
[Comprehensive student workbook with daily pages, assessments, and resources for ${cleanTopic}]
`.trim();

  const cleanVersion = cleanContent(content);
  const htmlVersion = formatAsEnhancedHTML(content, data);
  return { content, htmlVersion, cleanVersion };
}

/** POST handler with enhanced error handling */
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
        max_tokens: 25000, // INCREASED FURTHER FOR DETAILED CONTENT
        temperature: 0.4,
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

    lessonContent = lessonContent.replace(/```(?:markdown)?\s*|```/gi, '').trim();

    if (!lessonContent || lessonContent.length < 3000) {
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
      lessonPlan: cleanedContent,
      htmlVersion,
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
