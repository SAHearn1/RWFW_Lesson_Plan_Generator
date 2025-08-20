// src/app/api/generate-lesson/route.ts - Systematic Master Prompt Implementation

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

// Build the comprehensive master prompt with systematic validation
function buildMasterPrompt(data: MasterPromptRequest): string {
  const numberOfDays = parseInt(data.numberOfDays || '3');
  const durationMinutes = parseInt(data.duration?.match(/\d+/)?.[0] || '90');
  const lessonCode = `RootedIn${data.topic.replace(/[^a-zA-Z]/g, '')}`;
  const subjectAbbr = getSubjectAbbreviation(data.subject);
  
  return `
**REFINED MASTER LLM PROMPT for Trauma-Informed STEAM Lesson Plan Generator with Mandatory Teacher & Student Notes**

🧑‍🏫 Persona to Assume: You are an expert curriculum designer with 20+ years of experience in:

* K–12 education (general and special education)  
* Project-Based Learning (PBL)  
* Trauma-Informed Care (TIC) in schools  
* Living Learning Labs (LLLs) and STEAM integration  
* CASEL-aligned Social Emotional Learning (SEL)  
* MTSS design and classroom regulation  
* Student agency and equity-centered pedagogy

You are also familiar with the book From Garden to Growth and its frameworks, including:

* Table 1.1: "Foundations of Trauma-Informed Pedagogy"  
* Figure 1.3: "Regulation Rituals in Garden-Based Learning"  
* Table 2.1: "Cultural Anchoring in Learning Design"  
* Figure 2.3: "The Garden-Based Regulation Protocol"  
* The Trauma-Informed STEAM Lesson Design Rubric  
* The STEAM-PBL Unit Planner for LLLs  
* The Trauma-Responsive PBL Unit Template  
* The Trauma-Informed PBL Implementation Rubric

**LESSON REQUIREMENTS:**
- Subject: ${data.subject}
- Grade Level: ${data.gradeLevel}  
- Topic: ${data.topic}
- Duration: ${data.duration} per day over ${numberOfDays} days
- Location: ${data.location || 'Savannah, Georgia'}
${data.learningObjectives ? `- Learning Objectives: ${data.learningObjectives}` : ''}
${data.specialNeeds ? `- Special Considerations: ${data.specialNeeds}` : ''}
${data.availableResources ? `- Available Resources: ${data.availableResources}` : ''}
${data.unitContext ? `- Unit Context: ${data.unitContext}` : ''}

🎯 MANDATORY TEACHER & STUDENT NOTES PROTOCOL: Every lesson component MUST include both note types in this exact format:

**Teacher Notes Format:**
* Appear as [Teacher Note: ] immediately after each activity description  
* Include: pedagogical rationale, trauma-informed considerations, differentiation strategies, assessment insights, Rootwork Framework connections  
* Tone: Professional, supportive mentor to colleague  
* Length: 1-3 sentences maximum  
* Must address therapeutic context and trauma-informed facilitation

**Student Notes Format:**
* Appear as [Student Note: ] immediately after teacher notes  
* Include: coaching language, success strategies, self-advocacy prompts, growth mindset reinforcement, connection to personal growth  
* Tone: Warm, empowering, second-person voice aligned with Rootwork Framework  
* Length: 1-2 sentences maximum  
* Must support student agency and emotional regulation

**Placement Rules:**
* Notes appear immediately after activity descriptions, before MTSS supports  
* Both note types required for every major lesson component (Opening, I Do, We Do, You Do Together, You Do Alone, Closing)  
* No lesson component may be generated without both note types  
* Notes must maintain therapeutic Rootwork Framework context throughout

🎯 Objective: Generate a ${numberOfDays}-day, student-facing lesson plan that integrates:

* Trauma-informed care (SAMHSA 6 Principles)  
* STEAM and Project-Based Learning  
* Living Learning Lab methodology  
* CASEL SEL competencies  
* MTSS scaffolding  
* Student agency and differentiated learning modalities  
* Gradual Release of Responsibility (GRR)

🧾 MANDATORY Output Format - Each Component Required:

**HEADER SECTION:**
**TRAUMA-INFORMED STEAM LESSON PLAN**  
**Grade:** ${data.gradeLevel}  
**Duration:** ${data.duration} per day  
**Location:** ${data.location || 'Savannah, Georgia'}  
**Unit Title:** [Creative title connecting topic to place and identity]

---

For each lesson day (Day 1-${numberOfDays}), provide in this exact order:

## **DAY X: [Specific Day Title]**

### **Essential Question:**
[Daily essential question connecting to larger unit themes]

### **Learning Target:**
[Student-friendly "I can" statement with specific DOK level]

### **Standards (Georgia ELA/Subject Standards):**
* **Subject Standard Code** – Brief description  
* **SEL Alignment** – CASEL: [Specific competencies]

### **Root Work Framework 5 Rs Lesson Structure:**

**🤝 RELATIONSHIPS (${Math.round(durationMinutes * 0.15)} minutes)**  
*Building Community and Belonging*
[Specific community-building activity with regulation ritual]
[Teacher Note: Establish safety and belonging through consistent trauma-informed practices that honor student identities]
[Student Note: This is your time to connect with classmates and ground yourself in our learning community]

**📋 ROUTINES (${Math.round(durationMinutes * 0.1)} minutes)**  
*Establishing Predictable Structure*
[Clear agenda review, success criteria, materials preparation]
[Teacher Note: Provide predictable structure that reduces anxiety and builds executive function skills]
[Student Note: Use this time to organize yourself and understand what success looks like today]

**🌍 RELEVANCE (${Math.round(durationMinutes * 0.25)} minutes)**  
*Connecting to Lived Experience and Community*
**Personal Connection Phase:**
[Activity connecting ${data.topic} to student experiences and community context]
[Teacher Note: Draw explicit connections between academic content and student cultural assets and lived experiences]
[Student Note: Share your authentic experiences and see how they connect to our learning]

**📚 RIGOR (${Math.round(durationMinutes * 0.35)} minutes)**  
*Engaging in Challenging, Scaffolded Learning*
**I Do: Teacher Modeling (${Math.round(durationMinutes * 0.1)} minutes)**
[Content demonstration with think-aloud strategy]
[Teacher Note: Model complex thinking while making your reasoning visible and accessible]
[Student Note: Watch how expert thinking works and notice strategies you can use]

**We Do: Guided Practice (${Math.round(durationMinutes * 0.15)} minutes)**
[Collaborative exploration with teacher scaffolding]
[Teacher Note: Provide just-right support while encouraging productive struggle and peer collaboration]
[Student Note: Try out new learning with support - ask questions and build on others' ideas]

**You Do Together: Collaborative Application (${Math.round(durationMinutes * 0.1)} minutes)**
[Partner or small group application with choice in approach]
[Teacher Note: Monitor for understanding while honoring different cultural approaches to collaboration]
[Student Note: Work with your team to apply your learning in ways that honor everyone's strengths]

**🤔 REFLECTION (${Math.round(durationMinutes * 0.15)} minutes)**  
*Metacognitive Processing and Growth Recognition*
**Individual Processing:**
[Personal reflection on learning and growth]
[Teacher Note: Support metacognitive development while honoring different reflection styles and paces]
[Student Note: Think about how you've grown today and what strategies helped you learn]

**Community Closing:**
[Circle sharing and intention setting for continued learning]
[Teacher Note: Use restorative practices to build community and preview tomorrow's learning journey]
[Student Note: Celebrate your growth and that of your classmates as we prepare for tomorrow]

---

**Additional Required Sections Per Day:**

**Student-facing instructions and scaffolds**
[Clear, second-person coaching language for all activities]

**Facilitator modeling guidance**
[Specific think-aloud scripts and demonstration approaches]

**MTSS tiered supports:**
* **Tier 1 (Universal):** [3-4 specific supports for all students]
* **Tier 2 (Targeted):** [3-4 supports for students needing additional help]
* **Tier 3 (Intensive):** [3-4 individualized supports for highest-need students]
* **504 Accommodations:** [Specific supports for Section 504 students]
* **Gifted Extensions:** [Advanced learning opportunities]
* **SPED Modifications:** [IEP-specific adaptations]

**SEL competencies addressed**
[Specific CASEL domains with examples of integration]

**Regulation rituals (referencing therapeutic context)**
[Specific trauma-informed practices and timing]

**Choices for student expression**
[Multiple pathways for demonstrating learning]

**Assessment:**
* **Formative:** [Specific daily check-ins and feedback mechanisms]
* **Summative:** [End-of-unit performance assessment]

**I Can Targets with DOK Levels:**
* I can [specific skill] (DOK ${1 + Math.floor(Math.random() * 4)})
* I can [application skill] (DOK ${2 + Math.floor(Math.random() * 3)})
* I can [synthesis skill] (DOK ${3 + Math.floor(Math.random() * 2)})

**5 Rs Time Allocation:**
* **Relationships:** ${Math.round(durationMinutes * 0.15)} minutes - [Community building purpose]
* **Routines:** ${Math.round(durationMinutes * 0.1)} minutes - [Predictable structure purpose]  
* **Relevance:** ${Math.round(durationMinutes * 0.2)} minutes - [Personal connection purpose]
* **Rigor:** ${Math.round(durationMinutes * 0.4)} minutes - [Academic challenge purpose]
* **Reflection:** ${Math.round(durationMinutes * 0.15)} minutes - [Metacognitive closure purpose]

**Bloom's Taxonomy Alignment:**
* **Remember:** [Specific task] - Rationale: [Purpose]
* **Understand:** [Specific task] - Rationale: [Purpose]
* **Apply:** [Specific task] - Rationale: [Purpose]
* **Analyze:** [Specific task] - Rationale: [Purpose]
* **Evaluate:** [Specific task] - Rationale: [Purpose]
* **Create:** [Specific task] - Rationale: [Purpose]

**STEAM Integration:**
* **Science:** [How integrated throughout lesson]
* **Technology:** [Digital tools and computational thinking]
* **Engineering:** [Design thinking and problem-solving]
* **Arts:** [Creative expression and cultural connection]
* **Mathematics:** [Quantitative reasoning and patterns]

**Trauma-Informed Care (SAMHSA 6 Principles):**
* **Safety:** [Physical and emotional safety measures]
* **Trustworthiness:** [Transparency and consistency practices]
* **Peer Support:** [Student collaboration and mutual aid]
* **Collaboration:** [Shared decision-making opportunities]
* **Empowerment:** [Student choice and voice mechanisms]
* **Cultural Responsiveness:** [Asset-based cultural integration]

**Co-Teaching Integration:**
* **Model:** [Specific co-teaching approach]
* **Roles:** [Teacher A and Teacher B responsibilities]
* **Grouping:** [Student organization strategy]

**Optional extension or enrichment opportunities**
[Advanced learning pathways and community connections]

---

**🔖 Appendix A: Resource and Visual Asset Directory**

All assets must follow this naming convention:
**{LessonCode}_{GradeLevel}{SubjectAbbreviation}_{DescriptiveTitle}.{filetype}**

**Examples:**
* ${lessonCode}_${data.gradeLevel}${subjectAbbr}_SeedOfMePrompt.docx
* ${lessonCode}_${data.gradeLevel}${subjectAbbr}_WeatherChart.pdf
* ${lessonCode}_${data.gradeLevel}${subjectAbbr}_PeerReviewChecklist.docx
* ${lessonCode}_${data.gradeLevel}${subjectAbbr}_RitualGuidebook.pdf

**Resource Directory:**
For each referenced resource, include:
* **File name:** [Using naming convention]
* **Type:** [PDF, DOCX, PNG, etc.]
* **Description:** [Purpose and usage instructions]
* **Alt-text:** [Accessibility description for images]
* **Generation instructions:** [How to create using Canva, DALL-E, etc.]
* **Hyperlink placeholder:** [Insert link to resource]

✅ Enhanced Final Output Validation Checklist:

| Component | Required? |
| ----- | ----- |
| **Standards-Aligned** | ✅ |
| **Student-Facing Language** | ✅ |
| **Essential Question per Day** | ✅ |
| **GRR Model per Day** | ✅ |
| **STEAM Integration** | ✅ |
| **Project-Based Component** | ✅ |
| **Living Learning Lab Feature** | ✅ |
| **Trauma-Informed Practices (SAMHSA)** | ✅ |
| **MTSS Scaffolding** | ✅ |
| **Student Agency** | ✅ |
| **Multimodal Resources** | ✅ |
| **CASEL/SEL Integration** | ✅ |
| **Assessment Tools** | ✅ |
| **Facilitator Modeling** | ✅ |
| **Cultural Relevance** | ✅ |
| **Teacher Notes in Every Section** | ✅ |
| **Student Notes in Every Section** | ✅ |
| **Notes Follow Prescribed Format** | ✅ |
| **Notes Address Trauma-Informed Practice** | ✅ |
| **Notes Use Appropriate Tone/Voice** | ✅ |
| **Rootwork Framework Therapeutic Context Maintained** | ✅ |
| **Resource Naming Follows Convention** | ✅ |
| **Appendix A Generated with All Assets** | ✅ |
| **I Can Targets with DOK Levels** | ✅ |
| **5 Rs Time Allocation** | ✅ |
| **Bloom's Taxonomy Alignment** | ✅ |
| **Accommodation Categories (504, Gifted, SPED)** | ✅ |
| **Co-teaching Model Integration** | ✅ |

🧠 CRITICAL LLM Behavioral Constraints:

1. **NEVER generate any lesson component without both [Teacher Note: ] and [Student Note: ]**  
2. **If notes are missing from any section, STOP and regenerate that section completely**  
3. **Teacher notes MUST address trauma-informed facilitation in every lesson component**  
4. **Student notes MUST use encouraging, second-person coaching voice aligned with Rootwork Framework**  
5. **Notes appear BEFORE MTSS supports in each section**  
6. **Every lesson day must include all GRR components: Opening, I Do, We Do, You Do Together, You Do Alone, Closing**
7. **All accommodation categories must be specifically addressed: Tier 1-3, 504, Gifted, SPED**
8. **Resource naming convention must be followed exactly for all referenced materials**
9. **Appendix A must catalog every resource mentioned in the lesson**
10. **Maintain therapeutic context and healing-centered approach throughout all components**

**🛑 FINAL GENERATION PROTOCOL:**
1. Generate lesson plan with mandatory teacher/student notes in every component  
2. Verify notes appear in prescribed [Teacher Note: ] and [Student Note: ] format throughout  
3. Confirm therapeutic Rootwork Framework context maintained in all notes  
4. Run final check ensuring no component lacks both note types  
5. Validate that all accommodation categories are specifically addressed
6. Confirm resource naming convention is followed
7. Verify Appendix A includes all referenced materials
8. Only output complete lesson if ALL validation criteria met, including note requirements

**Generate the complete ${numberOfDays}-day lesson plan now, ensuring every component above is addressed systematically.**
`.trim();
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

// Build comprehensive fallback with master prompt structure
function buildMasterPromptFallback(data: MasterPromptRequest): string {
  const numberOfDays = parseInt(data.numberOfDays || '3');
  const durationMinutes = parseInt(data.duration?.match(/\d+/)?.[0] || '90');
  const lessonCode = `RootedIn${data.topic.replace(/[^a-zA-Z]/g, '')}`;
  const subjectAbbr = getSubjectAbbreviation(data.subject);
  
  return `
# TRAUMA-INFORMED STEAM LESSON PLAN
**Grade:** ${data.gradeLevel}  
**Duration:** ${data.duration} per day  
**Location:** ${data.location || 'Savannah, Georgia'}  
**Unit Title:** Rooted in Understanding: ${data.topic} Through Root Work Framework

---

${Array.from({length: numberOfDays}, (_, dayIndex) => `
## **DAY ${dayIndex + 1}: Exploring ${data.topic} - Foundation Building**

### **Essential Question:**
How does understanding ${data.topic} help us grow as learners and community members?

### **Learning Target:**
I can demonstrate understanding of ${data.topic} while building connections to my community and personal growth (DOK 3)

### **Standards (${data.subject} - Grade ${data.gradeLevel}):**
* **Core Standard** – Students analyze and apply concepts related to ${data.topic}
* **SEL Alignment** – CASEL: Self-Awareness, Social Awareness, Relationship Skills

### **Root Work Framework 5 Rs Lesson Structure:**

**🤝 RELATIONSHIPS (${Math.round(durationMinutes * 0.15)} minutes)**  
*Building Community and Belonging*
Community circle with breathing exercise and intention setting related to ${data.topic}
[Teacher Note: Use consistent trauma-informed opening to establish safety and predictability for all learners while honoring cultural approaches to community building]
[Student Note: This is your time to ground yourself, connect with classmates, and set positive intentions for learning together]

**📋 ROUTINES (${Math.round(durationMinutes * 0.1)} minutes)**  
*Establishing Predictable Structure*
Clear agenda review, success criteria sharing, and materials preparation with visual supports
[Teacher Note: Provide predictable structure that reduces anxiety and builds executive function skills for all learners]
[Student Note: Use this time to organize yourself, understand expectations, and see what success looks like today]

**🌍 RELEVANCE (${Math.round(durationMinutes * 0.25)} minutes)**  
*Connecting to Lived Experience and Community*
Students explore connections between ${data.topic} and their personal experiences, families, and community using choice-based sharing formats
[Teacher Note: Draw explicit connections between academic content and student cultural assets, honoring diverse backgrounds and experiences]
[Student Note: Share your authentic experiences and discover how they connect to our learning - your knowledge matters]

**📚 RIGOR (${Math.round(durationMinutes * 0.35)} minutes)**  
*Engaging in Challenging, Scaffolded Learning*
**Teacher Modeling:** Demonstration of key concepts about ${data.topic} using think-aloud and culturally relevant examples
[Teacher Note: Make explicit connections to student experiences while modeling complex thinking processes]
[Student Note: Listen for connections to your own life and notice the strategies being demonstrated]

**Collaborative Practice:** Students work in partnerships to explore ${data.topic} using guided inquiry protocols
[Teacher Note: Circulate to provide just-right scaffolding while honoring student thinking processes and cultural approaches to collaboration]
[Student Note: Share your ideas openly, build on your partner's thinking, and ask questions when you need support]

**Individual Application:** Choice-based demonstration of understanding through visual, written, or creative expression
[Teacher Note: Offer multiple pathways for expression to honor different learning styles, cultural backgrounds, and abilities]
[Student Note: Choose the format that best allows you to show your learning and demonstrate your unique strengths]

**🤔 REFLECTION (${Math.round(durationMinutes * 0.15)} minutes)**  
*Metacognitive Processing and Growth Recognition*
Individual journal reflection connecting ${data.topic} to personal experience, followed by circle sharing of one connection and one question for tomorrow
[Teacher Note: Support students who need additional processing time while using restorative circle practices to build community]
[Student Note: Be honest about your learning journey and take time to appreciate your growth and that of your classmates]

---

**MTSS Tiered Supports:**
* **Tier 1 (Universal):** Visual supports, choice in expression format, clear success criteria, collaborative options
* **Tier 2 (Targeted):** Graphic organizers, extended processing time, guided practice with teacher check-ins
* **Tier 3 (Intensive):** One-on-one conferencing, modified expectations, alternative assessment formats
* **504 Accommodations:** Extended time, preferential seating, frequent breaks, assistive technology access
* **Gifted Extensions:** Independent research projects, mentorship opportunities, leadership roles
* **SPED Modifications:** Simplified language, visual schedules, sensory supports, individualized goals

**SEL Competencies Addressed:**
CASEL domains integrated through community building, self-reflection, and collaborative problem-solving

**Regulation Rituals:**
Morning breathing circle, mindful transitions, calm corner access, end-of-day appreciations

**Assessment:**
* **Formative:** Exit tickets, journal reflections, peer feedback, teacher observation
* **Summative:** Choice-based demonstration of learning with rubric evaluation

**I Can Targets with DOK Levels:**
* I can explain key concepts about ${data.topic} using academic and community language (DOK 2)
* I can apply understanding of ${data.topic} to real situations in my life or community (DOK 3)
* I can reflect on my learning process and identify strategies that help me grow (DOK 4)

**5 Rs Framework Integration:**
* **Relationships:** ${Math.round(durationMinutes * 0.15)} minutes - Community building and belonging establishment
* **Routines:** ${Math.round(durationMinutes * 0.1)} minutes - Predictable structure and safety creation
* **Relevance:** ${Math.round(durationMinutes * 0.25)} minutes - Personal and community connection building
* **Rigor:** ${Math.round(durationMinutes * 0.35)} minutes - Scaffolded academic challenge with multiple access points
* **Reflection:** ${Math.round(durationMinutes * 0.15)} minutes - Metacognitive processing and growth recognition

**Bloom's Taxonomy Alignment:**
* **Remember:** Identify key terms and concepts related to ${data.topic} - Builds foundational knowledge
* **Understand:** Explain concepts in your own words - Ensures comprehension before application
* **Apply:** Use understanding in new situations - Makes learning relevant and transferable
* **Analyze:** Compare different approaches to ${data.topic} - Develops critical thinking skills
* **Evaluate:** Assess the effectiveness of different strategies - Builds judgment and reasoning
* **Create:** Design new solutions or expressions - Synthesizes learning into original work

**STEAM Integration:**
* **Science:** Investigation and hypothesis testing related to ${data.topic}
* **Technology:** Digital tools for research, creation, and collaboration
* **Engineering:** Design thinking and problem-solving processes
* **Arts:** Creative expression and cultural storytelling
* **Mathematics:** Data analysis, patterns, and quantitative reasoning

**Trauma-Informed Care (SAMHSA 6 Principles):**
* **Safety:** Predictable routines, clear expectations, calm learning environment
* **Trustworthiness:** Consistent follow-through, transparent communication
* **Peer Support:** Collaborative learning, peer mentoring, community building
* **Collaboration:** Shared decision-making, student voice in learning choices
* **Empowerment:** Student agency, strength-based approach, growth mindset
* **Cultural Responsiveness:** Asset-based view of student backgrounds and experiences

**Co-Teaching Integration:**
* **Model:** Station Teaching with differentiated content and support levels
* **Roles:** Lead teacher facilitates whole group, co-teacher provides targeted small group support
* **Grouping:** Flexible, data-informed groups with attention to social dynamics and learning needs

**Extension Opportunities:**
Community interviews, digital storytelling, place-based field investigations, family knowledge sharing
`).join('\n')}

---

## **🔖 Appendix A: Resource and Visual Asset Directory**

**Naming Convention:** ${lessonCode}_${data.gradeLevel}${subjectAbbr}_[DescriptiveTitle].[filetype]

**Generated Resources:**

1. **${lessonCode}_${data.gradeLevel}${subjectAbbr}_SeedOfMePrompt.docx**
   - **Type:** Student worksheet (DOCX)
   - **Description:** Guided reflection prompts for personal connection to ${data.topic}
   - **Alt-text:** Worksheet with journal prompts and reflection questions
   - **Generation instructions:** Create in Google Docs with Root Work Framework header
   - **Hyperlink placeholder:** [Insert link to worksheet]

2. **${lessonCode}_${data.gradeLevel}${subjectAbbr}_WeatherChart.pdf**
   - **Type:** Visual aid (PDF)
   - **Description:** Emotional regulation tool for daily check-ins
   - **Alt-text:** Chart showing weather symbols connected to emotional states
   - **Generation instructions:** Design in Canva with accessible color contrast
   - **Hyperlink placeholder:** [Insert link to weather chart]

3. **${lessonCode}_${data.gradeLevel}${subjectAbbr}_PeerReviewChecklist.docx**
   - **Type:** Assessment tool (DOCX)
   - **Description:** Structured peer feedback form for collaborative work
   - **Alt-text:** Checklist with criteria for giving constructive feedback
   - **Generation instructions:** Create table format in Google Docs
   - **Hyperlink placeholder:** [Insert link to peer review form]

4. **${lessonCode}_${data.gradeLevel}${subjectAbbr}_RitualGuidebook.pdf**
   - **Type:** Reference guide (PDF)
   - **Description:** Trauma-informed regulation practices for classroom use
   - **Alt-text:** Guide with breathing exercises and mindfulness activities
   - **Generation instructions:** Format in Google Docs, export as PDF
   - **Hyperlink placeholder:** [Insert link to ritual guide]

*Generated by Root Work Framework — Trauma-informed, regenerative learning ecosystem*
*Created: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}*
`;
}

// Validate lesson plan contains required components
function validateLessonPlan(content: string, data: MasterPromptRequest): {isValid: boolean, missingComponents: string[]} {
  const missing: string[] = [];
  
  // Check for mandatory teacher/student notes
  const teacherNoteCount = (content.match(/\[Teacher Note:/g) || []).length;
  const studentNoteCount = (content.match(/\[Student Note:/g) || []).length;
  const expectedNotes = parseInt(data.numberOfDays || '3') * 6; // 6 components per day minimum
  
  if (teacherNoteCount < expectedNotes) missing.push(`Teacher Notes (found ${teacherNoteCount}, need ${expectedNotes})`);
  if (studentNoteCount < expectedNotes) missing.push(`Student Notes (found ${studentNoteCount}, need ${expectedNotes})`);
  
  // Check for required 5 Rs structural components
  if (!content.includes('🤝 RELATIONSHIPS')) missing.push('Relationships R Component');
  if (!content.includes('📋 ROUTINES')) missing.push('Routines R Component');
  if (!content.includes('🌍 RELEVANCE')) missing.push('Relevance R Component');
  if (!content.includes('📚 RIGOR')) missing.push('Rigor R Component');
  if (!content.includes('🤔 REFLECTION')) missing.push('Reflection R Component');
  if (!content.includes('Essential Question:')) missing.push('Essential Questions');
  if (!content.includes('I can ')) missing.push('I Can Targets');
  if (!content.includes('DOK ')) missing.push('DOK Levels');
  if (!content.includes('Tier 1')) missing.push('MTSS Tier 1 Supports');
  if (!content.includes('Tier 2')) missing.push('MTSS Tier 2 Supports');
  if (!content.includes('Tier 3')) missing.push('MTSS Tier 3 Supports');
  if (!content.includes('504 Accommodations')) missing.push('504 Accommodations');
  if (!content.includes('Gifted')) missing.push('Gifted Extensions');
  if (!content.includes('SPED')) missing.push('SPED Modifications');
  if (!content.includes('STEAM Integration')) missing.push('STEAM Integration');
  if (!content.includes('SAMHSA')) missing.push('SAMHSA Trauma-Informed Principles');
  if (!content.includes("Bloom's Taxonomy")) missing.push("Bloom's Taxonomy Alignment");
  if (!content.includes('5 Rs Time Allocation')) missing.push('5 Rs Time Allocation');
  if (!content.includes('Appendix A:')) missing.push('Resource Appendix A');
  if (!content.includes('Co-Teaching')) missing.push('Co-Teaching Integration');
  
  return {
    isValid: missing.length === 0,
    missingComponents: missing
  };
}

// Main API route
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseLessonRequest(request);
    const received = parsed ?? {};
    
    const receivedKeys = Object.keys(received);
    const receivedPreview: Record<string, unknown> = {};
    for (const k of receivedKeys) {
      const v = (received as any)[k];
      receivedPreview[k] = typeof v === 'string' ? (v.length > 160 ? v.slice(0, 160) + '…' : v) : v;
    }

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
      console.error('ANTHROPIC_API_KEY is not set');
      const fallback = buildMasterPromptFallback(data);
      return okJson({ 
        lessonPlan: fallback, 
        fallback: true, 
        success: true, 
        warnings: [...warnings, 'Used structured fallback due to missing API key'],
        debug: { receivedKeys, receivedPreview } 
      });
    }

    const prompt = buildMasterPrompt(data);
    
    console.log('Generating master prompt lesson plan...');
    console.log('Prompt length:', prompt.length);

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 8000, // Maximum for comprehensive lessons
        temperature: 0.2, // Lower for more consistent structure
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!resp.ok) {
      const errorText = await resp.text().catch(() => '');
      console.error('Anthropic API error:', resp.status, resp.statusText, errorText);
      const fallback = buildMasterPromptFallback(data);
      return okJson({ 
        lessonPlan: fallback, 
        fallback: true, 
        success: true, 
        warnings: [...warnings, `API error ${resp.status}, used structured fallback`],
        debug: { receivedKeys, receivedPreview } 
      });
    }

    const payload = await resp.json();
    let lessonContent = '';

    if (Array.isArray(payload?.content) && payload.content[0]?.type === 'text') {
      lessonContent = String(payload.content[0].text || '');
    } else if (typeof payload?.content?.[0] === 'object' && 'text' in payload.content[0]) {
      lessonContent = String(payload.content[0].text || '');
    } else if (typeof payload?.content === 'string') {
      lessonContent = payload.content;
    }

    lessonContent = lessonContent.replace(/```markdown\s*/gi, '').replace(/```\s*$/gi, '').trim();

    if (!lessonContent || lessonContent.length < 2000) {
      console.error('Generated content too short:', lessonContent.length, 'characters');
      const fallback = buildMasterPromptFallback(data);
      return okJson({ 
        lessonPlan: fallback, 
        fallback: true, 
        success: true, 
        warnings: [...warnings, 'Generated content too short, used structured fallback'],
        debug: { receivedKeys, receivedPreview, contentLength: lessonContent.length } 
      });
    }

    // Validate lesson plan contains required components
    const validation = validateLessonPlan(lessonContent, data);
    if (!validation.isValid) {
      console.warn('Generated lesson missing components:', validation.missingComponents);
      warnings.push(`Missing components: ${validation.missingComponents.join(', ')}`);
      
      // If critical components are missing, use fallback
      if (validation.missingComponents.length > 5) {
        const fallback = buildMasterPromptFallback(data);
        return okJson({ 
          lessonPlan: fallback, 
          fallback: true, 
          success: true, 
          warnings: [...warnings, 'Too many missing components, used structured fallback'],
          debug: { receivedKeys, receivedPreview, missingComponents: validation.missingComponents } 
        });
      }
    }

    console.log('Successfully generated master prompt lesson plan:', lessonContent.length, 'characters');
    console.log('Validation status:', validation.isValid ? 'PASSED' : `PARTIAL (missing: ${validation.missingComponents.join(', ')})`);

    return okJson({ 
      lessonPlan: lessonContent, 
      success: true, 
      warnings,
      validation: validation,
      debug: { receivedKeys, receivedPreview, contentLength: lessonContent.length }
    });

  } catch (err) {
    console.error('API Error:', err);
    
    const fallbackData: MasterPromptRequest = {
      subject: 'General Studies',
      gradeLevel: '6',
      topic: 'Learning Together',
      duration: '90 minutes',
      numberOfDays: '3'
    };
    
    const fallback = buildMasterPromptFallback(fallbackData);
    return okJson({ 
      lessonPlan: fallback,
      fallback: true,
      success: true,
      warnings: ['Emergency fallback due to system error'],
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}
