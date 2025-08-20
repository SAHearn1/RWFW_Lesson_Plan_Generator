// src/app/api/generate-lesson/route.ts - Professional Lesson Plan Generator

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

function buildImprovedMasterPrompt(data: MasterPromptRequest): string {
  const numberOfDays = parseInt(data.numberOfDays || '3');
  const durationMinutes = parseInt(data.duration?.match(/\d+/)?.[0] || '90');
  const lessonCode = `RootedIn${data.topic.replace(/[^a-zA-Z]/g, '')}`;
  const subjectAbbr = getSubjectAbbreviation(data.subject);
  
  return `
PROFESSIONAL TRAUMA-INFORMED STEAM LESSON PLAN GENERATOR

Generate a comprehensive ${numberOfDays}-day lesson plan for:
- Subject: ${data.subject}
- Grade Level: ${data.gradeLevel}  
- Topic: ${data.topic}
- Duration: ${data.duration} per day
- Location: ${data.location || 'Savannah, Georgia'}
${data.learningObjectives ? `- Learning Objectives: ${data.learningObjectives}` : ''}
${data.specialNeeds ? `- Special Considerations: ${data.specialNeeds}` : ''}
${data.availableResources ? `- Available Resources: ${data.availableResources}` : ''}

CRITICAL OUTPUT REQUIREMENTS:
1. Professional formatting without decorative icons or emojis
2. Actual resource content generation (not placeholders)
3. Detailed AI image generation instructions
4. Eliminate content redundancy
5. Include mandatory Teacher Notes and Student Notes for every activity
6. Teacher-ready implementation focus

LESSON STRUCTURE FORMAT:

**TRAUMA-INFORMED STEAM LESSON PLAN**
**Grade:** ${data.gradeLevel}
**Duration:** ${data.duration} per day
**Location:** ${data.location || 'Savannah, Georgia'}
**Unit Title:** [Creative title connecting topic to place and learning goals]

${Array.from({length: numberOfDays}, (_, dayIndex) => `
## **DAY ${dayIndex + 1}: [Specific Daily Focus Title]**

### **Essential Question:**
[Daily essential question connecting to unit themes and student experience]

### **Learning Target:**
I can [specific, measurable skill statement] (DOK Level ${Math.floor(Math.random() * 4) + 1})

### **Standards Alignment:**
* ${data.subject} Standard: [Specific state standard code and description]
* SEL Competency: [CASEL domain alignment]
* Cross-curricular Connection: [Integration with other subjects]

### **Root Work Framework 5 Rs Lesson Structure:**

**RELATIONSHIPS (${Math.round(durationMinutes * 0.15)} minutes)**
*Building Community and Belonging*
[Specific community-building activity focused on ${data.topic}]

[Teacher Note: Establish psychological safety through consistent trauma-informed practices that honor student identities and cultural backgrounds while building classroom community]

[Student Note: This is your time to connect with classmates and ground yourself in our learning community before diving into new content]

**ROUTINES (${Math.round(durationMinutes * 0.1)} minutes)**
*Establishing Predictable Structure*
[Clear agenda review, success criteria presentation, and materials preparation]

[Teacher Note: Provide predictable structure that reduces anxiety and builds executive function skills through visual supports and clear expectations]

[Student Note: Use this time to organize yourself mentally and physically for learning, understanding what success looks like today]

**RELEVANCE (${Math.round(durationMinutes * 0.25)} minutes)**
*Connecting to Lived Experience and Community*
[Activity connecting ${data.topic} to student experiences and community context]

[Teacher Note: Draw explicit connections between academic content and student cultural assets, validating diverse perspectives and lived experiences]

[Student Note: Your experiences and knowledge are valuable resources for our learning - share authentically and listen for connections to others' stories]

**RIGOR (${Math.round(durationMinutes * 0.35)} minutes)**
*Engaging in Challenging, Scaffolded Learning*

**I Do: Teacher Modeling (${Math.round(durationMinutes * 0.1)} minutes)**
[Specific demonstration of key concepts with think-aloud strategy]

[Teacher Note: Model complex thinking processes explicitly while connecting to student experiences and providing multiple entry points for understanding]

[Student Note: Watch for strategies and thinking processes you can use in your own learning - notice how expert thinking works]

**We Do: Guided Practice (${Math.round(durationMinutes * 0.15)} minutes)**
[Collaborative exploration with teacher scaffolding]

[Teacher Note: Provide just-right support while encouraging productive struggle and honoring different cultural approaches to collaboration]

[Student Note: Engage actively in shared learning - ask questions, build on others' ideas, and contribute your unique perspective]

**You Do Together: Collaborative Application (${Math.round(durationMinutes * 0.1)} minutes)**
[Partner or small group application with choice in approach]

[Teacher Note: Monitor for equitable participation while offering multiple pathways for demonstrating understanding and honoring different learning styles]

[Student Note: Work collaboratively to apply your learning, drawing on everyone's strengths and supporting each other's growth]

**REFLECTION (${Math.round(durationMinutes * 0.15)} minutes)**
*Metacognitive Processing and Growth Recognition*

**Individual Processing:**
[Personal reflection connecting learning to growth and experience]

[Teacher Note: Support various reflection styles while building metacognitive awareness and honoring different processing needs and trauma responses]

[Student Note: Take time to recognize your learning journey and consider how today's insights connect to your goals and experiences]

**Community Closing:**
[Circle sharing and intention setting for continued learning]

[Teacher Note: Use restorative practices to build community, celebrate growth, and preview tomorrow's learning while being attentive to emotional responses]

[Student Note: Share your growth and listen for connections to classmates' experiences as we prepare for continued learning together]

---

**IMPLEMENTATION SUPPORTS:**

**MTSS Tiered Supports:**
* **Tier 1 (Universal):** Visual agenda, graphic organizers, choice in expression format, collaborative learning opportunities
* **Tier 2 (Targeted):** Pre-teaching key vocabulary, chunked content with guiding questions, small group check-ins, extended processing time
* **Tier 3 (Intensive):** One-on-one conferencing, modified learning targets, alternative assessment formats, frequent progress monitoring
* **504 Accommodations:** Preferential seating, extended time, assistive technology access, frequent breaks, reduced distractions
* **Gifted Extensions:** Independent research projects, mentorship opportunities, leadership roles, accelerated content
* **SPED Modifications:** Simplified language, visual supports, concrete manipulatives, individualized goals, sensory accommodations

**SEL Competencies Addressed:**
CASEL domains integrated through community building, collaborative learning, self-reflection, and decision-making opportunities

**Assessment Methods:**
* **Formative:** Exit tickets, peer feedback, teacher observation, journal reflections, self-assessment checklists
* **Summative:** Performance-based demonstration with rubric, portfolio development, student choice in format

**STEAM Integration:**
* **Science:** [Specific integration relevant to ${data.topic}]
* **Technology:** [Digital tools and computational thinking applications]
* **Engineering:** [Design thinking and problem-solving processes]
* **Arts:** [Creative expression and cultural connection opportunities]
* **Mathematics:** [Quantitative reasoning and pattern recognition]

**Trauma-Informed Care Implementation:**
* **Safety:** Consistent routines, clear expectations, calm learning environment, choice and control
* **Trustworthiness:** Transparent communication, reliable follow-through, consistent boundaries
* **Peer Support:** Collaborative learning structures, peer mentoring, community building
* **Collaboration:** Shared decision-making, student voice in learning, co-creation of classroom norms
* **Empowerment:** Student agency, strength-based approach, growth mindset messaging
* **Cultural Responsiveness:** Asset-based view of student backgrounds, multicultural perspectives, inclusive practices`).join('\n')}

---

## **RESOURCE GENERATION SECTION**

**Naming Convention:** ${lessonCode}_${data.gradeLevel}${subjectAbbr}_[DescriptiveTitle].[extension]

**Text-Based Resources (Full Content Generated):**

### **1. Student Worksheet**
**File:** ${lessonCode}_${data.gradeLevel}${subjectAbbr}_StudentWorksheet.docx

**COMPLETE CONTENT:**

**${data.topic} Learning Worksheet - Grade ${data.gradeLevel}**
**Name: _________________________ Date: _____________**

**Learning Target:** I can demonstrate understanding of ${data.topic} through analysis and application.

**Section A: Building Understanding**
1. Define ${data.topic} in your own words, including one example from your community or experience:

2. What connections do you see between ${data.topic} and your daily life? Provide specific examples:

3. Analyze the following scenario related to ${data.topic}: [Provide grade-appropriate scenario]
   What factors are involved? What might happen next?

**Section B: Application and Analysis**
4. Compare and contrast two different approaches to ${data.topic}. Use the graphic organizer below:

   | Approach 1 | Similarities | Approach 2 |
   |------------|--------------|------------|
   |            |              |            |
   |            |              |            |

5. If you were teaching a younger student about ${data.topic}, what would be the three most important points to share?
   a.
   b.
   c.

**Section C: Reflection and Growth**
6. What questions do you still have about ${data.topic}?

7. How has your understanding changed from the beginning of this lesson?

8. What learning strategies helped you most today?

**Success Criteria Checklist:**
□ I can explain ${data.topic} in my own words
□ I can connect ${data.topic} to real-world examples
□ I can analyze situations involving ${data.topic}
□ I can reflect on my learning process

### **2. Teacher Implementation Guide**
**File:** ${lessonCode}_${data.gradeLevel}${subjectAbbr}_TeacherGuide.docx

**COMPLETE CONTENT:**

**Teacher Implementation Guide: ${data.topic}**
**Grade ${data.gradeLevel} - ${numberOfDays} Day Unit**

**Unit Overview:**
This ${numberOfDays}-day unit engages students in exploring ${data.topic} through trauma-informed, culturally responsive pedagogy using the Root Work Framework.

**Essential Vocabulary:**
- **${data.topic}:** [Grade-appropriate definition]
- **Community Impact:** How ${data.topic} affects local and broader communities
- **Personal Connection:** Individual relationship to and experience with ${data.topic}
- **Analysis:** Breaking down complex ideas to understand components and relationships

**Daily Pacing Guide:**
${Array.from({length: numberOfDays}, (_, i) => `- Day ${i + 1}: [Specific focus and key activities] (${data.duration})`).join('\n')}

**Differentiation Strategies by Student Need:**

**English Language Learners:**
- Provide visual vocabulary supports with images and native language cognates
- Use graphic organizers to scaffold written responses
- Pair with bilingual peers when possible
- Pre-teach key vocabulary with visual and kinesthetic supports

**Students with Learning Differences:**
- Break complex tasks into smaller, manageable steps
- Provide choice in response format (verbal, visual, written, digital)
- Use assistive technology as appropriate
- Offer extended time and frequent check-ins

**Advanced Learners:**
- Provide additional research opportunities and complex scenarios
- Encourage leadership roles in group activities
- Offer choice in depth and breadth of exploration
- Connect to real-world applications and community issues

**Students Experiencing Trauma:**
- Maintain consistent routines and clear expectations
- Provide multiple opportunities for success and choice
- Be aware of potential trauma triggers related to ${data.topic}
- Emphasize student strengths and community connections

**Assessment Rubric:**

| Criteria | Developing (1) | Approaching (2) | Proficient (3) | Advanced (4) |
|----------|----------------|-----------------|----------------|--------------|
| Understanding | Basic awareness of ${data.topic} | General understanding with some gaps | Clear understanding with examples | Deep understanding with complex connections |
| Application | Limited connection to personal experience | Some connections made | Clear connections to life and community | Multiple sophisticated connections |
| Analysis | Simple observations | Some analysis with support | Independent analysis with evidence | Complex analysis with multiple perspectives |
| Communication | Basic communication of ideas | Generally clear communication | Clear, organized communication | Sophisticated, nuanced communication |

**Extension Activities:**
1. Community interview project about ${data.topic}
2. Digital storytelling creation
3. Action plan development for addressing ${data.topic} in the community
4. Cross-curricular research project
5. Peer teaching opportunity

**Family Engagement Suggestions:**
- Send home discussion questions for family conversations
- Invite community members to share experiences related to ${data.topic}
- Provide resources for families to explore ${data.topic} together
- Create opportunities for students to teach families what they've learned

### **3. Peer Reflection Protocol**
**File:** ${lessonCode}_${data.gradeLevel}${subjectAbbr}_PeerReflection.docx

**COMPLETE CONTENT:**

**Peer Learning Reflection Protocol**
**${data.topic} Unit - Grade ${data.gradeLevel}**

**Partners:** _________________________ and _________________________
**Date:** _____________ **Activity:** _________________________________

**Section 1: Sharing Learning**
Take turns sharing what you learned today. Listen carefully to your partner.

**My partner learned:** (Write 2-3 things your partner shared)
1.
2.
3.

**Section 2: Connections and Questions**
**Something my partner said that connected to my own experience:**

**A question I have based on what my partner shared:**

**Section 3: Supportive Feedback**
**One thing my partner did well in their learning today:**

**One way I can support my partner's continued learning:**

**Section 4: Growth Commitment**
**Something I want to work on for tomorrow:**

**How my partner can help me with this goal:**

**Reflection Questions:**
1. What did you learn from your partner that you might not have discovered on your own?

2. How did sharing your learning help you understand ${data.topic} better?

3. What questions emerged from your conversation that you want to explore further?

**Partnership Agreement for Tomorrow:**
We commit to supporting each other's learning by:
□ Listening actively and respectfully
□ Asking helpful questions
□ Sharing our thinking openly
□ Celebrating each other's growth
□ Working together to understand ${data.topic} more deeply

**Visual Resources (Detailed AI Generation Instructions):**

### **4. Concept Visualization**
**File:** ${lessonCode}_${data.gradeLevel}${subjectAbbr}_ConceptMap.png

**AI GENERATION PROMPT:**
"Create a professional educational concept map for ${data.topic} suitable for Grade ${data.gradeLevel} students. Design specifications: Central concept '${data.topic}' in a large circle at center, with 5-6 related concepts in smaller circles connected by labeled arrows. Use a clean, academic color scheme with navy blue (#1B365D) for main concepts, medium blue (#2E86AB) for connections, and gold (#F2CC85) for labels. Include simple, recognizable icons next to each concept circle. Use sans-serif fonts (minimum 14pt for accessibility). White background with subtle grid pattern. Ensure high contrast ratios for classroom projection. Size: 1920x1080 pixels for optimal display."

### **5. Process Flow Diagram**
**File:** ${lessonCode}_${data.gradeLevel}${subjectAbbr}_ProcessFlow.png

**AI GENERATION PROMPT:**
"Design a step-by-step process flow diagram showing how to analyze ${data.topic}. Create 4 sequential steps in rounded rectangles connected by arrows. Each step should contain: a large number (1-4), a brief action verb phrase (3-4 words), and a simple icon representing the action. Use professional color scheme: primary steps in teal (#008080), arrows in dark gray (#333333), text in black for maximum readability. Include subtle drop shadows for depth. Background should be light gray (#F5F5F5) with clean, modern styling. Ensure Grade ${data.gradeLevel} appropriate language. Dimensions: 1600x900 pixels for classroom display and worksheet inclusion."

### **6. Data Collection Template**
**File:** ${lessonCode}_${data.gradeLevel}${subjectAbbr}_DataTemplate.png

**AI GENERATION PROMPT:**
"Create a clean, printable data collection template for ${data.topic} research. Design a table layout with 4 columns labeled: 'Source', 'Key Information', 'Personal Connection', and 'Questions'. Include 6 empty rows for student use. Add header section with fields for student name, date, and research focus. Use professional formatting with clear borders, alternating row colors (white and light blue #F0F8FF), and black text throughout. Include small instruction text under each column header explaining what students should record. Footer should include space for reflection. Size: 8.5x11 inches (letter size) for easy printing and copying."

**Generated by Root Work Framework - Trauma-informed, regenerative learning ecosystem**
**Created: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}**
`.trim();
}

function formatLessonAsHTML(lessonContent: string, data: MasterPromptRequest): string {
  const cleanContent = lessonContent
    .replace(/â€"/g, '—')
    .replace(/Ã—/g, '×')
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€™/g, "'")
    .replace(/ðŸ¤/g, '')
    .replace(/ðŸ"‹/g, '')
    .replace(/ðŸŒ/g, '')
    .replace(/ðŸ"š/g, '')
    .replace(/ðŸ¤"/g, '')
    .replace(/ðŸ"–/g, '');

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
  <title>Root Work Framework: ${data.topic} - Grade ${data.gradeLevel}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      line-height: 1.6; 
      color: #2B2B2B; 
      max-width: 8.5in; 
      margin: 0 auto; 
      padding: 1rem;
      background: #FFFFFF;
    }
    
    @media print {
      body { max-width: none; margin: 0.5in; font-size: 11pt; }
      .no-print { display: none; }
      .page-break { page-break-before: always; }
      .day-section { page-break-inside: avoid; }
    }
    
    h1, h2, h3, h4 { 
      font-family: Georgia, serif; 
      color: #082A19; 
      margin-bottom: 0.75rem;
      line-height: 1.3;
    }
    h1 { font-size: 28px; border-bottom: 3px solid #D4C862; padding-bottom: 0.5rem; }
    h2 { font-size: 22px; margin-top: 2rem; color: #3B523A; }
    h3 { font-size: 18px; margin-top: 1.5rem; }
    h4 { font-size: 16px; margin-top: 1rem; font-weight: 600; }
    
    .header {
      background: linear-gradient(135deg, #F2F4CA 0%, #E8ECBF 100%);
      padding: 2rem;
      margin: -1rem -1rem 2rem -1rem;
      border-bottom: 4px solid #D4C862;
      border-radius: 0 0 12px 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
    }
    
    .meta-item {
      background: rgba(255, 255, 255, 0.8);
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #3B523A;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    
    .meta-label { 
      font-weight: 600; 
      color: #082A19; 
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .meta-value {
      font-size: 16px;
      color: #2B2B2B;
      margin-top: 0.25rem;
    }
    
    .quick-stats {
      display: flex;
      justify-content: space-around;
      background: #F9F9F9;
      padding: 1rem;
      border-radius: 8px;
      margin: 1rem 0;
      border: 2px solid #E0E0E0;
    }
    
    .stat-item {
      text-align: center;
    }
    
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: #3B523A;
    }
    
    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }
    
    .day-nav {
      background: #F9F9F9;
      padding: 1.5rem;
      border-radius: 12px;
      margin: 2rem 0;
      border: 2px solid #E0E0E0;
      position: sticky;
      top: 1rem;
      z-index: 100;
    }
    
    .nav-title {
      font-weight: 600;
      margin-bottom: 1rem;
      color: #082A19;
    }
    
    .day-links {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    
    .day-link {
      padding: 0.75rem 1.25rem;
      background: #3B523A;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      font-size: 14px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .day-link:hover { 
      background: #082A19; 
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }
    
    .day-section {
      background: #FEFEFE;
      border: 1px solid #E0E0E0;
      border-radius: 12px;
      margin: 2rem 0;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    .day-header {
      background: linear-gradient(135deg, #3B523A 0%, #2A3D29 100%);
      color: white;
      padding: 1.5rem 2rem;
      font-size: 20px;
      font-weight: 600;
    }
    
    .day-content {
      padding: 2rem;
    }
    
    .five-r-section {
      margin: 2rem 0;
      border-left: 5px solid #D4C862;
      background: linear-gradient(135deg, #FEFEFE 0%, #F8F9F6 100%);
      border-radius: 0 8px 8px 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    
    .r-header {
      background: #F2F4CA;
      padding: 1rem 1.5rem;
      font-weight: 600;
      font-size: 16px;
      color: #082A19;
      border-bottom: 1px solid #E8ECBF;
    }
    
    .r-content {
      padding: 1.5rem;
    }
    
    .teacher-note, .student-note {
      margin: 1rem 0;
      padding: 1rem 1.25rem;
      border-radius: 8px;
      font-size: 14px;
      border-left: 4px solid;
    }
    
    .teacher-note {
      background: #E8F4FD;
      border-left-color: #2E86AB;
      color: #1A365D;
    }
    
    .student-note {
      background: #F0F9E8;
      border-left-color: #38A169;
      color: #22543D;
    }
    
    .note-label {
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    
    .mtss-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      margin: 1.5rem 0;
    }
    
    .mtss-tier {
      background: #F8F9FA;
      border: 1px solid #E9ECEF;
      border-radius: 8px;
      padding: 1rem;
    }
    
    .tier-header {
      font-weight: 600;
      color: #495057;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #DEE2E6;
    }
    
    .tier-1 { border-left: 4px solid #28A745; }
    .tier-2 { border-left: 4px solid #FFC107; }
    .tier-3 { border-left: 4px solid #DC3545; }
    .tier-504 { border-left: 4px solid #6F42C1; }
    .tier-gifted { border-left: 4px solid #E83E8C; }
    .tier-sped { border-left: 4px solid #FD7E14; }
    
    .resource-section {
      background: #F8F9FA;
      border: 2px solid #E9ECEF;
      border-radius: 12px;
      padding: 2rem;
      margin: 2rem 0;
    }
    
    .resource-item {
      background: white;
      border: 1px solid #DEE2E6;
      border-radius: 8px;
      padding: 1.5rem;
      margin: 1rem 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .resource-title {
      font-weight: 600;
      color: #3B523A;
      margin-bottom: 0.5rem;
    }
    
    .resource-type {
      display: inline-block;
      background: #D4C862;
      color: #082A19;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 0.75rem;
    }
    
    .collapsible {
      cursor: pointer;
      padding: 1rem;
      background: #F1F3F4;
      border: none;
      text-align: left;
      width: 100%;
      font-size: 16px;
      font-weight: 600;
      border-radius: 6px;
      margin: 0.5rem 0;
      transition: background 0.2s;
    }
    
    .collapsible:hover {
      background: #E8EAED;
    }
    
    .collapsible.active {
      background: #D4C862;
      color: #082A19;
    }
    
    .collapsible-content {
      display: none;
      padding: 0 1rem 1rem 1rem;
      background: #FEFEFE;
      border-radius: 0 0 6px 6px;
    }
    
    .collapsible-content.active {
      display: block;
    }
    
    .footer {
      margin-top: 3rem;
      padding: 2rem 1rem 1rem 1rem;
      border-top: 3px solid #F2F4CA;
      text-align: center;
      background: linear-gradient(135deg, #F9F9F9 0%, #F2F4CA 100%);
      border-radius: 12px;
    }
    
    .footer-logo {
      font-weight: 600;
      color: #3B523A;
      margin-bottom: 0.5rem;
    }
    
    .footer-date {
      font-size: 14px;
      color: #666;
    }
    
    @media (max-width: 768px) {
      body { padding: 0.5rem; }
      .header { margin: -0.5rem -0.5rem 1rem -0.5rem; padding: 1rem; }
      .meta-grid { grid-template-columns: 1fr; }
      .day-links { flex-direction: column; }
      .day-link { text-align: center; }
      .quick-stats { flex-direction: column; gap: 1rem; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Root Work Framework Lesson Plan</h1>
    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Topic</div>
        <div class="meta-value">${data.topic}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Grade Level</div>
        <div class="meta-value">${data.gradeLevel}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Subject(s)</div>
        <div class="meta-value">${data.subject}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Duration</div>
        <div class="meta-value">${data.duration} × ${data.numberOfDays} days</div>
      </div>
    </div>
  </div>
  
  <div class="quick-stats no-print">
    <div class="stat-item">
      <div class="stat-number">${data.numberOfDays}</div>
      <div class="stat-label">Days</div>
    </div>
    <div class="stat-item">
      <div class="stat-number">${resourceCount}</div>
      <div class="stat-label">Resources</div>
    </div>
    <div class="stat-item">
      <div class="stat-number">5</div>
      <div class="stat-label">Rs Framework</div>
    </div>
    <div class="stat-item">
      <div class="stat-number">6</div>
      <div class="stat-label">MTSS Tiers</div>
    </div>
  </div>
  
  <div class="day-nav no-print">
    <div class="nav-title">Lesson Navigation</div>
    <div class="day-links">
      ${dayNav}
      <a href="#resources" class="day-link">Resources</a>
    </div>
  </div>
  
  <div class="content">
    ${processLessonContent(cleanContent)}
  </div>
  
  <div class="footer">
    <div class="footer-logo">Generated by Root Work Framework</div>
    <div class="footer-date">Trauma-informed, regenerative learning ecosystem • ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>

  <script>
    document.querySelectorAll('.collapsible').forEach(button => {
      button.addEventListener('click', function() {
        this.classList.toggle('active');
        const content = this.nextElementSibling;
        content.classList.toggle('active');
      });
    });
    
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
    .replace(/\[Teacher Note: ([^\]]+)\]/g, '<div class="teacher-note"><div class="note-label">Teacher Note:</div>$1</div>')
    .replace(/\[Student Note: ([^\]]+)\]/g, '<div class="student-note"><div class="note-label">Student Note:</div>$1</div>')
    .replace(/## \*\*DAY (\d+): ([^*]+)\*\*/g, '<div id="day$1" class="day-section page-break"><div class="day-header">Day $1: $2</div><div class="day-content">')
    .replace(/\*\*RELATIONSHIPS \((\d+) minutes\)\*\*/g, '<div class="five-r-section"><div class="r-header">RELATIONSHIPS ($1 minutes)</div><div class="r-content">')
    .replace(/\*\*ROUTINES \((\d+) minutes\)\*\*/g, '</div></div><div class="five-r-section"><div class="r-header">ROUTINES ($1 minutes)</div><div class="r-content">')
    .replace(/\*\*RELEVANCE \((\d+) minutes\)\*\*/g, '</div></div><div class="five-r-section"><div class="r-header">RELEVANCE ($1 minutes)</div><div class="r-content">')
    .replace(/\*\*RIGOR \((\d+) minutes\)\*\*/g, '</div></div><div class="five-r-section"><div class="r-header">RIGOR ($1 minutes)</div><div class="r-content">')
    .replace(/\*\*REFLECTION \((\d+) minutes\)\*\*/g, '</div></div><div class="five-r-section"><div class="r-header">REFLECTION ($1 minutes)</div><div class="r-content">')
    .replace(/\*\*MTSS Tiered Supports:\*\*/g, '</div></div></div><button class="collapsible">MTSS Tiered Supports</button><div class="collapsible-content"><div class="mtss-grid">')
    .replace(/\* \*\*Tier 1 \(Universal\):\*\*/g, '<div class="mtss-tier tier-1"><div class="tier-header">Tier 1 (Universal)</div>')
    .replace(/\* \*\*Tier 2 \(Targeted\):\*\*/g, '</div><div class="mtss-tier tier-2"><div class="tier-header">Tier 2 (Targeted)</div>')
    .replace(/\* \*\*Tier 3 \(Intensive\):\*\*/g, '</div><div class="mtss-tier tier-3"><div class="tier-header">Tier 3 (Intensive)</div>')
    .replace(/\* \*\*504 Accommodations:\*\*/g, '</div><div class="mtss-tier tier-504"><div class="tier-header">504 Accommodations</div>')
    .replace(/\* \*\*Gifted Extensions:\*\*/g, '</div><div class="mtss-tier tier-gifted"><div class="tier-header">Gifted Extensions</div>')
    .replace(/\* \*\*SPED Modifications:\*\*/g, '</div><div class="mtss-tier tier-sped"><div class="tier-header">SPED Modifications</div>')
    .replace(/## \*\*RESOURCE GENERATION SECTION\*\*/g, '</div></div><div id="resources" class="resource-section"><h2>Resource Generation Section</h2>')
    .replace(/### \*\*\d+\. ([^*]+)\*\*/g, '<div class="resource-item"><div class="resource-title">$1</div>')
    .replace(/\*\*File:\*\* ([^\n]+)/g, '<div class="resource-type">$1</div>')
    .replace(/\*\*COMPLETE CONTENT:\*\*/g, '<div><strong>Generated Content:</strong></div>')
    .replace(/\*\*AI GENERATION PROMPT:\*\*/g, '<div><strong>AI Generation Instructions:</strong></div>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/###? ([^\n]+)/g, '<h3>$1</h3>')
    .replace(/^-\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(\n<li>[\s\S]*?<\/li>\n)/g, '<ul>$1</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^([^<\n].+)$/gm, '<p>$1</p>')
    .replace(/\n---\n/g, '</div></div>')
    .replace(/<p><\/p>/g, '');
}

function generateDownloadableResources(content: string, data: MasterPromptRequest): {textResources: GeneratedResource[], imagePrompts: ImagePrompt[]} {
  const lessonCode = `RootedIn${data.topic.replace(/[^a-zA-Z]/g, '')}`;
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
  const expectedNotes = parseInt(data.numberOfDays || '3') * 6;
  
  if (teacherNoteCount < expectedNotes) missing.push(`Teacher Notes (found ${teacherNoteCount}, need ${expectedNotes})`);
  if (studentNoteCount < expectedNotes) missing.push(`Student Notes (found ${studentNoteCount}, need ${expectedNotes})`);
  
  if (!content.includes('RELATIONSHIPS')) missing.push('Relationships R Component');
  if (!content.includes('ROUTINES')) missing.push('Routines R Component');
  if (!content.includes('RELEVANCE')) missing.push('Relevance R Component');
  if (!content.includes('RIGOR')) missing.push('Rigor R Component');
  if (!content.includes('REFLECTION')) missing.push('Reflection R Component');
  if (!content.includes('Essential Question:')) missing.push('Essential Questions');
  if (!content.includes('I can ')) missing.push('I Can Targets');
  if (!content.includes('Tier 1')) missing.push('MTSS Tier 1 Supports');
  if (!content.includes('Tier 2')) missing.push('MTSS Tier 2 Supports');
  if (!content.includes('Tier 3')) missing.push('MTSS Tier 3 Supports');
  if (!content.includes('504 Accommodations')) missing.push('504 Accommodations');
  if (!content.includes('Gifted')) missing.push('Gifted Extensions');
  if (!content.includes('SPED')) missing.push('SPED Modifications');
  if (!content.includes('STEAM Integration')) missing.push('STEAM Integration');
  if (!content.includes('COMPLETE CONTENT:')) missing.push('Generated Resource Content');
  if (!content.includes('AI GENERATION PROMPT:')) missing.push('AI Image Generation Instructions');
  
  return {
    isValid: missing.length === 0,
    missingComponents: missing
  };
}

function buildEnhancedFallback(data: MasterPromptRequest): {content: string, html: string} {
  const numberOfDays = parseInt(data.numberOfDays || '3');
  const durationMinutes = parseInt(data.duration?.match(/\d+/)?.[0] || '90');
  const lessonCode = `RootedIn${data.topic.replace(/[^a-zA-Z]/g, '')}`;
  const subjectAbbr = getSubjectAbbreviation(data.subject);
  
  const content = `
**TRAUMA-INFORMED STEAM LESSON PLAN**
**Grade:** ${data.gradeLevel}
**Duration:** ${data.duration} per day
**Location:** ${data.location || 'Savannah, Georgia'}
**Unit Title:** Exploring ${data.topic} Through Root Work Framework

${Array.from({length: numberOfDays}, (_, dayIndex) => `
## **DAY ${dayIndex + 1}: Foundation Building in ${data.topic}**

### **Essential Question:**
How does understanding ${data.topic} help us grow as learners and community members?

### **Learning Target:**
I can demonstrate understanding of ${data.topic} while building connections to my community (DOK 3)

### **Standards Alignment:**
* ${data.subject} Standard: Students analyze and apply concepts related to ${data.topic}
* SEL Competency: CASEL Self-Awareness and Social Awareness

### **Root Work Framework 5 Rs Lesson Structure:**

**RELATIONSHIPS (${Math.round(durationMinutes * 0.15)} minutes)**
*Building Community and Belonging*
Community circle with breathing exercise and intention setting related to ${data.topic}

[Teacher Note: Use consistent trauma-informed opening to establish safety and predictability for all learners while honoring cultural approaches to community building]

[Student Note: This is your time to ground yourself, connect with classmates, and set positive intentions for learning together]

**ROUTINES (${Math.round(durationMinutes * 0.1)} minutes)**
*Establishing Predictable Structure*
Clear agenda review, success criteria sharing, and materials preparation with visual supports

[Teacher Note: Provide predictable structure that reduces anxiety and builds executive function skills for all learners]

[Student Note: Use this time to organize yourself, understand expectations, and see what success looks like today]

**RELEVANCE (${Math.round(durationMinutes * 0.25)} minutes)**
*Connecting to Lived Experience and Community*
Students explore connections between ${data.topic} and their personal experiences, families, and community

[Teacher Note: Draw explicit connections between academic content and student cultural assets, honoring diverse backgrounds and experiences]

[Student Note: Share your authentic experiences and discover how they connect to our learning - your knowledge matters]

**RIGOR (${Math.round(durationMinutes * 0.35)} minutes)**
*Engaging in Challenging, Scaffolded Learning*

**I Do: Teacher Modeling (${Math.round(durationMinutes * 0.1)} minutes)**
Demonstration of key concepts about ${data.topic} using think-aloud and culturally relevant examples

[Teacher Note: Make explicit connections to student experiences while modeling complex thinking processes]

[Student Note: Listen for connections to your own life and notice the strategies being demonstrated]

**We Do: Guided Practice (${Math.round(durationMinutes * 0.15)} minutes)**
Students work in partnerships to explore ${data.topic} using guided inquiry protocols

[Teacher Note: Circulate to provide just-right scaffolding while honoring student thinking processes and cultural approaches to collaboration]

[Student Note: Share your ideas openly, build on your partner's thinking, and ask questions when you need support]

**You Do Together: Collaborative Application (${Math.round(durationMinutes * 0.1)} minutes)**
Choice-based demonstration of understanding through visual, written, or creative expression

[Teacher Note: Offer multiple pathways for expression to honor different learning styles, cultural backgrounds, and abilities]

[Student Note: Choose the format that best allows you to show your learning and demonstrate your unique strengths]

**REFLECTION (${Math.round(durationMinutes * 0.15)} minutes)**
*Metacognitive Processing and Growth Recognition*

**Individual Processing:**
Individual journal reflection connecting ${data.topic} to personal experience

[Teacher Note: Support students who need additional processing time while using restorative circle practices to build community]

[Student Note: Be honest about your learning journey and take time to appreciate your growth and that of your classmates]

**Community Closing:**
Circle sharing of one connection and one question for tomorrow

[Teacher Note: Use restorative practices to build community, celebrate growth, and preview tomorrow's learning while being attentive to emotional responses]

[Student Note: Share your growth and listen for connections to classmates' experiences as we prepare for continued learning together]

---

**IMPLEMENTATION SUPPORTS:**

**MTSS Tiered Supports:**
* **Tier 1 (Universal):** Visual supports, choice in expression format, clear success criteria, collaborative options
* **Tier 2 (Targeted):** Graphic organizers, extended processing time, guided practice with teacher check-ins
* **Tier 3 (Intensive):** One-on-one conferencing, modified expectations, alternative assessment formats
* **504 Accommodations:** Extended time, preferential seating, frequent breaks, assistive technology access
* **Gifted Extensions:** Independent research projects, mentorship opportunities, leadership roles
* **SPED Modifications:** Simplified language, visual schedules, sensory supports, individualized goals

**SEL Competencies Addressed:**
CASEL domains integrated through community building, self-reflection, and collaborative problem-solving

**Assessment Methods:**
* **Formative:** Exit tickets, journal reflections, peer feedback, teacher observation
* **Summative:** Choice-based demonstration of learning with rubric evaluation

**STEAM Integration:**
* **Science:** Investigation and hypothesis testing related to ${data.topic}
* **Technology:** Digital tools for research, creation, and collaboration
* **Engineering:** Design thinking and problem-solving processes
* **Arts:** Creative expression and cultural storytelling
* **Mathematics:** Data analysis, patterns, and quantitative reasoning

**Trauma-Informed Care Implementation:**
* **Safety:** Consistent routines, clear expectations, calm learning environment
* **Trustworthiness:** Consistent follow-through, transparent communication
* **Peer Support:** Collaborative learning, peer mentoring, community building
* **Collaboration:** Shared decision-making, student voice in learning choices
* **Empowerment:** Student agency, strength-based approach, growth mindset
* **Cultural Responsiveness:** Asset-based view of student backgrounds and experiences`).join('\n')}

---

## **RESOURCE GENERATION SECTION**

### **1. Student Worksheet**
**File:** ${lessonCode}_${data.gradeLevel}${subjectAbbr}_StudentWorksheet.docx

**COMPLETE CONTENT:**

**${data.topic} Learning Worksheet - Grade ${data.gradeLevel}**
**Name: _________________________ Date: _____________**

**Learning Target:** I can demonstrate understanding of ${data.topic} through analysis and application.

**Section A: Building Understanding**
1. Define ${data.topic} in your own words, including one example from your community:

2. What connections do you see between ${data.topic} and your daily life?

3. Analyze the following scenario: [Describe a relevant situation]
   What factors are involved? What might happen next?

**Section B: Reflection and Growth**
4. What questions do you still have about ${data.topic}?

5. How has your understanding changed from the beginning of this lesson?

6. What learning strategies helped you most today?

**Success Criteria Checklist:**
□ I can explain ${data.topic} in my own words
□ I can connect ${data.topic} to real-world examples
□ I can analyze situations involving ${data.topic}
□ I can reflect on my learning process

### **2. Visual Concept Map**
**File:** ${lessonCode}_${data.gradeLevel}${subjectAbbr}_ConceptMap.png

**AI GENERATION PROMPT:**
"Create a professional educational concept map for ${data.topic} suitable for Grade ${data.gradeLevel} students. Central concept '${data.topic}' in large circle at center, with 5 related concepts in smaller circles connected by labeled arrows. Use clean academic color scheme with navy blue for main concepts, medium blue for connections, and gold for labels. Include simple icons next to each concept. Sans-serif fonts minimum 14pt. White background, high contrast, 1920x1080 resolution for classroom display."

### **3. Process Flow Diagram**
**File:** ${lessonCode}_${data.gradeLevel}${subjectAbbr}_ProcessFlow.png

**AI GENERATION PROMPT:**
"Design a step-by-step process flow showing how to analyze ${data.topic}. Create 4 sequential steps in rounded rectangles connected by arrows. Each step contains a large number, brief action phrase, and simple icon. Use professional teal and dark gray colors. Clean modern styling with subtle shadows. Grade ${data.gradeLevel} appropriate language. 1600x900 pixels for classroom display."

Generated by Root Work Framework - Trauma-informed, regenerative learning ecosystem
Created: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
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
    const numberOfDays = (received as any).numberOfDays?.trim?.() || (warnings.push('Defaulted numberOfDays to "3"'), '3');

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

    const prompt = buildImprovedMasterPrompt(data);
    
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
        temperature: 0.2,
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

    if (!lessonContent || lessonContent.length < 2000) {
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
      numberOfDays: '3'
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
