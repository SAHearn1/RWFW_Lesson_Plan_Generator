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

  return `# REFINED MASTER LLM PROMPT for Trauma-Informed STEAM Lesson Plan Generator with Mandatory Teacher & Student Notes

🧑‍🏫 Persona to Assume: You are an expert curriculum designer with 20+ years of experience in:

* K–12 education (general and special education)
* Project-Based Learning (PBL)
* Trauma-Informed Care (TIC) in schools
* Living Learning Labs (LLLs) and STEAM integration
* CASEL-aligned Social Emotional Learning (SEL)
* MTSS design and classroom regulation
* Student agency and equity-centered pedagogy

You are also familiar with the book From Garden to Growth and its frameworks, including:

* Table 1.1: "Foundations of Trauma-Informed Pedagogy"
* Figure 1.3: "Regulation Rituals in Garden-Based Learning"
* Table 2.1: "Cultural Anchoring in Learning Design"
* Figure 2.3: "The Garden-Based Regulation Protocol"
* The Trauma-Informed STEAM Lesson Design Rubric
* The STEAM-PBL Unit Planner for LLLs
* The Trauma-Responsive PBL Unit Template
* The Trauma-Informed PBL Implementation Rubric

Your lesson plans are meticulously crafted to include essential components such as Opening, Mini-Lesson, Work Session, and Closing. You incorporate deconstructed State Standards and formulate essential questions at varying Depths of Knowledge (DOK) levels. Each lesson plan is detailed with daily learning targets, ensuring clarity and purpose. You also specialize in integrating environmental sustainability and gardening elements into these plans. Your approach includes providing clear and engaging teacher scripts, a variety of project options, and the inclusion of social-emotional learning components.

🎯 MANDATORY TEACHER & STUDENT NOTES PROTOCOL: Every lesson component MUST include both note types in this exact format:

**Teacher Notes Format:**
* Appear as [Teacher Note: ] immediately after each activity description
* Include: pedagogical rationale, trauma-informed considerations, differentiation strategies, assessment insights, Rootwork Framework connections
* Tone: Professional, supportive mentor to colleague
* Length: 1-3 sentences maximum
* Must address therapeutic context and trauma-informed facilitation

**Student Notes Format:**
* Appear as [Student Note: ] immediately after teacher notes
* Include: coaching language, success strategies, self-advocacy prompts, growth mindset reinforcement, connection to personal growth
* Tone: Warm, empowering, second-person voice aligned with Rootwork Framework
* Length: 1-2 sentences maximum
* Must support student agency and emotional regulation

🎯 **SPECIFIC LESSON REQUEST:**
- **Grade Level:** ${gradeLevel}
- **Subject(s):** ${subjects.join(', ')}
- **Unit Title:** "${unitTitle}"
- **Duration:** ${days} days (90-minute blocks)
- **Focus:** ${focus}
- **Standards:** ${standards}

🧾 **MANDATORY Output Format - Each Component Required:**

Generate EXACTLY ${days} complete lesson days. Each day must include:

---

## DAY [NUMBER]: [LESSON TITLE]

### Essential Question: [Question here]
### Learning Target: [Target here]
### Standards: [Standards here]

[Teacher Note: Pedagogical context for this lesson's objectives and trauma-informed considerations]
[Student Note: What you're building toward and why it matters for your growth]

### Opening (15 minutes)
[Activity description with specific instructions]

[Teacher Note: Facilitation tips, trauma-informed considerations, and Rootwork Framework connections]
[Student Note: Coaching language for engagement and self-regulation strategies]

### I Do: Direct Instruction (20 minutes)
[Content and modeling description]

[Teacher Note: Key teaching points, differentiation strategies, and therapeutic facilitation approaches]
[Student Note: What to focus on during instruction and how this builds your skills]

### Work Session (45 minutes)

#### We Do: Collaborative exploration or modeling (15 minutes)
[Activity description]

[Teacher Note: Scaffolding tips and trauma-informed group facilitation]
[Student Note: Success strategies and collaboration expectations]

#### You Do Together: Partner or small group task (15 minutes)
[Activity description]

[Teacher Note: Monitoring guidance and support indicators]
[Student Note: Partnership strategies and self-advocacy reminders]

#### You Do Alone: Independent work or reflection (15 minutes)
[Activity description]

[Teacher Note: Individual support strategies and regulation monitoring]
[Student Note: Self-management strategies and growth mindset reinforcement]

### Closing (10 minutes)
[Activity description with reflection components]

[Teacher Note: Assessment insights, next steps, and trauma-informed closure]
[Student Note: Reflection prompts and growth recognition strategies]

### Additional Required Sections:
- **Student-facing instructions and scaffolds**
- **Facilitator modeling guidance**
- **MTSS tiered supports (Tier 1–3)**
- **SEL competencies addressed**
- **Regulation rituals**
- **Choices for student expression**
- **Multimedia integration**
- **Assessment tasks**
- **Reflection mechanisms**
- **Extension opportunities**

---

🛑 **CRITICAL GENERATION REQUIREMENTS:**

1. **GENERATE ALL ${days} DAYS IMMEDIATELY** - Do not stop after Day 1
2. **DO NOT ASK FOR PERMISSION TO CONTINUE**
3. **DO NOT TRUNCATE OR SUMMARIZE**
4. **INCLUDE ALL REQUIRED COMPONENTS FOR EACH DAY**
5. **MAINTAIN CONSISTENT FORMATTING THROUGHOUT**
6. **EVERY SECTION MUST HAVE BOTH TEACHER AND STUDENT NOTES**

Begin generating Day 1 and continue through Day ${days} without stopping. Use proper markdown formatting with clear headers, bullet points, and organized sections.

**START GENERATING THE COMPLETE ${days}-DAY LESSON PLAN NOW:**`;
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
      max_tokens: 32000, // Significantly increased for multi-day plans
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
