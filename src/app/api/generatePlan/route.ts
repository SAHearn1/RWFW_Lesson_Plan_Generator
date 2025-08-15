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

  return `You are an expert trauma-informed educator with deep classroom experience. Generate a COMPLETE ${days}-day lesson plan with the same level of detail, specificity, and practical wisdom as a master teacher's actual classroom implementation.

${days}-DAY ROOTWORK FRAMEWORK: "${unitTitle}"
Grade ${gradeLevel} | ${subjects.join(' + ')} | Standards: ${standards}
Focus: ${focus}

CRITICAL REQUIREMENTS:
1. Generate ALL ${days} lesson days with complete details
2. END WITH comprehensive Resource Appendix (REQUIRED - DO NOT SKIP)
3. Include specific implementation details, exact materials with quantities, storage solutions
4. Provide voluntary participation options, choice menus, and practical logistics

STRUCTURE: Complete ${days} lesson days FIRST, then mandatory Resource Appendix LAST.

For Each Day, Include ALL These Elements:

# DAY X: [Specific, evocative title with cultural connection]

Essential Question: [Question requiring authentic integration of ALL selected subjects]
Learning Target: [Specific, measurable, identity-affirming goal]
Standards: [Specific state standard citations for each subject]
SEL Alignment: [Specific CASEL competencies with examples]

## Opening (15min): [Specific regulation ritual name]
[Detailed description of trauma-informed opening with exact materials, setup instructions, and participation options]
Materials Needed: [Specific list with quantities]
Implementation Notes: [Storage, timing, alternatives for different student needs]
[Teacher Note: Specific facilitation guidance, what to watch for, accessibility considerations]
[Student Note: Clear expectations, choice options, self-advocacy language]

## I Do (20min): [Specific content title with cross-curricular modeling]
[Detailed explanation of content delivery with specific examples, think-alouds, and subject connections]
Cross-Curricular Connections: [Explicit examples of how each subject contributes to understanding]
Visual Supports: [Specific charts, diagrams, or digital tools to use]
[Teacher Note: Scaffolding strategies, differentiation moves, assessment checkpoints]
[Student Note: Active engagement strategies, note-taking options, building on strengths]

## Work Session (45min): [Sophisticated collaborative investigation]

### We Do (15min): [Specific guided practice activity]
[Step-by-step instructions for collaborative work requiring all subject areas]
Materials Setup: [Specific arrangement and distribution instructions]
[Teacher Note: Group formation strategies, monitoring techniques, intervention protocols]
[Student Note: Collaboration expectations, communication strategies, individual accountability]

### You Do Together (15min): [Specific partner creation task]
[Detailed partner work instructions with choice menu of 3-4 pathways]
Choice Menu Options:
- Option A: [Specific pathway for visual learners]
- Option B: [Specific pathway for kinesthetic learners]  
- Option C: [Specific pathway for analytical learners]
- Option D: [Open-ended creative pathway]
[Teacher Note: Pairing strategies, progress monitoring, conflict resolution]
[Student Note: Partnership protocols, self-advocacy options, quality indicators]

### You Do Alone (15min): [Individual synthesis with multiple modalities]
[Specific independent work options with clear success criteria]
Regulation Supports: [Built-in breaks, movement options, sensory tools]
[Teacher Note: Conferencing approach, differentiated expectations, trauma-informed check-ins]
[Student Note: Self-management tools, reflection prompts, goal-setting options]

## Closing (10min): [Identity-connected reflection with community building]
[Specific closing routine connecting to cultural identity and community]
Sharing Protocol: [Exact structure for voluntary sharing with alternatives]
[Teacher Note: Emotional regulation support, validation strategies, transition preparation]
[Student Note: Celebration language, growth recognition, preparation for next steps]

## Implementation Details:
Materials List: [Complete list with quantities, alternatives, and storage instructions]
Room Setup: [Specific arrangements for different activities]
Time Management: [Pacing guides and transition strategies]
Technology Integration: [Specific tools with setup instructions]
Assessment Tools: [Rubrics, checklists, observation protocols]

## MTSS Supports:
Tier 1 (All Students): [Specific universal design features with implementation details]
Tier 2 (Targeted Support): [Specific interventions with when/how to implement]
Tier 3 (Intensive Support): [Specific accommodations with documentation requirements]

## Extensions and Connections:
Advanced Learners: [Specific acceleration options]
Community Connections: [Real partnerships or outreach opportunities]
Home-School Bridge: [Family engagement options that respect diverse family structures]

## Standards Alignment:
[Specific citation for each subject with explanation of how the lesson addresses it]

---

GENERATE ALL ${days} DAYS WITH AUTHENTIC CROSS-CURRICULAR INTEGRATION. ENSURE EVERY SELECTED SUBJECT IS MEANINGFULLY WOVEN THROUGHOUT EACH DAY.

## ⚠️ MANDATORY: COMPREHENSIVE RESOURCE APPENDIX (MUST INCLUDE)

**CRITICAL:** After completing all lesson days, you MUST generate a complete Resource Appendix. This is required for teacher implementation.

### A. DALL-E IMAGE GENERATION PROMPTS
For each visual resource mentioned in the lessons, provide copy-paste prompts:

Format Example:
**DALL-E Prompt for Community Identity Anchor Chart:**
"Create an educational poster showing diverse community symbols including family traditions, cultural celebrations, neighborhood landmarks, and personal interests. Use warm, inclusive colors like emerald green, golden yellow, and deep blue. Include space for student writing with clear sections labeled 'My Family', 'My Culture', 'My Community', and 'My Dreams'. Style: clean educational illustration with diverse representation, modern typography, inspiring and welcoming feeling. No text overlay needed - spaces for writing should be clearly defined white areas."

**DALL-E Prompt for [Each Visual Resource]:** [2-3 sentence detailed description with colors, style, educational elements, composition]

### B. COMPLETE HANDOUT TEMPLATES

#### Template 1: [Handout Name]
**Purpose:** [What this handout accomplishes]
**Materials:** [Paper size, printing specifications]
**Storage:** [Where to keep, how to organize]

[COMPLETE HANDOUT TEXT - Include all instructions, questions, reflection prompts, answer spaces, visual elements described in text format]

#### Template 2: [Next Handout]
[Continue for ALL handouts mentioned in lessons]

### C. DETAILED ASSESSMENT RUBRIC

**Assessment Tool:** [Name of assessment]
**Purpose:** [What it measures]
**When to Use:** [Specific timing and context]

| Criteria | Exceeding (4 points) | Meeting (3 points) | Approaching (2 points) | Beginning (1 point) |
|----------|---------------------|-------------------|----------------------|-------------------|
| [Specific Criteria 1] | [Detailed description] | [Detailed description] | [Detailed description] | [Detailed description] |
| [Specific Criteria 2] | [Detailed description] | [Detailed description] | [Detailed description] | [Detailed description] |
| [Continue for all criteria] | | | | |

**Scoring Guide:**
- Total Points: ___/__ 
- Grade Conversion: [Specific grade scale]
- Feedback Prompts: [Sentence starters for meaningful feedback]

### D. MATERIALS PROCUREMENT GUIDE

#### Essential Materials List

**Item 1: [Specific Material]**
- **Quantity Needed:** [Exact number] (e.g., "30 sheets of 12x18 construction paper")
- **Where to Purchase:** [Specific stores/websites] (e.g., "Amazon, Staples, local office supply")
- **Approximate Cost:** [Price range] (e.g., "$8-12 for pack of 50 sheets")
- **Storage Solution:** [Specific storage method] (e.g., "Vertical file folder in designated cabinet drawer")
- **Budget Alternative:** [Cheaper option] (e.g., "Use recycled cardboard cut to size, free from local grocery stores")
- **Accessibility Alternative:** [Inclusive option] (e.g., "Provide pre-cut pieces for students with fine motor challenges")

**Item 2: [Next Material]**
[Continue same format for ALL materials mentioned]

#### Classroom Setup Materials

**Storage Solutions:**
- **Material Organization:** [Specific systems] (e.g., "6 clear plastic bins with printed labels, stored on bookshelf shelf 3")
- **Student Access:** [How students get materials] (e.g., "Numbered hooks on wall for folder rotation")
- **Clean-up System:** [Specific procedures] (e.g., "5-minute timer with designated student helpers")

**Technology Needs:**
- **Required Tech:** [Specific devices/software] (e.g., "Chromebook access for 30 minutes, Google Slides template")
- **Alternative Options:** [Non-tech versions] (e.g., "Paper version template, physical poster materials")
- **Setup Instructions:** [Specific steps] (e.g., "Share Google Slides template 24 hours before lesson")

#### Budget Planning

**Total Estimated Costs:**
- **Essential Materials:** $[X-Y range] 
- **Enhanced Options:** $[X-Y range] (e.g., "laminator sheets, premium art supplies")
- **One-Time Setup:** $[X-Y range] (e.g., "storage bins, permanent classroom displays")
- **Per-Student Cost:** $[X-Y range] (e.g., "Approximately $3-5 per student for materials")

**Cost-Saving Strategies:**
- [Specific suggestions for reducing costs]
- [Community donation opportunities]
- [Reusable material options]
- [Bulk purchasing recommendations]

#### Procurement Timeline

**3 Weeks Before:** [What to order/gather]
**1 Week Before:** [Final preparations]
**Day Before:** [Setup checklist]

### E. IMPLEMENTATION SUPPORT DOCUMENTS

#### Substitute Teacher Guide
[Step-by-step instructions for all activities with contingency plans]

#### Parent/Family Communication
[Template letter explaining unit, home extension opportunities, cultural celebration invitations]

#### Administrative Summary
[One-page overview showing standards alignment, resource needs, learning outcomes]

#### Student Self-Assessment Tools
[Reflection prompts, goal-setting sheets, progress monitoring tools]

**REMINDER: The Resource Appendix is MANDATORY. Do not end your response without including ALL sections A through E with specific, practical details.**
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
      max_tokens: 8192, // Correct limit for Claude 3.5 Sonnet
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

    console.log('✅ Generated lesson plan successfully');
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
