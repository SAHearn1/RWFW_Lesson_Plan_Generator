// File: src/app/api/generatePlan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Increase to 5 minutes (max for Vercel Pro)

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

  return `Expert trauma-informed STEAM educator: Generate COMPLETE ${days}-day lesson plan. ALL days required.

**${days}-DAY ROOTWORK: "${unitTitle}"**
Grade ${gradeLevel} | ${subjects.join('+')} | ${standards}

**Each Day Must Include:**

# DAY X: [STEAM Title]
**Question:** [Cross-curricular essential question]
**Target:** [Measurable learning goal]
**Project:** [What students create/build]

[Teacher Note: Trauma-informed approach, differentiation, STEAM connections]
[Student Note: Growth focus, agency building, success strategies]

## Opening (15min): [Regulation + Hook]
[Garden-based grounding activity connecting to lesson]
[Teacher Note: Dysregulation watch, cultural responsiveness]
[Student Note: Self-regulation, personal connection]

## I Do (20min): [Content + STEAM Modeling]
[Core concepts with real-world connections across all subjects]
[Teacher Note: Scaffolding, visual supports, assessment checks]
[Student Note: Active listening, note-taking, prior knowledge links]

## Work Session (45min):
### We Do (15min): [Collaborative STEAM Problem-Solving]
[Guided practice integrating all subject areas]
[Teacher Note: Group facilitation, progress monitoring]
[Student Note: Collaboration skills, voice and choice]

### You Do Together (15min): [Partner Project Building]
[Structured partner work on project components]
[Teacher Note: Peer mediation, formative assessment]
[Student Note: Partnership strategies, self-advocacy]

### You Do Alone (15min): [Independent Creation]
[Individual work with multiple modalities and choice]
[Teacher Note: Conferencing, differentiated supports]
[Student Note: Self-management, goal setting]

## Closing (10min): [Reflection + Connection]
[Identity-connected reflection and peer sharing]
[Teacher Note: Emotional regulation, preview connections]
[Student Note: Learning celebration, growth recognition]

**Materials:** [Complete supply list]
**MTSS:** Tier 1: [Universal] | Tier 2: [Targeted] | Tier 3: [Intensive]
**SEL:** [CASEL competencies]
**Assessment:** [Formative/summative measures]

---

GENERATE ALL ${days} DAYS WITH FULL DETAIL NOW. NO STOPPING. NO ASKING PERMISSION.`;
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

    // Add timeout wrapper
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 4 minutes')), 240000);
    });

    const apiPromise = client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 8192,
      temperature: 0.1, // Slightly higher for faster generation
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
    
    // Handle timeout specifically
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
