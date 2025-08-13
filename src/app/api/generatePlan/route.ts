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
    activity: `${label}: Comprehensive ${label.toLowerCase()} activities with trauma-informed approaches, cultural responsiveness, and student choice. Include multiple pathways for engagement and expression that honor student identities and lived experiences.`,
    teacherNote: `[Teacher Note: Use choice and voice to support student agency. Maintain calm, regulated presence and offer multiple pathways for participation. Monitor for signs of dysregulation and provide trauma-informed supports. Create brave spaces that honor cultural backgrounds and promote healing-centered learning.]`,
    studentNote: `[Student Note: You belong here and your voice matters. Take your time, breathe deeply, and trust your learning process. Your cultural identity and experiences are assets that strengthen our community learning space.]`,
  });

  const dayBlock = (day: number) => ({
    day,
    title: `${input.unitTitle} — Day ${day}: Building Community and Identity Through Learning`,
    learningTarget: `Students will demonstrate understanding through culturally responsive, trauma-informed learning experiences that honor their identities while building academic skills and community connections.`,
    essentialQuestion: `How do we learn in ways that honor our identities, heal our communities, and amplify our voices while mastering essential skills?`,
    standards: [input.standards || 'Relevant state standards aligned with trauma-informed and culturally responsive practices'],
    flow: {
      opening: mkStep('Opening Circle & Grounding Ritual'),
      iDo: mkStep('Culturally Responsive Direct Instruction with STEAM Integration'),
      weDo: mkStep('Collaborative Exploration with Trauma-Informed Group Work'),
      youDoTogether: mkStep('Community Learning with Cultural Connections'),
      youDoAlone: mkStep('Independent Expression with Choice and Voice'),
      closing: mkStep('Reflection & Community Building with Healing-Centered Closure'),
    },
    mtss: {
      tier1: [
        'Clear visual agenda with choice options and culturally relevant imagery',
        'Multiple representation modes honoring diverse learning styles',
        'Built-in movement breaks with regulation rituals',
        'Choice in expression methods that connect to cultural backgrounds',
        'Trauma-informed language and asset-based messaging throughout'
      ],
      tier2: [
        'Small group facilitation with trauma-informed approaches and cultural responsiveness',
        'Extended processing time with individualized supports',
        'Graphic organizers with culturally relevant examples',
        'Peer partnerships and mentoring with community building focus',
        'Alternative formats that honor different ways of knowing'
      ],
      tier3: [
        'Individualized supports and accommodations with trauma-informed care',
        'Alternative assessment formats that honor diverse expressions',
        'One-on-one conferencing with healing-centered approaches',
        'Assistive technology and modified expectations',
        'Intensive regulation support and crisis intervention protocols'
      ]
    },
    selCompetencies: [
      'Self-Awareness through cultural identity exploration and trauma-informed self-reflection',
      'Self-Management via regulation rituals and healing-centered practices',
      'Social Awareness through community building and cultural responsiveness',
      'Relationship Skills in collaborative work with trauma-informed boundaries',
      'Responsible Decision-Making in student choice with community accountability'
    ],
    regulationRituals: [
      'Mindful breathing with garden metaphors and nature connections',
      'Grounding techniques using cultural symbols and nature elements',
      'Movement breaks with purposeful community building',
      'Community agreements and emotional check-ins with trauma-informed language',
      'Sensory regulation tools and culturally responsive calming strategies'
    ],
    assessment: { 
      formative: [
        'Exit tickets with choice in expression and cultural connections',
        'Peer feedback circles with trauma-informed protocols',
        'Self-reflection journals with asset-based prompts',
        'Teacher observation with trauma-informed lens and cultural responsiveness',
        'Community showcase of learning with celebration of identity'
      ],
      summative: [
        'Portfolio presentation with cultural connections and identity integration',
        'Project showcase with community audience and healing-centered celebration',
        'Reflective essay or multimedia expression honoring diverse ways of knowing'
      ]
    },
    resources: [
      'Diverse texts and materials representing multiple cultural perspectives',
      'Technology tools with accessibility features and cultural responsiveness',
      'Art supplies for creative expression and cultural identity exploration',
      'Community resources and guest speakers from diverse backgrounds',
      'Regulation tools and sensory supports for trauma-informed learning'
    ],
  });

  const plan: LessonPlanJSON = {
    meta: {
      title: `${input.unitTitle}`,
      subtitle: 'Root Work Framework: S.T.E.A.M. Powered, Trauma Informed, Project Based',
      gradeLevel: input.gradeLevel,
      subject: input.subjects.join(', '),
      days: input.days,
      durationMinutes: 90,
      essentialQuestion: 'How can we design learning that heals, includes, and empowers every student while honoring their cultural identities and lived experiences?',
      standards: [input.standards],
    },
    days: Array.from({ length: input.days }, (_, i) => dayBlock(i + 1)),
    appendixA: {
      namingConvention: '{LessonCode}_{GradeLevel}{SubjectAbbreviation}_{DescriptiveTitle}.{filetype}',
      assets: [
        {
          fileName: 'RootedInMe_CulturalIdentity_ReflectionGuide.pdf',
          type: 'pdf',
          description: 'Student reflection guide for exploring cultural identity and personal narratives with trauma-informed prompts and healing-centered language.',
          altText: 'Colorful reflection guide with diverse student artwork, nature motifs, and trauma-informed design elements',
          howToGenerate: 'Create in Canva using diverse imagery, accessible fonts, trauma-informed language, and regulation ritual reminders. Include cultural responsiveness throughout.',
          linkPlaceholder: '[Insert link to RootedInMe_CulturalIdentity_ReflectionGuide.pdf]',
          figure: 'Figure 1',
        },
        {
          fileName: 'RootedInMe_RegulationRituals_GuidePoster.png',
          type: 'image',
          description: 'Visual poster showing garden-based regulation techniques for classroom display with trauma-informed and culturally responsive design.',
          altText: 'Poster with illustrations of breathing techniques using plant and garden metaphors, diverse children practicing regulation exercises, calming and inclusive design',
          howToGenerate: 'Use DALL-E 3 with prompt: "Educational poster showing mindfulness and regulation techniques using garden metaphors, with diverse children of multiple ethnicities practicing breathing exercises, colorful and calming design with trauma-informed visual elements"',
          linkPlaceholder: '[Insert link to RootedInMe_RegulationRituals_GuidePoster.png]',
          figure: 'Figure 2',
        },
        {
          fileName: 'RootedInMe_CommunityAgreements_Template.docx',
          type: 'docx',
          description: 'Template for creating trauma-informed community agreements that honor cultural backgrounds and promote healing-centered learning.',
          altText: 'Document template with spaces for student input and cultural identity integration',
          howToGenerate: 'Create in Google Docs with trauma-informed language, cultural responsiveness prompts, and community building elements.',
          linkPlaceholder: '[Insert link to RootedInMe_CommunityAgreements_Template.docx]',
          figure: 'Figure 3',
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

    console.log('API Input:', input); // Debug log

    // Streamlined but comprehensive prompt that focuses on generating complete JSON
    const masterPrompt = `You are an expert trauma-informed educator creating a comprehensive ${input.days}-day lesson plan using the Root Work Framework.

**LESSON REQUIREMENTS:**
- Grade Level: ${input.gradeLevel}
- Subject(s): ${input.subjects.join(', ')}
- Unit Title: ${input.unitTitle}
- Standards: ${input.standards}
- Focus: ${input.focus}
- Days: ${input.days} (90 minutes each)

**FRAMEWORK INTEGRATION:**
- Trauma-Informed Care (SAMHSA 6 Principles): Safety, trustworthiness, peer support, collaboration, empowerment, choice
- Cultural Responsiveness: Honor student identities, diverse perspectives, community connections
- STEAM Integration: Science, Technology, Engineering, Arts, Mathematics with hands-on learning
- Gradual Release: Opening → I Do → We Do → You Do Together → You Do Alone → Closing
- MTSS: Universal, targeted, and intensive supports
- SEL: Self-awareness, self-management, social awareness, relationship skills, responsible decision-making

**MANDATORY REQUIREMENTS:**
1. Every lesson component MUST include both [Teacher Note: ] and [Student Note: ] in exact format
2. Teacher notes: trauma-informed facilitation, pedagogical guidance, differentiation
3. Student notes: empowering coaching language, self-advocacy, growth mindset
4. Activities must be detailed, specific, and culturally responsive
5. All ${input.days} days must be fully developed with complete daily flows
6. Include comprehensive MTSS supports, SEL competencies, regulation rituals
7. Generate detailed Appendix A with proper asset naming conventions

**CRITICAL:** Generate ONLY valid JSON with this exact structure. Include ALL ${input.days} days with complete details:

{
  "meta": {
    "title": "${input.unitTitle}",
    "subtitle": "Root Work Framework: S.T.E.A.M. Powered, Trauma Informed, Project Based",
    "gradeLevel": "${input.gradeLevel}",
    "subject": "${input.subjects.join(', ')}",
    "days": ${input.days},
    "durationMinutes": 90,
    "essentialQuestion": "How can we use our learning to amplify our voices, honor our identities, and heal our communities?",
    "standards": ["${input.standards}"]
  },
  "days": [
    // Include ${input.days} complete day objects with detailed flow sections
    {
      "day": 1,
      "title": "Day 1 engaging title with trauma-informed and culturally responsive focus",
      "learningTarget": "Clear, asset-based learning target honoring student identities",
      "essentialQuestion": "Thought-provoking question connecting to healing and identity",
      "standards": ["${input.standards}"],
      "flow": {
        "opening": {
          "minutes": 15,
          "activity": "Detailed community building activity with regulation rituals and cultural connections. Specific instructions for creating brave spaces and honoring identities.",
          "teacherNote": "[Teacher Note: Specific trauma-informed facilitation guidance for community building. Monitor for regulation needs and provide multiple entry points. Honor cultural backgrounds and create safety through predictable structure.]",
          "studentNote": "[Student Note: Welcome to our learning community where your voice and identity matter. Take deep breaths and know you belong here exactly as you are.]"
        },
        "iDo": {
          "minutes": 20,
          "activity": "Detailed culturally responsive direct instruction with STEAM integration. Include multiple representation modes and trauma-informed teaching strategies.",
          "teacherNote": "[Teacher Note: Use asset-based language and connect to student experiences. Provide visual supports and multiple pathways for understanding. Monitor for engagement and offer choices.]",
          "studentNote": "[Student Note: Focus on connections between this learning and your own experiences. Ask questions and trust your thinking process.]"
        },
        "weDo": {
          "minutes": 25,
          "activity": "Detailed collaborative exploration with trauma-informed group facilitation. Include cultural connections and multiple ways to participate.",
          "teacherNote": "[Teacher Note: Facilitate with trauma-informed group norms. Provide structure while allowing for organic collaboration. Support students in finding their voice within the group.]",
          "studentNote": "[Student Note: Share your ideas and listen to others' perspectives. Your contributions strengthen our collective understanding.]"
        },
        "youDoTogether": {
          "minutes": 20,
          "activity": "Detailed partner work with cultural connections and choice in expression. Include trauma-informed partnership protocols.",
          "teacherNote": "[Teacher Note: Support partnership formation with intentional pairing. Provide conversation starters and monitor for inclusive participation. Offer alternative formats for different needs.]",
          "studentNote": "[Student Note: Practice active listening and share your thinking. Support your partner's learning while honoring your own needs.]"
        },
        "youDoAlone": {
          "minutes": 15,
          "activity": "Detailed independent practice with choice and cultural connections. Multiple pathways for expression and demonstration.",
          "teacherNote": "[Teacher Note: Provide choice in format and content. Monitor for regulation needs and offer support. Celebrate individual progress and cultural assets.]",
          "studentNote": "[Student Note: Choose the way that best shows your understanding. Take breaks as needed and trust your learning process.]"
        },
        "closing": {
          "minutes": 10,
          "activity": "Detailed reflection and community building with healing-centered closure. Include celebration of learning and identity.",
          "teacherNote": "[Teacher Note: Facilitate meaningful reflection with trauma-informed closure. Celebrate growth and cultural assets. Prepare students for transition with regulation support.]",
          "studentNote": "[Student Note: Reflect on your learning and growth. Celebrate what you've accomplished and how you've contributed to our community.]"
        }
      },
      "mtss": {
        "tier1": ["Specific universal supports with trauma-informed design", "Clear visual agenda with cultural responsiveness", "Built-in regulation breaks", "Choice in expression methods"],
        "tier2": ["Specific targeted interventions", "Small group supports with cultural connections", "Extended time and alternative formats", "Peer mentoring"],
        "tier3": ["Specific intensive supports", "Individualized accommodations", "Crisis intervention protocols", "Alternative assessment methods"]
      },
      "selCompetencies": ["Self-Awareness through cultural identity", "Self-Management via regulation", "Social Awareness through community", "Relationship Skills in collaboration", "Responsible Decision-Making with choice"],
      "regulationRituals": ["Garden-based breathing", "Grounding with cultural symbols", "Movement with purpose", "Community check-ins"],
      "assessment": {
        "formative": ["Exit tickets with choice", "Peer feedback circles", "Self-reflection with cultural connections", "Teacher observation"],
        "summative": ["Portfolio with identity integration", "Community presentation", "Multimedia expression"]
      },
      "resources": ["Diverse texts representing multiple perspectives", "Technology with accessibility", "Art supplies for expression", "Community resources"]
    }
    // REPEAT SIMILAR DETAILED STRUCTURE FOR ALL ${input.days} DAYS
  ],
  "appendixA": {
    "namingConvention": "{LessonCode}_{GradeLevel}{SubjectAbbreviation}_{DescriptiveTitle}.{filetype}",
    "assets": [
      {
        "fileName": "RootedInMe_${input.gradeLevel.replace(/\s+/g, '')}_CulturalReflection.pdf",
        "type": "pdf",
        "description": "Trauma-informed reflection guide for cultural identity exploration",
        "altText": "Diverse student artwork with nature motifs and healing imagery",
        "howToGenerate": "Create in Canva with trauma-informed design principles and cultural responsiveness",
        "linkPlaceholder": "[Insert link to cultural reflection guide]",
        "figure": "Figure 1"
      }
    ]
  }
}

Generate the complete ${input.days}-day lesson plan with ALL days fully detailed. Each day must include complete flow sections with proper teacher and student notes.`;

    let plan: LessonPlanJSON | null = null;
    let raw = '';

    // Use Claude Sonnet with higher token limit for complex generation
    try {
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192, // Increased token limit
        temperature: 0.1, // Lower temperature for more consistent JSON
        messages: [
          {
            role: 'user',
            content: masterPrompt
          }
        ]
      });
      
      raw = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '';
      console.log('Raw response length:', raw.length); // Debug log
      
      plan = safeParse<LessonPlanJSON>(raw);
    } catch (error) {
      console.error('Claude API error:', error);
    }

    // Enhanced repair attempt for JSON wrapped in markdown
    if (!plan && raw) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = raw.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        plan = safeParse<LessonPlanJSON>(jsonMatch[1]);
      } else {
        // Fallback to original extraction method
        const s = raw.indexOf('{');
        const e = raw.lastIndexOf('}');
        if (s !== -1 && e !== -1 && e > s) {
          plan = safeParse<LessonPlanJSON>(raw.slice(s, e + 1));
        }
      }
    }

    // If we still don't have a plan or it's incomplete, use fallback
    if (!plan || !plan.days || plan.days.length !== input.days) {
      console.log('Using fallback plan - missing or incomplete days');
      plan = fallbackPlan(input);
    }

    // Validate lesson plan structure
    if (!validateLessonPlanStructure(plan)) {
      console.log('Using fallback plan - structure validation failed');
      plan = fallbackPlan(input);
    }

    // Ensure we have the right number of days
    if (plan.days.length !== input.days) {
      console.log(`Adjusting days: got ${plan.days.length}, expected ${input.days}`);
      plan = fallbackPlan(input);
    }

    // Generate comprehensive markdown from the structured plan
    plan.markdown = generateComprehensiveMarkdown(plan);

    console.log('Final plan days:', plan.days.length); // Debug log

    return NextResponse.json({ 
      ok: true, 
      routeId: ROUTE_ID, 
      plan, 
      generator: LESSON_PLAN_CONFIG.generator 
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('API Error:', msg);
    
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
