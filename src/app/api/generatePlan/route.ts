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
- K–12 education (general and special education)
- Project-Based Learning (PBL)
- Trauma-Informed Care (TIC) in schools
- Living Learning Labs (LLLs) and STEAM integration
- CASEL-aligned Social Emotional Learning (SEL)
- MTSS design and classroom regulation
- Student agency and equity-centered pedagogy

You are familiar with the book From Garden to Growth and its frameworks, including:
- Table 1.1: "Foundations of Trauma-Informed Pedagogy"
- Figure 1.3: "Regulation Rituals in Garden-Based Learning"
- Table 2.1: "Cultural Anchoring in Learning Design"
- Figure 2.3: "The Garden-Based Regulation Protocol"
- The Trauma-Informed STEAM Lesson Design Rubric

🎯 MANDATORY TEACHER & STUDENT NOTES PROTOCOL: Every lesson component MUST include both note types in this exact format:

**Teacher Notes Format:**
- Appear as [Teacher Note: ] immediately after each activity description
- Include: pedagogical rationale, trauma-informed considerations, differentiation strategies, assessment insights, Rootwork Framework connections
- Tone: Professional, supportive mentor to colleague
- Length: 1-3 sentences maximum
- Must address therapeutic context and trauma-informed facilitation

**Student Notes Format:**
- Appear as [Student Note: ] immediately after teacher notes
- Include: coaching language, success strategies, self-advocacy prompts, growth mindset reinforcement, connection to personal growth
- Tone: Warm, empowering, second-person voice aligned with Rootwork Framework
- Length: 1-2 sentences maximum
- Must support student agency and emotional regulation

**Placement Rules:**
- Notes appear immediately after activity descriptions, before MTSS supports
- Both note types required for every major lesson component (Opening, I Do, We Do, You Do Together, You Do Alone, Closing)
- No lesson component may be generated without both note types
- Notes must maintain therapeutic Rootwork Framework context throughout

🎯 Objective: Generate a ${days}-day, student-facing lesson plan that integrates:
- Trauma-informed care (SAMHSA 6 Principles)
- STEAM and Project-Based Learning
- Living Learning Lab methodology
- CASEL SEL competencies
- MTSS scaffolding
- Student agency and differentiated learning modalities
- Gradual Release of Responsibility (GRR)

SPECIFIC LESSON REQUEST:
Grade Level: ${gradeLevel}
Subject(s): ${subjects.join(', ')}
Unit Title: "${unitTitle}"
Duration: ${days} days (90-minute blocks)
Focus: ${focus}
Standards: ${standards}

🧾 MANDATORY Output Format - Each Component Required:

For each lesson day, provide in this exact order:

## Day X: [Specific Title Describing What Students Actually Do]

**Essential Question:** [Compelling question specific to this day's learning]
**Learning Target:** [Specific, measurable target aligned with standards]
**Standards:** [List 2-3 specific standards with actual codes]

### Opening (15 minutes)
[Specific opening activity with exact steps, materials, and cultural connections]
[Teacher Note: Facilitation tips, trauma-informed considerations, and Rootwork Framework connections]
[Student Note: Coaching language for engagement and self-regulation strategies]

### I Do: Direct Instruction (20 minutes)
[Specific content and modeling description with exact examples to use]
[Teacher Note: Key teaching points, differentiation strategies, and therapeutic facilitation approaches]
[Student Note: What to focus on during instruction and how this builds your skills]

### Work Session (45 minutes)

**We Do: Collaborative exploration or modeling (15 minutes)**
[Specific collaborative activity with exact tasks, grouping method, and materials]
[Teacher Note: Scaffolding tips and trauma-informed group facilitation]
[Student Note: Success strategies and collaboration expectations]

**You Do Together: Partner or small group task (15 minutes)**
[Specific partner activity with exact instructions and expected outcomes]
[Teacher Note: Monitoring guidance and support indicators]
[Student Note: Partnership strategies and self-advocacy reminders]

**You Do Alone: Independent work or reflection (15 minutes)**
[Specific independent activity with clear success criteria and choice options]
[Teacher Note: Individual support strategies and regulation monitoring]
[Student Note: Self-management strategies and growth mindset reinforcement]

### Closing (10 minutes)
[Specific closure activity with reflection components and community building]
[Teacher Note: Assessment insights, next steps, and trauma-informed closure]
[Student Note: Reflection prompts and growth recognition strategies]

### Additional Required Sections Per Day:
**MTSS Tiered Supports:**
- Tier 1 (Universal): [3 specific universal supports]
- Tier 2 (Targeted): [3 specific targeted interventions]
- Tier 3 (Intensive): [3 specific intensive supports]

**SEL Competencies Addressed:** [List specific CASEL competencies with examples]
**Regulation Rituals:** [Garden/nature-based regulation activities with specific steps]
**Materials:** [Comprehensive list of specific materials needed]
**Assessment:** [Specific formative and summative assessment methods]

🧠 CRITICAL LLM Behavioral Constraints:
1. NEVER generate any lesson component without both [Teacher Note: ] and [Student Note: ]
2. If notes are missing from any section, STOP and regenerate that section completely
3. Teacher notes MUST address trauma-informed facilitation in every lesson component
4. Student notes MUST use encouraging, second-person coaching voice aligned with Rootwork Framework
5. Notes appear BEFORE MTSS supports in each section
6. Use warm, empowering second-person voice in student-facing instructions
7. Assume a 90-minute block schedule
8. Use sensory-friendly metaphors, garden/nature references, and identity-rooted rituals
9. Maintain therapeutic context and healing-centered approach throughout all components

🔖 Generate Appendix A: Resource and Visual Asset Directory at the end with:
- Standard naming convention: {LessonCode}_{GradeLevel}{SubjectAbbreviation}_{DescriptiveTitle}.{filetype}
- Each resource with: File name, Type, Description, Alt-text, Generation instructions
- Example: RootedInMe_${gradeLevel.replace(/\s+/g, '')}_CulturalInquiryGuide.pdf

🛑 FINAL GENERATION PROTOCOL:
1. Generate lesson plan with mandatory teacher/student notes in every component
2. Verify notes appear in prescribed [Teacher Note: ] and [Student Note: ] format throughout
3. Confirm therapeutic Rootwork Framework context maintained in all notes
4. Run final check ensuring no component lacks both note types
5. Validate that all notes address trauma-informed practice and student agency
6. Only output complete lesson if ALL validation criteria met, including note requirements

Generate SPECIFIC, ACTIONABLE, DETAILED content for ALL ${days} days. NO GENERIC TEMPLATES.

Focus on creating REAL lesson content that teachers can implement immediately while maintaining the healing-centered educational approach central to the Rootwork Framework.`;
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
      model: 'claude-3-opus-20240229', // UPGRADED: Most capable model for complex educational content
      max_tokens: 8000, // INCREASED: Your detailed requirements need more space
      temperature: 0.1, // LOWERED: More consistent adherence to your strict formatting requirements
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
