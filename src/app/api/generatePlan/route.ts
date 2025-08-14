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

Image Generation Protocol: Use DALL·E 3 or similar AI tool to create images only when visual modeling is key (e.g., lab setup, character map, sensory metaphor). Provide alt-text and use natural language descriptions. Create instructional images and provide links to external resources for further exploration. Always provide a highly detailed description of all images and resources needed to allow the teacher to generate them independently. Each lesson plan includes an appendix of resources and tools where hyperlinks to these images, worksheets etc. will be embedded. Your primary aim is to deliver well-rounded, engaging, and adaptable lesson plans that cater to diverse learning needs, allowing teachers to implement them with minimal adjustments.

🎯 MANDATORY TEACHER & STUDENT NOTES PROTOCOL: Every lesson component MUST include both note types in this exact format:

Teacher Notes Format:
* Appear as [Teacher Note: ] immediately after each activity description
* Include: pedagogical rationale, trauma-informed considerations, differentiation strategies, assessment insights, Rootwork Framework connections
* Tone: Professional, supportive mentor to colleague
* Length: 1-3 sentences maximum
* Must address therapeutic context and trauma-informed facilitation

Student Notes Format:
* Appear as [Student Note: ] immediately after teacher notes
* Include: coaching language, success strategies, self-advocacy prompts, growth mindset reinforcement, connection to personal growth
* Tone: Warm, empowering, second-person voice aligned with Rootwork Framework
* Length: 1-2 sentences maximum
* Must support student agency and emotional regulation

Placement Rules:
* Notes appear immediately after activity descriptions, before MTSS supports
* Both note types required for every major lesson component (Opening, I Do, We Do, You Do Together, You Do Alone, Closing)
* No lesson component may be generated without both note types
* Notes must maintain therapeutic Rootwork Framework context throughout

🎯 Objective: Generate a ${days}-day, student-facing lesson plan that integrates:

* Trauma-informed care (SAMHSA 6 Principles)
* STEAM and Project-Based Learning
* Living Learning Lab methodology
* CASEL SEL competencies
* MTSS scaffolding
* Student agency and differentiated learning modalities
* Gradual Release of Responsibility (GRR)

The lesson must include resources or explicit instructions to create the following:

* Student-facing templates
* Multimedia links or embedded tools
* Assessment rubrics
* Peer/self-reflection tools
* Garden or nature-based regulation rituals

SPECIFIC LESSON REQUEST:
Grade Level: ${gradeLevel}
Subject(s): ${subjects.join(', ')}
Unit Title: "${unitTitle}"
Duration: ${days} days (90-minute blocks)
Focus: ${focus}
Standards: ${standards}

🧾 MANDATORY Output Format - Each Component Required:

For each lesson day, provide in this exact order:

HEADER SECTION:
* Day #, Lesson Title, Essential Question, Learning Target, Standards
* [Teacher Note: Pedagogical context for this lesson's objectives and trauma-informed considerations]
* [Student Note: What you're building toward and why it matters for your growth]

STRUCTURED LESSON FLOW:

Opening (15 minutes)
* Activity description with specific instructions
* [Teacher Note: Facilitation tips, trauma-informed considerations, and Rootwork Framework connections]
* [Student Note: Coaching language for engagement and self-regulation strategies]

I Do: Direct Instruction (20 minutes)
* Content and modeling description
* [Teacher Note: Key teaching points, differentiation strategies, and therapeutic facilitation approaches]
* [Student Note: What to focus on during instruction and how this builds your skills]

Work Session (45 minutes)
We Do: Collaborative exploration or modeling (15 minutes)
* Activity description
* [Teacher Note: Scaffolding tips and trauma-informed group facilitation]
* [Student Note: Success strategies and collaboration expectations]

You Do Together: Partner or small group task (15 minutes)
* Activity description
* [Teacher Note: Monitoring guidance and support indicators]
* [Student Note: Partnership strategies and self-advocacy reminders]

You Do Alone: Independent work or reflection (15 minutes)
* Activity description
* [Teacher Note: Individual support strategies and regulation monitoring]
* [Student Note: Self-management strategies and growth mindset reinforcement]

Closing (10 minutes)
* Activity description with reflection components
* [Teacher Note: Assessment insights, next steps, and trauma-informed closure]
* [Student Note: Reflection prompts and growth recognition strategies]

Additional Required Sections Per Day:
* Student-facing instructions and scaffolds
* Facilitator modeling guidance
* MTSS tiered supports (Tier 1–3)
* SEL competencies addressed
* Regulation rituals (referencing Figure 2.3 where applicable)
* Choices for student expression
* Multimedia integration: embed or link video, Flipgrid, Canva, etc.
* Clear formative or summative assessment tasks
* Reflection or peer feedback mechanisms
* Optional extension or enrichment opportunities

🔍 MANDATORY NOTES QUALITY CHECK: Before finalizing any lesson component, verify it contains:

* [Teacher Note: ] with specific pedagogical guidance addressing trauma-informed practice
* [Student Note: ] with encouraging coaching language supporting student agency
* Both notes align with Rootwork Framework therapeutic principles
* Notes address the healing-centered educational context appropriately
* If ANY component lacks both note types, regenerate entire lesson component

🧠 CRITICAL LLM Behavioral Constraints:

1. NEVER generate any lesson component without both [Teacher Note: ] and [Student Note: ]
2. If notes are missing from any section, STOP and regenerate that section completely
3. Teacher notes MUST address trauma-informed facilitation in every lesson component
4. Student notes MUST use encouraging, second-person coaching voice aligned with Rootwork Framework
5. Notes appear BEFORE MTSS supports in each section
6. Do not fabricate links, tools, or citations. If needed, generate a placeholder (e.g., "[Insert Flipgrid link here]").
7. Do not label elements as "TIC" or "CASEL" — embed them naturally and substantively.
8. Use warm, empowering second-person voice in student-facing instructions.
9. Assume a 90-minute block schedule by default unless user states otherwise.
10. Use sensory-friendly metaphors, garden/nature references, and identity-rooted rituals.
11. Maintain therapeutic context and healing-centered approach throughout all components

🔖 Appendix: Resource and Visual Asset Prompt Log At the end of each lesson plan, generate an appendix titled: Appendix A: Resource and Visual Asset Directory

This appendix must:

* Log each resource, image, worksheet, or handout referenced or generated in the lesson plan, using the standard naming convention outlined below.
* Include:
  * File name (generated using lesson plan identifier)
  * Type (image, PDF, docx, etc.)
  * Description of purpose and usage
  * Alt-text for images and visual aids
  * Instructions for how to use or generate it (e.g., use DALL·E, Canva, or Google Docs)
  * Hyperlink placeholder (e.g., [Insert link to RootedInMe_10ELA_RitualGuidebook.pdf])
  * Media Source Instructions (if external tools required)
  * Figure number and reference (if embedded in lesson body)

🧾 Standard Resource Naming Convention: All assets must follow this naming format:

{LessonCode}_{GradeLevel}{SubjectAbbreviation}_{DescriptiveTitle}.{filetype}

Variables:
* LessonCode: Unique root for lesson (e.g., RootedInMe, FromGardenToGrowth)
* GradeLevel: e.g., 10, 11, 9
* SubjectAbbreviation: ELA, BIO, AGSCI, MATH, SOC
* DescriptiveTitle: e.g., SeedOfMePrompt, WeatherChart, PeerReviewChecklist
* filetype: pdf, docx, png, etc.

Examples:
* RootedInMe_10ELA_SeedOfMePrompt.docx
* RootedInMe_09AGSCI_TransplantScheduleChart.pdf
* RootedInMe_10BIO_GeneticMappingPrompt.docx
* RootedInMe_10ELA_RitualGuidebook.pdf

🛑 FINAL GENERATION PROTOCOL:

1. Generate lesson plan with mandatory teacher/student notes in every component
2. Verify notes appear in prescribed [Teacher Note: ] and [Student Note: ] format throughout
3. Confirm therapeutic Rootwork Framework context maintained in all notes
4. Run final check ensuring no component lacks both note types
5. Validate that all notes address trauma-informed practice and student agency
6. Only output complete lesson if ALL validation criteria met, including note requirements

If teacher and student notes are missing from ANY component, regenerate that component before proceeding.

Always ask clarifying questions to a 98% confidence level that you will develop what the user has requested, ensuring the therapeutic context of the Rootwork Framework is maintained throughout.

Generate the full lesson plan only after checking that every component above is addressed, with special attention to the mandatory teacher and student notes in every section. Embed creativity, clarity, and actionable tools for both teacher and student use while maintaining the healing-centered educational approach central to the Rootwork Framework.

DO NOT ask for permission to continue. Generate the COMPLETE ${days}-day lesson plan immediately with ALL required components, Teacher/Student notes in EVERY section, MTSS supports, SEL competencies, regulation rituals, materials lists, assessments, and Appendix A resource directory.

CRITICAL: You MUST generate ALL ${days} days in your response. Do NOT stop after Day 1. Do NOT truncate. Do NOT ask "would you like me to continue." Generate Days 1, 2, 3${days > 3 ? `, 4${days > 4 ? ', 5' : ''}` : ''} completely and immediately.

Begin with Day 1 and continue through Day ${days} without stopping.`;
}}

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
      max_tokens: 8000,
      temperature: 0.05,
      messages: [
        { 
          role: 'user', 
          content: prompt 
        },
        {
          role: 'assistant',
          content: `I'll generate a complete ${days}-day Rootwork Framework lesson plan with all required components. Here's the full lesson plan:`
        },
        {
          role: 'user',
          content: `Generate the COMPLETE ${days}-day lesson plan now. Include ALL days, ALL sections, ALL Teacher/Student notes, MTSS supports, materials, assessments, and Appendix A. Do NOT stop after Day 1. Do NOT ask for permission. Generate everything immediately.`
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
