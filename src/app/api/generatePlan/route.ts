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

  return `Generate a complete ${days}-day Rootwork Framework trauma-informed STEAM lesson plan.

**LESSON SPECS:**
- Grade: ${gradeLevel} | Subject: ${subjects.join(', ')} | Title: "${unitTitle}"
- Duration: ${days} days (90-min blocks) | Focus: ${focus} | Standards: ${standards}

**REQUIRED FORMAT FOR EACH DAY:**

# DAY [#]: [Title]
**Essential Question:** [question]
**Learning Target:** [target]
**Standards:** [standards]

[Teacher Note: Brief pedagogical context and trauma-informed considerations]
[Student Note: What you're building and why it matters for your growth]

## Opening (15 min)
[Activity description]
[Teacher Note: Facilitation tips and therapeutic considerations]
[Student Note: Engagement and self-regulation strategies]

## I Do: Direct Instruction (20 min)
[Content and modeling]
[Teacher Note: Key points and differentiation approaches]
[Student Note: What to focus on and how this builds skills]

## Work Session (45 min)
### We Do (15 min)
[Collaborative activity]
[Teacher Note: Scaffolding tips and group facilitation]
[Student Note: Success strategies and collaboration expectations]

### You Do Together (15 min)
[Partner/small group task]
[Teacher Note: Monitoring guidance and support indicators]
[Student Note: Partnership strategies and self-advocacy]

### You Do Alone (15 min)
[Independent work]
[Teacher Note: Individual support and regulation monitoring]
[Student Note: Self-management and growth mindset]

## Closing (10 min)
[Reflection activity]
[Teacher Note: Assessment insights and next steps]
[Student Note: Reflection prompts and growth recognition]

**MTSS Supports:** [Brief Tier 1-3 descriptions]
**SEL Focus:** [CASEL competencies]
**Materials:** [Essential items needed]

---

**CRITICAL REQUIREMENTS:**
1. Generate ALL ${days} days completely - no stopping after Day 1
2. Include [Teacher Note: ] and [Student Note: ] for every section
3. Use trauma-informed, garden/nature-based metaphors
4. Maintain healing-centered educational approach
5. Be concise but comprehensive

**Generate the complete ${days}-day plan now:**`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received request body:', JSON.stringify(body, null, 2));

    // More flexible validation - check what we actually received
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

    // Validate we have the required data
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

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not found in environment');
      return NextResponse.json(
        { error: 'API key not configured.' },
        { status: 500 }
      );
    }

    // Build the input object for the prompt
    const input = {
      gradeLevel,
      subjects,
      unitTitle,
      standards,
      focus,
      days: parseInt(String(days), 10)
    };

    // Generate the lesson plan with simplified, single message approach
    const prompt = createRootworkPrompt(input);
    console.log('Sending request to Anthropic...');

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8192, // Maximum allowed for Claude 3.5 Sonnet
      temperature: 0.1, // Slightly higher for more creative but consistent output
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

    // Return the lesson plan in the format your frontend expects
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
    
    // Check if it's an Anthropic API error
    if (error.status) {
      return NextResponse.json({
        error: `The AI model returned an error (Status: ${error.status}).`,
        details: error.message
      }, { status: 502 });
    }

    // Generic error
    return NextResponse.json({
      error: 'An internal server error occurred.',
      details: error.message
    }, { status: 500 });
  }
}
