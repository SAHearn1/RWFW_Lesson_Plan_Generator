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

  return "You are an expert trauma-informed educator with deep classroom experience. Generate a COMPLETE " + days + "-day lesson plan with the same level of detail, specificity, and practical wisdom as a master teacher's actual classroom implementation.\n\n" +
    days + "-DAY ROOTWORK FRAMEWORK: \"" + unitTitle + "\"\n" +
    "Grade " + gradeLevel + " | " + subjects.join(' + ') + " | Standards: " + standards + "\n" +
    "Focus: " + focus + "\n\n" +
    "CRITICAL: Include specific implementation details, exact materials with quantities, storage solutions, voluntary participation options, choice menus, and practical logistics that a substitute teacher could follow.\n\n" +
    "For Each Day, Include ALL These Elements:\n\n" +
    "# DAY X: [Specific, evocative title with cultural connection]\n\n" +
    "Essential Question: [Question requiring authentic integration of ALL selected subjects]\n" +
    "Learning Target: [Specific, measurable, identity-affirming goal]\n" +
    "Standards: [Specific state standard citations for each subject]\n" +
    "SEL Alignment: [Specific CASEL competencies with examples]\n\n" +
    "## Opening (15min): [Specific regulation ritual name]\n" +
    "[Detailed description of trauma-informed opening with exact materials, setup instructions, and participation options]\n" +
    "Materials Needed: [Specific list with quantities]\n" +
    "Implementation Notes: [Storage, timing, alternatives for different student needs]\n" +
    "[Teacher Note: Specific facilitation guidance, what to watch for, accessibility considerations]\n" +
    "[Student Note: Clear expectations, choice options, self-advocacy language]\n\n" +
    "## I Do (20min): [Specific content title with cross-curricular modeling]\n" +
    "[Detailed explanation of content delivery with specific examples, think-alouds, and subject connections]\n" +
    "Cross-Curricular Connections: [Explicit examples of how each subject contributes to understanding]\n" +
    "Visual Supports: [Specific charts, diagrams, or digital tools to use]\n" +
    "[Teacher Note: Scaffolding strategies, differentiation moves, assessment checkpoints]\n" +
    "[Student Note: Active engagement strategies, note-taking options, building on strengths]\n\n" +
    "## Work Session (45min): [Sophisticated collaborative investigation]\n\n" +
    "### We Do (15min): [Specific guided practice activity]\n" +
    "[Step-by-step instructions for collaborative work requiring all subject areas]\n" +
    "Materials Setup: [Specific arrangement and distribution instructions]\n" +
    "[Teacher Note: Group formation strategies, monitoring techniques, intervention protocols]\n" +
    "[Student Note: Collaboration expectations, communication strategies, individual accountability]\n\n" +
    "### You Do Together (15min): [Specific partner creation task]\n" +
    "[Detailed partner work instructions with choice menu of 3-4 pathways]\n" +
    "Choice Menu Options:\n" +
    "- Option A: [Specific pathway for visual learners]\n" +
    "- Option B: [Specific pathway for kinesthetic learners]\n" +
    "- Option C: [Specific pathway for analytical learners]\n" +
    "- Option D: [Open-ended creative pathway]\n" +
    "[Teacher Note: Pairing strategies, progress monitoring, conflict resolution]\n" +
    "[Student Note: Partnership protocols, self-advocacy options, quality indicators]\n\n" +
    "### You Do Alone (15min): [Individual synthesis with multiple modalities]\n" +
    "[Specific independent work options with clear success criteria]\n" +
    "Regulation Supports: [Built-in breaks, movement options, sensory tools]\n" +
    "[Teacher Note: Conferencing approach, differentiated expectations, trauma-informed check-ins]\n" +
    "[Student Note: Self-management tools, reflection prompts, goal-setting options]\n\n" +
    "## Closing (10min): [Identity-connected reflection with community building]\n" +
    "[Specific closing routine connecting to cultural identity and community]\n" +
    "Sharing Protocol: [Exact structure for voluntary sharing with alternatives]\n" +
    "[Teacher Note: Emotional regulation support, validation strategies, transition preparation]\n" +
    "[Student Note: Celebration language, growth recognition, preparation for next steps]\n\n" +
    "## Implementation Details:\n" +
    "Materials List: [Complete list with quantities, alternatives, and storage instructions]\n" +
    "Room Setup: [Specific arrangements for different activities]\n" +
    "Time Management: [Pacing guides and transition strategies]\n" +
    "Technology Integration: [Specific tools with setup instructions]\n" +
    "Assessment Tools: [Rubrics, checklists, observation protocols]\n\n" +
    "## MTSS Supports:\n" +
    "Tier 1 (All Students): [Specific universal design features with implementation details]\n" +
    "Tier 2 (Targeted Support): [Specific interventions with when/how to implement]\n" +
    "Tier 3 (Intensive Support): [Specific accommodations with documentation requirements]\n\n" +
    "## Extensions and Connections:\n" +
    "Advanced Learners: [Specific acceleration options]\n" +
    "Community Connections: [Real partnerships or outreach opportunities]\n" +
    "Home-School Bridge: [Family engagement options that respect diverse family structures]\n\n" +
    "## Standards Alignment:\n" +
    "[Specific citation for each subject with explanation of how the lesson addresses it]\n\n" +
    "---\n\n" +
    "GENERATE ALL " + days + " DAYS WITH AUTHENTIC CROSS-CURRICULAR INTEGRATION. ENSURE EVERY SELECTED SUBJECT IS MEANINGFULLY WOVEN THROUGHOUT EACH DAY.\n\n" +
    "## ESSENTIAL RESOURCE APPENDIX\n\n" +
    "### A. DALL-E IMAGE PROMPTS\n" +
    "**Visual 1:** \"[2-sentence prompt with colors, style, educational elements]\"\n" +
    "**Visual 2:** \"[2-sentence prompt with colors, style, educational elements]\"\n" +
    "[Include for each visual mentioned in lessons]\n\n" +
    "### B. KEY MATERIALS PROCUREMENT\n" +
    "**Material 1:** Qty: [number] | Cost: $[range] | Source: [store] | Storage: [method] | Alternative: [cheaper option]\n" +
    "**Material 2:** [same format]\n" +
    "[Continue for essential materials]\n\n" +
    "### C. ASSESSMENT RUBRIC\n" +
    "| Criteria | 4-Exceeding | 3-Meeting | 2-Approaching | 1-Beginning |\n" +
    "|----------|-------------|-----------|---------------|-------------|\n" +
    "| [Key criteria] | [Brief description] | [Brief description] | [Brief description] | [Brief description] |\n\n" +
    "**Total Budget:** $[range] | **Per Student:** $[range] | **Setup Time:** [timeline]\n\n" +
    "PRIORITIZE: Maintain full lesson detail, include essential practical resources for immediate implementation.";
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

    // Check if Resource Appendix was generated
    const hasResourceAppendix = lessonPlan.includes('RESOURCE APPENDIX') || 
                                lessonPlan.includes('DALL-E') || 
                                lessonPlan.includes('MATERIALS PROCUREMENT');

    console.log('Generated lesson plan successfully');
    console.log('Lesson plan length:', lessonPlan.length);
    console.log('Resource Appendix included:', hasResourceAppendix);

    // If Resource Appendix is missing, add a note
    let finalLessonPlan = lessonPlan;
    if (!hasResourceAppendix) {
      finalLessonPlan += "\n\n## WARNING: RESOURCE APPENDIX GENERATION NOTICE\n\n" +
        "The complete Resource Appendix was not fully generated due to length constraints.\n" +
        "To get your complete Resource Appendix with:\n" +
        "- DALL-E image generation prompts\n" +
        "- Complete handout templates\n" +
        "- Assessment rubrics\n" +
        "- Materials procurement guide with costs and quantities\n\n" +
        "**Recommended Action:** Try generating a shorter lesson plan (1-2 days) or contact support for the complete resource package.\n\n" +
        "**Quick Resource Guide:**\n" +
        "- **Basic Materials:** Construction paper, markers, poster board, sticky notes\n" +
        "- **Technology:** Chromebooks/tablets for research, Google Slides for presentations\n" +
        "- **Storage:** Clear bins with labels, numbered hooks for organization\n" +
        "- **Budget:** Approximately $3-8 per student for basic materials\n\n" +
        "For immediate implementation, use this lesson plan and source materials locally. The complete Resource Appendix with specific quantities, costs, and DALL-E prompts can be generated separately.";
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
