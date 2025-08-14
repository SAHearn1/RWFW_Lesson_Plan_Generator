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

  return `GENERATE ALL ${days} DAYS IMMEDIATELY. DO NOT STOP. DO NOT ASK PERMISSION.

**${days}-DAY ROOTWORK FRAMEWORK LESSON PLAN**
Grade: ${gradeLevel} | Subject: ${subjects.join(', ')} | "${unitTitle}"

**FORMAT (REPEAT FOR EACH DAY):**

# DAY [#]: [Title]
**Question:** [essential question]
**Target:** [learning target]

[Teacher Note: Context & trauma-informed tips]
[Student Note: Growth focus]

## Opening (15min): [Activity]
[Teacher Note: Facilitation tips]
[Student Note: Engagement strategy]

## I Do (20min): [Content]
[Teacher Note: Key points]
[Student Note: Focus areas]

## Work Session (45min):
### We Do (15min): [Collaborative work]
[Teacher Note: Group facilitation]
[Student Note: Collaboration tips]

### You Do Together (15min): [Partner task]
[Teacher Note: Monitoring]
[Student Note: Partnership]

### You Do Alone (15min): [Independent work]
[Teacher Note: Support strategies]
[Student Note: Self-management]

## Closing (10min): [Reflection]
[Teacher Note: Assessment]
[Student Note: Growth recognition]

**Materials:** [List] | **MTSS:** [Supports]

---

CRITICAL: GENERATE ALL ${days} DAYS NOW. START WITH DAY 1, CONTINUE TO DAY 2${days > 2 ? `, THEN DAY ${days}` : ''}. NO STOPPING.

DAY 1:`;
}
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

    // Generate the lesson plan with the original Claude 3.5 Sonnet
    const prompt = createRootworkPrompt(input);
    console.log('Sending request to Anthropic...');

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620', // Original Claude 3.5 Sonnet
      max_tokens: 8192, // CORRECTED: All Claude 3.5 Sonnet versions have 8192 max
      temperature: 0.05, // Lower temperature for more consistent output
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
