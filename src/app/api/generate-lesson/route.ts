// src/app/api/generate-lesson/route.ts

import { NextRequest, NextResponse } from 'next/server';

interface LessonRequest {
  unitTitle: string;
  gradeLevel: string;
  numberOfDays: string;
  minutes: string;
  standards?: string;
  focusArea?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: LessonRequest = await request.json();
    
    console.log('Received request data:', data);

    // Validate required fields
    const missingFields = [];
    if (!data.unitTitle?.trim()) missingFields.push('unitTitle');
    if (!data.gradeLevel?.trim()) missingFields.push('gradeLevel');
    if (!data.numberOfDays?.trim()) missingFields.push('numberOfDays');
    if (!data.minutes?.trim()) missingFields.push('minutes');

    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Construct the prompt for Claude
    const prompt = `Create a comprehensive, professional lesson plan for educators with the following specifications:

UNIT DETAILS:
- Unit Title: ${data.unitTitle}
- Grade Level: ${data.gradeLevel}
- Duration: ${data.numberOfDays} days, ${data.minutes} minutes per day
${data.standards ? `- Academic Standards: ${data.standards}` : ''}
${data.focusArea ? `- Special Focus: ${data.focusArea}` : ''}

LESSON PLAN REQUIREMENTS:
1. **Unit Overview** - Clear learning objectives and big picture goals
2. **Daily Breakdown** - Structured activities for each day
3. **Assessment Strategies** - Both formative and summative assessments
4. **Differentiation** - Accommodations for diverse learners
5. **Materials & Resources** - Complete list of needed supplies
6. **Standards Alignment** - Connection to educational standards
7. **Extension Activities** - For advanced learners or additional time

FORMAT REQUIREMENTS:
- Professional, educator-ready format
- Clear daily structure with time allocations
- Specific, actionable instructions
- Age-appropriate activities and language
- Include warm-up, main activities, and closure for each day

Please generate a complete, ready-to-implement lesson plan that an educator could use immediately.`;

    console.log('Calling Claude API with prompt...');

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status, response.statusText);
      throw new Error(`Claude API request failed: ${response.status}`);
    }

    const claudeData = await response.json();
    console.log('Claude API response received');

    const lessonPlan = claudeData.content[0].text;

    return NextResponse.json({ 
      lessonPlan,
      success: true 
    });

  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate lesson plan',
        success: false 
      },
      { status: 500 }
    );
  }
}
