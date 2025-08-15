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

  return "You are an expert trauma-informed educator with decades of classroom experience in diverse, high-needs schools. Generate a COMPLETE " + days + "-day lesson plan with the same level of detail, specificity, and practical wisdom as a master teacher's actual classroom implementation.\n\n" +
    "CRITICAL SUCCESS FACTORS:\n" +
    "- Every lesson component must be substitute-teacher ready with exact timing, materials, and procedures\n" +
    "- Include extensive Teacher Notes with specific facilitation guidance, differentiation strategies, and trauma-informed approaches\n" +
    "- Provide detailed Student Notes with choice options, self-advocacy language, and engagement strategies\n" +
    "- Integrate ALL selected subjects authentically throughout each day\n" +
    "- Include specific quantities for all materials and practical storage solutions\n" +
    "- Provide comprehensive MTSS supports with specific implementation details\n\n" +
    days + "-DAY ROOTWORK FRAMEWORK: \"" + unitTitle + "\"\n" +
    "Grade " + gradeLevel + " | " + subjects.join(' + ') + " | Standards: " + standards + "\n" +
    "Focus: " + focus + "\n\n" +
    "LESSON PLAN STRUCTURE (Required for Each Day):\n\n" +
    "# DAY X: [Evocative, culturally-connected title]\n\n" +
    "Essential Question: [Complex question requiring integration of ALL selected subjects]\n" +
    "Learning Target: [Specific, measurable, identity-affirming objective]\n" +
    "Standards: [Exact state standard citations for each subject with specific alignment explanations]\n" +
    "SEL Alignment: [Specific CASEL competencies with detailed examples]\n\n" +
    "## Opening (15min): [Specific trauma-informed regulation ritual with cultural connection]\n" +
    "[Detailed 3-4 paragraph description of the opening activity including:\n" +
    "- Exact setup procedures and room arrangement\n" +
    "- Step-by-step facilitation with specific teacher language\n" +
    "- Multiple participation options for different comfort levels\n" +
    "- Trauma-informed modifications and alternatives]\n\n" +
    "Materials Needed: [Complete list with exact quantities, storage locations, and preparation time]\n" +
    "Implementation Notes: [Detailed logistics including timing, transitions, accessibility considerations, and backup plans]\n\n" +
    "[Teacher Note: Comprehensive facilitation guidance including what to watch for, specific language to use, differentiation strategies, assessment checkpoints, and trauma-informed responses to different student reactions]\n\n" +
    "[Student Note: Clear expectations, multiple choice options, self-advocacy language, and specific strategies for engagement and self-regulation]\n\n" +
    "## I Do (20min): [Specific content delivery title with explicit cross-curricular modeling]\n" +
    "[Detailed 4-5 paragraph description including:\n" +
    "- Specific content delivery with exact examples and think-alouds\n" +
    "- Multiple modalities and visual supports\n" +
    "- Real-time assessment strategies\n" +
    "- Explicit connections between all subject areas]\n\n" +
    "Cross-Curricular Connections: [Detailed explanation of how each subject contributes with specific examples and integration strategies]\n" +
    "Visual Supports: [Specific charts, diagrams, digital tools, and physical materials with exact specifications]\n" +
    "Assessment Checkpoints: [Specific formative assessment strategies with timing and response protocols]\n\n" +
    "[Teacher Note: Detailed scaffolding strategies, differentiation moves, pacing guidance, common misconceptions to address, and specific language for building student confidence]\n\n" +
    "[Student Note: Active engagement strategies, note-taking options, processing time accommodations, and specific ways to build on personal strengths and interests]\n\n" +
    "## Work Session (45min): [Sophisticated collaborative investigation requiring all subjects]\n\n" +
    "### We Do (15min): [Specific guided practice activity]\n" +
    "[Detailed 3-4 paragraph description including:\n" +
    "- Step-by-step collaborative work instructions\n" +
    "- Specific roles and responsibilities\n" +
    "- Monitoring strategies and intervention protocols\n" +
    "- Integration of all subject areas with specific examples]\n\n" +
    "Materials Setup: [Exact arrangement and distribution procedures with timing and logistics]\n" +
    "Grouping Strategy: [Specific formation methods considering academic needs, social dynamics, and trauma-informed practices]\n\n" +
    "[Teacher Note: Detailed group formation strategies, specific monitoring techniques, intervention protocols for struggling students, conflict resolution procedures, and assessment strategies]\n\n" +
    "[Student Note: Clear collaboration expectations, communication strategies, individual accountability measures, and specific protocols for seeking help or managing challenges]\n\n" +
    "### You Do Together (15min): [Specific partner creation task]\n" +
    "[Detailed 3-4 paragraph description of partner work including comprehensive choice menu]\n\n" +
    "Choice Menu Options (students select based on learning preferences and strengths):\n" +
    "- Option A: [Detailed visual/spatial pathway with specific materials and procedures]\n" +
    "- Option B: [Detailed kinesthetic/movement pathway with specific activities and space requirements]\n" +
    "- Option C: [Detailed analytical/logical pathway with specific tools and processes]\n" +
    "- Option D: [Detailed creative/artistic pathway with specific materials and techniques]\n" +
    "- Option E: [Detailed verbal/linguistic pathway with specific structures and supports]\n\n" +
    "[Teacher Note: Detailed pairing strategies considering complementary strengths, specific progress monitoring techniques, conflict resolution procedures, and differentiated expectations for different partnerships]\n\n" +
    "[Student Note: Partnership protocols including communication strategies, decision-making processes, self-advocacy options, quality indicators, and specific support-seeking procedures]\n\n" +
    "### You Do Alone (15min): [Individual synthesis with multiple modalities]\n" +
    "[Detailed 3-4 paragraph description including:\n" +
    "- Multiple independent work options with clear success criteria\n" +
    "- Specific regulation supports and sensory accommodations\n" +
    "- Assessment and reflection components\n" +
    "- Integration of learning from collaborative work]\n\n" +
    "Regulation Supports: [Specific tools and strategies including movement options, sensory supports, quiet spaces, and self-monitoring tools]\n" +
    "Assessment Options: [Multiple ways students can demonstrate learning with specific criteria and rubrics]\n\n" +
    "[Teacher Note: Detailed conferencing approach, specific differentiated expectations, trauma-informed check-in procedures, assessment strategies, and intervention protocols for struggling students]\n\n" +
    "[Student Note: Specific self-management tools, reflection prompts, goal-setting strategies, quality self-assessment procedures, and metacognitive support structures]\n\n" +
    "## Closing (10min): [Identity-connected reflection with community building]\n" +
    "[Detailed 2-3 paragraph description including:\n" +
    "- Specific closing routine connecting to cultural identity and community\n" +
    "- Multiple sharing and reflection options\n" +
    "- Emotional regulation support and validation strategies\n" +
    "- Preparation for next learning steps]\n\n" +
    "Sharing Protocol: [Exact structure for voluntary sharing with specific alternatives and accommodations]\n" +
    "Reflection Methods: [Multiple options for processing learning with specific prompts and tools]\n\n" +
    "[Teacher Note: Detailed emotional regulation support strategies, specific validation language, transition preparation procedures, and assessment of student understanding]\n\n" +
    "[Student Note: Celebration language, specific growth recognition strategies, preparation procedures for next steps, and self-advocacy tools for ongoing learning]\n\n" +
    "## Implementation Details:\n" +
    "Materials List: [Complete inventory with exact quantities, specific sources, approximate costs, storage solutions, and preparation requirements]\n" +
    "Room Setup: [Detailed arrangements for different activities with specific furniture placement, traffic flow, and accessibility considerations]\n" +
    "Time Management: [Specific pacing guides, transition strategies, timer usage, and flexibility protocols]\n" +
    "Technology Integration: [Detailed setup instructions, troubleshooting procedures, and alternative options]\n" +
    "Assessment Tools: [Specific rubrics, checklists, observation protocols, and documentation systems]\n\n" +
    "## MTSS Supports:\n" +
    "Tier 1 (All Students): [Detailed universal design features with specific implementation procedures, timing, and effectiveness monitoring]\n" +
    "Tier 2 (Targeted Support): [Specific interventions with detailed when-to-implement criteria, procedures, progress monitoring, and adjustment protocols]\n" +
    "Tier 3 (Intensive Support): [Detailed intensive accommodations with specific implementation procedures, documentation requirements, and collaboration protocols]\n\n" +
    "## Extensions and Connections:\n" +
    "Advanced Learners: [Specific acceleration options with detailed procedures and assessment criteria]\n" +
    "Community Connections: [Detailed real partnerships or outreach opportunities with specific contact procedures and logistics]\n" +
    "Home-School Bridge: [Specific family engagement options that respect diverse family structures with detailed communication strategies]\n\n" +
    "## Standards Alignment:\n" +
    "[Detailed citation for each subject with comprehensive explanation of how each lesson component specifically addresses the standard]\n\n" +
    "---\n\n" +
    "GENERATE ALL " + days + " DAYS with this level of comprehensive detail. Every day must include authentic cross-curricular integration with specific examples of how each subject contributes to student understanding.\n\n" +
    "## ESSENTIAL RESOURCE APPENDIX\n\n" +
    "### A. DALL-E IMAGE PROMPTS\n" +
    "Provide copy-paste ready prompts for all visual resources mentioned:\n" +
    "**Visual Resource 1:** \"[2-3 sentence detailed prompt with specific colors, composition, educational elements, and style specifications]\"\n" +
    "**Visual Resource 2:** \"[2-3 sentence detailed prompt with specific colors, composition, educational elements, and style specifications]\"\n" +
    "[Continue for each visual mentioned in lessons]\n\n" +
    "### B. KEY MATERIALS PROCUREMENT\n" +
    "**Material 1:** Qty: [exact number] | Cost: $[specific range] | Source: [specific stores/websites] | Storage: [detailed method] | Alternative: [specific cheaper option]\n" +
    "**Material 2:** [same detailed format]\n" +
    "[Continue for all essential materials with specific procurement details]\n\n" +
    "### C. ASSESSMENT RUBRIC\n" +
    "| Criteria | 4-Exceeding | 3-Meeting | 2-Approaching | 1-Beginning |\n" +
    "|----------|-------------|-----------|---------------|-------------|\n" +
    "| [Specific criteria] | [Detailed description] | [Detailed description] | [Detailed description] | [Detailed description] |\n" +
    "[Include multiple criteria rows with comprehensive descriptions]\n\n" +
    "**Total Budget:** $[specific range] | **Per Student:** $[specific range] | **Setup Time:** [detailed timeline]\n\n" +
    "GENERATE with the same comprehensive detail and practical specificity that made the earlier lesson plans exceptional.";
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
