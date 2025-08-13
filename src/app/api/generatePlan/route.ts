// src/app/api/generatePlan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = ['iad1'];
export const maxDuration = 60;

const ROUTE_ID = 'generatePlan-v8-anthropic-2025-08-12-unique';

// Lesson plan specific configuration for unique bundling
const LESSON_PLAN_CONFIG = {
  maxDays: 5,
  gradeRanges: ['K-2', '3-5', '6-8', '9-12'],
  instructionalFrameworks: ['GRR', 'PBL', 'STEAM', 'MTSS', 'CASEL'],
  generator: 'lesson-plan-generator-v8'
};

// Incoming payload (may be partial/optional)
type GeneratePlanInput = {
  gradeLevel?: string;
  subjects?: string[];
  duration?: number;
  unitTitle?: string;
  standards?: string;
  focus?: string;
  
  subject?: string;
  durationMinutes?: number;
  topic?: string;
  days?: number;

  brandName?: string;
  includeAppendix?: boolean;
  includeRubrics?: boolean;
  includeAssetsDirectory?: boolean;

  userPrompt?: string;
};

// Fully normalized, non-optional version (safe to use everywhere)
type NormalizedInput = {
  gradeLevel: string;
  subjects: string[];
  duration: number;
  unitTitle: string;
  standards: string;
  focus: string;
  days: number;
  brandName: string;
  includeAppendix: boolean;
  includeRubrics: boolean;
  includeAssetsDirectory: boolean;
  userPrompt: string;
};

type LessonPlanJSON = {
  meta: {
    title: string;
    subtitle?: string;
    gradeLevel: string;
    subject: string;
    days: number;
    durationMinutes: number;
    essentialQuestion: string;
    standards: string[];
  };
  days: Array<{
    day: number;
    title: string;
    learningTarget: string;
    essentialQuestion: string;
    standards: string[];
    flow: {
      opening: { minutes: number; activity: string; teacherNote: string; studentNote: string };
      iDo: { minutes: number; activity: string; teacherNote: string; studentNote: string };
      weDo: { minutes: number; activity: string; teacherNote: string; studentNote: string };
      youDoTogether: { minutes: number; activity: string; teacherNote: string; studentNote: string };
      youDoAlone: { minutes: number; activity: string; teacherNote: string; studentNote: string };
      closing: { minutes: number; activity: string; teacherNote: string; studentNote: string };
    };
    mtss: {
      tier1: string[];
      tier2: string[];
      tier3: string[];
    };
    selCompetencies: string[];
    regulationRituals: string[];
    assessment: {
      formative: string[];
      summative?: string[];
    };
    resources: string[];
  }>;
  appendixA?: {
    assets: Array<{
      fileName: string;
      type: 'image' | 'pdf' | 'docx' | 'sheet' | 'link';
      description: string;
      altText?: string;
      howToGenerate?: string;
      linkPlaceholder?: string;
      figure?: string;
    }>;
    namingConvention: string;
  };
  markdown?: string;
};

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Lesson plan specific validation function
function validateLessonPlanStructure(plan: any): boolean {
  return !!(plan?.meta?.title && plan?.days?.length && plan?.days[0]?.flow);
}

function safeParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function normalizeInput(body: GeneratePlanInput | null): NormalizedInput {
  const days = Math.min(Math.max(body?.days ?? body?.duration ?? 3, 1), LESSON_PLAN_CONFIG.maxDays);
  
  return {
    gradeLevel: body?.gradeLevel ?? '10th Grade',
    subjects: body?.subjects ?? [body?.subject ?? 'English Language Arts'],
    duration: days,
    unitTitle: body?.unitTitle ?? body?.topic ?? 'Rooted in Me: Exploring Culture, Identity, and Expression',
    standards: body?.standards ?? 'Please align with relevant standards (CCSS/NGSS/etc.)',
    focus: body?.focus ?? 'None specified',
    days,
    brandName: body?.brandName ?? 'Root Work Framework',
    includeAppendix: body?.includeAppendix ?? true,
    includeRubrics: body?.includeRubrics ?? true,
    includeAssetsDirectory: body?.includeAssetsDirectory ?? true,
    userPrompt: body?.userPrompt ?? '',
  };
}

// Function to generate comprehensive markdown from structured plan
function generateComprehensiveMarkdown(plan: LessonPlanJSON): string {
  const { meta, days, appendixA } = plan;
  
  let markdown = `# ${meta.title}

*${meta.subtitle || 'Root Work Framework: S.T.E.A.M. Powered, Trauma Informed, Project Based'}*

## Unit Overview

**Grade Level:** ${meta.gradeLevel}  
**Subject(s):** ${meta.subject}  
**Duration:** ${meta.days} days (${meta.durationMinutes} minutes per day)  
**Essential Question:** ${meta.essentialQuestion}  
**Standards:** ${meta.standards.join(', ')}  

---

## Daily Lesson Plans

`;

  // Generate each day's comprehensive plan
  days.forEach((day, index) => {
    markdown += `### Day ${day.day}: ${day.title}

**Learning Target:** ${day.learningTarget}  
**Essential Question:** ${day.essentialQuestion}  
**Standards:** ${day.standards.join(', ')}  

${day.flow.opening.teacherNote}
${day.flow.opening.studentNote}

#### Daily Flow (${meta.durationMinutes} minutes total)

**Opening (${day.flow.opening.minutes} minutes)**
- **Activity:** ${day.flow.opening.activity}
- ${day.flow.opening.teacherNote}
- ${day.flow.opening.studentNote}

**I Do - Direct Instruction (${day.flow.iDo.minutes} minutes)**
- **Activity:** ${day.flow.iDo.activity}
- ${day.flow.iDo.teacherNote}
- ${day.flow.iDo.studentNote}

**We Do - Guided Practice (${day.flow.weDo.minutes} minutes)**
- **Activity:** ${day.flow.weDo.activity}
- ${day.flow.weDo.teacherNote}
- ${day.flow.weDo.studentNote}

**You Do Together - Collaborative Work (${day.flow.youDoTogether.minutes} minutes)**
- **Activity:** ${day.flow.youDoTogether.activity}
- ${day.flow.youDoTogether.teacherNote}
- ${day.flow.youDoTogether.studentNote}

**You Do Alone - Independent Practice (${day.flow.youDoAlone.minutes} minutes)**
- **Activity:** ${day.flow.youDoAlone.activity}
- ${day.flow.youDoAlone.teacherNote}
- ${day.flow.youDoAlone.studentNote}

**Closing (${day.flow.closing.minutes} minutes)**
- **Activity:** ${day.flow.closing.activity}
- ${day.flow.closing.teacherNote}
- ${day.flow.closing.studentNote}

#### MTSS Support Strategies

**Tier 1 (Universal Supports):**
${day.mtss.tier1.map(item => `- ${item}`).join('\n')}

**Tier 2 (Targeted Supports):**
${day.mtss.tier2.map(item => `- ${item}`).join('\n')}

**Tier 3 (Intensive Supports):**
${day.mtss.tier3.map(item => `- ${item}`).join('\n')}

#### SEL Competencies
${day.selCompetencies.map(comp => `- ${comp}`).join('\n')}

#### Regulation Rituals
${day.regulationRituals.map(ritual => `- ${ritual}`).join('\n')}

#### Assessment

**Formative Assessment:**
${day.assessment.formative.map(item => `- ${item}`).join('\n')}

${day.assessment.summative ? `**Summative Assessment:**
${day.assessment.summative.map(item => `- ${item}`).join('\n')}` : ''}

#### Required Resources
${day.resources.map(resource => `- ${resource}`).join('\n')}

---

`;
  });

  // Add appendix if present
  if (appendixA && appendixA.assets.length > 0) {
    markdown += `## Appendix A: Resource and Visual Asset Directory

**Naming Convention:** ${appendixA.namingConvention}

`;

    appendixA.assets.forEach((asset, index) => {
      markdown += `### ${asset.figure || `Asset ${index + 1}`}: ${asset.fileName}

**Type:** ${asset.type}  
**Description:** ${asset.description}  
${asset.altText ? `**Alt Text:** ${asset.altText}  ` : ''}
${asset.howToGenerate ? `**How to Generate:** ${asset.howToGenerate}  ` : ''}
${asset.linkPlaceholder ? `**Link:** ${asset.linkPlaceholder}  ` : ''}

`;
    });
  }

  return markdown;
}

// Guaranteed non-empty plan if model fails
function fallbackPlan(input: NormalizedInput): LessonPlanJSON {
  const mkStep = (label: string) => ({
    minutes: Math.round(90 / 6),
    activity: `${label}: Comprehensive ${label.toLowerCase()} activities with trauma-informed approaches and student choice.`,
    teacherNote: '[Teacher Note: Use choice, maintain calm presence, offer multiple pathways, celebrate progress. Monitor for regulation needs and provide trauma-informed supports.]',
    studentNote: '[Student Note: You belong here. Take your time, ask questions, and trust your learning process. Your voice and experiences matter in this space.]',
  });

  const dayBlock = (day: number) => ({
    day,
    title: `${input.unitTitle} — Day ${day}`,
    learningTarget: `Students will demonstrate understanding through culturally responsive, trauma-informed learning experiences that honor their identities.`,
    essentialQuestion: input.focus || 'How do we learn in ways that honor our identities and experiences while building community?',
    standards: [input.standards || 'Relevant state standards'],
    flow: {
      opening: mkStep('Opening Circle & Grounding'),
      iDo: mkStep('Culturally Responsive Direct Instruction'),
      weDo: mkStep('Collaborative Exploration'),
      youDoTogether: mkStep('Community Learning'),
      youDoAlone: mkStep('Independent Expression'),
      closing: mkStep('Reflection & Community Building'),
    },
    mtss: {
      tier1: ['Clear visual agenda with choice options', 'Multiple representation modes', 'Built-in movement breaks', 'Regulation rituals embedded'],
      tier2: ['Small group facilitation with trauma-informed approaches', 'Extended processing time', 'Graphic organizers', 'Peer partnerships and mentoring'],
      tier3: ['Individualized supports and accommodations', 'Alternative assessment formats', 'One-on-one conferencing', 'Assistive technology and modified expectations'],
    },
    selCompetencies: ['Self-Awareness through cultural identity exploration', 'Self-Management via regulation rituals', 'Social Awareness through community building', 'Relationship Skills in collaborative work', 'Responsible Decision-Making in student choice'],
    regulationRituals: ['Mindful breathing with garden metaphors', 'Grounding techniques using nature elements', 'Movement breaks with purpose', 'Community agreements and check-ins'],
    assessment: { 
      formative: ['Exit tickets with choice in expression', 'Peer feedback circles', 'Self-reflection journals', 'Teacher observation with trauma-informed lens'],
      summative: ['Portfolio presentation with cultural connections', 'Project showcase with community audience', 'Reflective essay or multimedia expression']
    },
    resources: ['Diverse texts and materials representing multiple perspectives', 'Technology tools with accessibility features', 'Art supplies for creative expression', 'Community resources and guest speakers'],
  });

  const plan: LessonPlanJSON = {
    meta: {
      title: `${input.unitTitle}`,
      subtitle: 'Root Work Framework: S.T.E.A.M. Powered, Trauma Informed, Project Based',
      gradeLevel: input.gradeLevel,
      subject: input.subjects.join(', '),
      days: input.days,
      durationMinutes: 90,
      essentialQuestion: 'How can we design learning that heals, includes, and empowers every student while honoring their cultural identities?',
      standards: [input.standards],
    },
    days: Array.from({ length: input.days }, (_, i) => dayBlock(i + 1)),
    appendixA: {
      namingConvention: '{LessonCode}_{GradeLevel}{SubjectAbbreviation}_{DescriptiveTitle}.{filetype}',
      assets: [
        {
          fileName: 'RootedInMe_CulturalIdentity_ReflectionGuide.pdf',
          type: 'pdf',
          description: 'Student reflection guide for exploring cultural identity and personal narratives with trauma-informed prompts.',
          altText: 'Colorful reflection guide with diverse student artwork and nature motifs',
          howToGenerate: 'Create in Canva using diverse imagery, accessible fonts, and trauma-informed language. Include regulation ritual reminders.',
          linkPlaceholder: '[Insert link to RootedInMe_CulturalIdentity_ReflectionGuide.pdf]',
          figure: 'Figure 1',
        },
        {
          fileName: 'RootedInMe_RegulationRituals_GuidePoster.png',
          type: 'image',
          description: 'Visual poster showing garden-based regulation techniques for classroom display.',
          altText: 'Poster with illustrations of breathing techniques using plant and garden metaphors',
          howToGenerate: 'Use DALL-E 3 with prompt: "Educational poster showing mindfulness techniques using garden metaphors, with diverse children practicing breathing exercises, colorful and calming design"',
          linkPlaceholder: '[Insert link to RootedInMe_RegulationRituals_GuidePoster.png]',
          figure: 'Figure 2',
        },
      ],
    },
  };

  return plan;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { ok: false, routeId: ROUTE_ID, error: 'Missing ANTHROPIC_API_KEY' },
        { status: 500 },
      );
    }

    const body = (await req.json().catch(() => null)) as GeneratePlanInput | null;
    const input = normalizeInput(body);

    // Your comprehensive master prompt
    const masterPrompt = `REFINED MASTER LLM PROMPT for Trauma-Informed STEAM Lesson Plan Generator with Mandatory Teacher & Student Notes

🧑‍🏫 Persona to Assume: You are an expert curriculum designer with 20+ years of experience in:
K–12 education (general and special education)
Project-Based Learning (PBL)
Trauma-Informed Care (TIC) in schools
Living Learning Labs (LLLs) and STEAM integration
CASEL-aligned Social Emotional Learning (SEL)
MTSS design and classroom regulation
Student agency and equity-centered pedagogy

You are also familiar with the book From Garden to Growth and its frameworks, including:
Table 1.1: "Foundations of Trauma-Informed Pedagogy"
Figure 1.3: "Regulation Rituals in Garden-Based Learning"
Table 2.1: "Cultural Anchoring in Learning Design"
Figure 2.3: "The Garden-Based Regulation Protocol"
The Trauma-Informed STEAM Lesson Design Rubric
The STEAM-PBL Unit Planner for LLLs
The Trauma-Responsive PBL Unit Template
The Trauma-Informed PBL Implementation Rubric

Your lesson plans are meticulously crafted to include essential components such as Opening, Mini-Lesson, Work Session, and Closing. You incorporate deconstructed State Standards and formulate essential questions at varying Depths of Knowledge (DOK) levels. Each lesson plan is detailed with daily learning targets, ensuring clarity and purpose. You also specialize in integrating environmental sustainability and gardening elements into these plans. Your approach includes providing clear and engaging teacher scripts, a variety of project options, and the inclusion of social-emotional learning components.

🎯 MANDATORY TEACHER & STUDENT NOTES PROTOCOL: Every lesson component MUST include both note types in this exact format:

Teacher Notes Format:
Appear as [Teacher Note: ] immediately after each activity description
Include: pedagogical rationale, trauma-informed considerations, differentiation strategies, assessment insights, Rootwork Framework connections
Tone: Professional, supportive mentor to colleague
Length: 1-3 sentences maximum
Must address therapeutic context and trauma-informed facilitation

Student Notes Format:
Appear as [Student Note: ] immediately after teacher notes
Include: coaching language, success strategies, self-advocacy prompts, growth mindset reinforcement, connection to personal growth
Tone: Warm, empowering, second-person voice aligned with Rootwork Framework
Length: 1-2 sentences maximum
Must support student agency and emotional regulation

Placement Rules:
Notes appear immediately after activity descriptions, before MTSS supports
Both note types required for every major lesson component (Opening, I Do, We Do, You Do Together, You Do Alone, Closing)
No lesson component may be generated without both note types
Notes must maintain therapeutic Rootwork Framework context throughout

🎯 Objective: Generate a ${input.days}-day, student-facing lesson plan that integrates:
Trauma-informed care (SAMHSA 6 Principles)
STEAM and Project-Based Learning
Living Learning Lab methodology
CASEL SEL competencies
MTSS scaffolding
Student agency and differentiated learning modalities
Gradual Release of Responsibility (GRR)

**LESSON PARAMETERS:**
- Grade Level: ${input.gradeLevel}
- Subject(s): ${input.subjects.join(', ')}
- Unit Title: ${input.unitTitle}
- Standards: ${input.standards}
- Additional Focus: ${input.focus}
- Duration: ${input.days} days (90 minutes per day)

🧾 MANDATORY Output Format - Each Component Required:

For each lesson day, provide in this exact order:

HEADER SECTION:
Day #, Lesson Title, Essential Question, Learning Target, Standards
[Teacher Note: Pedagogical context for this lesson's objectives and trauma-informed considerations]
[Student Note: What you're building toward and why it matters for your growth]

STRUCTURED LESSON FLOW:
Opening (X minutes)
Activity description with specific instructions
[Teacher Note: Facilitation tips, trauma-informed considerations, and Rootwork Framework connections]
[Student Note: Coaching language for engagement and self-regulation strategies]

I Do: Direct Instruction (X minutes)
Content and modeling description
[Teacher Note: Key teaching points, differentiation strategies, and therapeutic facilitation approaches]
[Student Note: What to focus on during instruction and how this builds your skills]

Work Session (X minutes)
We Do: Collaborative exploration or modeling
Activity description
[Teacher Note: Scaffolding tips and trauma-informed group facilitation]
[Student Note: Success strategies and collaboration expectations]

You Do Together: Partner or small group task
Activity description
[Teacher Note: Monitoring guidance and support indicators]
[Student Note: Partnership strategies and self-advocacy reminders]

You Do Alone: Independent work or reflection
Activity description
[Teacher Note: Individual support strategies and regulation monitoring]
[Student Note: Self-management strategies and growth mindset reinforcement]

Closing (X minutes)
Activity description with reflection components
[Teacher Note: Assessment insights, next steps, and trauma-informed closure]
[Student Note: Reflection prompts and growth recognition strategies]

Additional Required Sections Per Day:
Student-facing instructions and scaffolds
Facilitator modeling guidance
MTSS tiered supports (Tier 1–3)
SEL competencies addressed
Regulation rituals (referencing Figure 2.3 where applicable)
Choices for student expression
Multimedia integration: embed or link video, Flipgrid, Canva, etc.
Clear formative or summative assessment tasks
Reflection or peer feedback mechanisms
Optional extension or enrichment opportunities

🔍 MANDATORY NOTES QUALITY CHECK: Before finalizing any lesson component, verify it contains:
[Teacher Note: ] with specific pedagogical guidance addressing trauma-informed practice
[Student Note: ] with encouraging coaching language supporting student agency
Both notes align with Rootwork Framework therapeutic principles
Notes address the healing-centered educational context appropriately
If ANY component lacks both note types, regenerate entire lesson component

**CRITICAL OUTPUT REQUIREMENT:**
Respond with ONLY a valid JSON object using this exact structure:

{
  "meta": {
    "title": "${input.unitTitle}",
    "subtitle": "Root Work Framework: S.T.E.A.M. Powered, Trauma Informed, Project Based",
    "gradeLevel": "${input.gradeLevel}",
    "subject": "${input.subjects.join(', ')}",
    "days": ${input.days},
    "durationMinutes": 90,
    "essentialQuestion": "string - thought-provoking question connecting to identity/community and trauma-informed healing",
    "standards": ["${input.standards}"]
  },
  "days": [
    {
      "day": 1,
      "title": "string - engaging, culturally responsive title",
      "learningTarget": "string - clear, asset-based learning target with trauma-informed language",
      "essentialQuestion": "string - connects to larger essential question and healing-centered approach",
      "standards": ["string"],
      "flow": {
        "opening": {
          "minutes": 15,
          "activity": "string - detailed community building/grounding activity with regulation rituals",
          "teacherNote": "[Teacher Note: Specific trauma-informed facilitation guidance and Rootwork Framework connections]",
          "studentNote": "[Student Note: Empowering, asset-based coaching language for engagement and self-regulation]"
        },
        "iDo": {
          "minutes": 20,
          "activity": "string - detailed culturally responsive direct instruction with STEAM integration",
          "teacherNote": "[Teacher Note: Key teaching points, differentiation strategies, and therapeutic facilitation approaches]",
          "studentNote": "[Student Note: What to focus on during instruction and how this builds your skills and identity]"
        },
        "weDo": {
          "minutes": 25,
          "activity": "string - detailed collaborative guided practice with trauma-informed group work",
          "teacherNote": "[Teacher Note: Scaffolding tips, trauma-informed group facilitation, and cultural responsiveness]",
          "studentNote": "[Student Note: Success strategies, collaboration expectations, and community building]"
        },
        "youDoTogether": {
          "minutes": 20,
          "activity": "string - detailed peer collaboration with cultural connections and choice",
          "teacherNote": "[Teacher Note: Monitoring guidance, support indicators, and trauma-informed partnerships]",
          "studentNote": "[Student Note: Partnership strategies, self-advocacy reminders, and peer support]"
        },
        "youDoAlone": {
          "minutes": 15,
          "activity": "string - detailed independent practice with choice and cultural connections",
          "teacherNote": "[Teacher Note: Individual support strategies, regulation monitoring, and asset-based feedback]",
          "studentNote": "[Student Note: Self-management strategies, growth mindset reinforcement, and identity affirmation]"
        },
        "closing": {
          "minutes": 10,
          "activity": "string - detailed reflection and community building with healing-centered closure",
          "teacherNote": "[Teacher Note: Assessment insights, next steps, trauma-informed closure, and celebration]",
          "studentNote": "[Student Note: Reflection prompts, growth recognition, and community connection]"
        }
      },
      "mtss": {
        "tier1": ["string - specific universal supports with trauma-informed approaches"],
        "tier2": ["string - specific targeted interventions with cultural responsiveness"],
        "tier3": ["string - specific intensive supports with individualized trauma-informed care"]
      },
      "selCompetencies": ["string - specific CASEL skills with trauma-informed integration"],
      "regulationRituals": ["string - specific garden-based regulation techniques from Figure 2.3"],
      "assessment": {
        "formative": ["string - specific trauma-informed formative assessment strategies"],
        "summative": ["string - specific culturally responsive summative assessment with choice"]
      },
      "resources": ["string - specific diverse, inclusive materials with trauma-informed considerations"]
    }
  ],
  "appendixA": {
    "namingConvention": "{LessonCode}_{GradeLevel}{SubjectAbbreviation}_{DescriptiveTitle}.{filetype}",
    "assets": [
      {
        "fileName": "string - specific file name following naming convention",
        "type": "pdf|image|docx|sheet|link",
        "description": "string - detailed description of asset and its trauma-informed purpose",
        "altText": "string - accessibility description with inclusive language",
        "howToGenerate": "string - specific instructions for creating asset with trauma-informed design",
        "linkPlaceholder": "string - placeholder for actual link",
        "figure": "string - figure number/reference for lesson integration"
      }
    ]
  }
}

🛑 FINAL GENERATION PROTOCOL:
Generate lesson plan with mandatory teacher/student notes in every component
Verify notes appear in prescribed [Teacher Note: ] and [Student Note: ] format throughout
Confirm therapeutic Rootwork Framework context maintained in all notes
Run final check ensuring no component lacks both note types
Validate that all notes address trauma-informed practice and student agency
Only output complete lesson if ALL validation criteria met, including note requirements

${input.userPrompt ? `\nAdditional Requirements: ${input.userPrompt}` : ''}

Generate the comprehensive trauma-informed lesson plan now, ensuring every component includes the mandatory teacher and student notes in the exact format specified.`;

    let plan: LessonPlanJSON | null = null;
    let raw = '';

    // Primary call using Claude Sonnet for better comprehension of complex requirements
    try {
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: masterPrompt
          }
        ]
      });
      
      raw = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '';
      plan = safeParse<LessonPlanJSON>(raw);
    } catch (error) {
      console.error('Claude API error:', error);
    }

    // One repair attempt if model wrapped JSON in prose
    if (!plan && raw) {
      const s = raw.indexOf('{');
      const e = raw.lastIndexOf('}');
      if (s !== -1 && e !== -1 && e > s) {
        plan = safeParse<LessonPlanJSON>(raw.slice(s, e + 1));
      }
    }

    // Last resort fallback
    if (!plan) {
      plan = fallbackPlan(input);
    }

    // Validate lesson plan structure
    if (!validateLessonPlanStructure(plan)) {
      plan = fallbackPlan(input);
    }

    // Generate comprehensive markdown from the structured plan
    plan.markdown = generateComprehensiveMarkdown(plan);

    return NextResponse.json({ 
      ok: true, 
      routeId: ROUTE_ID, 
      plan, 
      generator: LESSON_PLAN_CONFIG.generator 
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const safe = fallbackPlan(
      normalizeInput({
        gradeLevel: '10th Grade',
        subjects: ['English Language Arts'],
        unitTitle: 'Rooted in Me: Exploring Culture, Identity, and Expression',
        duration: 3,
      }),
    );
    safe.markdown = generateComprehensiveMarkdown(safe);
    
    return NextResponse.json(
      { ok: true, routeId: ROUTE_ID, plan: safe, warning: `Generator error: ${msg}` },
      { status: 200 },
    );
  }
}
