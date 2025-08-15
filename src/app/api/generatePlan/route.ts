// File: src/app/api/generatePlan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

type GeneratePlanInput = {
  gradeLevel?: string;
  subjects?: string[];
  duration?: number;
  unitTitle?: string;
  standards?: string;
  focus?: string;
  days?: number;
};

function createRootworkPrompt(input: GeneratePlanInput): string {
  const days = input.days || input.duration || 3;
  const gradeLevel = input.gradeLevel || '9th Grade';
  const subjects = input.subjects || ['English Language Arts'];
  const unitTitle = input.unitTitle || 'Cultural Identity and Expression';
  const standards = input.standards || 'CCSS ELA Standards';
  const focus = input.focus || 'Trauma-informed cultural exploration';

  return `You are an expert trauma-informed educator with deep classroom experience. Generate a COMPLETE ${days}-day lesson plan with the same level of detail, specificity, and practical wisdom as a master teacher's actual classroom implementation.

${days}-DAY ROOTWORK FRAMEWORK: "${unitTitle}"
Grade ${gradeLevel} | ${subjects.join(' + ')} | Standards: ${standards}
Focus: ${focus}

CRITICAL: Include specific implementation details, exact materials with quantities, storage solutions, voluntary participation options, choice menus, and practical logistics that a substitute teacher could follow.

For Each Day, Include ALL These Elements:

# DAY X: [Specific, evocative title with cultural connection]

Essential Question: [Question requiring authentic integration of ALL selected subjects]
Learning Target: [Specific, measurable, identity-affirming goal]
Standards: [Specific state standard citations for each subject]
SEL Alignment: [Specific CASEL competencies with examples]

## Opening (15min): [Specific regulation ritual name]
[Detailed description of trauma-informed opening with exact materials, setup instructions, and participation options]
Materials Needed: [Specific list with quantities]
Implementation Notes: [Storage, timing, alternatives for different student needs]
[Teacher Note: Specific facilitation guidance, what to watch for, accessibility considerations]
[Student Note: Clear expectations, choice options, self-advocacy language]

## I Do (20min): [Specific content title with cross-curricular modeling]
[Detailed explanation of content delivery with specific examples, think-alouds, and subject connections]
Cross-Curricular Connections: [Explicit examples of how each subject contributes to understanding]
Visual Supports: [Specific charts, diagrams, or digital tools to use]
[Teacher Note: Scaffolding strategies, differentiation moves, assessment checkpoints]
[Student Note: Active engagement strategies, note-taking options, building on strengths]

## Work Session (45min): [Sophisticated collaborative investigation]

### We Do (15min): [Specific guided practice activity]
[Step-by-step instructions for collaborative work requiring all subject areas]
Materials Setup: [Specific arrangement and distribution instructions]
[Teacher Note: Group formation strategies, monitoring techniques, intervention protocols]
[Student Note: Collaboration expectations, communication strategies, individual accountability]

### You Do Together (15min): [Specific partner creation task]
[Detailed partner work instructions with choice menu of 3-4 pathways]
Choice Menu Options:
- Option A: [Specific pathway for visual learners]
- Option B: [Specific pathway for kinesthetic learners]  
- Option C: [Specific pathway for analytical learners]
- Option D: [Open-ended creative pathway]
[Teacher Note: Pairing strategies, progress monitoring, conflict resolution]
[Student Note: Partnership protocols, self-advocacy options, quality indicators]

### You Do Alone (15min): [Individual synthesis with multiple modalities]
[Specific independent work options with clear success criteria]
Regulation Supports: [Built-in breaks, movement options, sensory tools]
[Teacher Note: Conferencing approach, differentiated expectations, trauma-informed check-ins]
[Student Note: Self-management tools, reflection prompts, goal-setting options]

## Closing (10min): [Identity-connected reflection with community building]
[Specific closing routine connecting to cultural identity and community]
Sharing Protocol: [Exact structure for voluntary sharing with alternatives]
[Teacher Note: Emotional regulation support, validation strategies, transition preparation]
[Student Note: Celebration language, growth recognition, preparation for next steps]

## Implementation Details:
Materials List: [Complete list with quantities, alternatives, and storage instructions]
Room Setup: [Specific arrangements for different activities]
Time Management: [Pacing guides and transition strategies]
Technology Integration: [Specific tools with setup instructions]
Assessment Tools: [Rubrics, checklists, observation protocols]

## MTSS Supports:
Tier 1 (All Students): [Specific universal design features with implementation details]
Tier 2 (Targeted Support): [Specific interventions with when/how to implement]
Tier 3 (Intensive Support): [Specific accommodations with documentation requirements]

## Extensions and Connections:
Advanced Learners: [Specific acceleration options]
Community Connections: [Real partnerships or outreach opportunities]
Home-School Bridge: [Family engagement options that respect diverse family structures]

## Standards Alignment:
[Specific citation for each subject with explanation of how the lesson addresses it]

---

GENERATE ALL ${days} DAYS WITH AUTHENTIC CROSS-CURRICULAR INTEGRATION. ENSURE EVERY SELECTED SUBJECT IS MEANINGFULLY WOVEN THROUGHOUT EACH DAY.

## CRITICAL: RESOURCE GENERATION APPENDIX

After completing all lesson days, create a comprehensive Resource Generation Appendix with:

### A. IMAGE GENERATION PROMPTS
For each visual resource mentioned in lessons, provide detailed prompts for DALL-E/Copilot:
Format: "DALL-E Prompt for [Resource Name]: [Detailed 2-3 sentence description with style, colors, composition, and educational elements]"

### B. TEXT-BASED RESOURCES  
Generate actual content for text-based materials:
- Handout text and instructions
- Worksheet questions and answer keys
- Rubric criteria and scoring guides
- Student reflection prompts
- Assessment tools mentioned in lessons

### C. MATERIALS PROCUREMENT GUIDE
Specific sourcing information for physical materials mentioned, including:
- Where to obtain items
- Approximate costs
- Suitable alternatives
- Storage suggestions

GENERATE COMPLETE LESSON PLAN FIRST, THEN COMPREHENSIVE RESOURCE APPENDIX.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received request body:', JSON.stringify(body, null, 2));

    const gradeLevel = body.gradeLevel || body.grade || '';
    const subjects = body.subjects || body.subject ? [body.subject] : [];
    const unitTitle = body.unitTitle || body.topic || 'Cultural Identity and Expression';
    const standards = body.standards || 'CCSS Standards';
    const focus = body.focus || 'Trauma-informed learning';
    const days = body.days || body.duration || 3;

    console.log('Processed data:', {
      gradeLevel,
      subjects,
      unitTitle,
      standards,
      focus,
      days
    });

    if (!gradeLevel || gradeLevel === 'Select Grade' || gradeLevel === '') {
      console.log('Grade level validation failed:', gradeLevel);
      return NextResponse.json(
        { error: 'Please select a grade level.' },
        { status: 400 }
      );
    }

    if (!subjects || subjects.length === 0 || (subjects.length === 1 && subjects[0] === '')) {
      console.log('Subjects validation failed:', subjects);
      return NextResponse.json(
        { error: 'Please select at least one subject area.' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not found in environment');
      return NextResponse.json(
        { error: 'API key not configured.' },
        { status: 500 }
      );
    }

    const input = {
      gradeLevel,
      subjects,
      unitTitle,
      standards,
      focus,
      days: parseInt(String(days), 10)
    };

    const prompt = createRootworkPrompt(input);
    console.log('Sending request to Anthropic...');

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 4 minutes')), 240000);
    });

    const apiPromise = client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 8192,
      temperature: 0.1,
      messages: [
        { 
          role: 'user', 
          content: prompt 
        }
      ]
    });

    const response = await Promise.race([apiPromise, timeoutPromise]) as any;

    const lessonPlan = response.content?.[0]?.type === 'text' ? response.content[0].text : '';
    
    if (!lessonPlan) {
      return NextResponse.json(
        { error: 'Empty response from AI model.' },
        { status: 502 }
      );
    }

    console.log('✅ Generated lesson plan successfully');
    console.log('Lesson plan length:', lessonPlan.length);

    return NextResponse.json({
      ok: true,
      lessonPlan,
      markdown: lessonPlan,
      plan: {
        markdown: lessonPlan,
        meta: {
          title: unitTitle,
          gradeLevel: gradeLevel,
          subject: subjects.join(', '),
          days: days
        }
      }
    });

  } catch (error: any) {
    console.error('Error in generatePlan:', error);
    
    if (error.message?.includes('timeout')) {
      return NextResponse.json({
        error: 'Lesson plan generation is taking longer than expected. Please try with fewer days or a simpler topic.',
        details: 'Request timeout - try reducing complexity'
      }, { status: 504 });
    }
    
    if (error.status) {
      return NextResponse.json({
        error: `The AI model returned an error (Status: ${error.status}).`,
        details: error.message
      }, { status: 502 });
    }

    return NextResponse.json({
      error: 'An internal server error occurred.',
      details: error.message
    }, { status: 500 });
  }
}
