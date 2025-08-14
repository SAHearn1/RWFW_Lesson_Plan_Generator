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

  return `# ROOTWORK FRAMEWORK LESSON PLAN GENERATOR

You are an expert trauma-informed educator creating a ${days}-day lesson plan using the Rootwork Framework.

## LESSON REQUIREMENTS:
- Grade Level: ${gradeLevel}
- Subject(s): ${subjects.join(', ')}
- Unit Title: ${unitTitle}
- Standards: ${standards}
- Focus: ${focus}
- Duration: ${days} days (90 minutes each)

## MANDATORY TEACHER & STUDENT NOTES PROTOCOL:
Every lesson component MUST include both note types in this exact format:

**Teacher Notes Format:**
- Appear as [Teacher Note: ] immediately after each activity description
- Include: pedagogical rationale, trauma-informed considerations, differentiation strategies
- Tone: Professional, supportive mentor to colleague
- Length: 1-3 sentences maximum

**Student Notes Format:**
- Appear as [Student Note: ] immediately after teacher notes
- Include: coaching language, success strategies, self-advocacy prompts, growth mindset reinforcement
- Tone: Warm, empowering, second-person voice
- Length: 1-2 sentences maximum

## REQUIRED LESSON STRUCTURE:

For each day, provide:

### Day X: [Specific Title]

**Essential Question:** [Compelling question for this day]
**Learning Target:** [Specific, measurable target]
**Standards:** [Specific standards for this day]

**Opening (15 minutes)**
[Specific opening activity with exact steps and materials]
[Teacher Note: Facilitation tips and trauma-informed considerations]
[Student Note: Coaching language for engagement and self-regulation]

**I Do: Direct Instruction (20 minutes)**
[Specific content and modeling description]
[Teacher Note: Key teaching points and differentiation strategies]
[Student Note: What to focus on and how this builds skills]

**We Do: Collaborative Work (25 minutes)**
[Specific collaborative activity description]
[Teacher Note: Scaffolding tips and group facilitation guidance]
[Student Note: Success strategies and collaboration expectations]

**You Do Together: Partner Work (15 minutes)**
[Specific partner activity description]
[Teacher Note: Monitoring guidance and support indicators]
[Student Note: Partnership strategies and self-advocacy reminders]

**You Do Alone: Independent Work (10 minutes)**
[Specific independent work description]
[Teacher Note: Individual support strategies and regulation monitoring]
[Student Note: Self-management strategies and growth mindset reinforcement]

**Closing (5 minutes)**
[Specific closure activity with reflection]
[Teacher Note: Assessment insights and trauma-informed closure]
[Student Note: Reflection prompts and growth recognition]

**MTSS Supports:**
- Tier 1: [Universal supports]
- Tier 2: [Targeted supports]
- Tier 3: [Intensive supports]

**SEL Competencies:** [Specific competencies addressed]
**Regulation Rituals:** [Garden/nature-based regulation activities]
**Materials:** [Specific materials needed]
**Assessment:** [Specific assessment methods]

## CRITICAL REQUIREMENTS:
1. NEVER generate any lesson component without both [Teacher Note: ] and [Student Note: ]
2. Teacher notes MUST address trauma-informed facilitation
3. Student notes MUST use encouraging, second-person coaching voice
4. Generate SPECIFIC, ACTIONABLE activities - NOT generic templates
5. Use garden/nature metaphors and cultural identity connections
6. Maintain therapeutic Rootwork Framework context throughout

Generate a complete ${days}-day lesson plan following this format exactly, with specific activities teachers can implement immediately.`;
}

export async function POST(req: NextRequest) {
  try {
    // Check if this is a PDF download request
    const format = req.nextUrl.searchParams.get('format');
    
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

    // Generate the lesson plan
    const prompt = createRootworkPrompt(input);
    console.log('Sending request to Anthropic...');

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 6000,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }]
    });

    const lessonPlan = response.content[0]?.type === 'text' ? response.content[0].text : '';
    
    if (!lessonPlan) {
      return NextResponse.json(
        { error: 'Empty response from AI model.' },
        { status: 502 }
      );
    }

    console.log('✅ Generated lesson plan successfully');

    // If PDF requested, generate PDF (simplified version)
    if (format === 'pdf') {
      try {
        // For now, return a simple PDF-like response
        // You can enhance this with actual PDF generation later
        const pdfContent = `# ${unitTitle}

**Grade Level:** ${gradeLevel}
**Subject(s):** ${subjects.join(', ')}
**Rootwork Framework: Trauma-Informed STEAM Lesson Plan**

${lessonPlan}`;

        const blob = Buffer.from(pdfContent, 'utf-8');
        
        return new NextResponse(blob, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${unitTitle.replace(/[^a-zA-Z0-9]/g, '_')}_RootworkFramework.pdf"`
          }
        });
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        // Fallback to regular response if PDF fails
      }
    }

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
