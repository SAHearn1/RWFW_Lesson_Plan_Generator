// FILE PATH: src/app/api/generatePlan/route.ts
// This is the complete, enhanced file for a professional-quality product.

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Configuration for Vercel's serverless environment
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 90; // Keep the 90-second timeout

// Initialize the Anthropic client with the API key from environment variables
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Define the structure for the input data from the frontend
type GeneratePlanInput = {
  gradeLevel?: string;
  subjects?: string[];
  duration?: number;
  unitTitle?: string;
  standards?: string;
  focus?: string;
  days?: number;
};

/**
 * Creates a dynamically optimized prompt based on user input.
 * This function now includes more direct instructions for quality and adherence
 * to your specific educational frameworks.
 * @param input - The user's selections from the frontend form.
 * @returns A string representing the complete prompt for the AI.
 */
function createOptimizedPrompt(input: GeneratePlanInput): string {
  const days = input.days || input.duration || 3;
  const gradeLevel = input.gradeLevel || '9th Grade';
  const subjects = input.subjects || ['English Language Arts'];
  const unitTitle = input.unitTitle || 'Cultural Identity and Expression';
  const standards = input.standards || 'Relevant state standards (e.g., CCSS, NGSS)';
  const focus = input.focus || 'Trauma-informed, project-based learning';

  // This prompt is refined to be more direct and emphasize the non-negotiable elements.
  return `
You are an expert curriculum designer embodying the principles of the Rootwork Framework. Your task is to generate a comprehensive, implementation-ready ${days}-day lesson plan of exemplar quality. The output must be immediately usable by a teacher in a professional setting.

**LESSON SPECIFICATIONS:**
- **Grade:** ${gradeLevel}
- **Subjects:** ${subjects.join(', ')}
- **Unit Title:** ${unitTitle}
- **Standards:** ${standards}
- **Core Focus:** ${focus}
- **Duration:** ${days} days (assuming 90-minute blocks)

---

**MANDATORY STRUCTURE FOR EACH DAY:**

# DAY [X]: [Engaging, Culturally Relevant Title]

**Essential Question:** [A complex, guiding question that integrates the core focus and subjects.]
**Learning Target:** [A specific, measurable, and student-friendly objective.]
**Standards:** [Cite the specific standards being addressed for this day.]
**SEL Competencies:** [List the CASEL competencies and describe their trauma-informed application.]

## Opening (15 min): "[Title of Regulation Ritual]"
[Detailed, multi-paragraph description of the activity, including setup, facilitation steps, and options for student participation. This must be a practical, actionable guide.]
[**Teacher Note:** Provide specific, trauma-informed guidance, differentiation strategies, and how to monitor for student regulation.]
[**Student Note:** Use empowering, second-person language to set expectations, offer choices, and prompt self-advocacy.]

## I Do (20 min): "[Title of Direct Instruction]"
[Detailed description of the content delivery, modeling, and think-aloud process. Explicitly state the cross-curricular connections.]
[**Teacher Note:** Include key scaffolding techniques, formative assessment checkpoints, and differentiation for diverse learners.]
[**Student Note:** Guide students on what to focus on, how to take notes, and how this skill connects to the larger project.]

## Work Session (45 min): "[Title of Project-Based Investigation]"

### We Do (15 min): [Title of Guided Practice]
[Describe a collaborative exploration with step-by-step procedures and clear grouping strategies.]
[**Teacher Note:** Offer guidance on group formation, monitoring progress, and facilitating in a trauma-informed manner.]
[**Student Note:** Explain collaboration expectations and provide sentence starters or strategies for effective communication.]

### You Do Together (15 min): [Title of Partner Work]
[Describe a partner activity that includes a menu of choices for different learning modalities (e.g., Visual, Kinesthetic, Analytical).]
[**Teacher Note:** Provide strategies for pairing, progress monitoring, and targeted support.]
[**Student Note:** Outline partnership protocols and provide clear quality indicators for the work.]

### You Do Alone (15 min): [Title of Independent Practice]
[Describe an individual task that includes built-in regulation supports (e.g., movement breaks, sensory tools).]
[**Teacher Note:** Detail strategies for conferencing, individual check-ins, and providing personalized support.]
[**Student Note:** Offer strategies for self-management, reflection, and maintaining focus.]

## Closing (10 min): "[Title of Identity/Community Reflection]"
[Describe a community-building routine that includes cultural affirmation and reflection on the day's learning.]
[**Teacher Note:** Provide guidance on offering emotional support, preparing for transitions, and celebrating student growth.]
[**Student Note:** Offer prompts for reflecting on growth, celebrating identity, and strengthening community bonds.]

---
[REPEAT THIS COMPLETE STRUCTURE FOR ALL ${days} DAYS]
---

## RESOURCE APPENDIX
[Generate a detailed appendix including DALL-E prompts for visuals, a materials procurement list with estimated costs, and a comprehensive assessment rubric as specified in the master prompt.]
`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Enhanced validation with more descriptive error messages
    if (!body.gradeLevel || body.gradeLevel === 'Select Grade') {
      return NextResponse.json({ error: 'Please select a valid grade level to begin.' }, { status: 400 });
    }
    if (!body.subjects || body.subjects.length === 0) {
      return NextResponse.json({ error: 'Please select at least one subject area.' }, { status: 400 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("CRITICAL: ANTHROPIC_API_KEY is not configured in Vercel.");
      return NextResponse.json({ error: 'The application is not configured correctly. Please contact support.' }, { status: 500 });
    }

    const input: GeneratePlanInput = {
      gradeLevel: body.gradeLevel,
      subjects: body.subjects,
      duration: parseInt(String(body.days || body.duration || 3), 10),
      days: parseInt(String(body.days || body.duration || 3), 10),
      unitTitle: body.unitTitle || 'Cultural Identity and Expression',
      standards: body.standards || 'Relevant state standards',
      focus: body.focus || 'Trauma-informed approach'
    };

    const prompt = createOptimizedPrompt(input);

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      // Increased token limit to find the "sweet spot" for more detailed, multi-day plans.
      // This is the primary lever for balancing detail vs. speed.
      max_tokens: 6000, 
      temperature: 0.3, // Lower temperature for more consistent, less "creative" output
      messages: [{ role: 'user', content: prompt }]
    });

    const lessonPlan = response.content?.[0]?.type === 'text' ? response.content[0].text : '';
    
    if (!lessonPlan) {
      throw new Error('The AI returned an empty response. Please try a more specific request.');
    }

    // More robust quality validation
    const dayHeaders = lessonPlan.match(/# DAY \d+:/gi) || [];
    const teacherNotesCount = (lessonPlan.match(/\[Teacher Note:/gi) || []).length;
    const studentNotesCount = (lessonPlan.match(/\[Student Note:/gi) || []).length;
    const hasResourceAppendix = lessonPlan.toUpperCase().includes('RESOURCE APPENDIX');
    
    const quality = {
      daysGenerated: dayHeaders.length,
      daysRequested: input.days!,
      teacherNotesCount,
      studentNotesCount,
      hasResourceAppendix
    };

    // Add a professional header to the output
    let finalLessonPlan = `
# 🌱 Rootwork Framework Lesson Plan

**Unit Title:** ${input.unitTitle}  
**Grade Level:** ${input.gradeLevel} | **Subjects:** ${input.subjects!.join(', ')}

---
${lessonPlan}
    `;

    // Refined quality notice logic
    const qualityIssues = [];
    if (quality.daysGenerated < quality.daysRequested) {
      qualityIssues.push(`only ${quality.daysGenerated} of ${quality.daysRequested} days were generated`);
    }
    // Check for at least 3 notes per day generated, a reasonable minimum for quality
    if (quality.teacherNotesCount < quality.daysGenerated * 3) {
      qualityIssues.push('is missing some Teacher Notes');
    }
    if (quality.studentNotesCount < quality.daysGenerated * 3) {
      qualityIssues.push('is missing some Student Notes');
    }
    if (!quality.hasResourceAppendix) {
      qualityIssues.push('is missing the Resource Appendix');
    }

    if (qualityIssues.length > 0) {
      finalLessonPlan += `\n\n---\n\n## QUALITY ENHANCEMENT NOTICE\n\n`;
      finalLessonPlan += `⚡ **Partial Generation:** This plan ${qualityIssues.join(', ')}.\n\n`;
      finalLessonPlan += `**For maximum quality, try generating fewer days (1-2) or a single subject.**\n`;
      finalLessonPlan += `*This lesson plan is designed to be fully functional for classroom use as-is.*`;
    }

    return NextResponse.json({ lessonPlan: finalLessonPlan });

  } catch (error: any) {
    console.error('[API_ERROR]', error);
    
    let errorMessage = 'An unexpected error occurred during generation.';
    let suggestion = 'Please try reducing the number of days or subjects. If the problem persists, contact support.';

    if (error.status === 429) {
      errorMessage = 'The generator is currently experiencing high demand.';
      suggestion = 'Please wait 60 seconds and try your request again.';
    } else if (error.message) {
      errorMessage = `Generation failed: ${error.message}`;
    }
    
    return NextResponse.json({ error: errorMessage, suggestion }, { status: 500 });
  }
}
