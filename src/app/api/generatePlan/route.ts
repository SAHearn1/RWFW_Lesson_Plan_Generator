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

  return "You are an expert trauma-informed educator with decades of classroom experience. Generate a COMPLETE " + days + "-day lesson plan with master teacher-level detail and practical wisdom.\n\n" +
    "CRITICAL SUCCESS FACTORS:\n" +
    "- Every component must be substitute-teacher ready with exact timing and materials\n" +
    "- Include comprehensive Teacher Notes and Student Notes for each section\n" +
    "- Integrate ALL selected subjects authentically throughout each day\n" +
    "- Provide specific quantities for materials and practical storage solutions\n" +
    "- Include detailed MTSS supports with implementation guidance\n" +
    "- MUST end with complete Resource Appendix\n\n" +
    days + "-DAY ROOTWORK FRAMEWORK: \"" + unitTitle + "\"\n" +
    "Grade " + gradeLevel + " | " + subjects.join(' + ') + " | Standards: " + standards + "\n" +
    "Focus: " + focus + "\n\n" +
    "LESSON STRUCTURE (Required for Each Day):\n\n" +
    "# DAY X: [Culturally-connected title]\n\n" +
    "Essential Question: [Complex question integrating ALL subjects]\n" +
    "Learning Target: [Specific, measurable, identity-affirming objective]\n" +
    "Standards: [Exact citations for each subject]\n" +
    "SEL Alignment: [Specific CASEL competencies with examples]\n\n" +
    "## Opening (15min): [Trauma-informed regulation ritual]\n" +
    "[Detailed 3-paragraph description with setup, facilitation, and participation options]\n" +
    "Materials Needed: [Complete list with quantities and storage]\n" +
    "[Teacher Note: Comprehensive facilitation guidance, differentiation strategies, and trauma-informed responses]\n" +
    "[Student Note: Clear expectations, choice options, and self-advocacy language]\n\n" +
    "## I Do (20min): [Cross-curricular content delivery]\n" +
    "[Detailed 3-paragraph description with content delivery, examples, and subject connections]\n" +
    "Cross-Curricular Connections: [Specific examples for each subject]\n" +
    "Visual Supports: [Specific charts and tools]\n" +
    "[Teacher Note: Scaffolding strategies, assessment checkpoints, and differentiation]\n" +
    "[Student Note: Engagement strategies, note-taking options, and strength-building]\n\n" +
    "## Work Session (45min): [Collaborative investigation]\n\n" +
    "### We Do (15min): [Guided practice]\n" +
    "[Detailed instructions for collaborative work with all subjects]\n" +
    "Materials Setup: [Specific arrangement procedures]\n" +
    "[Teacher Note: Group formation, monitoring, and intervention protocols]\n" +
    "[Student Note: Collaboration expectations and communication strategies]\n\n" +
    "### You Do Together (15min): [Partner creation]\n" +
    "[Detailed partner work with comprehensive choice menu]\n" +
    "Choice Menu Options:\n" +
    "- Option A: [Visual/spatial pathway with materials]\n" +
    "- Option B: [Kinesthetic pathway with activities]\n" +
    "- Option C: [Analytical pathway with tools]\n" +
    "- Option D: [Creative pathway with techniques]\n" +
    "[Teacher Note: Pairing strategies and progress monitoring]\n" +
    "[Student Note: Partnership protocols and quality indicators]\n\n" +
    "### You Do Alone (15min): [Individual synthesis]\n" +
    "[Detailed independent work with regulation supports]\n" +
    "Regulation Supports: [Movement options, sensory tools, quiet spaces]\n" +
    "[Teacher Note: Conferencing approach and trauma-informed check-ins]\n" +
    "[Student Note: Self-management tools and reflection prompts]\n\n" +
    "## Closing (10min): [Identity-connected reflection]\n" +
    "[Detailed closing routine with community building]\n" +
    "Sharing Protocol: [Voluntary sharing with alternatives]\n" +
    "[Teacher Note: Emotional regulation support and transition preparation]\n" +
    "[Student Note: Celebration language and growth recognition]\n\n" +
    "## Implementation Details:\n" +
    "Materials List: [Complete inventory with quantities, costs, and storage]\n" +
    "Room Setup: [Detailed arrangements for activities]\n" +
    "Time Management: [Pacing guides and transition strategies]\n" +
    "Assessment Tools: [Rubrics, checklists, and protocols]\n\n" +
    "## MTSS Supports:\n" +
    "Tier 1: [Universal design features with implementation]\n" +
    "Tier 2: [Targeted interventions with criteria]\n" +
    "Tier 3: [Intensive accommodations with procedures]\n\n" +
    "## Extensions and Standards:\n" +
    "Advanced Learners: [Acceleration options]\n" +
    "Community Connections: [Real partnerships]\n" +
    "Standards Alignment: [Citation and explanation for each subject]\n\n" +
    "---\n\n" +
    "GENERATE ALL " + days + " DAYS with this comprehensive detail, ensuring authentic cross-curricular integration.\n\n" +
    "## ESSENTIAL RESOURCE APPENDIX (REQUIRED)\n\n" +
    "### A. DALL-E IMAGE PROMPTS\n" +
    "**Visual Resource 1:** \"[2-sentence prompt with colors, style, educational elements]\"\n" +
    "**Visual Resource 2:** \"[2-sentence prompt with colors, style, educational elements]\"\n" +
    "[Continue for each visual mentioned]\n\n" +
    "### B. KEY MATERIALS PROCUREMENT\n" +
    "**Material 1:** Qty: [exact number] | Cost: $[range] | Source: [store] | Storage: [method] | Alternative: [option]\n" +
    "**Material 2:** [same format]\n" +
    "[Continue for all essential materials]\n\n" +
    "### C. ASSESSMENT RUBRIC\n" +
    "| Criteria | Exceeding (4) | Meeting (3) | Approaching (2) | Beginning (1) |\n" +
    "|----------|---------------|-------------|-----------------|---------------|\n" +
    "| [Criteria] | [Description] | [Description] | [Description] | [Description] |\n\n" +
    "**Budget:** $[range] | **Per Student:** $[range] | **Setup:** [timeline]\n\n" +
    "CRITICAL: Complete ALL sections including full Resource Appendix for teacher implementation success.";
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

    // Check if Resource Appendix was generated - improved detection
    const hasResourceAppendix = lessonPlan.includes('RESOURCE APPENDIX') || 
                                lessonPlan.includes('RESOURCE GENERATION APPENDIX') ||
                                lessonPlan.includes('DALL-E') || 
                                lessonPlan.includes('MATERIALS PROCUREMENT') ||
                                lessonPlan.includes('A. DALL-E IMAGE PROMPTS') ||
                                lessonPlan.includes('B. KEY MATERIALS PROCUREMENT');

    console.log('Generated lesson plan successfully');
    console.log('Lesson plan length:', lessonPlan.length);
    console.log('Resource Appendix included:', hasResourceAppendix);

    // If Resource Appendix is missing, add a note
    let finalLessonPlan = lessonPlan;
    if (!hasResourceAppendix) {
      finalLessonPlan += "\n\n## RESOURCE APPENDIX NOTICE\n\n" +
        "The complete Resource Appendix with detailed procurement guides was not fully generated due to length constraints.\n" +
        "Your lesson plan is complete and ready for implementation. For the full Resource Appendix with:\n" +
        "- Copy-paste DALL-E image generation prompts\n" +
        "- Detailed materials procurement with costs and alternatives\n" +
        "- Complete assessment rubrics\n\n" +
        "**Quick Resource Guide:**\n" +
        "- **Basic Materials:** Construction paper, markers, poster board, sticky notes\n" +
        "- **Technology:** Chromebooks/tablets, Google Slides, projection screen\n" +
        "- **Storage:** Clear bins with labels, numbered hooks for organization\n" +
        "- **Budget:** Approximately $3-8 per student for basic supplies\n\n" +
        "Contact support at hearn.sa@gmail.com for the complete Resource Appendix or try generating a shorter lesson plan for full appendix inclusion.";
    }

    return NextResponse.json({
      ok: true,
      lessonPlan: finalLessonPlan,
      markdown: finalLessonPlan,
      plan: {
        markdown: finalLessonPlan,
        meta: {
          title: unitTitle,
          gradeLevel: gradeLevel,
          subject: subjects.join(', '),
          days: days,
          hasResourceAppendix: hasResourceAppendix
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
        error: "The AI model returned an error (Status: " + error.status + ").",
        details: error.message
      }, { status: 502 });
    }

    return NextResponse.json({
      error: 'An internal server error occurred.',
      details: error.message
    }, { status: 500 });
  }
}
