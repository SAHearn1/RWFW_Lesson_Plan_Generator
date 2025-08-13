// src/app/api/generatePlan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = ['iad1'];
export const maxDuration = 60;

const ROUTE_ID = 'generatePlan-v8-anthropic-2025-08-12-unique';

const LESSON_PLAN_CONFIG = {
  maxDays: 5,
  gradeRanges: ['K-2', '3-5', '6-8', '9-12'],
  instructionalFrameworks: ['GRR', 'PBL', 'STEAM', 'MTSS', 'CASEL'],
  generator: 'lesson-plan-generator-v8'
};

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

function fallbackPlan(input: NormalizedInput): LessonPlanJSON {
  const getIntelligentStandards = (gradeLevel: string, subjects: string[], standardsGuidance: string): string[] => {
    const grade = gradeLevel.toLowerCase();
    const standards: string[] = [];
    
    const isGeorgia = standardsGuidance.toLowerCase().includes('georgia');
    
    subjects.forEach(subject => {
      const subjectLower = subject.toLowerCase();
      
      if (subjectLower.includes('english') || subjectLower.includes('ela')) {
        if (isGeorgia) {
          if (grade.includes('9') || grade.includes('10')) {
            standards.push('ELAGSE9-10.RI.1', 'ELAGSE9-10.W.1');
          } else if (grade.includes('11') || grade.includes('12')) {
            standards.push('ELAGSE11-12.RI.1', 'ELAGSE11-12.W.1');
          } else {
            standards.push('ELAGSE-appropriate for ' + gradeLevel + ' ELA');
          }
        } else {
          if (grade.includes('9') || grade.includes('10')) {
            standards.push('CCSS.ELA-LITERACY.RI.9-10.1', 'CCSS.ELA-LITERACY.W.9-10.1');
          } else if (grade.includes('11') || grade.includes('12')) {
            standards.push('CCSS.ELA-LITERACY.RI.11-12.1', 'CCSS.ELA-LITERACY.W.11-12.1');
          } else {
            standards.push('CCSS ELA standards appropriate for ' + gradeLevel);
          }
        }
      }
      
      if (subjectLower.includes('math')) {
        if (isGeorgia) {
          standards.push('MGSE-appropriate mathematics standards for ' + gradeLevel);
        } else {
          standards.push('CCSS.MATH.CONTENT.HSA.REI.A.1');
        }
      }
      
      if (subjectLower.includes('science')) {
        if (isGeorgia) {
          standards.push('GSE Science standards for ' + gradeLevel);
        } else {
          standards.push('NGSS.HS-PS1-1', 'NGSS.HS-ETS1-1');
        }
      }
      
      if (subjectLower.includes('social')) {
        if (isGeorgia) {
          standards.push('GSE Social Studies standards for ' + gradeLevel);
        } else {
          standards.push('NCSS thematic standards appropriate for ' + gradeLevel);
        }
      }
      
      if (subjectLower.includes('art')) {
        standards.push('National Core Arts Standards for ' + gradeLevel + ' Visual Arts');
      }
    });
    
    if (standards.length === 0) {
      return ['State-appropriate standards for ' + gradeLevel + ' ' + subjects.join(', ')];
    }
    
    return standards.slice(0, 5);
  };

  const getFocusEnhancement = (focus: string, subjects: string[]): string => {
    const focusLower = focus.toLowerCase();
    const isInterdisciplinary = subjects.length > 1;
    
    if (focusLower.includes('steam')) {
      return isInterdisciplinary 
        ? `with integrated STEAM elements woven throughout ${subjects.join(', ')}`
        : 'with integrated STEAM elements (Science, Technology, Engineering, Arts, Mathematics)';
    } else if (focusLower.includes('pbl') || focusLower.includes('project')) {
      return isInterdisciplinary
        ? `structured as project-based learning requiring knowledge from ${subjects.join(', ')}`
        : 'structured as project-based learning with authentic problem-solving';
    }
    
    return isInterdisciplinary
      ? `with trauma-informed approaches that naturally integrate ${subjects.join(', ')}`
      : 'with trauma-informed and culturally responsive approaches';
  };

  const intelligentStandards = getIntelligentStandards(input.gradeLevel, input.subjects, input.standards);
  const focusEnhancement = getFocusEnhancement(input.focus, input.subjects);

  const mkStep = (label: string) => ({
    minutes: Math.round(90 / 6),
    activity: `${label}: Comprehensive activities ${focusEnhancement}. Include multiple pathways for engagement that honor student identities${input.subjects.length > 1 ? ` while integrating ${input.subjects.join(', ')} naturally` : ''}.`,
    teacherNote: `[Teacher Note: Use trauma-informed approaches while emphasizing ${input.focus}${input.subjects.length > 1 ? ` across ${input.subjects.join(', ')}` : ''}. Monitor for regulation needs and provide multiple entry points.]`,
    studentNote: `[Student Note: You belong here and your voice matters. Notice how ${input.focus}${input.subjects.length > 1 ? ` and ${input.subjects.join(' and ')} connect` : ' connects'} to your life.]`,
  });

  const dayBlock = (day: number) => ({
    day,
    title: `${input.unitTitle} — Day ${day}${input.subjects.length > 1 ? ': Interdisciplinary Learning' : ''}`,
    learningTarget: `Students will demonstrate understanding through culturally responsive, trauma-informed learning experiences${input.subjects.length > 1 ? ` across ${input.subjects.join(', ')}` : ''}.`,
    essentialQuestion: `How do we learn in ways that honor our identities through ${input.focus}${input.subjects.length > 1 ? ` and ${input.subjects.join(' and ')}` : ''}?`,
    standards: intelligentStandards,
    flow: {
      opening: mkStep('Opening Circle & Grounding'),
      iDo: mkStep('Direct Instruction'),
      weDo: mkStep('Collaborative Exploration'),
      youDoTogether: mkStep('Partner Work'),
      youDoAlone: mkStep('Independent Practice'),
      closing: mkStep('Reflection & Closure'),
    },
    mtss: {
      tier1: [
        `Clear visual agenda with ${input.focus} supports${input.subjects.length > 1 ? ` spanning ${input.subjects.join(', ')}` : ''}`,
        'Multiple representation modes with trauma-informed design',
        'Built-in regulation breaks and student choice'
      ],
      tier2: [
        `Small group supports with ${input.focus} scaffolding`,
        'Extended processing time and alternative formats',
        'Peer partnerships with community building'
      ],
      tier3: [
        `Individualized accommodations for ${input.focus} participation`,
        'Alternative assessment formats',
        'Intensive regulation support'
      ]
    },
    selCompetencies: [
      `Self-Awareness through ${input.focus} exploration`,
      'Self-Management via regulation rituals',
      'Social Awareness through community building',
      'Relationship Skills in collaboration',
      'Responsible Decision-Making with choice'
    ],
    regulationRituals: [
      `Garden-based breathing with ${input.focus} visualization`,
      'Grounding with cultural symbols',
      'Movement with community building'
    ],
    assessment: { 
      formative: [
        `Exit tickets with ${input.focus} reflection`,
        'Peer feedback circles',
        'Self-reflection journals'
      ],
      summative: [
        `Portfolio with ${input.focus} showcase${input.subjects.length > 1 ? ` across ${input.subjects.join(', ')}` : ''}`,
        'Community presentation',
        'Multimedia expression'
      ]
    },
    resources: [
      `Diverse materials with ${input.focus} connections`,
      'Technology with accessibility features',
      'Art supplies for creative expression'
    ],
  });

  const plan: LessonPlanJSON = {
    meta: {
      title: `${input.unitTitle}`,
      subtitle: `Root Work Framework: S.T.E.A.M. Powered, Trauma Informed, Project Based${input.subjects.length > 1 ? ' - Interdisciplinary' : ''}`,
      gradeLevel: input.gradeLevel,
      subject: input.subjects.join(', '),
      days: input.days,
      durationMinutes: 90,
      essentialQuestion: `How can we design learning that heals and empowers students through ${input.focus}${input.subjects.length > 1 ? ` and ${input.subjects.join(' and ')}` : ''}?`,
      standards: intelligentStandards,
    },
    days: Array.from({ length: input.days }, (_, i) => dayBlock(i + 1)),
    appendixA: {
      namingConvention: '{LessonCode}_{GradeLevel}{SubjectAbbreviation}_{DescriptiveTitle}.{filetype}',
      assets: [
        {
          fileName: `RootedInMe_${input.gradeLevel.replace(/\s+/g, '')}_ReflectionGuide.pdf`,
          type: 'pdf',
          description: `Trauma-informed reflection guide with ${input.focus} integration`,
          altText: 'Diverse student artwork with healing imagery',
          howToGenerate: 'Create in Canva with trauma-informed design principles',
          linkPlaceholder: '[Insert link to reflection guide]',
          figure: 'Figure 1',
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

    console.log('API Input:', input);

    const masterPrompt = `You are an expert trauma-informed educator creating a comprehensive ${input.days}-day lesson plan using the Root Work Framework with interdisciplinary integration.

**LESSON REQUIREMENTS:**
- Grade Level: ${input.gradeLevel}
- Subject(s): ${input.subjects.join(', ')} ${input.subjects.length > 1 ? '(INTERDISCIPLINARY)' : ''}
- Unit Title: ${input.unitTitle}
- Standards: "${input.standards}" (Select specific standards for all subjects)
- Focus: "${input.focus}" (Integrate throughout all activities)
- Days: ${input.days} (90 minutes each)

${input.subjects.length > 1 ? `**INTERDISCIPLINARY INTEGRATION:**
- EVERY activity must integrate ALL subjects: ${input.subjects.join(', ')}
- Create authentic, real-world connections between subjects
- Use project-based approaches requiring multiple disciplines
- Ensure assessments evaluate understanding across all subject areas` : ''}

**CRITICAL:** Generate ONLY valid JSON with complete ${input.days} days. NO markdown, NO explanations, ONLY JSON:

{
  "meta": {
    "title": "${input.unitTitle}",
    "subtitle": "Root Work Framework: S.T.E.A.M. Powered, Trauma Informed, Project Based${input.subjects.length > 1 ? ' - Interdisciplinary' : ''}",
    "gradeLevel": "${input.gradeLevel}",
    "subject": "${input.subjects.join(', ')}",
    "days": ${input.days},
    "durationMinutes": 90,
    "essentialQuestion": "How can we amplify our voices and heal communities through learning?",
    "standards": ["List 3-5 specific standards from all subject areas"]
  },
  "days": [
    // Generate ALL ${input.days} days with complete details
    {
      "day": 1,
      "title": "Day 1 title integrating ${input.subjects.length > 1 ? 'all subjects' : 'subject'} and ${input.focus}",
      "learningTarget": "Asset-based target incorporating ${input.focus}${input.subjects.length > 1 ? ' across ' + input.subjects.join(', ') : ''}",
      "essentialQuestion": "Question connecting to healing and ${input.subjects.length > 1 ? 'interdisciplinary' : ''} learning",
      "standards": ["Specific standards from all subject areas"],
      "flow": {
        "opening": {
          "minutes": 15,
          "activity": "Community building with ${input.focus}${input.subjects.length > 1 ? ' introducing connections between ' + input.subjects.join(', ') : ''}",
          "teacherNote": "[Teacher Note: Trauma-informed facilitation guidance for ${input.focus}${input.subjects.length > 1 ? ' and interdisciplinary connections' : ''}]",
          "studentNote": "[Student Note: Empowering message about belonging and ${input.focus} learning]"
        },
        "iDo": {
          "minutes": 20,
          "activity": "Direct instruction integrating ${input.focus}${input.subjects.length > 1 ? ' across ' + input.subjects.join(', ') : ''}",
          "teacherNote": "[Teacher Note: Asset-based teaching with ${input.focus} connections${input.subjects.length > 1 ? ' and interdisciplinary examples' : ''}]",
          "studentNote": "[Student Note: Focus on connections to your experiences and ${input.focus}]"
        },
        "weDo": {
          "minutes": 25,
          "activity": "Collaborative exploration with ${input.focus}${input.subjects.length > 1 ? ' requiring knowledge from ' + input.subjects.join(', ') : ''}",
          "teacherNote": "[Teacher Note: Trauma-informed group facilitation with ${input.focus}${input.subjects.length > 1 ? ' and interdisciplinary support' : ''}]",
          "studentNote": "[Student Note: Share ideas while exploring ${input.focus}${input.subjects.length > 1 ? ' connections' : ''}]"
        },
        "youDoTogether": {
          "minutes": 20,
          "activity": "Partner work with ${input.focus}${input.subjects.length > 1 ? ' integrating ' + input.subjects.join(', ') : ''}",
          "teacherNote": "[Teacher Note: Support partnerships for ${input.focus} work${input.subjects.length > 1 ? ' across subjects' : ''}]",
          "studentNote": "[Student Note: Practice listening and sharing about ${input.focus}]"
        },
        "youDoAlone": {
          "minutes": 15,
          "activity": "Independent practice with ${input.focus}${input.subjects.length > 1 ? ' demonstrating understanding across ' + input.subjects.join(', ') : ''}",
          "teacherNote": "[Teacher Note: Provide choice while ensuring ${input.focus} integration${input.subjects.length > 1 ? ' across subjects' : ''}]",
          "studentNote": "[Student Note: Choose how to show understanding of ${input.focus}]"
        },
        "closing": {
          "minutes": 10,
          "activity": "Reflection and community building with ${input.focus}${input.subjects.length > 1 ? ' celebrating interdisciplinary learning' : ''}",
          "teacherNote": "[Teacher Note: Trauma-informed closure highlighting ${input.focus}${input.subjects.length > 1 ? ' and subject connections' : ''}]",
          "studentNote": "[Student Note: Reflect on growth in ${input.focus}${input.subjects.length > 1 ? ' and subject connections' : ''}]"
        }
      },
      "mtss": {
        "tier1": ["Universal supports with ${input.focus}${input.subjects.length > 1 ? ' and interdisciplinary scaffolds' : ''}"],
        "tier2": ["Targeted interventions for ${input.focus}${input.subjects.length > 1 ? ' across subjects' : ''}"],
        "tier3": ["Intensive supports with ${input.focus}${input.subjects.length > 1 ? ' accommodations' : ''}"]
      },
      "selCompetencies": ["Self-Awareness through ${input.focus}", "Self-Management", "Social Awareness", "Relationship Skills", "Responsible Decision-Making"],
      "regulationRituals": ["Garden-based breathing with ${input.focus}", "Grounding techniques", "Movement with purpose"],
      "assessment": {
        "formative": ["Exit tickets with ${input.focus}${input.subjects.length > 1 ? ' connections' : ''}"],
        "summative": ["Portfolio showcasing ${input.focus}${input.subjects.length > 1 ? ' across subjects' : ''}"]
      },
      "resources": ["Diverse materials with ${input.focus}${input.subjects.length > 1 ? ' spanning subjects' : ''}"]
    }
  ],
  "appendixA": {
    "namingConvention": "{LessonCode}_{GradeLevel}{SubjectAbbreviation}_{DescriptiveTitle}.{filetype}",
    "assets": [
      {
        "fileName": "RootedInMe_${input.gradeLevel.replace(/\s+/g, '')}_Guide.pdf",
        "type": "pdf",
        "description": "Trauma-informed guide for ${input.focus}${input.subjects.length > 1 ? ' interdisciplinary' : ''} learning",
        "altText": "Diverse artwork with ${input.focus} elements",
        "howToGenerate": "Create with trauma-informed design and ${input.focus} integration",
        "linkPlaceholder": "[Insert link to guide]",
        "figure": "Figure 1"
      }
    ]
  }
}

Generate complete JSON for ALL ${input.days} days. Ensure every day has detailed flow sections.`;

    let plan: LessonPlanJSON | null = null;
    let raw = '';

    try {
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: masterPrompt
          }
        ]
      });
      
      raw = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '';
      console.log('Raw response length:', raw.length);
      
      plan = safeParse<LessonPlanJSON>(raw);
    } catch (error) {
      console.error('Claude API error:', error);
    }

    if (!plan && raw) {
      const jsonMatch = raw.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        plan = safeParse<LessonPlanJSON>(jsonMatch[1]);
      } else {
        const s = raw.indexOf('{');
        const e = raw.lastIndexOf('}');
        if (s !== -1 && e !== -1 && e > s) {
          plan = safeParse<LessonPlanJSON>(raw.slice(s, e + 1));
        }
      }
    }

    if (!plan || !plan.days || plan.days.length !== input.days) {
      console.log('Using fallback plan');
      plan = fallbackPlan(input);
    }

    if (!validateLessonPlanStructure(plan)) {
      console.log('Using fallback plan - validation failed');
      plan = fallbackPlan(input);
    }

    if (plan.days.length !== input.days) {
      console.log(`Adjusting days: got ${plan.days.length}, expected ${input.days}`);
      plan = fallbackPlan(input);
    }

    plan.markdown = generateComprehensiveMarkdown(plan);

    console.log('Final plan days:', plan.days.length);

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
