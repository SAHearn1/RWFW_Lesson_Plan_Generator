// src/app/api/generate-lesson/route.ts - Professional Clean Lesson Plan Generator

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
  let cleanTopic = topic.trim();
  
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
  
  return cleanTopic.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

function cleanContent(content: string): string {
  return content
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
    .replace(/[^\x00-\x7F]/g, function(char) {
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
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`{1,3}([^`]+)`{1,3}/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\d+\.\s+/gm, function(match, offset, string) {
      const lineStart = string.lastIndexOf('\n', offset) + 1;
      const lineNumber = string.substring(0, offset).split('\n').length;
      return lineNumber + '. ';
    })
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
PROFESSIONAL LESSON PLAN GENERATOR - CLEAN OUTPUT REQUIRED

Create a comprehensive ${numberOfDays}-day lesson plan with NO MARKDOWN formatting, NO special characters, and NO encoding issues.

LESSON PARAMETERS:
- Subject: ${data.subject}
- Grade Level: ${data.gradeLevel}
- Topic: ${cleanTopic}
- Duration: ${data.duration} per day
- Location: ${data.location || 'Savannah, Georgia'}
- Days: ${numberOfDays}

CRITICAL OUTPUT REQUIREMENTS:
1. Use ONLY standard ASCII characters - no emojis, no special symbols
2. Each day must have UNIQUE, SPECIFIC content that builds progressively  
3. Activities must be detailed and actionable for teachers
4. Generate ACTUAL resource content, not placeholders
5. Use clean, professional formatting suitable for Word documents

DAILY PROGRESSION:
Day 1: Introduction and Foundation Building
Day 2: Exploration and Investigation  
Day 3: Analysis and Critical Thinking
Day 4: Application and Creation
Day 5: Synthesis and Reflection

OUTPUT FORMAT:

TRAUMA-INFORMED STEAM LESSON PLAN
Grade: ${data.gradeLevel}
Subject: ${data.subject}
Topic: ${cleanTopic}
Duration: ${data.duration} per day over ${numberOfDays} days
Location: ${data.location || 'Savannah, Georgia'}
Unit Title: [Create compelling 4-6 word title using "${cleanTopic}"]

LESSON OVERVIEW:
[Write 2-3 sentences describing the unit's purpose and student outcomes]

UNIT ESSENTIAL QUESTION:
[One overarching question that spans all ${numberOfDays} days]

UNIT LEARNING TARGETS:
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
  const dayFocus = dayFoci[dayIndex] || `Advanced Application ${dayNumber}`;
  
  return `
DAY ${dayNumber}: ${dayFocus}

Daily Essential Question:
[Specific question for Day ${dayNumber} that builds toward unit question]

Daily Learning Target:
I can [specific skill for Day ${dayNumber} related to ${cleanTopic}] (DOK ${dayNumber === 1 ? 2 : dayNumber === 2 ? 2 : dayNumber === 3 ? 3 : dayNumber === 4 ? 3 : 4})

Standards Alignment:
- Primary Standard: [Specific ${data.subject} standard for Grade ${data.gradeLevel}]
- SEL Integration: [Specific CASEL competency for Day ${dayNumber}]
- Cross-Curricular Connections: [Other subject areas integrated]

Materials Needed:
[Specific list of materials for Day ${dayNumber} activities]

Root Work Framework 5 Rs Structure:

RELATIONSHIPS (${Math.round(durationMinutes * 0.15)} minutes)
Community Building and Belonging

Opening Activity for Day ${dayNumber}:
[Specific community-building activity related to ${cleanTopic} and Day ${dayNumber} focus]

Teacher Note: [Specific guidance for Day ${dayNumber} community building that establishes safety while connecting to ${dayFocus}]

Student Note: [Day ${dayNumber} specific encouragement that relates to ${dayFocus} and builds confidence]

ROUTINES (${Math.round(durationMinutes * 0.1)} minutes)
Predictable Structure and Safety

Day ${dayNumber} Agenda:
[Specific agenda items for this day's ${dayFocus}]

Success Criteria:
[Specific success indicators students will achieve by end of Day ${dayNumber}]

Teacher Note: [Day ${dayNumber} specific routine guidance that reduces anxiety and supports executive function]

Student Note: [Day ${dayNumber} organization tips that help students prepare for ${dayFocus}]

RELEVANCE (${Math.round(durationMinutes * 0.25)} minutes)
Connecting to Student Experience

Day ${dayNumber} Connection Activity:
[Specific activity connecting ${cleanTopic} to student lives, appropriate for ${dayFocus}]

Real-World Bridge:
[Specific examples of how Day ${dayNumber} content connects to current events, local community, or student interests]

Teacher Note: [Day ${dayNumber} guidance for honoring diverse perspectives while making ${cleanTopic} personally meaningful]

Student Note: [Day ${dayNumber} encouragement for sharing personal connections and valuing diverse experiences]

RIGOR (${Math.round(durationMinutes * 0.35)} minutes)
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
[Specific supports for Day ${dayNumber} that help students engage with ${dayFocus}]

Teacher Note: [Day ${dayNumber} guidance for providing just-right support during ${dayFocus} practice]

Student Note: [Day ${dayNumber} collaboration strategies that support peer learning during ${dayFocus}]

You Do Together: Collaborative Application (${Math.round(durationMinutes * 0.1)} minutes)
[Specific partner/group task for Day ${dayNumber} that applies ${dayFocus} to ${cleanTopic}]

Choice Options:
[Specific options for how students can demonstrate Day ${dayNumber} learning]

Teacher Note: [Day ${dayNumber} guidance for monitoring group dynamics and ensuring equitable participation]

Student Note: [Day ${dayNumber} teamwork strategies that honor different learning styles and perspectives]

REFLECTION (${Math.round(durationMinutes * 0.15)} minutes)
Growth Recognition and Forward Planning

Day ${dayNumber} Processing:
[Specific reflection activity that helps students process ${dayFocus} learning about ${cleanTopic}]

Tomorrow's Preview:
[Brief preview of Day ${dayNumber + 1} that builds excitement and connection]

Teacher Note: [Day ${dayNumber} reflection guidance that supports metacognition and celebrates growth in ${dayFocus}]

Student Note: [Day ${dayNumber} reflection prompts that help students recognize their progress in ${dayFocus}]

Day ${dayNumber} Implementation Supports:

MTSS Tiered Supports:
- Tier 1 (Universal): [3 specific supports for Day ${dayNumber} ${dayFocus}]
- Tier 2 (Targeted): [3 specific interventions for Day ${dayNumber} ${dayFocus}]  
- Tier 3 (Intensive): [3 specific modifications for Day ${dayNumber} ${dayFocus}]
- 504 Accommodations: [Specific accommodations for Day ${dayNumber} activities]
- Gifted Extensions: [Advanced opportunities for Day ${dayNumber} ${dayFocus}]
- SPED Modifications: [Specific modifications for Day ${dayNumber} ${dayFocus}]

Day ${dayNumber} Assessment:
- Formative: [Specific check for understanding during Day ${dayNumber}]
- Summative: [How Day ${dayNumber} contributes to unit assessment]

SEL Integration:
[Specific social-emotional learning embedded in Day ${dayNumber} ${dayFocus}]

Trauma-Informed Considerations:
[Specific considerations for Day ${dayNumber} that support student emotional safety]

`;
}).join('')}

COMPREHENSIVE RESOURCE GENERATION

File Naming Convention: ${lessonCode}_${data.gradeLevel}${subjectAbbr}_[ResourceName]

1. Student Workbook
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

2. Teacher Implementation Guide
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

3. Assessment Rubric
File: ${lessonCode}_${data.gradeLevel}${subjectAbbr}_AssessmentRubric.pdf

COMPLETE CONTENT:

${cleanTopic} UNIT ASSESSMENT RUBRIC
Grade ${data.gradeLevel} - Holistic Performance Evaluation

Criteria | Developing (1) | Approaching (2) | Proficient (3) | Advanced (4)

Understanding of ${cleanTopic}:
Developing: Basic awareness with significant gaps
Approaching: General understanding with some misconceptions  
Proficient: Clear, accurate understanding with examples
Advanced: Deep, nuanced understanding with sophisticated connections

Analysis and Critical Thinking:
Developing: Simple observations with minimal analysis
Approaching: Some analysis with teacher support
Proficient: Independent analysis with evidence
Advanced: Complex analysis with multiple perspectives

Application to Real World:
Developing: Limited or unclear connections
Approaching: Some connections with prompting
Proficient: Clear, relevant connections
Advanced: Multiple sophisticated connections across contexts

Communication of Ideas:
Developing: Basic communication with unclear organization
Approaching: Generally clear with some organization
Proficient: Clear, well-organized communication
Advanced: Sophisticated, compelling communication

Collaboration and SEL:
Developing: Minimal participation in group work
Approaching: Participates with encouragement
Proficient: Actively contributes to group learning
Advanced: Facilitates and enhances group learning

DAILY CHECK-IN TOOLS:

Exit Ticket Templates:
- Day 1: "One thing I learned about ${cleanTopic} today is..."
- Day 2: "The most surprising discovery about ${cleanTopic} was..."
- Day 3: "When I analyze ${cleanTopic}, I notice..."
- Day 4: "I can apply ${cleanTopic} to my life by..."
- Day 5: "My thinking about ${cleanTopic} has changed because..."

Generated by Root Work Framework - Professional Trauma-Informed Learning Design
Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
`.trim();
}

function formatAsCleanDocument(content: string, data: MasterPromptRequest, format: 'html' | 'word'): string {
  const cleanedContent = cleanContent(content);
  const cleanTopic = processTopicForReadability(data.topic);
  
  if (format === 'word') {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${cleanTopic} - Grade ${data.gradeLevel} Lesson Plan</title>
<style>
@page { margin: 1in; }
body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #000000; }
h1 { font-size: 18pt; font-weight: bold; text-align: center; margin-bottom: 24pt; page-break-after: avoid; }
h2 { font-size: 14pt; font-weight: bold; margin-top: 18pt; margin-bottom: 12pt; page-break-after: avoid; }
h3 { font-size: 12pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; page-break-after: avoid; }
p { margin-bottom: 12pt; text-align: justify; }
.header { text-align: center; margin-bottom: 36pt; }
.meta-info { margin-bottom: 24pt; }
.day-section { page-break-before: always; margin-bottom: 36pt; }
.rs-section { margin: 18pt 0; padding-left: 24pt; }
.note { margin: 12pt 0; padding: 12pt; background-color: #f5f5f5; border-left: 4pt solid #333333; }
.teacher-note { border-left-color: #2E86AB; }
.student-note { border-left-color: #28A745; }
table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
th, td { border: 1pt solid #000000; padding: 6pt; text-align: left; }
th { background-color: #f0f0f0; font-weight: bold; }
ul, ol { margin: 12pt 0; padding-left: 36pt; }
li { margin-bottom: 6pt; }
</style>
</head>
<body>
<div class="header">
<h1>Root Work Framework Lesson Plan</h1>
<div class="meta-info">
<p><strong>Topic:</strong> ${cleanTopic}</p>
<p><strong>Grade Level:</strong> ${data.gradeLevel}</p>
<p><strong>Subject:</strong> ${data.subject}</p>
<p><strong>Duration:</strong> ${data.duration} × ${data.numberOfDays} days</p>
</div>
</div>
${processContentForWord(cleanedContent)}
<div style="margin-top: 36pt; text-align: center; font-size: 10pt; color: #666666;">
<p>Generated by Root Work Framework - Professional Trauma-Informed Learning Design</p>
<p>Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
</div>
</body>
</html>`;
  }
  
  return cleanedContent;
}

function processContentForWord(content: string): string {
  return content
    .replace(/^DAY (\d+): (.+)$/gm, '<div class="day-section"><h2>DAY $1: $2</h2>')
    .replace(/^RELATIONSHIPS \((\d+) minutes\)$/gm, '<div class="rs-section"><h3>RELATIONSHIPS ($1 minutes)</h3>')
    .replace(/^ROUTINES \((\d+) minutes\)$/gm, '</div><div class="rs-section"><h3>ROUTINES ($1 minutes)</h3>')
    .replace(/^RELEVANCE \((\d+) minutes\)$/gm, '</div><div class="rs-section"><h3>RELEVANCE ($1 minutes)</h3>')
    .replace(/^RIGOR \((\d+) minutes\)$/gm, '</div><div class="rs-section"><h3>RIGOR ($1 minutes)</h3>')
    .replace(/^REFLECTION \((\d+) minutes\)$/gm, '</div><div class="rs-section"><h3>REFLECTION ($1 minutes)</h3>')
    .replace(/Teacher Note: ([^\n]+)/g, '<div class="note teacher-note"><strong>Teacher Note:</strong> $1</div>')
    .replace(/Student Note: ([^\n]+)/g, '<div class="note student-note"><strong>Student Note:</strong> $1</div>')
    .replace(/^([A-Z][A-Z\s]+):$/gm, '<h3>$1</h3>')
    .replace(/^([^<\n].+)$/gm, '<p>$1</p>')
    .replace(/\n\n/g, '\n')
    .replace(/<\/div>\s*<p>/g, '</div><p>')
    .replace(/<\/p>\s*<h/g, '</p><h')
    + '</div>';
}

function generateDownloadableResources(content: string, data: MasterPromptRequest): {textResources: GeneratedResource[], imagePrompts: ImagePrompt[]} {
  const cleanTopic = processTopicForReadability(data.topic);
  const lessonCode = `RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}`;
  const subjectAbbr = getSubjectAbbreviation(data.subject);
  
  const resourceMatches = content.match(/COMPLETE CONTENT:([\s\S]*?)(?=File:|$)/g) || [];
  
  return {
    textResources: resourceMatches.map((match, index) => ({
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
  if (!content.includes('Essential Question:')) missing.push('Essential Questions');
  if (!content.includes('Tier 1')) missing.push('MTSS Tier 1 Supports');
  if (!content.includes('COMPLETE CONTENT:')) missing.push('Generated Resource Content');
  
  return {
    isValid: missing.length === 0,
    missingComponents: missing
  };
}

function buildEnhancedFallback(data: MasterPromptRequest): {content: string, wordVersion: string, cleanVersion: string} {
  const cleanTopic = processTopicForReadability(data.topic);
  const numberOfDays = parseInt(data.numberOfDays || '5');
  const durationMinutes = parseInt(data.duration?.match(/\d+/)?.[0] || '90');
  
  const content = `
TRAUMA-INFORMED STEAM LESSON PLAN
Grade: ${data.gradeLevel}
Subject: ${data.subject}
Topic: ${cleanTopic}
Duration: ${data.duration} per day over ${numberOfDays} days
Location: ${data.location || 'Savannah, Georgia'}
Unit Title: Exploring ${cleanTopic} Through Root Work Framework

UNIT ESSENTIAL QUESTION:
How does understanding ${cleanTopic} help us grow as learners and community members?

UNIT LEARNING TARGETS:
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
  const dayFocus = dayFoci[dayIndex] || `Advanced Application ${dayNumber}`;
  
  return `
DAY ${dayNumber}: ${dayFocus}

Daily Essential Question:
How does ${cleanTopic} connect to our daily experiences and community?

Daily Learning Target:
I can demonstrate understanding of ${cleanTopic} through ${dayFocus.toLowerCase()} (DOK ${dayNumber <= 2 ? 2 : dayNumber <= 4 ? 3 : 4})

Standards Alignment:
- Primary Standard: ${data.subject} - Students analyze and apply concepts related to ${cleanTopic}
- SEL Integration: CASEL Self-Awareness and Social Awareness
- Cross-Curricular Connections: Science, Technology, Arts, Mathematics integration

Materials Needed:
- Student worksheets and reflection journals
- Visual aids and graphic organizers
- Technology tools for research and creation
- Community connection resources

Root Work Framework 5 Rs Structure:

RELATIONSHIPS (${Math.round(durationMinutes * 0.15)} minutes)
Community Building and Belonging

Opening Activity for Day ${dayNumber}:
Students engage in a community circle focused on ${dayFocus.toLowerCase()} related to ${cleanTopic}, sharing one personal connection or question.

Teacher Note: Establish psychological safety through consistent trauma-informed practices that honor student identities while connecting to ${dayFocus}

Student Note: This is your time to connect with classmates and ground yourself in our learning community before exploring ${cleanTopic}

ROUTINES (${Math.round(durationMinutes * 0.1)} minutes)
Predictable Structure and Safety

Day ${dayNumber} Agenda:
Review the day's ${dayFocus} activities, success criteria, and learning goals related to ${cleanTopic}.

Teacher Note: Provide predictable structure that reduces anxiety and builds executive function skills while previewing ${dayFocus}

Student Note: Use this time to organize yourself mentally and understand what success looks like in today's ${dayFocus}

RELEVANCE (${Math.round(durationMinutes * 0.25)} minutes)
Connecting to Student Experience

Day ${dayNumber} Connection Activity:
Students explore personal and community connections to ${cleanTopic} through ${dayFocus} lens, sharing diverse perspectives and experiences.

Teacher Note: Draw explicit connections between ${cleanTopic} and student cultural assets while facilitating ${dayFocus} thinking

Student Note: Your experiences with ${cleanTopic} are valuable - share authentically and listen for connections to others' stories

RIGOR (${Math.round(durationMinutes * 0.35)} minutes)
Academic Challenge and Growth

I Do: Teacher Modeling (${Math.round(durationMinutes * 0.1)} minutes)
Demonstrate ${dayFocus} thinking about ${cleanTopic} using think-aloud strategies and culturally relevant examples.

Teacher Note: Model complex thinking processes while making connections to student experiences and ${dayFocus} goals

Student Note: Watch for strategies and thinking processes you can use when engaging in ${dayFocus} about ${cleanTopic}

We Do: Guided Practice (${Math.round(durationMinutes * 0.15)} minutes)
Collaborative exploration of ${cleanTopic} using ${dayFocus} approaches with teacher scaffolding and peer support.

Teacher Note: Provide just-right support while encouraging productive struggle and honoring different approaches to ${dayFocus}

Student Note: Engage actively in shared learning about ${cleanTopic} - ask questions and build on others' ${dayFocus} ideas

You Do Together: Collaborative Application (${Math.round(durationMinutes * 0.1)} minutes)
Partner or small group application of ${dayFocus} skills to analyze or create something related to ${cleanTopic}.

Teacher Note: Monitor for equitable participation while offering multiple pathways for demonstrating ${dayFocus} understanding

Student Note: Work collaboratively to apply your ${dayFocus} learning about ${cleanTopic}, drawing on everyone's unique strengths

REFLECTION (${Math.round(durationMinutes * 0.15)} minutes)
Growth Recognition and Forward Planning

Day ${dayNumber} Processing:
Individual reflection on ${dayFocus} learning about ${cleanTopic}, followed by community sharing of insights and questions.

Teacher Note: Support various reflection styles while building metacognitive awareness about ${dayFocus} and ${cleanTopic}

Student Note: Take time to recognize your growth in ${dayFocus} and consider how today's insights about ${cleanTopic} connect to your goals

Day ${dayNumber} Implementation Supports:

MTSS Tiered Supports:
- Tier 1 (Universal): Visual supports for ${cleanTopic}, choice in expression format, clear success criteria for ${dayFocus}
- Tier 2 (Targeted): Graphic organizers for ${dayFocus}, extended processing time, guided practice with ${cleanTopic}
- Tier 3 (Intensive): One-on-one conferencing, modified expectations for ${dayFocus}, alternative assessment formats
- 504 Accommodations: Extended time, assistive technology access, preferential seating for ${dayFocus} activities
- Gifted Extensions: Independent research projects about ${cleanTopic}, leadership roles in ${dayFocus}
- SPED Modifications: Simplified language, visual supports for ${cleanTopic}, individualized ${dayFocus} goals

Day ${dayNumber} Assessment:
- Formative: Exit ticket about ${dayFocus} understanding of ${cleanTopic}
- Summative: Portfolio development showing ${dayFocus} growth with ${cleanTopic}

SEL Integration:
CASEL competencies integrated through ${dayFocus} activities and community building around ${cleanTopic}

Trauma-Informed Considerations:
Consistent routines, student choice, cultural responsiveness, and strength-based approach to ${dayFocus} and ${cleanTopic}

`;
}).join('')}

COMPREHENSIVE RESOURCE GENERATION

1. Student Workbook
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
  const wordVersion = formatAsCleanDocument(content, data, 'word');
  
  return { content, wordVersion, cleanVersion };
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
        wordVersion: fallback.wordVersion,
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
        wordVersion: fallback.wordVersion,
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
    }

    lessonContent = lessonContent.replace(/```markdown\s*/gi, '').replace(/```\s*$/gi, '').trim();

    if (!lessonContent || lessonContent.length < 3000) {
      const fallback = buildEnhancedFallback(data);
      return okJson({ 
        lessonPlan: fallback.cleanVersion,
        wordVersion: fallback.wordVersion,
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
        wordVersion: fallback.wordVersion,
        plainText: fallback.content,
        fallback: true, 
        success: true, 
        warnings: [...warnings, 'Too many missing components, used enhanced fallback']
      });
    }

    const cleanedContent = cleanContent(lessonContent);
    const wordVersion = formatAsCleanDocument(lessonContent, data, 'word');
    const resources = generateDownloadableResources(lessonContent, data);

    return okJson({ 
      lessonPlan: cleanedContent,
      wordVersion: wordVersion,
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
      wordVersion: fallback.wordVersion,
      plainText: fallback.content,
      fallback: true,
      success: true,
      warnings: ['Emergency fallback due to system error'],
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}
