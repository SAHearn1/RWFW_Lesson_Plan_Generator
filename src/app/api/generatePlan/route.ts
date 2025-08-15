// FILE PATH: src/app/api/generatePlan/route.ts
// Copy this entire file to: src/app/api/generatePlan/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes for comprehensive generation

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

function createComprehensivePrompt(input: GeneratePlanInput): string {
  const days = input.days || input.duration || 3;
  const gradeLevel = input.gradeLevel || '9th Grade';
  const subjects = input.subjects || ['English Language Arts'];
  const unitTitle = input.unitTitle || 'Cultural Identity and Expression';
  const standards = input.standards || 'Relevant state standards';
  const focus = input.focus || 'Trauma-informed approach';

  return `🧑‍🏫 You are an expert trauma-informed educator with 20+ years of experience creating comprehensive, professionally-ready lesson plans. Generate a complete ${days}-day lesson plan that matches master teacher quality.

**LESSON SPECIFICATIONS:**
- Grade Level: ${gradeLevel}
- Subject(s): ${subjects.join(', ')} ${subjects.length > 1 ? '(INTERDISCIPLINARY)' : ''}
- Unit Title: ${unitTitle}
- Standards: ${standards}
- Focus: ${focus}
- Duration: ${days} days (90 minutes each)

**CRITICAL QUALITY REQUIREMENTS:**
✅ Every section MUST include [Teacher Note: ] and [Student Note: ]
✅ Detailed implementation guidance with specific materials and quantities
✅ Comprehensive MTSS supports across all three tiers
✅ Complete Resource Appendix with DALL-E prompts and procurement guides
✅ Professional formatting ready for immediate classroom implementation

**MANDATORY STRUCTURE FOR EACH DAY:**

# DAY [X]: [Engaging, culturally-connected title]

Essential Question: [Complex question integrating all subjects]
Learning Target: [Specific, measurable, identity-affirming objective]
Standards: [Exact citations: ${standards}]
SEL Alignment: [Specific CASEL competencies with examples]

## Opening (15min): "[Trauma-informed regulation ritual name]"

[Detailed 3-paragraph description including setup procedures, facilitation steps, and multiple participation pathways for diverse learners]

Materials Needed: 
- [Complete list with exact quantities, storage locations, and cost estimates]
- [Include backup materials and alternatives]

Implementation Notes: [Setup timing, preparation requirements, cleanup procedures]

[Teacher Note: Comprehensive guidance on trauma-informed facilitation, differentiation strategies, cultural responsiveness, and monitoring for regulation needs. Address potential challenges and intervention strategies.]

[Student Note: Clear expectations using warm, empowering language. Include choice options, self-advocacy reminders, and connection to personal growth and identity affirmation.]

## I Do (20min): "[Cross-curricular content delivery title]"

[Detailed 3-paragraph description including content delivery with specific examples, think-aloud strategies, and visual supports]

Cross-Curricular Connections:
${subjects.map(subject => `- ${subject}: [Specific examples and integration points]`).join('\n')}

Visual Supports: [Detailed descriptions of charts, graphic organizers, multimedia resources]

[Teacher Note: Key teaching points, scaffolding strategies, formative assessment checkpoints, and differentiation for diverse learners. Include pacing guidance and transition preparation.]

[Student Note: What to focus on during instruction, note-taking strategies, and how this learning builds your skills and connects to your experiences. Include engagement strategies and self-regulation techniques.]

## Work Session (45min): "[Collaborative investigation title]"

### We Do (15min): "[Guided practice activity]"
[Detailed description of collaborative exploration with step-by-step procedures]

Materials Setup: [Specific arrangement procedures, group formation, resource distribution]

[Teacher Note: Group formation strategies, monitoring protocols, intervention guidance, and support for collaborative learning. Address potential conflicts and maintain trauma-informed environment.]

[Student Note: Collaboration expectations, communication strategies, and ways to contribute your unique perspectives. Include protocols for asking for help and celebrating diverse thinking.]

### You Do Together (15min): "[Partner creation activity]"
[Detailed partner work with comprehensive choice menu addressing multiple learning modalities]

Choice Menu Options:
- Option A: [Visual/artistic pathway with specific materials and techniques]
- Option B: [Kinesthetic/movement pathway with activities and space requirements]
- Option C: [Analytical/research pathway with tools and resources]
- Option D: [Creative/multimedia pathway with technology and platforms]

[Teacher Note: Pairing strategies considering strengths and needs, progress monitoring techniques, and support for partnership dynamics. Include guidance for students who prefer independent work.]

[Student Note: Partnership protocols, quality indicators for success, and strategies for effective collaboration. Include self-advocacy language and celebration of different working styles.]

### You Do Alone (15min): "[Individual synthesis activity]"
[Detailed independent work with multiple regulation and accessibility supports]

Regulation Supports: [Movement options, sensory tools, quiet spaces, alternative seating, fidget tools, headphones, standing desks]

[Teacher Note: Conferencing approach, trauma-informed check-ins, and individualized support strategies. Include guidance for different processing speeds and accommodation needs.]

[Student Note: Self-management tools, reflection prompts, and strategies for maintaining focus. Include permission for breaks and celebration of individual progress.]

## Closing (10min): "[Identity-connected reflection activity]"

[Detailed closing routine with community building and cultural affirmation]
Sharing Protocol: [Voluntary sharing with multiple alternatives for participation]

[Teacher Note: Emotional regulation support, transition preparation, and celebration of diverse contributions. Include guidance for processing emotions and preparing for next learning.]

[Student Note: Reflection language that honors growth, celebrates identity, and builds community. Include options for different sharing comfort levels and recognition of learning journey.]

## Implementation Details:

Materials List: 
[Complete inventory with quantities, estimated costs, storage solutions, and alternatives]
- Material 1: Qty: X | Cost: $X-X | Source: [Store] | Storage: [Method] | Alternative: [Option]

Room Setup: [Detailed arrangements for each activity phase with transition procedures]
Time Management: [Pacing guides, visible timers, transition signals, and flexibility options]
Technology Integration: [Specific platforms, backup plans, accessibility features]
Assessment Tools: [Rubrics, checklists, observation protocols, and student self-assessment options]

## MTSS Supports:

Tier 1 (Universal): [Specific design features with implementation guidance]
- Visual schedules with progress indicators
- Multiple representation modes (visual, auditory, kinesthetic)
- Built-in choice and movement opportunities
- Clear expectations with modeling

Tier 2 (Targeted): [Specific interventions with criteria and procedures]
- Small group reteaching with alternative explanations
- Extended processing time with scaffolded support
- Peer partnerships with structured protocols
- Modified assessment formats

Tier 3 (Intensive): [Individualized accommodations with implementation procedures]
- One-on-one support with specialized strategies
- Alternative participation formats
- Sensory regulation tools and quiet spaces
- Modified expectations with progress monitoring

## Extensions and Connections:

Advanced Learners: [Specific acceleration and enrichment opportunities]
Community Connections: [Real partnerships with local organizations, experts, or cultural institutions]
Home-School Bridge: [Family engagement opportunities and cultural connections]

## Standards Alignment:
${subjects.map(subject => `**${subject}:** [Specific standard citations with explanations of how each is addressed in the lesson]`).join('\n')}

---

[REPEAT this comprehensive format for ALL ${days} days]

## ESSENTIAL RESOURCE APPENDIX

### A. DALL-E IMAGE PROMPTS

**Visual 1:** "Create a [detailed 2-sentence description with specific colors, style, cultural elements, and educational purpose]. Include diverse students engaged in [specific activity] with warm, natural lighting and educational materials visible."

**Visual 2:** "Design a [detailed 2-sentence description for second visual resource]. Use [specific color palette] and show [specific educational elements] that support trauma-informed learning environments."

### B. KEY MATERIALS PROCUREMENT

**Primary Materials:**
- Item 1: Qty: [exact number] | Cost: $[specific range] | Source: [specific store/vendor] | Storage: [method] | Alternative: [budget option]

**Technology Requirements:**
- Platform 1: [specifications, account requirements, alternatives]

### C. ASSESSMENT RUBRIC

| Criteria | Exceeding (4) | Meeting (3) | Approaching (2) | Beginning (1) |
|----------|---------------|-------------|-----------------|---------------|
| [Subject Integration] | [Detailed description] | [Detailed description] | [Detailed description] | [Detailed description] |
| [Cultural Responsiveness] | [Detailed description] | [Detailed description] | [Detailed description] | [Detailed description] |

**Total Budget:** $[specific range] | **Per Student:** $[specific range] | **Setup Time:** [specific hours] per day

CRITICAL: Generate ALL ${days} days with complete detail and Resource Appendix for immediate implementation success.`;
}

export async function POST(req: NextRequest) {
  try {
    console.log('[PROD] Route started');
    
    // Parse request body
    const body = await req.json();
    console.log('[PROD] Request received:', { 
      gradeLevel: body.gradeLevel, 
      subjects: body.subjects, 
      days: body.days || body.duration 
    });

    // Validate required fields
    if (!body.gradeLevel || body.gradeLevel === 'Select Grade') {
      return NextResponse.json({ error: 'Please select a grade level.' }, { status: 400 });
    }

    if (!body.subjects || body.subjects.length === 0) {
      return NextResponse.json({ error: 'Please select at least one subject area.' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
    }

    // Process input
    const input = {
      gradeLevel: body.gradeLevel,
      subjects: body.subjects,
      duration: parseInt(String(body.days || body.duration || 3), 10),
      days: parseInt(String(body.days || body.duration || 3), 10),
      unitTitle: body.unitTitle || 'Cultural Identity and Expression',
      standards: body.standards || 'Relevant state standards',
      focus: body.focus || 'Trauma-informed approach'
    };

    console.log('[PROD] Processed input:', input);

    // Create comprehensive prompt
    const prompt = createComprehensivePrompt(input);
    console.log('[PROD] Prompt created, length:', prompt.length);

    // Make API call with optimal settings
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 12000, // Optimal balance of quality and reliability
      temperature: 0.3,  // Good for creative educational content
      messages: [{ role: 'user', content: prompt }]
    });

    const lessonPlan = response.content?.[0]?.type === 'text' ? response.content[0].text : '';
    
    if (!lessonPlan) {
      throw new Error('Empty response from Claude');
    }

    console.log('[PROD] Generated lesson plan, length:', lessonPlan.length);

    // Enhanced quality validation
    const dayHeaders = lessonPlan.match(/# DAY \d+:/gi) || [];
    const hasTeacherNotes = lessonPlan.includes('[Teacher Note:');
    const hasStudentNotes = lessonPlan.includes('[Student Note:');
    const hasResourceAppendix = lessonPlan.includes('RESOURCE APPENDIX') || 
                                lessonPlan.includes('DALL-E') || 
                                lessonPlan.includes('MATERIALS PROCUREMENT');
    const hasMTSS = lessonPlan.includes('MTSS') || lessonPlan.includes('Tier 1');

    const quality = {
      daysGenerated: dayHeaders.length,
      daysRequested: input.days,
      hasTeacherNotes,
      hasStudentNotes,
      hasResourceAppendix,
      hasMTSS
    };

    console.log('[PROD] Quality check:', quality);

    // Add quality notice if needed
    let finalLessonPlan = lessonPlan;
    const qualityIssues = [];
    
    if (quality.daysGenerated < quality.daysRequested) {
      qualityIssues.push(`Generated ${quality.daysGenerated}/${quality.daysRequested} days`);
    }
    if (!hasTeacherNotes) qualityIssues.push('Missing Teacher Notes');
    if (!hasStudentNotes) qualityIssues.push('Missing Student Notes');
    if (!hasResourceAppendix) qualityIssues.push('Incomplete Resource Appendix');
    if (!hasMTSS) qualityIssues.push('Missing MTSS Supports');

    if (qualityIssues.length > 0) {
      finalLessonPlan += `\n\n## GENERATION QUALITY NOTICE\n\n`;
      finalLessonPlan += `⚠️ **Quality Issues:** ${qualityIssues.join(', ')}\n\n`;
      finalLessonPlan += `**For complete exemplar quality:**\n`;
      finalLessonPlan += `- Try reducing to 2-3 days for complex topics\n`;
      finalLessonPlan += `- Use single subject focus for maximum detail\n`;
      finalLessonPlan += `- Generate during off-peak hours for best results\n\n`;
      finalLessonPlan += `**Contact:** hearn.sa@gmail.com for comprehensive lesson plan support.`;
    }

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
          quality: qualityIssues.length === 0 ? 'Complete' : 'Partial',
          qualityMetrics: quality
        }
      }
    });

  } catch (error: any) {
    console.error('[PROD] Generation error:', error);
    
    // Enhanced error handling with specific guidance
    if (error.status === 429) {
      return NextResponse.json({
        error: '🚦 Rate limit reached. Please wait 60 seconds and try again.',
        tip: 'Try 2 days instead for faster processing.'
      }, { status: 429 });
    }
    
    if (error.status === 529 || error.message?.includes('overloaded')) {
      return NextResponse.json({
        error: '🖥️ High server demand. Try again in 1-2 minutes.',
        suggestion: 'Generate shorter lesson plans during busy periods.'
      }, { status: 503 });
    }
    
    return NextResponse.json({
      error: 'Generation failed: ' + error.message,
      suggestion: 'Try reducing days to 2 or simplifying the topic.'
    }, { status: 500 });
  }
}
