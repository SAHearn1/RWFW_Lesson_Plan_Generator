// src/app/api/generate-lesson/route.ts - Final version with correct Claude model names

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

// Full RWFW prompt structure for high-token models
function buildEnhancedMasterPrompt(data: MasterPromptRequest): string {
  const numberOfDays = parseInt(data.numberOfDays || '5');
  const durationMinutes = parseInt(data.duration?.match(/\d+/)?.[0] || '90');
  const cleanTopic = data.topic || 'Core Learning Concept';

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

CRITICAL: You must generate ALL ${numberOfDays} days completely. Do not stop after Day 1. Generate Day 1, Day 2, Day 3, up through Day ${numberOfDays}. Every single day must be included.

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
Primary Standard | [Real ${data.subject} standard code for Grade ${data.gradeLevel}] | [Complete description of how this applies to ${cleanTopic}]
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
Formative | [Exit ticket aligned to Day ${dayNumber} learning target] | Monitor daily progress
Summative | [Assessment aligned to unit targets] | Evaluate mastery

LEVEL II HEADING: SEL Integration
[SEL specifics Day ${dayNumber}]

LEVEL II HEADING: Trauma-Informed Considerations
[Trauma-informed notes Day ${dayNumber}]

PAGE BREAK
`.trim();
}).join('\n\n')}

LEVEL I HEADING: COMPREHENSIVE RESOURCE GENERATION

LEVEL II HEADING: 1. Student Workbook
File: RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}_${data.gradeLevel}_StudentWorkbook.pdf

COMPLETE CONTENT:
[Write out all student-facing workbook pages for the unit]

LEVEL II HEADING: 2. Teacher Implementation Guide
File: RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}_${data.gradeLevel}_TeacherGuide.pdf

COMPLETE CONTENT:
[Write a detailed teacher guide, prep checklists, day-by-day tips, anticipated challenges, differentiation, and rubrics]
`.trim();
}

async function callAnthropicAPI(prompt: string, apiKey: string, model: string, maxTokens: number): Promise<{success: boolean, content: string, model: string, error?: string}> {
  try {
    console.log(`Calling Anthropic API with model: ${model}, max_tokens: ${maxTokens}`);
    
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: maxTokens,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    console.log(`${model} response status: ${resp.status}`);

    if (!resp.ok) {
      const errorText = await resp.text();
      console.log(`${model} error response:`, errorText);
      return {
        success: false,
        content: '',
        model,
        error: `${model} returned ${resp.status}: ${errorText}`
      };
    }

    const payload = await resp.json();
    let lessonContent = '';
    
    if (Array.isArray(payload?.content)) {
      const firstText = payload.content.find((c: any) => c?.type === 'text');
      if (firstText?.text) lessonContent = String(firstText.text);
    }

    console.log(`${model} generated content length:`, lessonContent.length);
    
    // Validate content quality
    const dayMatches = lessonContent.match(/DAY\s+\d+/gi) || [];
    const hasMinimumContent = lessonContent.length > 5000;
    const hasAllSections = lessonContent.includes('Teacher Note:') && lessonContent.includes('Student Note:');
    
    console.log(`${model} validation - Days found: ${dayMatches.length}, Min content: ${hasMinimumContent}, Has sections: ${hasAllSections}`);

    return {
      success: true,
      content: lessonContent,
      model
    };

  } catch (error) {
    console.error(`${model} API call failed:`, error);
    return {
      success: false,
      content: '',
      model,
      error: `${model} API call failed: ${(error as Error).message}`
    };
  }
}

function cleanContent(content: string): string {
  return content
    .replace(/â€"|—/g, '—')
    .replace(/â€œ|â€|"|"/g, '"')
    .replace(/â€˜|â€™|'/g, "'")
    .replace(/Â/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatAsEnhancedHTML(content: string, data: MasterPromptRequest): string {
  const cleaned = cleanContent(content);
  const cleanTopic = data.topic || 'Core Concept';

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
  html = html.replace(/\n?PAGE BREAK\n?/g, '</section>');

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

async function parseLessonRequest(req: NextRequest): Promise<Partial<MasterPromptRequest> | null> {
  try {
    const json = await req.json();
    return json;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== LESSON PLAN GENERATION START ===');
    
    const parsed = await parseLessonRequest(request);
    if (!parsed) {
      return okJson({ error: 'Could not parse request' }, { status: 400 });
    }

    const subject = (parsed as any).subject?.trim() || 'English Language Arts';
    const gradeLevel = (parsed as any).gradeLevel?.trim() || '9';
    const topic = (parsed as any).topic?.trim() || 'Core Concept';
    const duration = (parsed as any).duration?.trim() || '60 minutes';
    const numberOfDays = (parsed as any).numberOfDays?.trim() || '3';

    const data: MasterPromptRequest = {
      subject, gradeLevel, topic, duration, numberOfDays,
      learningObjectives: (parsed as any).learningObjectives ?? '',
      specialNeeds: (parsed as any).specialNeeds ?? '',
      availableResources: (parsed as any).availableResources ?? '',
      location: (parsed as any).location ?? 'Savannah, Georgia',
      unitContext: (parsed as any).unitContext ?? '',
      lessonType: (parsed as any).lessonType ?? 'comprehensive_multi_day',
      specialInstructions: (parsed as any).specialInstructions ?? ''
    };

    console.log('Final lesson data:', data);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return okJson({ error: 'No API key configured' }, { status: 500 });
    }

    const prompt = buildEnhancedMasterPrompt(data);
    console.log('Prompt length:', prompt.length);

    // Try Claude Opus 4.1 first (32k output tokens - most capable)
    console.log('=== PRIMARY: Attempting Claude Opus 4.1 ===');
    let result = await callAnthropicAPI(prompt, apiKey, 'claude-opus-4-1-20250805', 30000);
    
    // If Opus 4.1 fails, try Claude 3.7 Sonnet (64k output tokens - highest output)
    if (!result.success) {
      console.log('=== FALLBACK 1: Trying Claude 3.7 Sonnet ===');
      result = await callAnthropicAPI(prompt, apiKey, 'claude-3-7-sonnet-20250219', 60000);
    }

    // If 3.7 Sonnet fails, try Claude Sonnet 4 (high capability)
    if (!result.success) {
      console.log('=== FALLBACK 2: Trying Claude Sonnet 4 ===');
      result = await callAnthropicAPI(prompt, apiKey, 'claude-sonnet-4-20250514', 25000);
    }

    // Final fallback to Claude Haiku 3.5 (8k tokens, fast)
    if (!result.success) {
      console.log('=== FALLBACK 3: Trying Claude Haiku 3.5 ===');
      result = await callAnthropicAPI(prompt, apiKey, 'claude-3-5-haiku-20241022', 8000);
    }

    if (!result.success) {
      console.log('=== ALL MODELS FAILED ===');
      return okJson({ 
        error: 'All available Claude models failed to generate lesson plan',
        details: result.error,
        success: false 
      }, { status: 500 });
    }

    console.log(`=== SUCCESS WITH ${result.model.toUpperCase()} ===`);
    
    const dayMatches = result.content.match(/DAY\s+\d+/gi) || [];
    console.log('Days found:', dayMatches.length, 'out of', numberOfDays);

    const cleanedContent = cleanContent(result.content);
    const htmlVersion = formatAsEnhancedHTML(result.content, data);

    return okJson({
      lessonPlan: cleanedContent,
      htmlVersion,
      plainText: cleanedContent,
      success: true,
      metadata: {
        modelUsed: result.model,
        daysRequested: parseInt(numberOfDays),
        daysFound: dayMatches.length,
        isComplete: dayMatches.length >= parseInt(numberOfDays),
        contentLength: result.content.length
      }
    });

  } catch (err) {
    console.error('=== CRITICAL ERROR ===');
    console.error('Error:', (err as Error).message);
    return okJson({
      error: (err as Error).message,
      success: false
    }, { status: 500 });
  }
}
