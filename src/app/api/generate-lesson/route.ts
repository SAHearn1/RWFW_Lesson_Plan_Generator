// src/app/api/generate-lesson/route.ts - Enhanced Professional Lesson Plan Generator

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
  // Clean up overly long or malformed topics
  let cleanTopic = topic.trim();
  
  // If topic is longer than 60 characters, try to extract the core concept
  if (cleanTopic.length > 60) {
    // Look for key educational terms and extract the main concept
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
    
    // If still too long, take first meaningful chunk
    if (cleanTopic.length > 60) {
      const words = cleanTopic.split(' ');
      cleanTopic = words.slice(0, Math.min(6, words.length)).join(' ');
    }
  }
  
  // Ensure it's properly capitalized
  return cleanTopic.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

function buildEnhancedMasterPrompt(data: MasterPromptRequest): string {
  const numberOfDays = parseInt(data.numberOfDays || '5');
  const durationMinutes = parseInt(data.duration?.match(/\d+/)?.[0] || '90');
  const cleanTopic = processTopicForReadability(data.topic);
  const lessonCode = `RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}`;
  const subjectAbbr = getSubjectAbbreviation(data.subject);
  
  return `
ENHANCED PROFESSIONAL TRAUMA-INFORMED STEAM LESSON PLAN GENERATOR

Create a comprehensive ${numberOfDays}-day lesson plan with the following specifications:

**LESSON PARAMETERS:**
- Subject: ${data.subject}
- Grade Level: ${data.gradeLevel}
- Topic: ${cleanTopic}
- Duration: ${data.duration} per day
- Location: ${data.location || 'Savannah, Georgia'}
- Days: ${numberOfDays}

**CRITICAL QUALITY REQUIREMENTS:**
1. Each day must have UNIQUE, SPECIFIC content that builds progressively
2. Activities must be detailed and actionable for teachers
3. Generate ACTUAL resource content, not placeholders
4. Use ONLY the clean topic "${cleanTopic}" throughout (never repeat long topic names)
5. Include specific, grade-appropriate examples and scenarios
6. Provide detailed facilitation guidance for every activity

**DAILY PROGRESSION STRUCTURE:**
Day 1: Introduction and Foundation Building
Day 2: Exploration and Investigation  
Day 3: Analysis and Critical Thinking
Day 4: Application and Creation
Day 5: Synthesis and Reflection

**ENHANCED OUTPUT FORMAT:**

**TRAUMA-INFORMED STEAM LESSON PLAN**
**Grade:** ${data.gradeLevel}
**Subject:** ${data.subject}
**Topic:** ${cleanTopic}
**Duration:** ${data.duration} per day over ${numberOfDays} days
**Location:** ${data.location || 'Savannah, Georgia'}
**Unit Title:** [Create compelling 4-6 word title using "${cleanTopic}"]

**LESSON OVERVIEW:**
[Write 2-3 sentences describing the unit's purpose and student outcomes]

**UNIT ESSENTIAL QUESTION:**
[One overarching question that spans all ${numberOfDays} days]

**UNIT LEARNING TARGETS:**
- I can [specific measurable outcome 1] (DOK 2)
- I can [specific measurable outcome 2] (DOK 3) 
- I can [specific measurable outcome 3] (DOK 4)

---

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
## **DAY ${dayNumber}: ${dayFocus}**

### **Daily Essential Question:**
[Specific question for Day ${dayNumber} that builds toward unit question]

### **Daily Learning Target:**
I can [specific skill for Day ${dayNumber} related to ${cleanTopic}] (DOK ${dayNumber === 1 ? 2 : dayNumber === 2 ? 2 : dayNumber === 3 ? 3 : dayNumber === 4 ? 3 : 4})

### **Standards Alignment:**
- **Primary Standard:** [Specific ${data.subject} standard for Grade ${data.gradeLevel}]
- **SEL Integration:** [Specific CASEL competency for Day ${dayNumber}]
- **Cross-Curricular Connections:** [Other subject areas integrated]

### **Materials Needed:**
[Specific list of materials for Day ${dayNumber} activities]

---

### **Root Work Framework 5 Rs Structure:**

**RELATIONSHIPS (${Math.round(durationMinutes * 0.15)} minutes)**
*Community Building and Belonging*

**Opening Ritual for Day ${dayNumber}:**
[Specific community-building activity related to ${cleanTopic} and Day ${dayNumber} focus]

**Facilitation Notes:**
[Teacher Note: Specific guidance for Day ${dayNumber} community building that establishes safety while connecting to ${dayFocus}]

[Student Note: Day ${dayNumber} specific encouragement that relates to ${dayFocus} and builds confidence]

**ROUTINES (${Math.round(durationMinutes * 0.1)} minutes)**
*Predictable Structure and Safety*

**Day ${dayNumber} Agenda Preview:**
[Specific agenda items for this day's ${dayFocus}]

**Success Criteria Review:**
[Specific success indicators students will achieve by end of Day ${dayNumber}]

[Teacher Note: Day ${dayNumber} specific routine guidance that reduces anxiety and supports executive function]

[Student Note: Day ${dayNumber} organization tips that help students prepare for ${dayFocus}]

**RELEVANCE (${Math.round(durationMinutes * 0.25)} minutes)**
*Connecting to Student Experience*

**Day ${dayNumber} Connection Activity:**
[Specific activity connecting ${cleanTopic} to student lives, appropriate for ${dayFocus}]

**Real-World Bridge:**
[Specific examples of how Day ${dayNumber} content connects to current events, local community, or student interests]

[Teacher Note: Day ${dayNumber} guidance for honoring diverse perspectives while making ${cleanTopic} personally meaningful]

[Student Note: Day ${dayNumber} encouragement for sharing personal connections and valuing diverse experiences]

**RIGOR (${Math.round(durationMinutes * 0.35)} minutes)**
*Academic Challenge and Growth*

**I Do: Teacher Modeling (${Math.round(durationMinutes * 0.1)} minutes)**
[Specific demonstration for Day ${dayNumber} that models ${dayFocus} thinking about ${cleanTopic}]

**Think-Aloud Script Sample:**
"Today I'm going to show you how to [specific skill for Day ${dayNumber}] when analyzing ${cleanTopic}. Watch how I..."

[Teacher Note: Day ${dayNumber} modeling guidance that makes expert thinking visible for ${dayFocus}]

[Student Note: Day ${dayNumber} listening strategies that help students capture key thinking processes]

**We Do: Guided Practice (${Math.round(durationMinutes * 0.15)} minutes)**
[Specific collaborative activity for Day ${dayNumber} that practices ${dayFocus} with ${cleanTopic}]

**Scaffolding Supports:**
[Specific supports for Day ${dayNumber} that help students engage with ${dayFocus}]

[Teacher Note: Day ${dayNumber} guidance for providing just-right support during ${dayFocus} practice]

[Student Note: Day ${dayNumber} collaboration strategies that support peer learning during ${dayFocus}]

**You Do Together: Collaborative Application (${Math.round(durationMinutes * 0.1)} minutes)**
[Specific partner/group task for Day ${dayNumber} that applies ${dayFocus} to ${cleanTopic}]

**Choice Options:**
[Specific options for how students can demonstrate Day ${dayNumber} learning]

[Teacher Note: Day ${dayNumber} guidance for monitoring group dynamics and ensuring equitable participation]

[Student Note: Day ${dayNumber} teamwork strategies that honor different learning styles and perspectives]

**REFLECTION (${Math.round(durationMinutes * 0.15)} minutes)**
*Growth Recognition and Forward Planning*

**Day ${dayNumber} Processing:**
[Specific reflection activity that helps students process ${dayFocus} learning about ${cleanTopic}]

**Tomorrow's Preview:**
[Brief preview of Day ${dayNumber + 1} that builds excitement and connection]

[Teacher Note: Day ${dayNumber} reflection guidance that supports metacognition and celebrates growth in ${dayFocus}]

[Student Note: Day ${dayNumber} reflection prompts that help students recognize their progress in ${dayFocus}]

---

### **Day ${dayNumber} Implementation Supports:**

**MTSS Tiered Supports:**
- **Tier 1 (Universal):** [3 specific supports for Day ${dayNumber} ${dayFocus}]
- **Tier 2 (Targeted):** [3 specific interventions for Day ${dayNumber} ${dayFocus}]  
- **Tier 3 (Intensive):** [3 specific modifications for Day ${dayNumber} ${dayFocus}]
- **504 Accommodations:** [Specific accommodations for Day ${dayNumber} activities]
- **Gifted Extensions:** [Advanced opportunities for Day ${dayNumber} ${dayFocus}]
- **SPED Modifications:** [Specific modifications for Day ${dayNumber} ${dayFocus}]

**Day ${dayNumber} Assessment:**
- **Formative:** [Specific check for understanding during Day ${dayNumber}]
- **Summative:** [How Day ${dayNumber} contributes to unit assessment]

**SEL Integration:**
[Specific social-emotional learning embedded in Day ${dayNumber} ${dayFocus}]

**Trauma-Informed Considerations:**
[Specific considerations for Day ${dayNumber} that support student emotional safety]

---`;
}).join('')}

## **COMPREHENSIVE RESOURCE GENERATION**

**File Naming Convention:** ${lessonCode}_${data.gradeLevel}${subjectAbbr}_[ResourceName].[extension]

### **1. Day-by-Day Student Workbook**
**File:** ${lessonCode}_${data.gradeLevel}${subjectAbbr}_StudentWorkbook.pdf

**COMPLETE CONTENT:**

**${cleanTopic} Student Learning Guide**
**Grade ${data.gradeLevel} - ${numberOfDays} Day Unit**
**Name: _________________________ Class Period: _________**

**Unit Overview:**
This ${numberOfDays}-day exploration of ${cleanTopic} will help you develop critical thinking skills while connecting academic learning to your personal experiences and community.

**Unit Essential Question:**
[Insert the unit essential question here]

**My Learning Targets:**
By the end of this unit, I will be able to:
- [ ] [Target 1 - knowledge/comprehension]
- [ ] [Target 2 - application/analysis] 
- [ ] [Target 3 - synthesis/evaluation]

${Array.from({length: parseInt(data.numberOfDays || '5')}, (_, i) => `
**DAY ${i + 1} LEARNING PAGE**

**Today's Focus:** ${['Foundation Building', 'Exploration', 'Analysis', 'Application', 'Reflection'][i]}

**Daily Essential Question:** _________________________________

**What I Already Know About ${cleanTopic}:**
_____________________________________________________________
_____________________________________________________________

**New Learning - Key Concepts:**
1. ____________________________________________________________
2. ____________________________________________________________  
3. ____________________________________________________________

**Real-World Connections:**
How does ${cleanTopic} connect to my life or community?
_____________________________________________________________
_____________________________________________________________

**Analysis Activity:**
[Specific activity prompt for Day ${i + 1}]

**Reflection:**
What surprised me today? ___________________________________
What questions do I still have? ____________________________
How did I grow as a learner? _______________________________

**Preparation for Tomorrow:**
One thing I want to explore further: _________________________
`).join('')}

**Unit Reflection Portfolio:**
[Instructions for final reflection and portfolio compilation]

### **2. Teacher Implementation Guide**
**File:** ${lessonCode}_${data.gradeLevel}${subjectAbbr}_TeacherGuide.pdf

**COMPLETE CONTENT:**

**TEACHER IMPLEMENTATION GUIDE: ${cleanTopic}**
**Grade ${data.gradeLevel} Professional Development Resource**

**UNIT OVERVIEW:**
This ${numberOfDays}-day unit engages students in exploring ${cleanTopic} through trauma-informed, culturally responsive pedagogy using the Root Work Framework.

**PREPARATION CHECKLIST:**
**Before Day 1:**
- [ ] Review all student materials and make copies
- [ ] Prepare community circle space with comfortable seating
- [ ] Gather materials for hands-on activities
- [ ] Review student IEPs and 504 plans for accommodations
- [ ] Set up digital tools and resources

**DAILY PREPARATION GUIDES:**

${Array.from({length: parseInt(data.numberOfDays || '5')}, (_, i) => `
**DAY ${i + 1} TEACHER PREP:**
**Focus:** ${['Foundation Building', 'Exploration', 'Analysis', 'Application', 'Reflection'][i]}

**Key Teaching Points:**
- [Specific content point 1 for Day ${i + 1}]
- [Specific content point 2 for Day ${i + 1}]
- [Specific content point 3 for Day ${i + 1}]

**Anticipated Student Challenges:**
- Challenge 1: [Common misconception about ${cleanTopic}]
  Solution: [Specific teaching strategy]
- Challenge 2: [Engagement concern for Day ${i + 1}]
  Solution: [Specific intervention]

**Differentiation Strategies:**
- **Below Grade Level:** [Specific supports for Day ${i + 1}]
- **On Grade Level:** [Core instruction adaptations for Day ${i + 1}]
- **Above Grade Level:** [Extension activities for Day ${i + 1}]

**Assessment Indicators:**
Students successfully demonstrate understanding when they:
- [Observable behavior 1 for Day ${i + 1}]
- [Observable behavior 2 for Day ${i + 1}]
- [Observable behavior 3 for Day ${i + 1}]

**Potential Pivots:**
If students struggle with [concept], try [alternative approach]
If students master quickly, extend with [enrichment activity]
`).join('')}

**TROUBLESHOOTING GUIDE:**
- **Low Engagement:** [Specific strategies for re-engaging students with ${cleanTopic}]
- **Behavior Concerns:** [Trauma-informed responses for challenging behaviors]
- **Academic Struggles:** [Scaffolding strategies for complex concepts]
- **Technology Issues:** [Backup plans for digital components]

**FAMILY COMMUNICATION:**
[Template for communicating unit goals and home extension activities]

### **3. Assessment Rubric and Tools**
**File:** ${lessonCode}_${data.gradeLevel}${subjectAbbr}_AssessmentTools.pdf

**COMPLETE CONTENT:**

**${cleanTopic} UNIT ASSESSMENT RUBRIC**
**Grade ${data.gradeLevel} - Holistic Performance Evaluation**

| Criteria | Developing (1) | Approaching (2) | Proficient (3) | Advanced (4) |
|----------|----------------|-----------------|----------------|--------------|
| **Understanding of ${cleanTopic}** | Basic awareness with significant gaps | General understanding with some misconceptions | Clear, accurate understanding with examples | Deep, nuanced understanding with sophisticated connections |
| **Analysis and Critical Thinking** | Simple observations with minimal analysis | Some analysis with teacher support | Independent analysis with evidence | Complex analysis with multiple perspectives |
| **Application to Real World** | Limited or unclear connections | Some connections with prompting | Clear, relevant connections | Multiple sophisticated connections across contexts |
| **Communication of Ideas** | Basic communication with unclear organization | Generally clear with some organization | Clear, well-organized communication | Sophisticated, compelling communication |
| **Collaboration and SEL** | Minimal participation in group work | Participates with encouragement | Actively contributes to group learning | Facilitates and enhances group learning |

**DAILY CHECK-IN TOOLS:**

**Exit Ticket Templates:**
- Day 1: "One thing I learned about ${cleanTopic} today is..."
- Day 2: "The most surprising discovery about ${cleanTopic} was..."
- Day 3: "When I analyze ${cleanTopic}, I notice..."
- Day 4: "I can apply ${cleanTopic} to my life by..."
- Day 5: "My thinking about ${cleanTopic} has changed because..."

**Peer Feedback Forms:**
[Structured forms for collaborative assessment activities]

**Self-Assessment Checklists:**
[Student reflection tools for metacognitive development]

### **4. Visual Learning Aids**
**File:** ${lessonCode}_${data.gradeLevel}${subjectAbbr}_ConceptMap.png

**AI GENERATION PROMPT:**
"Create a professional educational concept map for '${cleanTopic}' designed for Grade ${data.gradeLevel} students. Central hub labeled '${cleanTopic}' in bold sans-serif font, surrounded by 6 key concept bubbles connected with labeled relationship arrows. Use an academic color palette: navy blue (#1B365D) for the central concept, medium blue (#2E86AB) for secondary concepts, and gold (#F2CC85) for connection labels. Include simple, recognizable icons next to each concept bubble that relate to ${data.subject} learning. Ensure minimum 16pt font size for accessibility and high contrast ratios. Background should be clean white with subtle grid lines. Design for 1920x1080 resolution to ensure clarity when projected in classrooms. Make it visually engaging but academically appropriate for ${data.gradeLevel} students."

### **5. Process Guide Poster**
**File:** ${lessonCode}_${data.gradeLevel}${subjectAbbr}_ProcessPoster.png

**AI GENERATION PROMPT:**
"Design a step-by-step process poster showing 'How to Analyze ${cleanTopic}' for Grade ${data.gradeLevel} students. Create 5 sequential steps in colorful rounded rectangles, connected by clear directional arrows. Each step should include: a large, bold number (1-5), a concise action phrase (4-6 words), and a relevant icon. Use a professional but engaging color scheme: teal (#008080) for step backgrounds, white text for readability, and dark gray (#333333) for arrows and borders. Include subtle drop shadows for visual depth. Add a header banner with the title 'Analyzing ${cleanTopic}: A Step-by-Step Guide' in large, readable font. Ensure the design is clean, modern, and suitable for both classroom display and student handouts. Size: 11x17 inches for poster printing."

### **6. Student Reference Card**
**File:** ${lessonCode}_${data.gradeLevel}${subjectAbbr}_ReferenceCard.png

**AI GENERATION PROMPT:**
"Create a student reference card (bookmark size) featuring key vocabulary and concepts for '${cleanTopic}' at Grade ${data.gradeLevel} level. Include 8-10 essential terms with brief, student-friendly definitions. Use a clean, organized layout with alternating light blue (#F0F8FF) and white backgrounds for each term. Add small icons next to vocabulary words to aid memory retention. Include the unit title '${cleanTopic}' at the top in bold, readable font. Add a QR code placeholder at the bottom for digital resources. Design should be professional yet student-friendly, suitable for printing on cardstock. Dimensions: 2.5 x 8 inches for bookmark format. Ensure all text is large enough to read easily (minimum 10pt font)."

Generated by Root Work Framework - Professional Trauma-Informed Learning Design
Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
`.trim();
}

function formatLessonAsHTML(lessonContent: string, data: MasterPromptRequest): string {
  const cleanContent = lessonContent
    .replace(/â€"/g, '—')
    .replace(/Ã—/g, '×')
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€™/g, "'")
    .replace(/\\/g, '');

  const cleanTopic = processTopicForReadability(data.topic);
  const dayMatches = cleanContent.match(/## \*\*DAY \d+:.*?\*\*/g) || [];
  const dayNav = dayMatches.map((match, index) => {
    const dayNum = index + 1;
    const title = match.replace(/## \*\*DAY \d+: /, '').replace(/\*\*/, '');
    return `<a href="#day${dayNum}" class="day-link">Day ${dayNum}: ${title}</a>`;
  }).join('');

  const resourceCount = (cleanContent.match(/\*\*File:\*\*/g) || []).length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Root Work Framework: ${cleanTopic} - Grade ${data.gradeLevel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body { 
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      line-height: 1.6; 
      color: #2B2B2B; 
      background: #FFFFFF;
      font-size: 14px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }
    
    @media print {
      body { font-size: 11pt; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
      .day-section { page-break-inside: avoid; }
      .container { max-width: none; padding: 0; }
    }
    
    /* Typography */
    h1, h2, h3, h4 { 
      font-family: 'Segoe UI', system-ui, sans-serif;
      color: #1B365D; 
      margin-bottom: 1rem;
      line-height: 1.2;
    }
    h1 { font-size: 2.5rem; font-weight: 700; border-bottom: 4px solid #2E86AB; padding-bottom: 1rem; }
    h2 { font-size: 1.8rem; font-weight: 600; margin-top: 3rem; color: #2E86AB; }
    h3 { font-size: 1.4rem; font-weight: 600; margin-top: 2rem; }
    h4 { font-size: 1.1rem; font-weight: 600; margin-top: 1rem; }
    
    /* Header */
    .header {
      background: linear-gradient(135deg, #1B365D 0%, #2E86AB 100%);
      color: white;
      padding: 3rem 0;
      margin-bottom: 3rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    
    .header h1 {
      color: white;
      border-bottom: 4px solid #F2CC85;
      margin-bottom: 2rem;
    }
    
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }
    
    .meta-item {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .meta-label { 
      font-weight: 600; 
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.9;
      margin-bottom: 0.5rem;
    }
    
    .meta-value {
      font-size: 1.2rem;
      font-weight: 500;
    }
    
    /* Navigation */
    .navigation {
      background: #F8F9FA;
      padding: 2rem 0;
      margin-bottom: 2rem;
      border-top: 1px solid #E9ECEF;
      border-bottom: 1px solid #E9ECEF;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .nav-title {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #1B365D;
    }
    
    .day-links {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .day-link {
      padding: 0.75rem 1.5rem;
      background: #2E86AB;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      font-size: 0.9rem;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(46, 134, 171, 0.3);
    }
    
    .day-link:hover { 
      background: #1B365D; 
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(46, 134, 171, 0.4);
    }
    
    /* Content Sections */
    .day-section {
      background: white;
      border: 1px solid #E9ECEF;
      border-radius: 16px;
      margin: 3rem 0;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.08);
    }
    
    .day-header {
      background: linear-gradient(135deg, #1B365D 0%, #2E86AB 100%);
      color: white;
      padding: 2rem;
      font-size: 1.5rem;
      font-weight: 600;
    }
    
    .day-content {
      padding: 2rem;
    }
    
    /* 5 Rs Framework */
    .rs-section {
      margin: 2rem 0;
      border-left: 6px solid #F2CC85;
      background: linear-gradient(135deg, #FEFEFE 0%, #F8F9FA 100%);
      border-radius: 0 12px 12px 0;
      overflow: hidden;
    }
    
    .rs-header {
      background: #F2CC85;
      color: #1B365D;
      padding: 1rem 1.5rem;
      font-weight: 700;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .rs-content {
      padding: 2rem;
    }
    
    /* Notes */
    .teacher-note, .student-note {
      margin: 1.5rem 0;
      padding: 1.5rem;
      border-radius: 12px;
      font-size: 0.95rem;
      border-left: 5px solid;
      position: relative;
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
      font-weight: 700;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    th, td {
      padding: 1rem 1.5rem;
      text-align: left;
      border-bottom: 1px solid #E9ECEF;
    }
    
    th {
      background: #1B365D;
      color: white;
      font-weight: 600;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    tr:hover {
      background: #F8F9FA;
    }
    
    /* MTSS Grid */
    .mtss-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin: 2rem 0;
    }
    
    .mtss-tier {
      background: white;
      border: 1px solid #E9ECEF;
      border-radius: 12px;
      padding: 1.5rem;
      border-left-width: 5px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    }
    
    .tier-header {
      font-weight: 700;
      font-size: 1rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #F8F9FA;
    }
    
    .tier-1 { border-left-color: #28A745; }
    .tier-2 { border-left-color: #FFC107; }
    .tier-3 { border-left-color: #DC3545; }
    .tier-504 { border-left-color: #6F42C1; }
    .tier-gifted { border-left-color: #E83E8C; }
    .tier-sped { border-left-color: #FD7E14; }
    
    /* Resources */
    .resource-section {
      background: #F8F9FA;
      border: 2px solid #E9ECEF;
      border-radius: 16px;
      padding: 3rem;
      margin: 3rem 0;
    }
    
    .resource-item {
      background: white;
      border: 1px solid #E9ECEF;
      border-radius: 12px;
      padding: 2rem;
      margin: 2rem 0;
      box-shadow: 0 4px 16px rgba(0,0,0,0.05);
    }
    
    .resource-title {
      font-weight: 700;
      font-size: 1.2rem;
      color: #1B365D;
      margin-bottom: 1rem;
    }
    
    .resource-type {
      display: inline-block;
      background: #F2CC85;
      color: #1B365D;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    /* Footer */
    .footer {
      background: linear-gradient(135deg, #1B365D 0%, #2E86AB 100%);
      color: white;
      text-align: center;
      padding: 3rem 0;
      margin-top: 4rem;
    }
    
    .footer-logo {
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    
    .footer-date {
      font-size: 0.9rem;
      opacity: 0.9;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .container { padding: 0 15px; }
      .header { padding: 2rem 0; }
      h1 { font-size: 2rem; }
      .meta-grid { grid-template-columns: 1fr; }
      .day-links { flex-direction: column; }
      .mtss-grid { grid-template-columns: 1fr; }
    }
    
    /* Print Styles */
    @media print {
      .navigation { position: static; }
      .day-section { box-shadow: none; border: 2px solid #ccc; }
      .rs-section { border-left: 4px solid #333; }
      .teacher-note, .student-note { border-left: 3px solid #666; background: #f9f9f9; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="container">
      <h1>Root Work Framework Lesson Plan</h1>
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Topic</div>
          <div class="meta-value">${cleanTopic}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Grade Level</div>
          <div class="meta-value">${data.gradeLevel}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Subject</div>
          <div class="meta-value">${data.subject}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Duration</div>
          <div class="meta-value">${data.duration} × ${data.numberOfDays} days</div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="navigation no-print">
    <div class="container">
      <div class="nav-title">Lesson Navigation</div>
      <div class="day-links">
        ${dayNav}
        <a href="#resources" class="day-link">Resources</a>
      </div>
    </div>
  </div>
  
  <div class="container">
    <div class="content">
      ${processLessonContent(cleanContent)}
    </div>
  </div>
  
  <div class="footer">
    <div class="container">
      <div class="footer-logo">Generated by Root Work Framework</div>
      <div class="footer-date">Professional Trauma-Informed Learning Design • ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
  </div>

  <script>
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  </script>
</body>
</html>`;
}

function processLessonContent(content: string): string {
  return content
    .replace(/\[Teacher Note: ([^\]]+)\]/g, '<div class="teacher-note"><div class="note-label">👩‍🏫 Teacher Note:</div>$1</div>')
    .replace(/\[Student Note: ([^\]]+)\]/g, '<div class="student-note"><div class="note-label">🎓 Student Note:</div>$1</div>')
    .replace(/## \*\*DAY (\d+): ([^*]+)\*\*/g, '<div id="day$1" class="day-section page-break"><div class="day-header">Day $1: $2</div><div class="day-content">')
    .replace(/\*\*RELATIONSHIPS \((\d+) minutes\)\*\*/g, '<div class="rs-section"><div class="rs-header">🤝 RELATIONSHIPS ($1 minutes)</div><div class="rs-content">')
    .replace(/\*\*ROUTINES \((\d+) minutes\)\*\*/g, '</div></div><div class="rs-section"><div class="rs-header">📋 ROUTINES ($1 minutes)</div><div class="rs-content">')
    .replace(/\*\*RELEVANCE \((\d+) minutes\)\*\*/g, '</div></div><div class="rs-section"><div class="rs-header">🌍 RELEVANCE ($1 minutes)</div><div class="rs-content">')
    .replace(/\*\*RIGOR \((\d+) minutes\)\*\*/g, '</div></div><div class="rs-section"><div class="rs-header">📚 RIGOR ($1 minutes)</div><div class="rs-content">')
    .replace(/\*\*REFLECTION \((\d+) minutes\)\*\*/g, '</div></div><div class="rs-section"><div class="rs-header">🤔 REFLECTION ($1 minutes)</div><div class="rs-content">')
    .replace(/\*\*MTSS Tiered Supports:\*\*/g, '</div></div></div><h3>MTSS Tiered Supports</h3><div class="mtss-grid">')
    .replace(/- \*\*Tier 1 \(Universal\):\*\*/g, '<div class="mtss-tier tier-1"><div class="tier-header">Tier 1 (Universal)</div>')
    .replace(/- \*\*Tier 2 \(Targeted\):\*\*/g, '</div><div class="mtss-tier tier-2"><div class="tier-header">Tier 2 (Targeted)</div>')
    .replace(/- \*\*Tier 3 \(Intensive\):\*\*/g, '</div><div class="mtss-tier tier-3"><div class="tier-header">Tier 3 (Intensive)</div>')
    .replace(/- \*\*504 Accommodations:\*\*/g, '</div><div class="mtss-tier tier-504"><div class="tier-header">504 Accommodations</div>')
    .replace(/- \*\*Gifted Extensions:\*\*/g, '</div><div class="mtss-tier tier-gifted"><div class="tier-header">Gifted Extensions</div>')
    .replace(/- \*\*SPED Modifications:\*\*/g, '</div><div class="mtss-tier tier-sped"><div class="tier-header">SPED Modifications</div>')
    .replace(/## \*\*COMPREHENSIVE RESOURCE GENERATION\*\*/g, '</div></div><div id="resources" class="resource-section"><h2>Comprehensive Resource Generation</h2>')
    .replace(/### \*\*\d+\. ([^*]+)\*\*/g, '<div class="resource-item"><div class="resource-title">$1</div>')
    .replace(/\*\*File:\*\* ([^\n]+)/g, '<div class="resource-type">$1</div>')
    .replace(/\*\*COMPLETE CONTENT:\*\*/g, '<div><h4>Generated Content:</h4></div>')
    .replace(/\*\*AI GENERATION PROMPT:\*\*/g, '<div><h4>AI Generation Instructions:</h4></div>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/###? ([^\n]+)/g, '<h3>$1</h3>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(\n<li>[\s\S]*?<\/li>\n)/g, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^([^<\n].+)$/gm, '<p>$1</p>')
    .replace(/\n---\n/g, '</div></div>')
    .replace(/<p><\/p>/g, '');
}

function generateDownloadableResources(content: string, data: MasterPromptRequest): {textResources: GeneratedResource[], imagePrompts: ImagePrompt[]} {
  const cleanTopic = processTopicForReadability(data.topic);
  const lessonCode = `RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}`;
  const subjectAbbr = getSubjectAbbreviation(data.subject);
  
  const resourceMatches = content.match(/\*\*COMPLETE CONTENT:\*\*([\s\S]*?)(?=\*\*File:|### \*\*\d+\.|$)/g) || [];
  const imagePrompts = content.match(/\*\*AI GENERATION PROMPT:\*\*\s*"([^"]+)"/g) || [];
  
  return {
    textResources: resourceMatches.map((match, index) => ({
      filename: `${lessonCode}_${data.gradeLevel}${subjectAbbr}_Resource${index + 1}.txt`,
      content: match.replace('**COMPLETE CONTENT:**', '').trim(),
      type: 'text/plain'
    })),
    imagePrompts: imagePrompts.map((prompt, index) => ({
      filename: `${lessonCode}_${data.gradeLevel}${subjectAbbr}_Visual${index + 1}.png`,
      prompt: prompt.replace('**AI GENERATION PROMPT:** "', '').replace('"', ''),
      type: 'image/png'
    }))
  };
}

function validateLessonPlan(content: string, data: MasterPromptRequest): {isValid: boolean, missingComponents: string[]} {
  const missing: string[] = [];
  
  const teacherNoteCount = (content.match(/\[Teacher Note:/g) || []).length;
  const studentNoteCount = (content.match(/\[Student Note:/g) || []).length;
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
  if (!content.includes('AI GENERATION PROMPT:')) missing.push('AI Image Generation Instructions');
  
  return {
    isValid: missing.length === 0,
    missingComponents: missing
  };
}

function buildEnhancedFallback(data: MasterPromptRequest): {content: string, html: string} {
  const cleanTopic = processTopicForReadability(data.topic);
  const numberOfDays = parseInt(data.numberOfDays || '5');
  const durationMinutes = parseInt(data.duration?.match(/\d+/)?.[0] || '90');
  
  const content = `
**TRAUMA-INFORMED STEAM LESSON PLAN**
**Grade:** ${data.gradeLevel}
**Subject:** ${data.subject}
**Topic:** ${cleanTopic}
**Duration:** ${data.duration} per day over ${numberOfDays} days
**Location:** ${data.location || 'Savannah, Georgia'}
**Unit Title:** Exploring ${cleanTopic} Through Root Work Framework

**UNIT ESSENTIAL QUESTION:**
How does understanding ${cleanTopic} help us grow as learners and community members?

**UNIT LEARNING TARGETS:**
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
## **DAY ${dayNumber}: ${dayFocus}**

### **Daily Essential Question:**
How does ${cleanTopic} connect to our daily experiences and community?

### **Daily Learning Target:**
I can demonstrate understanding of ${cleanTopic} through ${dayFocus.toLowerCase()} (DOK ${dayNumber <= 2 ? 2 : dayNumber <= 4 ? 3 : 4})

### **Standards Alignment:**
- **Primary Standard:** ${data.subject} - Students analyze and apply concepts related to ${cleanTopic}
- **SEL Integration:** CASEL Self-Awareness and Social Awareness
- **Cross-Curricular Connections:** Science, Technology, Arts, Mathematics integration

### **Materials Needed:**
- Student worksheets and reflection journals
- Visual aids and graphic organizers
- Technology tools for research and creation
- Community connection resources

---

### **Root Work Framework 5 Rs Structure:**

**RELATIONSHIPS (${Math.round(durationMinutes * 0.15)} minutes)**
*Community Building and Belonging*

**Opening Ritual for Day ${dayNumber}:**
Students engage in a community circle focused on ${dayFocus.toLowerCase()} related to ${cleanTopic}, sharing one personal connection or question.

[Teacher Note: Establish psychological safety through consistent trauma-informed practices that honor student identities while connecting to ${dayFocus}]

[Student Note: This is your time to connect with classmates and ground yourself in our learning community before exploring ${cleanTopic}]

**ROUTINES (${Math.round(durationMinutes * 0.1)} minutes)**
*Predictable Structure and Safety*

**Day ${dayNumber} Agenda Preview:**
Review the day's ${dayFocus} activities, success criteria, and learning goals related to ${cleanTopic}.

[Teacher Note: Provide predictable structure that reduces anxiety and builds executive function skills while previewing ${dayFocus}]

[Student Note: Use this time to organize yourself mentally and understand what success looks like in today's ${dayFocus}]

**RELEVANCE (${Math.round(durationMinutes * 0.25)} minutes)**
*Connecting to Student Experience*

**Day ${dayNumber} Connection Activity:**
Students explore personal and community connections to ${cleanTopic} through ${dayFocus} lens, sharing diverse perspectives and experiences.

[Teacher Note: Draw explicit connections between ${cleanTopic} and student cultural assets while facilitating ${dayFocus} thinking]

[Student Note: Your experiences with ${cleanTopic} are valuable - share authentically and listen for connections to others' stories]

**RIGOR (${Math.round(durationMinutes * 0.35)} minutes)**
*Academic Challenge and Growth*

**I Do: Teacher Modeling (${Math.round(durationMinutes * 0.1)} minutes)**
Demonstrate ${dayFocus} thinking about ${cleanTopic} using think-aloud strategies and culturally relevant examples.

[Teacher Note: Model complex thinking processes while making connections to student experiences and ${dayFocus} goals]

[Student Note: Watch for strategies and thinking processes you can use when engaging in ${dayFocus} about ${cleanTopic}]

**We Do: Guided Practice (${Math.round(durationMinutes * 0.15)} minutes)**
Collaborative exploration of ${cleanTopic} using ${dayFocus} approaches with teacher scaffolding and peer support.

[Teacher Note: Provide just-right support while encouraging productive struggle and honoring different approaches to ${dayFocus}]

[Student Note: Engage actively in shared learning about ${cleanTopic} - ask questions and build on others' ${dayFocus} ideas]

**You Do Together: Collaborative Application (${Math.round(durationMinutes * 0.1)} minutes)**
Partner or small group application of ${dayFocus} skills to analyze or create something related to ${cleanTopic}.

[Teacher Note: Monitor for equitable participation while offering multiple pathways for demonstrating ${dayFocus} understanding]

[Student Note: Work collaboratively to apply your ${dayFocus} learning about ${cleanTopic}, drawing on everyone's unique strengths]

**REFLECTION (${Math.round(durationMinutes * 0.15)} minutes)**
*Growth Recognition and Forward Planning*

**Day ${dayNumber} Processing:**
Individual reflection on ${dayFocus} learning about ${cleanTopic}, followed by community sharing of insights and questions.

[Teacher Note: Support various reflection styles while building metacognitive awareness about ${dayFocus} and ${cleanTopic}]

[Student Note: Take time to recognize your growth in ${dayFocus} and consider how today's insights about ${cleanTopic} connect to your goals]

---

### **Day ${dayNumber} Implementation Supports:**

**MTSS Tiered Supports:**
- **Tier 1 (Universal):** Visual supports for ${cleanTopic}, choice in expression format, clear success criteria for ${dayFocus}
- **Tier 2 (Targeted):** Graphic organizers for ${dayFocus}, extended processing time, guided practice with ${cleanTopic}
- **Tier 3 (Intensive):** One-on-one conferencing, modified expectations for ${dayFocus}, alternative assessment formats
- **504 Accommodations:** Extended time, assistive technology access, preferential seating for ${dayFocus} activities
- **Gifted Extensions:** Independent research projects about ${cleanTopic}, leadership roles in ${dayFocus}
- **SPED Modifications:** Simplified language, visual supports for ${cleanTopic}, individualized ${dayFocus} goals

**Day ${dayNumber} Assessment:**
- **Formative:** Exit ticket about ${dayFocus} understanding of ${cleanTopic}
- **Summative:** Portfolio development showing ${dayFocus} growth with ${cleanTopic}

**SEL Integration:**
CASEL competencies integrated through ${dayFocus} activities and community building around ${cleanTopic}

**Trauma-Informed Considerations:**
Consistent routines, student choice, cultural responsiveness, and strength-based approach to ${dayFocus} and ${cleanTopic}

---`;
}).join('')}

## **COMPREHENSIVE RESOURCE GENERATION**

### **1. Day-by-Day Student Workbook**
**File:** RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}_${data.gradeLevel}${getSubjectAbbreviation(data.subject)}_StudentWorkbook.pdf

**COMPLETE CONTENT:**

**${cleanTopic} Student Learning Guide**
**Grade ${data.gradeLevel} - ${numberOfDays} Day Unit**

This ${numberOfDays}-day exploration of ${cleanTopic} will help you develop critical thinking skills while connecting academic learning to your personal experiences and community.

**Unit Essential Question:** How does understanding ${cleanTopic} help us grow as learners and community members?

**My Learning Targets:**
- [ ] I can analyze key concepts related to ${cleanTopic}
- [ ] I can apply understanding of ${cleanTopic} to real-world situations  
- [ ] I can evaluate the impact of ${cleanTopic} on my community

${Array.from({length: numberOfDays}, (_, i) => `
**DAY ${i + 1} LEARNING PAGE**
**Today's Focus:** ${['Foundation Building', 'Exploration', 'Analysis', 'Application', 'Reflection'][i]}

**What I Know About ${cleanTopic}:**
_________________________________________________

**New Learning - Key Concepts:**
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

**Real-World Connections:**
How does ${cleanTopic} connect to my life?
_________________________________________________

**Daily Reflection:**
What surprised me? _____________________________
What questions do I have? _____________________
How did I grow? _______________________________
`).join('')}

### **2. Teacher Implementation Guide**
**File:** RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}_${data.gradeLevel}${getSubjectAbbreviation(data.subject)}_TeacherGuide.pdf

**COMPLETE CONTENT:**

**TEACHER IMPLEMENTATION GUIDE: ${cleanTopic}**
**Grade ${data.gradeLevel} Professional Development Resource**

**UNIT OVERVIEW:**
This ${numberOfDays}-day unit engages students in exploring ${cleanTopic} through trauma-informed, culturally responsive pedagogy.

**KEY TEACHING STRATEGIES:**
- Use think-aloud modeling to make learning visible
- Provide multiple pathways for student expression
- Connect academic content to student cultural assets
- Maintain consistent routines for emotional safety
- Facilitate meaningful peer collaboration

**DAILY FOCUS AREAS:**
${Array.from({length: numberOfDays}, (_, i) => `Day ${i + 1}: ${['Foundation Building', 'Exploration', 'Analysis', 'Application', 'Reflection'][i]} with ${cleanTopic}`).join('\n')}

**DIFFERENTIATION STRATEGIES:**
- **Below Grade Level:** Provide graphic organizers, extended time, visual supports for ${cleanTopic}
- **On Grade Level:** Use collaborative learning and choice-based activities
- **Above Grade Level:** Offer independent research and leadership opportunities

**ASSESSMENT GUIDANCE:**
Focus on growth over perfection, provide multiple ways to demonstrate understanding of ${cleanTopic}, and use formative assessment to guide instruction.

### **3. Visual Learning Aids**
**File:** RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}_${data.gradeLevel}${getSubjectAbbreviation(data.subject)}_ConceptMap.png

**AI GENERATION PROMPT:**
"Create a professional educational concept map for '${cleanTopic}' designed for Grade ${data.gradeLevel} students. Central hub labeled '${cleanTopic}' in bold sans-serif font, surrounded by 5 key concept bubbles connected with labeled arrows. Use academic color palette: navy blue for central concept, medium blue for secondary concepts, gold for connection labels. Include simple icons next to each concept. Ensure 16pt minimum font size and high contrast. White background with subtle grid. 1920x1080 resolution for classroom projection."

Generated by Root Work Framework - Professional Trauma-Informed Learning Design
Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
`;

  const html = formatLessonAsHTML(content, data);
  return { content, html };
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
        lessonPlan: fallback.content,
        htmlVersion: fallback.html,
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
        lessonPlan: fallback.content,
        htmlVersion: fallback.html,
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
        lessonPlan: fallback.content,
        htmlVersion: fallback.html,
        fallback: true, 
        success: true, 
        warnings: [...warnings, 'Generated content too short, used enhanced fallback']
      });
    }

    const validation = validateLessonPlan(lessonContent, data);
    if (!validation.isValid && validation.missingComponents.length > 5) {
      const fallback = buildEnhancedFallback(data);
      return okJson({ 
        lessonPlan: fallback.content,
        htmlVersion: fallback.html,
        fallback: true, 
        success: true, 
        warnings: [...warnings, 'Too many missing components, used enhanced fallback']
      });
    }

    const htmlVersion = formatLessonAsHTML(lessonContent, data);
    const resources = generateDownloadableResources(lessonContent, data);

    return okJson({ 
      lessonPlan: lessonContent,
      htmlVersion: htmlVersion,
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
      lessonPlan: fallback.content,
      htmlVersion: fallback.html,
      fallback: true,
      success: true,
      warnings: ['Emergency fallback due to system error'],
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}
