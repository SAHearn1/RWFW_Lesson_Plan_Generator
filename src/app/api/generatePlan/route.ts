// File: src/app/api/generatePlan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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

  return `You are an expert trauma-informed STEAM educator. Generate a COMPLETE ${days}-day lesson plan with ALL required elements. DO NOT STOP after Day 1.

**${days}-DAY ROOTWORK FRAMEWORK: "${unitTitle}"**
Grade: ${gradeLevel} | Subjects: ${subjects.join(' + ')} | Standards: ${standards}
Focus: ${focus} | Trauma-Informed + Project-Based + STEAM Integration

**CRITICAL: Include ALL components for EACH day - Opening, I Do, We Do, You Do Together, You Do Alone, Closing + Teacher/Student Notes + STEAM connections + Assessment**

**FORMAT FOR EACH DAY:**

# DAY X: [Compelling Title with STEAM Connection]

**Essential Question:** [Cross-curricular question connecting all subjects]
**Learning Target:** [Specific, measurable, trauma-informed]
**STEAM Integration:** [How science, tech, engineering, arts, math connect]
**Project Component:** [What students build/create/design]

[Teacher Note: Trauma-informed facilitation approach, differentiation strategies, and cross-curricular connections]
[Student Note: Personal growth focus, agency building, and success strategies]

## Opening (15min): [Regulation Ritual + Hook Activity]
**Activity:** [Garden/nature-based grounding + engaging opener connecting to student lives]
**Materials:** [Specific items needed]
[Teacher Note: Trauma-informed facilitation, watch for dysregulation, cultural responsiveness]
[Student Note: Self-regulation strategies, connection to personal experiences, growth mindset]

## I Do: Direct Instruction (20min): [Content + Modeling]
**Content:** [Core concepts with real-world STEAM connections, accessible language, visual supports]
**Modeling:** [Think-aloud, demonstration, worked examples across disciplines]
[Teacher Note: Scaffolding strategies, differentiation for diverse learners, assessment checkpoints]
[Student Note: Active listening strategies, note-taking methods, connection to prior knowledge]

## Work Session (45min): **Gradual Release Framework**

### We Do (15min): [Collaborative Exploration]
**Activity:** [Guided practice with cross-curricular problem-solving, partner/small group work]
**STEAM Connection:** [Specific integration of subjects, real-world application]
[Teacher Note: Group formation strategies, peer support facilitation, progress monitoring]
[Student Note: Collaboration skills, peer learning strategies, voice and choice opportunities]

### You Do Together (15min): [Partner Investigation]
**Task:** [Structured partner work building project components, inquiry-based exploration]
**Choices:** [Multiple pathways/options respecting learning differences]
[Teacher Note: Scaffolding supports, peer mediation, formative assessment opportunities]
[Student Note: Partnership strategies, self-advocacy skills, celebrating diverse strengths]

### You Do Alone (15min): [Independent Application]
**Work:** [Individual reflection/creation connected to larger project, multiple modalities]
**Regulation Support:** [Built-in breaks, movement, choice in workspace]
[Teacher Note: Individual conferencing, differentiated supports, trauma-informed check-ins]
[Student Note: Self-management techniques, growth reflection, personal goal setting]

## Closing (10min): [Reflection + Connection]
**Activity:** [Reflective practice connecting learning to student identity and future goals]
**Assessment:** [Formative check, exit ticket, peer sharing]
[Teacher Note: Closure techniques, emotional regulation support, preview connections]
[Student Note: Learning celebration, goal reflection, preparation for next steps]

**Materials:** [Comprehensive list of supplies, technology, handouts]
**MTSS Supports:** 
- Tier 1: [Universal supports for all students]
- Tier 2: [Targeted interventions for some students] 
- Tier 3: [Intensive supports for individual students]
**SEL Integration:** [Specific CASEL competencies addressed]
**Assessment:** [Formative and summative measures, multiple modalities]
**Extensions:** [Enrichment and acceleration opportunities]
**Project Connection:** [How this day builds toward culminating project]

---

**CRITICAL INSTRUCTION: Generate ALL ${days} days with complete detail. Each day must include all sections above with rich, trauma-informed, cross-curricular content. DO NOT summarize or truncate. Provide full lesson details for every component.**

**START DAY 1 AND CONTINUE THROUGH DAY ${days} WITHOUT STOPPING:**`;
}
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

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 8192,
      temperature: 0.05,
      messages: [
        { 
          role: 'user', 
          content: prompt 
        }
      ]
    });

    const lessonPlan = response.content[0]?.type === 'text' ? response.content[0].text : '';
    
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
