// File: src/app/api/generate-lesson/route.ts

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
      /^(.*?)\s+(?:Impact|Effect|Influence)/i
    ];

    for (const pattern of patterns) {
      const match = cleanTopic.match(pattern);
      if (match && match[1] && match[1].length > 10 && match[1].length < 50) {
        cleanTopic = match[1].trim();
        break;
      }
    }

    if (cleanTopic.length > 60) {
      const words = cleanTopic.split(' ');
      cleanTopic = words.slice(0, Math.min(6, words.length)).join(' ');
    }
  }

  return cleanTopic.split(' ').map((word: string) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

function cleanContent(content: string): string {
  return (content || '')
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
    .replace(/[^\x00-\x7F]/g, function(char: string): string {
      const charMap: {[key: string]: string} = {
        'â€"': '—',
        'â€œ': '"',
        'â€': '"',
        'â€™': "'",
        'â€¦': '...',
        'Ã—': '×',
        'Â': ' '
      };
      return charMap[char] || char;
    })
    // strip markdown emphasis/links/code
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`{1,3}([^`]+)`{1,3}/g, '$1')
    // simple bullets/numbering normalization
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

function buildEnhancedMasterPrompt(data: MasterPromptRequest): string {
  const numberOfDays = parseInt(data.numberOfDays || '5');
  const durationMinutes = parseInt(data.duration?.match(/\d+/)?.[0] || '90');
  const cleanTopic = processTopicForReadability(data.topic);
  const lessonCode = `RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}`;
  const subjectAbbr = getSubjectAbbreviation(data.subject);

  return `
PROFESSIONAL LESSON PLAN GENERATOR - STRUCTURED OUTPUT

Create a comprehensive ${numberOfDays}-day lesson plan with clear content hierarchy and professional formatting.

LESSON PARAMETERS:
- Subject: ${data.subject}
- Grade Level: ${data.gradeLevel}
- Topic: ${cleanTopic}
- Duration: ${data.duration} per day
- Location: ${data.location || 'Savannah, Georgia'}
- Days: ${numberOfDays}

CRITICAL OUTPUT REQUIREMENTS:
1. Use clear heading hierarchy (Level I, II, III)
2. Each day must have UNIQUE, SPECIFIC content that builds progressively  
3. Activities must be detailed and actionable for teachers
4. Generate ACTUAL resource content, not placeholders
5. Structure content for tables and visual organization where appropriate

DAILY PROGRESSION:
Day 1: Introduction and Foundation Building
Day 2: Exploration and Investigation  
Day 3: Analysis and Critical Thinking
Day 4: Application and Creation
Day 5: Synthesis and Reflection

OUTPUT FORMAT WITH CLEAR HIERARCHY:

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

${Array.from({length: numberOfDays}, (_, dayIndex) => {
  const dayNumber = dayIndex + 1;
  const dayFoci = [
    'Introduction and Foundation Building',
    'Exploration and Investigation', 
    'Analysis and Critical Thinking',
    'Application and Creation',
    'Synthesis and Reflection'
  ];
  const dayFocus = dayFoci[dayIndex] || \`Advanced Application \${dayNumber}\`;

  return `
LEVEL I HEADING: DAY ${dayNumber}: ${dayFocus}

LEVEL II HEADING: Daily Essential Question
[Specific question for Day ${dayNumber} that builds toward unit question]

LEVEL II HEADING: Daily Learning Target
I can [specific skill for Day ${dayNumber} related to ${cleanTopic}] (DOK ${dayNumber === 1 ? 2 : dayNumber === 2 ? 2 : dayNumber === 3 ? 3 : dayNumber === 4 ? 3 : 4})

LEVEL II HEADING: Standards Alignment
CREATE TABLE:
Standard Type | Standard Code | Description
Primary Standard | [Specific ${data.subject} standard] | [Brief description]
SEL Integration | CASEL | [Specific competency for Day ${dayNumber}]
Cross-Curricular | [Subject areas] | [Integration description]

LEVEL II HEADING: Materials Needed
[Specific bulleted list of materials for Day ${dayNumber} activities]

LEVEL II HEADING: Root Work Framework 5 Rs Structure

LEVEL III HEADING: RELATIONSHIPS (${Math.round(durationMinutes * 0.15)} minutes)
Community Building and Belonging

Opening Activity for Day ${dayNumber}:
[Specific community-building activity related to ${cleanTopic} and Day ${dayNumber} focus]

Teacher Note: [Specific guidance for Day ${dayNumber} community building that establishes safety while connecting to ${dayFocus}]

Student Note: [Day ${dayNumber} specific encouragement that relates to ${dayFocus} and builds confidence]

LEVEL III HEADING: ROUTINES (${Math.round(durationMinutes * 0.1)} minutes)
Predictable Structure and Safety

Day ${dayNumber} Agenda:
[Specific bulleted agenda items for this day's ${dayFocus}]

Success Criteria:
[Specific bulleted success indicators students will achieve by end of Day ${dayNumber}]

Teacher Note: [Day ${dayNumber} specific routine guidance that reduces anxiety and supports executive function]

Student Note: [Day ${dayNumber} organization tips that help students prepare for ${dayFocus}]

LEVEL III HEADING: RELEVANCE (${Math.round(durationMinutes * 0.25)} minutes)
Connecting to Student Experience

Day ${dayNumber} Connection Activity:
[Specific activity connecting ${cleanTopic} to student lives, appropriate for ${dayFocus}]

Real-World Bridge:
[Specific examples of how Day ${dayNumber} content connects to current events, local community, or student interests]

Teacher Note: [Day ${dayNumber} guidance for honoring diverse perspectives while making ${cleanTopic} personally meaningful]

Student Note: [Day ${dayNumber} encouragement for sharing personal connections and valuing diverse experiences]

LEVEL III HEADING: RIGOR (${Math.round(durationMinutes * 0.35)} minutes)
Academic Challenge and Growth

I Do: Teacher Modeling (${Math.round(durationMinutes * 0.1)} minutes)
[Specific demonstration for Day ${dayNumber} that models ${dayFocus} thinking about ${cleanTopic}]

Think-Aloud Script:
"Today I'm going to show you how to [specific skill for Day ${dayNumber}] when analyzing ${cleanTopic}. Watch how I..."

Teacher Note: [Day ${dayNumber} modeling guidance that makes expert thinking visible for ${dayFocus}]

Student Note: [Day ${dayNumber} listening strategies that help students capture key thinking processes]

We Do: Guided Practice (${Math.round(durationMinutes * 0.15)} minutes)
[Specific collaborative activity for Day ${dayNumber} that practices ${dayFocus} with ${cleanTopic}]

Scaffolding Supports:
[Bulleted list of specific supports for Day ${dayNumber} that help students engage with ${dayFocus}]

Teacher Note: [Day ${dayNumber} guidance for providing just-right support during ${dayFocus} practice]

Student Note: [Day ${dayNumber} collaboration strategies that support peer learning during ${dayFocus}]

You Do Together: Collaborative Application (${Math.round(durationMinutes * 0.1)} minutes)
[Specific partner/group task for Day ${dayNumber} that applies ${dayFocus} to ${cleanTopic}]

Choice Options:
[Bulleted list of specific options for how students can demonstrate Day ${dayNumber} learning]

Teacher Note: [Day ${dayNumber} guidance for monitoring group dynamics and ensuring equitable participation]

Student Note: [Day ${dayNumber} teamwork strategies that honor different learning styles and perspectives]

LEVEL III HEADING: REFLECTION (${Math.round(durationMinutes * 0.15)} minutes)
Growth Recognition and Forward Planning

Day ${dayNumber} Processing:
[Specific reflection activity that helps students process ${dayFocus} learning about ${cleanTopic}]

Tomorrow's Preview:
[Brief preview of Day ${dayNumber + 1} that builds excitement and connection]

Teacher Note: [Day ${dayNumber} reflection guidance that supports metacognition and celebrates growth in ${dayFocus}]

Student Note: [Day ${dayNumber} reflection prompts that help students recognize their progress in ${dayFocus}]

LEVEL II HEADING: Day ${dayNumber} Implementation Supports

CREATE TABLE FOR MTSS SUPPORTS:
Support Tier | Target Population | Specific Strategies
Tier 1 Universal | All Students | [3 specific supports for Day ${dayNumber} ${dayFocus}]
Tier 2 Targeted | Students Needing Additional Support | [3 specific interventions for Day ${dayNumber} ${dayFocus}]
Tier 3 Intensive | Students Needing Significant Support | [3 specific modifications for Day ${dayNumber} ${dayFocus}]
504 Accommodations | Students with Disabilities | [Specific accommodations for Day ${dayNumber} activities]
Gifted Extensions | Advanced Learners | [Advanced opportunities for Day ${dayNumber} ${dayFocus}]
SPED Modifications | Students with IEPs | [Specific modifications for Day ${dayNumber} ${dayFocus}]

LEVEL II HEADING: Day ${dayNumber} Assessment
CREATE TABLE:
Assessment Type | Method | Purpose
Formative | [Specific check for understanding during Day ${dayNumber}] | Monitor learning progress
Summative | [How Day ${dayNumber} contributes to unit assessment] | Evaluate mastery

LEVEL II HEADING: SEL Integration
[Specific social-emotional learning embedded in Day ${dayNumber} ${dayFocus}]

LEVEL II HEADING: Trauma-Informed Considerations
[Specific considerations for Day ${dayNumber} that support student emotional safety]

PAGE BREAK

`;
}).join('')}

LEVEL I HEADING: COMPREHENSIVE RESOURCE GENERATION

File Naming Convention: ${lessonCode}_${data.gradeLevel}${subjectAbbr}_[ResourceName]

LEVEL II HEADING: 1. Student Workbook
File: ${lessonCode}_${data.gradeLevel}${subjectAbbr}_StudentWorkbook.pdf

COMPLETE CONTENT:

${cleanTopic} Student Learning Guide
Grade ${data.gradeLevel} - ${numberOfDays} Day Unit
Name: _________________________ Class Period: _________

Unit Overview:
This ${numberOfDays}-day exploration of ${cleanTopic} will help you develop critical thinking skills while connecting academic learning to your personal experiences and community.

Unit Essential Question:
[Insert the unit essential question here]

My Learning Targets:
By the end of this unit, I will be able to:
- Target 1: [knowledge/comprehension related to ${cleanTopic}]
- Target 2: [application/analysis related to ${cleanTopic}] 
- Target 3: [synthesis/evaluation related to ${cleanTopic}]

${Array.from({length: parseInt(data.numberOfDays || '5')}, (_, i) => `
DAY ${i + 1} LEARNING PAGE

Today's Focus: ${['Foundation Building', 'Exploration', 'Analysis', 'Application', 'Reflection'][i]}

Daily Essential Question: _________________________________

What I Already Know About ${cleanTopic}:
_____________________________________________________________
_____________________________________________________________

New Learning - Key Concepts:
1. ____________________________________________________________
2. ____________________________________________________________  
3. ____________________________________________________________

Real-World Connections:
How does ${cleanTopic} connect to my life or community?
_____________________________________________________________
_____________________________________________________________

Analysis Activity:
[Specific activity prompt for Day ${i + 1} related to ${cleanTopic}]

Reflection:
What surprised me today? ___________________________________
What questions do I still have? ____________________________
How did I grow as a learner? _______________________________

Preparation for Tomorrow:
One thing I want to explore further: _________________________
`).join('')}

Unit Reflection Portfolio:
[Instructions for final reflection and portfolio compilation related to ${cleanTopic}]

LEVEL II HEADING: 2. Teacher Implementation Guide
File: ${lessonCode}_${data.gradeLevel}${subjectAbbr}_TeacherGuide.pdf

COMPLETE CONTENT:

TEACHER IMPLEMENTATION GUIDE: ${cleanTopic}
Grade ${data.gradeLevel} Professional Development Resource

UNIT OVERVIEW:
This ${numberOfDays}-day unit engages students in exploring ${cleanTopic} through trauma-informed, culturally responsive pedagogy using the Root Work Framework.

PREPARATION CHECKLIST:
Before Day 1:
- Review all student materials and make copies
- Prepare community circle space with comfortable seating
- Gather materials for hands-on activities related to ${cleanTopic}
- Review student IEPs and 504 plans for accommodations
- Set up digital tools and resources

${Array.from({length: parseInt(data.numberOfDays || '5')}, (_, i) => `
DAY ${i + 1} TEACHER PREP:
Focus: ${['Foundation Building', 'Exploration', 'Analysis', 'Application', 'Reflection'][i]}

Key Teaching Points:
- Content point 1 for Day ${i + 1} related to ${cleanTopic}
- Content point 2 for Day ${i + 1} related to ${cleanTopic}
- Content point 3 for Day ${i + 1} related to ${cleanTopic}

Anticipated Student Challenges:
- Challenge 1: Common misconception about ${cleanTopic}
  Solution: Specific teaching strategy
- Challenge 2: Engagement concern for Day ${i + 1}
  Solution: Specific intervention

Differentiation Strategies:
- Below Grade Level: Specific supports for Day ${i + 1}
- On Grade Level: Core instruction adaptations for Day ${i + 1}
- Above Grade Level: Extension activities for Day ${i + 1}

Assessment Indicators:
Students successfully demonstrate understanding when they:
- Observable behavior 1 for Day ${i + 1}
- Observable behavior 2 for Day ${i + 1}
- Observable behavior 3 for Day ${i + 1}
`).join('')}

TROUBLESHOOTING GUIDE:
- Low Engagement: Specific strategies for re-engaging students with ${cleanTopic}
- Behavior Concerns: Trauma-informed responses for challenging behaviors
- Academic Struggles: Scaffolding strategies for complex concepts
- Technology Issues: Backup plans for digital components

FAMILY COMMUNICATION:
Template for communicating unit goals and home extension activities related to ${cleanTopic}

Generated by Root Work Framework - Professional Trauma-Informed Learning Design
Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
`.trim();
}

/** NEW: robust, state-machine HTML builder to avoid malformed markup */
function processContentForEnhancedHTML(content: string): string {
  const src = (content || '').replace(/\r\n/g, '\n');
  const lines = src.split('\n');
  const out: string[] = [];

  let inDay = false;
  let inRS = false;
  let inList = false;

  const closeList = () => { if (inList) { out.push('</ul></div>'); inList = false; } };
  const closeRS = () => { if (inRS) { closeList(); out.push('</div>'); inRS = false; } };
  const closeDay = () => { if (inDay) { closeRS(); out.push('</div>'); inDay = false; } };

  const esc = (s: string) =>
    s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const makeTable = (header: string, rows: string[]) => {
    const headers = header.split('|').map(h => esc(h.trim())).filter(Boolean);
    const body = rows
      .map(r => r.split('|').map(c => esc(c.trim())).filter(Boolean))
      .filter(r => r.length);

    const thead = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${body.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`;
    return `<table>${thead}${tbody}</table>`;
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Page breaks
    if (/^\s*PAGE BREAK\s*$/i.test(line)) {
      closeList(); closeRS(); closeDay();
      out.push('<div class="page-break"></div>');
      continue;
    }

    // LEVEL I
    let m = /^LEVEL\s*I\s*HEADING:\s*(.+)$/i.exec(line);
    if (m) {
      const title = m[1].trim();
      // Check if it's "DAY N: Title"
      const dayMatch = /^DAY\s+(\d+)\s*:\s*(.+)$/i.exec(title);
      if (dayMatch) {
        closeList(); closeRS(); closeDay();
        inDay = true;
        out.push(`<div class="day-section"><h1 class="level-1-heading">DAY ${esc(dayMatch[1])}: ${esc(dayMatch[2])}</h1>`);
      } else {
        closeList(); closeRS(); closeDay();
        out.push(`<h1 class="level-1-heading">${esc(title)}</h1>`);
      }
      continue;
    }

    // LEVEL II
    m = /^LEVEL\s*II\s*HEADING:\s*(.+)$/i.exec(line);
    if (m) {
      closeList(); closeRS();
      out.push(`<h2 class="level-2-heading">${esc(m[1].trim())}</h2>`);
      continue;
    }

    // LEVEL III
    m = /^LEVEL\s*III\s*HEADING:\s*(.+)$/i.exec(line);
    if (m) {
      closeList(); closeRS();
      const h3 = m[1].trim();
      const rsMatch = /^(RELATIONSHIPS|ROUTINES|RELEVANCE|RIGOR|REFLECTION)\s*\((\d+)\s*minutes\)/i.exec(h3);
      if (rsMatch) {
        inRS = true;
        out.push(`<div class="rs-section"><div class="rs-header">${esc(rsMatch[1].toUpperCase())} (${esc(rsMatch[2])} minutes)</div>`);
      } else {
        out.push(`<h3 class="level-3-heading">${esc(h3)}</h3>`);
      }
      continue;
    }

    // CREATE TABLE:
    if (/^\s*CREATE TABLE\s*:\s*$/i.test(line)) {
      // header line
      i++;
      while (i < lines.length && lines[i].trim() === '') i++;
      const header = i < lines.length ? lines[i] : '';
      const rows: string[] = [];
      i++;
      while (i < lines.length && /\|/.test(lines[i])) {
        rows.push(lines[i]);
        i++;
      }
      i--; // step back for loop increment
      closeList();
      out.push(makeTable(header, rows));
      continue;
    }

    // Teacher / Student notes
    m = /^\s*Teacher Note:\s*(.+)$/i.exec(line);
    if (m) {
      closeList();
      out.push(`<div class="note teacher-note"><div class="note-label">Teacher Note:</div>${esc(m[1].trim())}</div>`);
      continue;
    }
    m = /^\s*Student Note:\s*(.+)$/i.exec(line);
    if (m) {
      closeList();
      out.push(`<div class="note student-note"><div class="note-label">Student Note:</div>${esc(m[1].trim())}</div>`);
      continue;
    }

    // Activity callouts
    if (/^\s*(Opening Activity for Day \d+:|Day \d+ Connection Activity:|I Do: Teacher Modeling|We Do: Guided Practice|You Do Together: Collaborative Application)\s*$/i.test(line)) {
      closeList();
      const label = esc(line.replace(/\s*:\s*$/, ''));
      out.push(`<div class="activity-block"><strong>${label}</strong></div>`);
      continue;
    }

    // Bullets (•, -, *)
    if (/^\s*[•\-*]\s+/.test(line)) {
      const item = esc(line.replace(/^\s*[•\-*]\s+/, ''));
      if (!inList) { out.push('<div class="bulleted-list"><ul>'); inList = true; }
      out.push(`<li>${item}</li>`);
      continue;
    }

    // Blank line → paragraph break
    if (line.trim() === '') {
      closeList();
      out.push('<br/>');
      continue;
    }

    // Default paragraph
    closeList();
    out.push(`<p>${esc(line)}</p>`);
  }

  // Close leftover wrappers
  closeList();
  closeRS();
  closeDay();

  return out.join('\n');
}

function formatAsEnhancedHTML(content: string, data: MasterPromptRequest): string {
  const cleanedContent = cleanContent(content);
  const cleanTopic = processTopicForReadability(data.topic);
  const bodyHTML = processContentForEnhancedHTML(cleanedContent);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${cleanTopic} - Grade ${data.gradeLevel} Lesson Plan</title>
<style>
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
  font-size: 11pt; 
  line-height: 1.4; 
  color: #2B2B2B; 
  background: #FFFFFF;
  margin: 0;
  padding: 0;
}

/* HEADING HIERARCHY */
.level-1-heading { 
  font-size: 18pt; 
  font-weight: bold; 
  color: #1B365D; 
  margin: 24pt 0 12pt 0; 
  padding: 8pt 12pt;
  background: linear-gradient(135deg, #1B365D 0%, #2E86AB 100%);
  color: white;
  border-radius: 6pt;
  page-break-after: avoid;
}

.level-2-heading { 
  font-size: 14pt; 
  font-weight: bold; 
  color: #2E86AB; 
  margin: 18pt 0 9pt 0; 
  padding: 6pt 0;
  border-bottom: 2pt solid #2E86AB;
  page-break-after: avoid;
}

.level-3-heading { 
  font-size: 12pt; 
  font-weight: bold; 
  color: #3B523A; 
  margin: 12pt 0 6pt 0;
  padding: 4pt 8pt;
  background: #F2F4CA;
  border-left: 4pt solid #3B523A;
  page-break-after: avoid;
}

/* LAYOUT STRUCTURE */
.header { 
  text-align: center; 
  margin-bottom: 36pt; 
  padding: 24pt;
  background: linear-gradient(135deg, #F2F4CA 0%, #E8ECBF 100%);
  border-radius: 12pt;
  border: 2pt solid #D4C862;
}

.header h1 {
  font-size: 24pt;
  font-weight: bold;
  color: #1B365D;
  margin-bottom: 12pt;
}

.meta-grid { 
  display: grid; 
  grid-template-columns: 1fr 1fr; 
  gap: 12pt; 
  margin: 18pt 0;
}

.meta-item { 
  padding: 9pt; 
  background: rgba(255, 255, 255, 0.8);
  border-radius: 6pt;
  border-left: 3pt solid #2E86AB;
}

.meta-label { 
  font-weight: bold; 
  color: #1B365D; 
}

/* DAY SECTIONS */
.day-section { 
  margin: 36pt 0; 
  padding: 18pt; 
  background: #FEFEFE;
  border: 1pt solid #E0E0E0;
  border-radius: 12pt;
  box-shadow: 0 4pt 12pt rgba(0,0,0,0.1);
  page-break-inside: avoid;
}

.page-break { 
  page-break-before: always; 
}

/* 5 Rs SECTIONS */
.rs-section { 
  margin: 18pt 0; 
  padding: 12pt; 
  border-left: 6pt solid #D4C862;
  background: linear-gradient(135deg, #FEFEFE 0%, #F8F9FA 100%);
  border-radius: 0 8pt 8pt 0;
}

.rs-header {
  font-size: 12pt;
  font-weight: bold;
  color: #1B365D;
  margin-bottom: 9pt;
  padding: 6pt 12pt;
  background: #F2F4CA;
  border-radius: 6pt;
}

/* NOTES STYLING */
.note { 
  margin: 12pt 0; 
  padding: 12pt; 
  border-radius: 8pt; 
  font-size: 10pt;
  border-left: 4pt solid;
}

.teacher-note { 
  background: linear-gradient(135deg, #E8F4FD 0%, #F0F8FF 100%);
  border-left-color: #2E86AB; 
  color: #1B365D;
}

.student-note { 
  background: linear-gradient(135deg, #F0F9E8 0%, #F8FFF8 100%);
  border-left-color: #28A745; 
  color: #155724;
}

.note-label { 
  font-weight: bold; 
  margin-bottom: 6pt;
}

/* TABLES */
table { 
  width: 100%; 
  border-collapse: collapse; 
  margin: 12pt 0; 
  background: white;
  border-radius: 8pt;
  overflow: hidden;
  box-shadow: 0 2pt 8pt rgba(0,0,0,0.1);
}

th, td { 
  border: 1pt solid #E0E0E0; 
  padding: 8pt 12pt; 
  text-align: left; 
  vertical-align: top;
}

th { 
  background: linear-gradient(135deg, #1B365D 0%, #2E86AB 100%);
  color: white; 
  font-weight: bold; 
  font-size: 10pt;
}

tr:nth-child(even) { 
  background: #F8F9FA; 
}

tr:hover { 
  background: #E8F4FD; 
}

/* LISTS */
ul, ol { 
  margin: 9pt 0; 
  padding-left: 24pt; 
}

li { 
  margin-bottom: 4pt; 
}

ul li {
  list-style-type: disc;
}

.bulleted-list {
  background: #F8F9FA;
  padding: 12pt;
  border-radius: 6pt;
  border-left: 3pt solid #D4C862;
}

/* CONTENT SECTIONS */
.content-block {
  margin: 12pt 0;
  padding: 12pt;
  background: #FEFEFE;
  border-radius: 6pt;
  border: 1pt solid #E9ECEF;
}

.activity-block {
  margin: 12pt 0;
  padding: 15pt;
  background: linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%);
  border-radius: 8pt;
  border-left: 5pt solid #28A745;
}

.resource-section {
  background: linear-gradient(135deg, #F2F4CA 0%, #E8ECBF 100%);
  padding: 18pt;
  border-radius: 12pt;
  border: 2pt solid #D4C862;
  margin: 24pt 0;
}

/* FOOTER */
.footer { 
  margin-top: 36pt; 
  padding: 18pt;
  border-top: 3pt solid #F2F4CA;
  text-align: center; 
  font-size: 9pt; 
  color: #666;
  background: #F8F9FA;
  border-radius: 6pt;
}

/* RESPONSIVE DESIGN */
@media screen and (max-width: 768px) {
  .meta-grid { grid-template-columns: 1fr; }
  .day-section { margin: 18pt 0; padding: 12pt; }
  .level-1-heading { font-size: 16pt; }
  .level-2-heading { font-size: 13pt; }
  .level-3-heading { font-size: 11pt; }
}

/* PRINT OPTIMIZATION */
@media print {
  body { font-size: 10pt; }
  .day-section { page-break-inside: avoid; }
  .level-1-heading, .level-2-heading, .level-3-heading { page-break-after: avoid; }
  .rs-section { page-break-inside: avoid; }
  table { page-break-inside: avoid; }
}
</style>
</head>
<body>
<div class="header">
<h1>Root Work Framework Lesson Plan</h1>
<div class="meta-grid">
  <div class="meta-item">
    <div class="meta-label">Topic:</div>
    <div>${cleanTopic}</div>
  </div>
  <div class="meta-item">
    <div class="meta-label">Grade Level:</div>
    <div>${data.gradeLevel}</div>
  </div>
  <div class="meta-item">
    <div class="meta-label">Subject:</div>
    <div>${data.subject}</div>
  </div>
  <div class="meta-item">
    <div class="meta-label">Duration:</div>
    <div>${data.duration} × ${data.numberOfDays} days</div>
  </div>
</div>
</div>

${bodyHTML}

<div class="footer">
  <p><strong>Generated by Root Work Framework</strong></p>
  <p>Professional Trauma-Informed Learning Design</p>
  <p>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
</div>
</body>
</html>`;
}

function generateDownloadableResources(content: string, data: MasterPromptRequest): {textResources: GeneratedResource[], imagePrompts: ImagePrompt[]} {
  const cleanTopic = processTopicForReadability(data.topic);
  const lessonCode = `RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}`;
  const subjectAbbr = getSubjectAbbreviation(data.subject);

  const resourceMatches = content.match(/COMPLETE CONTENT:([\s\S]*?)(?=File:|$)/g) || [];

  return {
    textResources: resourceMatches.map((match: string, index: number) => ({
      filename: `${lessonCode}_${data.gradeLevel}${subjectAbbr}_Resource${index + 1}.txt`,
      content: cleanContent(match.replace('COMPLETE CONTENT:', '').trim()),
      type: 'text/plain'
    })),
    imagePrompts: []
  };
}

function validateLessonPlan(content: string, data: MasterPromptRequest): {isValid: boolean, missingComponents: string[]} {
  const missing: string[] = [];

  const teacherNoteCount = (content.match(/Teacher Note:/g) || []).length;
  const studentNoteCount = (content.match(/Student Note:/g) || []).length;
  const expectedNotes = parseInt(data.numberOfDays || '5') * 6;

  if (teacherNoteCount < expectedNotes) missing.push(`Teacher Notes (found ${teacherNoteCount}, need ${expectedNotes})`);
  if (studentNoteCount < expectedNotes) missing.push(`Student Notes (found ${studentNoteCount}, need ${expectedNotes})`);

  if (!content.includes('RELATIONSHIPS')) missing.push('Relationships Component');
  if (!content.includes('ROUTINES')) missing.push('Routines Component');
  if (!content.includes('RELEVANCE')) missing.push('Relevance Component');
  if (!content.includes('RIGOR')) missing.push('Rigor Component');
  if (!content.includes('REFLECTION')) missing.push('Reflection Component');
  if (!content.includes('Essential Question')) missing.push('Essential Questions');
  if (!content.includes('CREATE TABLE')) missing.push('Structured Tables');
  if (!content.includes('COMPLETE CONTENT:')) missing.push('Generated Resource Content');

  return {
    isValid: missing.length === 0,
    missingComponents: missing
  };
}

function buildEnhancedFallback(data: MasterPromptRequest): {content: string, htmlVersion: string, cleanVersion: string} {
  const cleanTopic = processTopicForReadability(data.topic);
  const numberOfDays = parseInt(data.numberOfDays || '5');
  const durationMinutes = parseInt(data.duration?.match(/\d+/)?.[0] || '90');

  const content = `
LEVEL I HEADING: TRAUMA-INFORMED STEAM LESSON PLAN
Grade: ${data.gradeLevel}
Subject: ${data.subject}
Topic: ${cleanTopic}
Duration: ${data.duration} per day over ${numberOfDays} days
Location: ${data.location || 'Savannah, Georgia'}
Unit Title: Exploring ${cleanTopic} Through Root Work Framework

LEVEL I HEADING: LESSON OVERVIEW
This ${numberOfDays}-day exploration of ${cleanTopic} will help students develop critical thinking skills while connecting academic learning to their personal experiences and community.

LEVEL I HEADING: UNIT ESSENTIAL QUESTION
How does understanding ${cleanTopic} help us grow as learners and community members?

LEVEL I HEADING: UNIT LEARNING TARGETS
- I can analyze key concepts related to ${cleanTopic} (DOK 2)
- I can apply understanding of ${cleanTopic} to real-world situations (DOK 3)
- I can evaluate the impact of ${cleanTopic} on my community (DOK 4)

${Array.from({length: numberOfDays}, (_, dayIndex) => {
  const dayNumber = dayIndex + 1;
  const dayFoci = [
    'Introduction and Foundation Building',
    'Exploration and Investigation', 
    'Analysis and Critical Thinking',
    'Application and Creation',
    'Synthesis and Reflection'
  ];
  const dayFocus = dayFoci[dayIndex] || \`Advanced Application \${dayNumber}\`;

  return `
LEVEL I HEADING: DAY ${dayNumber}: ${dayFocus}

LEVEL II HEADING: Daily Essential Question
How does ${cleanTopic} connect to our daily experiences and community?

LEVEL II HEADING: Daily Learning Target
I can demonstrate understanding of ${cleanTopic} through ${dayFocus.toLowerCase()} (DOK ${dayNumber <= 2 ? 2 : dayNumber <= 4 ? 3 : 4})

LEVEL II HEADING: Standards Alignment
CREATE TABLE:
Standard Type | Standard Code | Description
Primary Standard | ${data.subject} Standards | Students analyze and apply concepts related to ${cleanTopic}
SEL Integration | CASEL | Self-Awareness and Social Awareness
Cross-Curricular | STEAM | Science, Technology, Arts, Mathematics integration

LEVEL II HEADING: Materials Needed
- Student worksheets and reflection journals
- Visual aids and graphic organizers
- Technology tools for research and creation
- Community connection resources

LEVEL II HEADING: Root Work Framework 5 Rs Structure

LEVEL III HEADING: RELATIONSHIPS (${Math.round(durationMinutes * 0.15)} minutes)
Community Building and Belonging

Opening Activity for Day ${dayNumber}:
Students engage in a community circle focused on ${dayFocus.toLowerCase()} related to ${cleanTopic}, sharing one personal connection or question.

Teacher Note: Establish psychological safety through consistent trauma-informed practices that honor student identities while connecting to ${dayFocus}

Student Note: This is your time to connect with classmates and ground yourself in our learning community before exploring ${cleanTopic}

LEVEL III HEADING: ROUTINES (${Math.round(durationMinutes * 0.1)} minutes)
Predictable Structure and Safety

Day ${dayNumber} Agenda:
- Review the day's ${dayFocus} activities
- Establish success criteria
- Prepare materials for ${cleanTopic} exploration

Success Criteria:
- I can identify key aspects of ${cleanTopic}
- I can engage in ${dayFocus.toLowerCase()} activities
- I can reflect on my learning progress

Teacher Note: Provide predictable structure that reduces anxiety and builds executive function skills while previewing ${dayFocus}

Student Note: Use this time to organize yourself mentally and understand what success looks like in today's ${dayFocus}

LEVEL III HEADING: RELEVANCE (${Math.round(durationMinutes * 0.25)} minutes)
Connecting to Student Experience

Day ${dayNumber} Connection Activity:
Students explore personal and community connections to ${cleanTopic} through ${dayFocus} lens, sharing diverse perspectives and experiences.

Real-World Bridge:
Local examples of ${cleanTopic} in ${data.location || 'Savannah, Georgia'} and connections to current events.

Teacher Note: Draw explicit connections between ${cleanTopic} and student cultural assets while facilitating ${dayFocus} thinking

Student Note: Your experiences with ${cleanTopic} are valuable - share authentically and listen for connections to others' stories

LEVEL III HEADING: RIGOR (${Math.round(durationMinutes * 0.35)} minutes)
Academic Challenge and Growth

I Do: Teacher Modeling (${Math.round(durationMinutes * 0.1)} minutes)
Demonstrate ${dayFocus} thinking about ${cleanTopic} using think-aloud strategies and culturally relevant examples.

Think-Aloud Script:
"Today I'm going to show you how to engage in ${dayFocus.toLowerCase()} when exploring ${cleanTopic}. Watch how I..."

Teacher Note: Model complex thinking processes while making connections to student experiences and ${dayFocus} goals

Student Note: Watch for strategies and thinking processes you can use when engaging in ${dayFocus} about ${cleanTopic}

We Do: Guided Practice (${Math.round(durationMinutes * 0.15)} minutes)
Collaborative exploration of ${cleanTopic} using ${dayFocus} approaches with teacher scaffolding and peer support.

Scaffolding Supports:
- Visual aids and graphic organizers
- Think-pair-share opportunities
- Sentence starters for discussions

Teacher Note: Provide just-right support while encouraging productive struggle and honoring different approaches to ${dayFocus}

Student Note: Engage actively in shared learning about ${cleanTopic} - ask questions and build on others' ${dayFocus} ideas

You Do Together: Collaborative Application (${Math.round(durationMinutes * 0.1)} minutes)
Partner or small group application of ${dayFocus} skills to analyze or create something related to ${cleanTopic}.

Choice Options:
- Written analysis or reflection
- Visual representation or diagram
- Verbal presentation or discussion

Teacher Note: Monitor for equitable participation while offering multiple pathways for demonstrating ${dayFocus} understanding

Student Note: Work collaboratively to apply your ${dayFocus} learning about ${cleanTopic}, drawing on everyone's unique strengths

LEVEL III HEADING: REFLECTION (${Math.round(durationMinutes * 0.15)} minutes)
Growth Recognition and Forward Planning

Day ${dayNumber} Processing:
Individual reflection on ${dayFocus} learning about ${cleanTopic}, followed by community sharing of insights and questions.

Tomorrow's Preview:
Brief preview of Day ${dayNumber + 1} that builds excitement and connection.

Teacher Note: Support various reflection styles while building metacognitive awareness about ${dayFocus} and ${cleanTopic}

Student Note: Take time to recognize your growth in ${dayFocus} and consider how today's insights about ${cleanTopic} connect to your goals

LEVEL II HEADING: Day ${dayNumber} Implementation Supports

CREATE TABLE:
Support Tier | Target Population | Specific Strategies
Tier 1 Universal | All Students | Visual supports, choice in expression format, clear success criteria
Tier 2 Targeted | Students Needing Additional Support | Graphic organizers, extended processing time, guided practice
Tier 3 Intensive | Students Needing Significant Support | One-on-one conferencing, modified expectations, alternative assessment formats
504 Accommodations | Students with Disabilities | Extended time, assistive technology access, preferential seating
Gifted Extensions | Advanced Learners | Independent research projects, leadership roles, accelerated content
SPED Modifications | Students with IEPs | Simplified language, visual supports, individualized goals

LEVEL II HEADING: Day ${dayNumber} Assessment
CREATE TABLE:
Assessment Type | Method | Purpose
Formative | Exit ticket about ${dayFocus} understanding of ${cleanTopic} | Monitor learning progress
Summative | Portfolio development showing ${dayFocus} growth with ${cleanTopic} | Evaluate mastery

LEVEL II HEADING: SEL Integration
CASEL competencies integrated through ${dayFocus} activities and community building around ${cleanTopic}

LEVEL II HEADING: Trauma-Informed Considerations
Consistent routines, student choice, cultural responsiveness, and strength-based approach to ${dayFocus} and ${cleanTopic}

PAGE BREAK

`;
}).join('')}

LEVEL I HEADING: COMPREHENSIVE RESOURCE GENERATION

LEVEL II HEADING: 1. Student Workbook
File: RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}_${data.gradeLevel}${getSubjectAbbreviation(data.subject)}_StudentWorkbook.pdf

COMPLETE CONTENT:

${cleanTopic} Student Learning Guide
Grade ${data.gradeLevel} - ${numberOfDays} Day Unit

This ${numberOfDays}-day exploration of ${cleanTopic} will help you develop critical thinking skills while connecting academic learning to your personal experiences and community.

Unit Essential Question: How does understanding ${cleanTopic} help us grow as learners and community members?

My Learning Targets:
- I can analyze key concepts related to ${cleanTopic}
- I can apply understanding of ${cleanTopic} to real-world situations  
- I can evaluate the impact of ${cleanTopic} on my community

${Array.from({length: numberOfDays}, (_, i) => `
DAY ${i + 1} LEARNING PAGE
Today's Focus: ${['Foundation Building', 'Exploration', 'Analysis', 'Application', 'Reflection'][i]}

What I Know About ${cleanTopic}:
_________________________________________________

New Learning - Key Concepts:
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

Real-World Connections:
How does ${cleanTopic} connect to my life?
_________________________________________________

Daily Reflection:
What surprised me? _____________________________
What questions do I have? _____________________
How did I grow? _______________________________
`).join('')}

Generated by Root Work Framework - Professional Trauma-Informed Learning Design
Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
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

    if (Array.isArray(payload?.content) && payload.content[0]?.type === 'text') {
      lessonContent = String(payload.content[0].text || '');
    } else if (typeof payload?.content === 'string') {
      lessonContent = String(payload.content);
    }

    lessonContent = lessonContent.replace(/```markdown\s*/gi, '').replace(/```\s*$/gi, '').trim();

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
    if (!validation.isValid && validation.missingComponents.length > 5) {
      const fallback = buildEnhancedFallback(data);
      return okJson({
        lessonPlan: fallback.cleanVersion,
        htmlVersion: fallback.htmlVersion,
        plainText: fallback.content,
        fallback: true,
        success: true,
        warnings: [...warnings, 'Too many missing components, used enhanced fallback']
      });
    }

    const cleanedContent = cleanContent(lessonContent);
    const htmlVersion = formatAsEnhancedHTML(lessonContent, data);
    const resources = generateDownloadableResources(lessonContent, data);

    return okJson({
      lessonPlan: cleanedContent,
      htmlVersion: htmlVersion,
      plainText: cleanedContent,
      resources: resources,
      success: true,
      warnings,
      validation: validation
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
