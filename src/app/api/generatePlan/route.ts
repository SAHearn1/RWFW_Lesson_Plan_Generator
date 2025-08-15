// FILE PATH: src/app/api/generatePlan/route.ts
// Copy this entire file to: src/app/api/generatePlan/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90; // Conservative timeout

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

function createWorkingPrompt(input: GeneratePlanInput): string {
  const days = input.days || input.duration || 3;
  const gradeLevel = input.gradeLevel || '9th Grade';
  const subjects = input.subjects || ['English Language Arts'];
  const unitTitle = input.unitTitle || 'Cultural Identity and Expression';
  const standards = input.standards || 'Relevant state standards';
  const focus = input.focus || 'Trauma-informed approach';

  return `You are an expert trauma-informed educator creating comprehensive lesson plans. Generate a complete ${days}-day lesson plan with professional quality and detailed implementation guidance.

**LESSON SPECIFICATIONS:**
- Grade Level: ${gradeLevel}
- Subject(s): ${subjects.join(', ')}
- Unit Title: ${unitTitle}
- Standards: ${standards}
- Focus: ${focus}
- Duration: ${days} days (90 minutes each)

**REQUIRED STRUCTURE FOR EACH DAY:**

# DAY [X]: [Engaging lesson title]

Essential Question: [Question integrating subject content with ${focus}]
Learning Target: [Specific, measurable objective]
Standards: [Relevant standards for ${subjects.join(', ')}]
SEL Alignment: [CASEL competencies addressed]

## Opening (15min): [Trauma-informed opening activity]

[2-3 paragraph detailed description including setup, facilitation steps, and participation options for diverse learners]

Materials Needed: 
- [Specific list with quantities and storage notes]

Implementation Notes: [Setup and preparation guidance]

[Teacher Note: Trauma-informed facilitation guidance, differentiation strategies, and monitoring for student regulation needs]

[Student Note: Clear expectations with empowering language, choice options, and self-advocacy reminders]

## I Do (20min): [Direct instruction title]

[2-3 paragraph description including content delivery, modeling, and think-aloud strategies]

Cross-Curricular Connections:
${subjects.map(subject => `- ${subject}: [Specific integration examples]`).join('\n')}

Visual Supports: [Charts, organizers, and multimedia resources]

[Teacher Note: Key teaching points, scaffolding strategies, assessment checkpoints, and differentiation approaches]

[Student Note: Focus areas during instruction, note-taking strategies, and skill-building connections]

## Work Session (45min): [Collaborative learning focus]

### We Do (15min): [Guided practice activity]
[Detailed collaborative exploration with step-by-step procedures]

Materials Setup: [Arrangement procedures and group formation]

[Teacher Note: Group formation strategies, monitoring protocols, and trauma-informed group facilitation]

[Student Note: Collaboration expectations, communication strategies, and ways to contribute unique perspectives]

### You Do Together (15min): [Partner work activity]
[Partner work with choice menu for different learning modalities]

Choice Menu Options:
- Option A: [Visual/artistic pathway with materials]
- Option B: [Kinesthetic/movement pathway with activities]
- Option C: [Analytical/research pathway with tools]
- Option D: [Creative/multimedia pathway with technology]

[Teacher Note: Pairing strategies, progress monitoring, and support for partnership dynamics]

[Student Note: Partnership protocols, quality indicators, and collaboration strategies]

### You Do Alone (15min): [Independent practice activity]
[Individual work with regulation and accessibility supports]

Regulation Supports: [Movement options, sensory tools, quiet spaces, alternative seating]

[Teacher Note: Conferencing approach, trauma-informed check-ins, and individualized support strategies]

[Student Note: Self-management tools, reflection prompts, and focus strategies]

## Closing (10min): [Identity-connected reflection]

[Closing routine with community building and cultural affirmation]
Sharing Protocol: [Voluntary sharing with participation alternatives]

[Teacher Note: Emotional regulation support, transition preparation, and celebration of contributions]

[Student Note: Reflection language honoring growth, celebrating identity, and building community]

## Implementation Details:

Materials List: 
- [Complete inventory with quantities, costs, storage, and alternatives]

Room Setup: [Arrangements for each activity phase with transitions]
Time Management: [Pacing guides, timers, and flexibility options]
Technology Integration: [Platforms, backup plans, accessibility features]
Assessment Tools: [Rubrics, checklists, observation protocols]

## MTSS Supports:

Tier 1 (Universal): [Design features with implementation guidance]
- Visual schedules with progress indicators
- Multiple representation modes
- Built-in choice and movement opportunities
- Clear expectations with modeling

Tier 2 (Targeted): [Interventions with criteria and procedures]
- Small group reteaching with alternative explanations
- Extended processing time with scaffolded support
- Peer partnerships with structured protocols
- Modified assessment formats

Tier 3 (Intensive): [Accommodations with implementation procedures]
- One-on-one support with specialized strategies
- Alternative participation formats
- Sensory regulation tools and quiet spaces
- Modified expectations with progress monitoring

## Extensions and Connections:

Advanced Learners: [Acceleration and enrichment opportunities]
Community Connections: [Real partnerships with local organizations]
Home-School Bridge: [Family engagement and cultural connections]

## Standards Alignment:
${subjects.map(subject => `**${subject}:** [Standard citations with implementation explanations]`).join('\n')}

---

[REPEAT this structure for ALL ${days} days]

## ESSENTIAL RESOURCE APPENDIX

### A. DALL-E IMAGE PROMPTS

**Visual 1:** "Create a classroom scene showing diverse students engaged in ${focus} learning activities. Include warm, natural lighting with educational materials visible and culturally responsive design elements."

**Visual 2:** "Design an educational poster showing ${unitTitle} concepts with vibrant colors, clear text, and imagery that supports trauma-informed learning environments."

### B. KEY MATERIALS PROCUREMENT

**Primary Materials:**
- Chart paper: Qty: 6 sheets | Cost: $15-20 | Source: Office supply store | Storage: Flat in cabinet | Alternative: Butcher paper
- Markers: Qty: 6 sets | Cost: $25-30 | Source: Walmart/Target | Storage: Organized bins | Alternative: Colored pencils

**Technology:**
- Tablets/Chromebooks: 15 devices | Available from school | Storage: Charging cart | Alternative: Paper-based activities

### C. ASSESSMENT RUBRIC

| Criteria | Exceeding (4) | Meeting (3) | Approaching (2) | Beginning (1) |
|----------|---------------|-------------|-----------------|---------------|
| Content Understanding | Demonstrates deep comprehension with connections | Shows solid understanding of key concepts | Basic grasp with some gaps | Limited understanding evident |
| Participation | Actively engages and supports others | Consistent participation and collaboration | Some engagement with prompting | Minimal participation despite supports |

**Total Budget:** $150-250 | **Per Student:** $5-8 | **Setup Time:** 1-2 hours per day

Generate ALL ${days} days with complete detail and implementation guidance.`;
}

export async function POST(req: NextRequest) {
  try {
    console.log('[SAFE] Route started successfully');
    
    // Step 1: Parse request
    let body;
    try {
      body = await req.json();
      console.log('[SAFE] Body parsed:', {
        gradeLevel: body.gradeLevel,
        subjects: body.subjects,
        days: body.days || body.duration,
        unitTitle: body.unitTitle
      });
    } catch (e: any) {
      console.error('[SAFE] Body parse error:', e.message);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Step 2: Validate inputs
    try {
      if (!body.gradeLevel || body.gradeLevel === 'Select Grade') {
        console.log('[SAFE] Grade level validation failed');
        return NextResponse.json({ error: 'Please select a grade level.' }, { status: 400 });
      }

      if (!body.subjects || body.subjects.length === 0) {
        console.log('[SAFE] Subjects validation failed');
        return NextResponse.json({ error: 'Please select at least one subject area.' }, { status: 400 });
      }

      if (!process.env.ANTHROPIC_API_KEY) {
        console.log('[SAFE] API key missing');
        return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
      }
      
      console.log('[SAFE] Validation passed');
    } catch (e: any) {
      console.error('[SAFE] Validation error:', e.message);
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }

    // Step 3: Process input
    let input;
    try {
      input = {
        gradeLevel: body.gradeLevel,
        subjects: body.subjects,
        duration: parseInt(String(body.days || body.duration || 3), 10),
        days: parseInt(String(body.days || body.duration || 3), 10),
        unitTitle: body.unitTitle || 'Cultural Identity and Expression',
        standards: body.standards || 'Relevant state standards',
        focus: body.focus || 'Trauma-informed approach'
      };
      console.log('[SAFE] Input processed successfully:', input);
    } catch (e: any) {
      console.error('[SAFE] Input processing error:', e.message);
      return NextResponse.json({ error: 'Input processing failed' }, { status: 400 });
    }

    // Step 4: Create prompt
    let prompt;
    try {
      prompt = createWorkingPrompt(input);
      console.log('[SAFE] Prompt created, length:', prompt.length);
    } catch (e: any) {
      console.error('[SAFE] Prompt creation error:', e.message);
      return NextResponse.json({ error: 'Prompt creation failed' }, { status: 500 });
    }

    // Step 5: Make API call with conservative settings
    let response;
    try {
      console.log('[SAFE] Making API call...');
      response = await client.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 8000, // Conservative limit
        temperature: 0.2, // Conservative temperature
        messages: [{ role: 'user', content: prompt }]
      });
      console.log('[SAFE] API call successful');
    } catch (e: any) {
      console.error('[SAFE] API call error:', e.message, 'Status:', e.status);
      
      if (e.status === 429) {
        return NextResponse.json({
          error: 'Rate limit reached. Please wait 60 seconds and try again.',
          tip: 'Try 2 days instead for faster processing.'
        }, { status: 429 });
      }
      
      if (e.status === 529 || e.message?.includes('overloaded')) {
        return NextResponse.json({
          error: 'Server overloaded. Try again in 1-2 minutes.',
          suggestion: 'Generate shorter lesson plans during busy periods.'
        }, { status: 503 });
      }
      
      return NextResponse.json({
        error: 'API call failed: ' + e.message,
        status: e.status || 'unknown'
      }, { status: 500 });
    }

    // Step 6: Process response
    let lessonPlan;
    try {
      lessonPlan = response.content?.[0]?.type === 'text' ? response.content[0].text : '';
      
      if (!lessonPlan) {
        throw new Error('Empty response from Claude');
      }
      
      console.log('[SAFE] Response processed, length:', lessonPlan.length);
    } catch (e: any) {
      console.error('[SAFE] Response processing error:', e.message);
      return NextResponse.json({ error: 'Response processing failed' }, { status: 500 });
    }

    // Step 7: Quality validation
    try {
      const dayHeaders = lessonPlan.match(/# DAY \d+:/gi) || [];
      const hasTeacherNotes = lessonPlan.includes('[Teacher Note:');
      const hasStudentNotes = lessonPlan.includes('[Student Note:');
      const hasResourceAppendix = lessonPlan.includes('RESOURCE APPENDIX') || 
                                  lessonPlan.includes('DALL-E') || 
                                  lessonPlan.includes('MATERIALS PROCUREMENT');

      const quality = {
        daysGenerated: dayHeaders.length,
        daysRequested: input.days,
        hasTeacherNotes,
        hasStudentNotes,
        hasResourceAppendix
      };

      console.log('[SAFE] Quality metrics:', quality);

      // Add quality notice if needed
      let finalLessonPlan = lessonPlan;
      if (quality.daysGenerated < quality.daysRequested || !hasTeacherNotes || !hasStudentNotes) {
        finalLessonPlan += `\n\n## QUALITY NOTICE\n\n`;
        finalLessonPlan += `Generated: ${quality.daysGenerated}/${quality.daysRequested} days | `;
        finalLessonPlan += `Teacher Notes: ${hasTeacherNotes ? '✅' : '❌'} | `;
        finalLessonPlan += `Student Notes: ${hasStudentNotes ? '✅' : '❌'}\n\n`;
        finalLessonPlan += `For complete quality, try: 2-3 days max, single subject focus, off-peak hours`;
      }

      console.log('[SAFE] Returning successful response');

      return NextResponse.json({
        ok: true,
        lessonPlan: finalLessonPlan,
        markdown: finalLessonPlan,
        plan: {
          markdown: finalLessonPlan,
          meta: {
            title: input.unitTitle,
            gradeLevel: input.gradeLevel,
            subject: input.subjects.join(', '),
            days: input.days,
            quality: quality.daysGenerated === quality.daysRequested && hasTeacherNotes && hasStudentNotes ? 'Complete' : 'Partial',
            qualityMetrics: quality
          }
        }
      });

    } catch (e: any) {
      console.error('[SAFE] Quality validation error:', e.message);
      return NextResponse.json({ error: 'Quality validation failed' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[SAFE] Outer catch - unexpected error:', error.message, error.stack);
    return NextResponse.json({
      error: 'Unexpected server error',
      message: error.message,
      type: 'outer_catch'
    }, { status: 500 });
  }
}
