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

// Retry logic with exponential backoff
async function retryApiCall(
  client: Anthropic, 
  prompt: string, 
  maxTokens: number, 
  maxRetries: number = 2
): Promise<any> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Add random delay to avoid thundering herd
      if (attempt > 0) {
        const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
        console.log(`Retry attempt ${attempt}, waiting ${Math.round(delay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      // Use progressively more conservative settings on retries
      const retryTokens = attempt === 0 ? maxTokens : Math.max(8192, maxTokens - (attempt * 2000));
      const retryTemp = attempt === 0 ? 0.3 : 0.1;
      
      console.log(`Attempt ${attempt + 1}: Using ${retryTokens} tokens, temp ${retryTemp}`);
      
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: retryTokens,
        temperature: retryTemp,
        messages: [{ role: 'user', content: prompt }]
      });
      
      return response; // Success!
      
    } catch (error: any) {
      lastError = error;
      console.log(`Attempt ${attempt + 1} failed:`, error.message);
      
      // Don't retry on certain errors
      if (error.status === 400 || error.status === 401 || error.status === 403) {
        throw error; // Authentication/validation errors
      }
      
      // Check if we should continue retrying
      const isRetryableError = 
        error.status === 429 || // Rate limit
        error.status === 500 || // Server error
        error.status === 502 || // Bad gateway
        error.status === 503 || // Service unavailable
        error.status === 529 || // Overloaded
        error.message?.includes('busy') ||
        error.message?.includes('overloaded') ||
        error.message?.includes('timeout');
      
      if (!isRetryableError || attempt === maxRetries) {
        break; // Don't retry or max retries reached
      }
    }
  }
  
  throw lastError; // All retries failed
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

    // Enhanced validation
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

    // Smart day limiting during high-demand periods
    if (days > 3) {
      return NextResponse.json({
        error: `For comprehensive quality with detailed Teacher/Student Notes and Resource Appendix, generate 2-3 days at a time.`,
        suggestion: `Try Days 1-3 first, then generate Days 4-${days} separately. This ensures full exemplar-quality detail.`,
        tip: 'Complex lesson plans work best in smaller chunks during peak usage times.'
      }, { status: 400 });
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
    console.log('Sending request to Anthropic with retry logic...');

    // Determine token limit based on complexity
    const baseTokens = 10000; // Conservative starting point
    const complexityMultiplier = subjects.length > 1 ? 1.2 : 1.0;
    const dayMultiplier = Math.min(days * 0.3, 1.5);
    const maxTokens = Math.round(baseTokens * complexityMultiplier * dayMultiplier);
    
    console.log(`Using ${maxTokens} tokens for ${days} days, ${subjects.length} subjects`);

    // Use retry logic
    const response = await retryApiCall(client, prompt, maxTokens);

    const lessonPlan = response.content?.[0]?.type === 'text' ? response.content[0].text : '';
    
    if (!lessonPlan) {
      return NextResponse.json(
        { error: 'Empty response from AI model.' },
        { status: 502 }
      );
    }

    // Enhanced quality validation
    const hasResourceAppendix = lessonPlan.includes('RESOURCE APPENDIX') || 
                                lessonPlan.includes('RESOURCE GENERATION APPENDIX') ||
                                lessonPlan.includes('DALL-E') || 
                                lessonPlan.includes('MATERIALS PROCUREMENT') ||
                                lessonPlan.includes('A. DALL-E IMAGE PROMPTS') ||
                                lessonPlan.includes('B. KEY MATERIALS PROCUREMENT') ||
                                lessonPlan.includes('ESSENTIAL RESOURCE APPENDIX');

    const hasTeacherNotes = lessonPlan.includes('[Teacher Note:');
    const hasStudentNotes = lessonPlan.includes('[Student Note:');
    const dayCount = (lessonPlan.match(/# DAY \d+:/g) || []).length;
    
    console.log('Generated lesson plan successfully');
    console.log('Lesson plan length:', lessonPlan.length);
    console.log('Quality metrics:', {
      hasResourceAppendix,
      hasTeacherNotes,
      hasStudentNotes,
      dayCount,
      requestedDays: days
    });

    // Quality feedback
    let finalLessonPlan = lessonPlan;
    const qualityIssues = [];
    
    if (dayCount < days) qualityIssues.push(`Generated ${dayCount}/${days} days`);
    if (!hasTeacherNotes) qualityIssues.push('Missing Teacher Notes');
    if (!hasStudentNotes) qualityIssues.push('Missing Student Notes');
    if (!hasResourceAppendix) qualityIssues.push('Incomplete Resource Appendix');
    
    if (qualityIssues.length > 0) {
      finalLessonPlan += `\n\n## GENERATION QUALITY NOTICE\n\n`;
      finalLessonPlan += `⚠️ **Quality Check:** ${qualityIssues.join(', ')}\n\n`;
      finalLessonPlan += `**For complete exemplar-quality output:**\n`;
      finalLessonPlan += `- Generate 2-3 days max during peak hours\n`;
      finalLessonPlan += `- Try single-subject focus first, then add interdisciplinary elements\n`;
      finalLessonPlan += `- Retry during off-peak hours (early morning/evening) for best results\n\n`;
      finalLessonPlan += `**Generated during high-demand period.** Retry for enhanced quality with detailed Teacher/Student Notes and complete Resource Appendix.\n\n`;
      finalLessonPlan += `**Support:** hearn.sa@gmail.com`;
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
          quality: qualityIssues.length === 0 ? 'Complete' : 'Partial',
          tokensUsed: maxTokens
        }
      }
    });

  } catch (error: any) {
    console.error('Error in generatePlan:', error);
    
    // Enhanced error handling with specific user guidance
    if (error.status === 429) {
      return NextResponse.json({
        error: '🚦 Rate limit reached. Please wait 60 seconds and try again.',
        retryAfter: 60,
        tip: 'Try generating 2 days instead of ' + (req.body?.days || 3) + ' for faster processing.'
      }, { status: 429 });
    }
    
    if (error.status === 529 || error.message?.includes('busy') || error.message?.includes('overloaded')) {
      return NextResponse.json({
        error: '🖥️ High server demand detected. Please try again in 1-2 minutes.',
        suggestion: 'Try during off-peak hours (early morning/late evening) for best results.',
        quickTip: 'Generate 2-day lesson plans for faster processing during busy periods.'
      }, { status: 503 });
    }
    
    if (error.message?.includes('timeout')) {
      return NextResponse.json({
        error: '⏱️ Generation timeout. Try reducing complexity.',
        suggestions: [
          'Reduce to 2 days maximum',
          'Focus on single subject first',
          'Simplify the topic description',
          'Try again during off-peak hours'
        ]
      }, { status: 504 });
    }
    
    if (error.status) {
      return NextResponse.json({
        error: `API error (${error.status}): ${error.message}`,
        suggestion: 'Try simplifying your request or contact support.',
        troubleshooting: 'Reduce days to 2, use single subject, or retry in a few minutes.'
      }, { status: 502 });
    }

    return NextResponse.json({
      error: 'Unexpected error during generation.',
      details: error.message,
      action: 'Please try again with simplified parameters (2 days, single subject).'
    }, { status: 500 });
  }
}
