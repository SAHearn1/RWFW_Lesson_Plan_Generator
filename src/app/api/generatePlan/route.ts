// File: src/app/api/generatePlan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Increased for comprehensive generation

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

  // Enhanced prompt with explicit quality requirements
  return `🧑‍🏫 EXPERT CURRICULUM DESIGNER: You are a master teacher with 20+ years creating trauma-informed, culturally responsive lesson plans. Your expertise includes K-12 education, Project-Based Learning, STEAM integration, MTSS design, and Rootwork Framework implementation.

GENERATE COMPREHENSIVE ${days}-DAY LESSON PLAN MATCHING PROFESSIONAL EXEMPLAR QUALITY

**LESSON SPECIFICATIONS:**
- Grade Level: ${gradeLevel}
- Subject(s): ${subjects.join(' + ')} ${subjects.length > 1 ? '(INTERDISCIPLINARY INTEGRATION)' : ''}
- Unit Title: ${unitTitle}
- Standards: ${standards}
- Focus: ${focus}
- Duration: ${days} days (90 minutes each)

**CRITICAL QUALITY STANDARDS:**
✅ Every section MUST include both [Teacher Note: ] and [Student Note: ]
✅ Detailed implementation guidance with specific materials and quantities
✅ Comprehensive MTSS supports across all three tiers
✅ Complete Resource Appendix with DALL-E prompts and procurement guides
✅ Professional formatting ready for immediate classroom implementation

**MANDATORY STRUCTURE FOR EACH DAY:**

# DAY X: [Engaging, culturally-connected title]

Essential Question: [Complex question integrating ${subjects.length > 1 ? 'ALL subjects' : 'subject content'}]
Learning Target: [Specific, measurable, identity-affirming objective]
Standards: [Exact citations for each subject: ${subjects.join(', ')}]
SEL Alignment: [Specific CASEL competencies with implementation examples]

## Opening (15min): "[Trauma-informed regulation ritual name]"

[Detailed 3-paragraph description including:]
- Setup procedures and room arrangement
- Facilitation steps with specific dialogue
- Multiple participation pathways for diverse learners

Materials Needed: 
- [Complete list with exact quantities, storage locations, and cost estimates]
- [Include backup materials and alternatives]

Implementation Notes: [Setup timing, preparation requirements, cleanup procedures]

[Teacher Note: Comprehensive guidance on trauma-informed facilitation, differentiation strategies, cultural responsiveness, and monitoring for regulation needs. Address potential challenges and intervention strategies.]

[Student Note: Clear expectations using warm, empowering language. Include choice options, self-advocacy reminders, and connection to personal growth and identity affirmation.]

## I Do (20min): "[Cross-curricular content delivery title]"

[Detailed 3-paragraph description including:]
- Content delivery with specific examples and modeling
- Think-aloud strategies demonstrating connections between ${subjects.join(' and ')}
- Visual supports and accessibility features

Cross-Curricular Connections:
${subjects.map(subject => `- ${subject}: [Specific examples and integration points]`).join('\n')}

Visual Supports: [Detailed descriptions of charts, graphic organizers, multimedia resources]

[Teacher Note: Key teaching points, scaffolding strategies, formative assessment checkpoints, and differentiation for diverse learners. Include pacing guidance and transition preparation.]

[Student Note: What to focus on during instruction, note-taking strategies, and how this learning builds your skills and connects to your experiences. Include engagement strategies and self-regulation techniques.]

## Work Session (45min): "[Collaborative investigation title]"

### We Do (15min): "[Guided practice activity]"
[Detailed description of collaborative exploration with step-by-step procedures]
${subjects.length > 1 ? `Integration requirement: Every activity must authentically connect ${subjects.join(', ')} through real-world applications.` : ''}

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
- [Continue for all materials]

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

[Continue this comprehensive format for ALL ${days} days]

---

## ESSENTIAL RESOURCE APPENDIX

### A. DALL-E IMAGE PROMPTS

**Visual 1:** "Create a [detailed 2-sentence description with specific colors, style, cultural elements, and educational purpose]. Include diverse students engaged in [specific activity] with warm, natural lighting and educational materials visible."

**Visual 2:** "Design a [detailed 2-sentence description for second visual resource]. Use [specific color palette] and show [specific educational elements] that support trauma-informed learning environments."

[Continue for each visual resource mentioned in lesson plans]

### B. KEY MATERIALS PROCUREMENT

**Primary Materials:**
- Item 1: Qty: [exact number] | Cost: $[specific range] | Source: [specific store/vendor] | Storage: [method] | Alternative: [budget option]
- Item 2: [same detailed format]
[Continue for all essential materials]

**Technology Requirements:**
- Platform 1: [specifications, account requirements, alternatives]
[Continue for all tech needs]

### C. ASSESSMENT RUBRIC

| Criteria | Exceeding (4) | Meeting (3) | Approaching (2) | Beginning (1) |
|----------|---------------|-------------|-----------------|---------------|
| [Subject Integration] | [Detailed description] | [Detailed description] | [Detailed description] | [Detailed description] |
| [Cultural Responsiveness] | [Detailed description] | [Detailed description] | [Detailed description] | [Detailed description] |
| [Trauma-Informed Practice] | [Detailed description] | [Detailed description] | [Detailed description] | [Detailed description] |

**Total Budget:** $[specific range] | **Per Student:** $[specific range] | **Setup Time:** [specific hours] per day

CRITICAL: Generate ALL ${days} days with complete Resource Appendix for immediate implementation success.`;
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

    // Extended timeout for comprehensive generation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 5 minutes')), 300000);
    });

    // CRITICAL FIXES: Updated model and increased token limit
    const apiPromise = client.messages.create({
      model: 'claude-3-5-sonnet-20241022', // Updated model
      max_tokens: 25000,                   // INCREASED from 8192 - this was the main issue!
      temperature: 0.3,                    // Slightly increased for creativity
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

    // Enhanced Resource Appendix detection
    const hasResourceAppendix = lessonPlan.includes('RESOURCE APPENDIX') || 
                                lessonPlan.includes('RESOURCE GENERATION APPENDIX') ||
                                lessonPlan.includes('DALL-E') || 
                                lessonPlan.includes('MATERIALS PROCUREMENT') ||
                                lessonPlan.includes('A. DALL-E IMAGE PROMPTS') ||
                                lessonPlan.includes('B. KEY MATERIALS PROCUREMENT') ||
                                lessonPlan.includes('ESSENTIAL RESOURCE APPENDIX');

    // Enhanced quality validation
    const hasTeacherNotes = lessonPlan.includes('[Teacher Note:');
    const hasStudentNotes = lessonPlan.includes('[Student Note:');
    const dayCount = (lessonPlan.match(/# DAY \d+:/g) || []).length;
    
    console.log('Generated lesson plan successfully');
    console.log('Lesson plan length:', lessonPlan.length);
    console.log('Resource Appendix included:', hasResourceAppendix);
    console.log('Teacher Notes included:', hasTeacherNotes);
    console.log('Student Notes included:', hasStudentNotes);
    console.log('Days generated:', dayCount, 'of', days, 'requested');

    // Enhanced feedback for quality
    let finalLessonPlan = lessonPlan;
    if (!hasResourceAppendix || !hasTeacherNotes || !hasStudentNotes || dayCount < days) {
      finalLessonPlan += "\n\n## GENERATION QUALITY NOTICE\n\n";
      
      if (dayCount < days) {
        finalLessonPlan += `⚠️ **Partial Generation:** ${dayCount} of ${days} requested days completed.\n`;
      }
      if (!hasTeacherNotes || !hasStudentNotes) {
        finalLessonPlan += `⚠️ **Missing Notes:** Comprehensive Teacher/Student Notes may be incomplete.\n`;
      }
      if (!hasResourceAppendix) {
        finalLessonPlan += `⚠️ **Resource Appendix:** Complete procurement guide may be incomplete.\n`;
      }
      
      finalLessonPlan += "\n**For complete exemplar-quality output:**\n" +
        "- Try reducing to 2-3 days for complex interdisciplinary units\n" +
        "- Simplify focus area for initial generation\n" +
        "- Generate additional days separately if needed\n\n" +
        "**Contact:** hearn.sa@gmail.com for support with complex lesson plan requirements.";
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
          hasResourceAppendix: hasResourceAppendix,
          hasTeacherNotes: hasTeacherNotes,
          hasStudentNotes: hasStudentNotes,
          actualDays: dayCount,
          quality: hasResourceAppendix && hasTeacherNotes && hasStudentNotes && dayCount === days ? 'Complete' : 'Partial'
        }
      }
    });

  } catch (error: any) {
    console.error('Error in generatePlan:', error);
    
    if (error.message?.includes('timeout')) {
      return NextResponse.json({
        error: 'Comprehensive lesson plan generation requires more time. Try fewer days or simpler focus for faster generation.',
        details: 'Request timeout - reduce complexity for faster results'
      }, { status: 504 });
    }
    
    if (error.status) {
      return NextResponse.json({
        error: "AI model error (Status: " + error.status + "). Try simplifying your request.",
        details: error.message
      }, { status: 502 });
    }

    return NextResponse.json({
      error: 'Generation failed. Try reducing days or simplifying the topic.',
      details: error.message
    }, { status: 500 });
  }
}
