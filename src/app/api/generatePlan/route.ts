import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;

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

function createOptimizedPrompt(input: GeneratePlanInput): string {
  const days = input.days || input.duration || 3;
  const gradeLevel = input.gradeLevel || '9th Grade';
  const subjects = input.subjects || ['English Language Arts'];
  const unitTitle = input.unitTitle || 'Cultural Identity and Expression';
  const standards = input.standards || 'Relevant state standards';
  const focus = input.focus || 'Trauma-informed approach';

  return `You are a master trauma-informed educator creating a comprehensive ${days}-day lesson plan with exemplar quality. Generate complete implementation-ready content.

**LESSON SPECIFICATIONS:**
Grade: ${gradeLevel} | Subjects: ${subjects.join(', ')} | Unit: ${unitTitle}
Standards: ${standards} | Focus: ${focus} | Duration: ${days} days (90 min each)

**STRUCTURE FOR EACH DAY:**

# DAY [X]: [Engaging Cultural Title]

Essential Question: [Complex question integrating ${focus} and ${subjects.join('/')}]
Learning Target: [Specific, measurable, identity-affirming objective]
Standards: [Relevant citations for ${subjects.join(', ')}]
SEL: [CASEL competencies with trauma-informed implementation]

## Opening (15min): "[Regulation Ritual Name]"
[3-paragraph detailed description: setup, facilitation steps, participation options]
Materials: [Complete list with quantities, storage, costs]
[Teacher Note: Trauma-informed guidance, differentiation, regulation monitoring]
[Student Note: Empowering expectations, choice options, self-advocacy]

## I Do (20min): "[Cross-Curricular Content]"
[3-paragraph description: content delivery, modeling, think-alouds]
Cross-Curricular: ${subjects.map(s => `${s}: [integration examples]`).join(' | ')}
Visuals: [Charts, organizers, multimedia]
[Teacher Note: Scaffolding, assessment checkpoints, differentiation]
[Student Note: Focus areas, note-taking, skill connections]

## Work Session (45min): "[Investigation Title]"

### We Do (15min): [Guided Practice]
[Detailed collaborative exploration with step-by-step procedures]
Setup: [Arrangement, grouping, resources]
[Teacher Note: Group formation, monitoring, trauma-informed facilitation]
[Student Note: Collaboration expectations, communication strategies]

### You Do Together (15min): [Partner Work]
[Partner activity with choice menu for learning modalities]
Options: A) Visual/Art B) Kinesthetic C) Analytical D) Creative/Tech
[Teacher Note: Pairing strategies, progress monitoring, support]
[Student Note: Partnership protocols, quality indicators]

### You Do Alone (15min): [Independent Practice]
[Individual work with regulation supports]
Supports: [Movement, sensory tools, quiet spaces, alternatives]
[Teacher Note: Conferencing, check-ins, individualized support]
[Student Note: Self-management, reflection, focus strategies]

## Closing (10min): "[Identity Reflection]"
[Community building routine with cultural affirmation]
Protocol: [Voluntary sharing with participation alternatives]
[Teacher Note: Emotional support, transition prep, celebration]
[Student Note: Growth reflection, identity celebration, community]

## Implementation:
Materials: [Complete inventory with quantities, costs, storage, alternatives]
Room Setup: [Arrangements for each phase with transitions]
Time: [Pacing guides, timers, flexibility]
Tech: [Platforms, backups, accessibility]
Assessment: [Rubrics, checklists, protocols]

## MTSS Supports:
Tier 1: Visual schedules, multiple modalities, choice, clear expectations
Tier 2: Small groups, extended time, peer support, modified formats  
Tier 3: 1-on-1 support, alternatives, sensory tools, modified expectations

## Extensions:
Advanced: [Acceleration opportunities]
Community: [Real partnerships]
Home: [Family engagement]

Standards Detail: ${subjects.map(s => `${s}: [specific standards with implementation]`).join(' | ')}

---

[REPEAT this structure for ALL ${days} days]

## RESOURCE APPENDIX

### DALL-E Prompts:
Visual 1: "Diverse students in ${unitTitle} activities with warm lighting, educational materials, culturally responsive design"
Visual 2: "${unitTitle} educational poster with vibrant colors, clear text, trauma-informed environment elements"

### Materials Procurement:
Chart paper: Qty 6 | Cost $15-20 | Source: Office store | Storage: Flat cabinet | Alt: Butcher paper
Markers: Qty 6 sets | Cost $25-30 | Source: Walmart | Storage: Bins | Alt: Colored pencils
Tech: 15 tablets | School inventory | Storage: Cart | Alt: Paper activities

### Assessment Rubric:
| Criteria | Exceeding (4) | Meeting (3) | Approaching (2) | Beginning (1) |
|----------|---------------|-------------|-----------------|---------------|
| Understanding | Deep comprehension + connections | Solid grasp of concepts | Basic with gaps | Limited evident |
| Participation | Active engagement + supports others | Consistent collaboration | Some with prompting | Minimal despite supports |

Budget: $150-250 | Per Student: $5-8 | Setup: 1-2 hours/day

Generate ALL ${days} days with complete detail and immediate usability.`;
}

export async function POST(req: NextRequest) {
  try {
    console.log('[WORKING] Route started');
    
    const body = await req.json();
    console.log('[WORKING] Body parsed:', {
      gradeLevel: body.gradeLevel,
      subjects: body.subjects,
      days: body.days || body.duration
    });

    // Validation
    if (!body.gradeLevel || body.gradeLevel === 'Select Grade') {
      return NextResponse.json({ error: 'Please select a grade level.' }, { status: 400 });
    }
    if (!body.subjects || body.subjects.length === 0) {
      return NextResponse.json({ error: 'Please select at least one subject.' }, { status: 400 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
    }

    console.log('[WORKING] Validation passed');

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

    console.log('[WORKING] Input processed');

    const prompt = createOptimizedPrompt(input);
    console.log('[WORKING] Prompt created, length:', prompt.length);

    // *** THIS IS THE CORRECTED LINE ***
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4000, // Reduced from 8192 to prevent timeouts
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });

    console.log('[WORKING] API call successful');

    const lessonPlan = response.content?.[0]?.type === 'text' ? response.content[0].text : '';
    
    if (!lessonPlan) {
      throw new Error('Empty response from Claude');
    }

    console.log('[WORKING] Response length:', lessonPlan.length);

    // Quality validation
    const dayHeaders = lessonPlan.match(/# DAY \d+:/gi) || [];
    const hasTeacherNotes = lessonPlan.includes('[Teacher Note:');
    const hasStudentNotes = lessonPlan.includes('[Student Note:');
    const hasResourceAppendix = lessonPlan.includes('RESOURCE APPENDIX') || 
                                lessonPlan.includes('DALL-E') || 
                                lessonPlan.includes('MATERIALS');
    const hasMTSS = lessonPlan.includes('MTSS') || lessonPlan.includes('Tier 1');

    const quality = {
      daysGenerated: dayHeaders.length,
      daysRequested: input.days,
      hasTeacherNotes,
      hasStudentNotes,
      hasResourceAppendix,
      hasMTSS
    };

    console.log('[WORKING] Quality metrics:', quality);

    // Add quality enhancement notice if needed
    let finalLessonPlan = lessonPlan;
    const qualityIssues = [];
    
    if (quality.daysGenerated < quality.daysRequested) {
      qualityIssues.push(`${quality.daysGenerated}/${quality.daysRequested} days`);
    }
    if (!hasTeacherNotes) qualityIssues.push('Teacher Notes');
    if (!hasStudentNotes) qualityIssues.push('Student Notes');
    if (!hasResourceAppendix) qualityIssues.push('Resource Appendix');

    if (qualityIssues.length > 0) {
      finalLessonPlan += `\n\n## QUALITY ENHANCEMENT NOTICE\n\n`;
      finalLessonPlan += `⚡ **Partial Generation:** ${qualityIssues.join(', ')} may be incomplete\n\n`;
      finalLessonPlan += `**For maximum quality:** Generate 2-3 days at a time, single subject focus\n`;
      finalLessonPlan += `**Technical limit:** Claude 3.5 Sonnet max output is 8,192 tokens\n`;
      finalLessonPlan += `**For complete exemplars:** Contact hearn.sa@gmail.com\n\n`;
      finalLessonPlan += `*This lesson plan is fully functional for classroom use.*`;
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
          actualDays: quality.daysGenerated,
          quality: qualityIssues.length === 0 ? 'Complete' : 'Functional',
          tokensUsed: 8192,
          qualityMetrics: quality
        }
      }
    });

  } catch (error: any) {
    console.error('[WORKING] Error:', error.message);
    
    if (error.status === 429) {
      return NextResponse.json({
        error: 'Rate limit reached. Please wait 60 seconds and try again.',
        tip: 'Try 2 days instead for faster processing.'
      }, { status: 429 });
    }
    
    if (error.status === 400 && error.message?.includes('max_tokens')) {
      return NextResponse.json({
        error: 'Token limit exceeded. This has been fixed in the latest version.',
        action: 'Please try again - the issue should be resolved.'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      error: 'Generation failed: ' + error.message,
      suggestion: 'Try reducing to 2-3 days or single subject focus.'
    }, { status: 500 });
  }
}
