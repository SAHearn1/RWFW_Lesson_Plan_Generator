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

  return `Expert trauma-informed STEAM educator: Generate COMPLETE ${days}-day lesson plan with deep interdisciplinary integration.

${days}-DAY ROOTWORK: "${unitTitle}"
Grade ${gradeLevel} | ${subjects.join('+')} | ${standards}

CRITICAL: Each day must include authentic STEAM integration where Science, Technology, Engineering, Arts, and Mathematics are meaningfully woven together, not just mentioned separately.

Each Day Must Include:

# DAY X: [Title connecting all subjects with garden/nature metaphor]
Question: [Essential question requiring knowledge from ALL selected subjects]
Target: [Measurable goal demonstrating cross-curricular mastery]
Project Component: [Sophisticated multi-step creation requiring all disciplines]
STEAM Bridge: [Specific explanation of how S-T-E-A-M connect in this lesson]

[Teacher Note: Trauma-informed facilitation, specific differentiation strategies, assessment checkpoints]
[Student Note: Growth mindset language, agency building, connection to personal identity]

## Opening (15min): Garden-Based Regulation + Content Hook
[Nature-based grounding activity directly connecting to lesson content across all subjects]
Materials: [Specific sensory items, plants, or nature elements]
[Teacher Note: Dysregulation monitoring, cultural responsiveness, accessibility accommodations]
[Student Note: Self-regulation strategies, connection to personal/cultural knowledge]

## I Do (20min): Integrated Content Modeling
[Demonstrate how today's concepts connect across ALL selected subjects with specific examples and think-alouds]
Cross-curricular connections: [Explicit links between subjects with specific examples]
[Teacher Note: Scaffolding for diverse learners, visual/auditory/kinesthetic supports, assessment for understanding]
[Student Note: Active engagement strategies, note-taking methods that work for you, building on prior knowledge]

## Work Session (45min): Collaborative Investigation
### We Do (15min): Guided Multi-Disciplinary Problem-Solving
[Structured activity requiring knowledge from all subjects to solve authentic problem]
Authentic Assessment: [Real-world application demonstrating subject integration]
[Teacher Note: Collaborative grouping strategies, progress monitoring, peer support facilitation]
[Student Note: Communication skills, leveraging individual strengths, voice and choice in process]

### You Do Together (15min): Partnership Creation
[Partner work building sophisticated project components requiring multiple subject areas]
Choice Menu: [3-4 different pathways respecting learning preferences and strengths]
[Teacher Note: Formative assessment opportunities, conflict mediation, scaffolding supports]
[Student Note: Partnership strategies, self-advocacy skills, celebrating diverse perspectives]

### You Do Alone (15min): Individual Synthesis
[Independent work demonstrating personal understanding across subjects with multiple modalities]
Regulation Supports: [Built-in movement, choice, sensory breaks]
[Teacher Note: Individual conferencing, differentiated expectations, trauma-informed check-ins]
[Student Note: Self-management techniques, reflection on learning, personal goal setting]

## Closing (10min): Identity-Connected Reflection
[Reflective practice connecting learning to student identity, culture, and future aspirations]
Community Connection: [How today's learning connects to student's community and goals]
[Teacher Note: Emotional regulation support, culturally responsive validation, transition preparation]
[Student Note: Learning celebration, growth recognition, preparation for tomorrow's challenge]

Materials: [Comprehensive list including nature elements, technology, hands-on materials, texts]
MTSS: Tier 1: [Universal design features] | Tier 2: [Targeted supports] | Tier 3: [Intensive accommodations]
SEL: [Specific CASEL competencies with examples]
Assessment: [Formative checkpoints and authentic performance measures across all subjects]
Standards: [Specific alignment to provided standards with citations]
Extensions: [Accelerated learning options and community connections]

GENERATE ALL ${days} DAYS WITH AUTHENTIC CROSS-CURRICULAR INTEGRATION. ENSURE EVERY SELECTED SUBJECT IS MEANINGFULLY WOVEN THROUGHOUT EACH DAY.`;
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
