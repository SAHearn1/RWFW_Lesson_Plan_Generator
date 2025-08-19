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

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'API configuration error. Please check your environment variables.' },
        { status: 500 }
      );
    }

    // Construct the Root Work Framework-aligned prompt
    const prompt = `Create a comprehensive, Root Work Framework-aligned lesson plan for educators with the following specifications:

UNIT DETAILS:
- Unit Title: ${data.unitTitle}
- Grade Level: ${data.gradeLevel}
- Duration: ${data.numberOfDays} days, ${data.minutes} minutes per day
${data.standards ? `- Academic Standards: ${data.standards}` : ''}
${data.focusArea ? `- Special Focus: ${data.focusArea}` : ''}

ROOT WORK FRAMEWORK REQUIREMENTS:
Please structure this lesson plan around the 5Rs of Root Work Framework:
1. **Relationships** - Build authentic connections and community
2. **Routines** - Establish predictable, healing-centered structures  
3. **Relevance** - Connect learning to students' lives and experiences
4. **Rigor** - Maintain high academic expectations with appropriate support
5. **Reflection** - Include metacognitive and restorative practices

LESSON PLAN STRUCTURE:
**Unit Overview**
- Clear learning objectives aligned with the 5Rs
- Big picture goals and essential questions
- Connection to healing-centered, biophilic practices

**Daily Breakdown** (for each of the ${data.numberOfDays} days)
- Day X (${data.minutes} minutes): 
  - Opening Routine (5-10 minutes) - relationship/community building
  - Main Learning Activities - incorporating rigor and relevance
  - Reflection/Closure (5-10 minutes) - metacognitive practices
  - Materials needed
  - Differentiation strategies

**Assessment Strategies**
- Formative assessments embedded throughout
- Summative assessment options
- Student self-reflection components

**Root Work Integration**
- Specific examples of how each lesson connects to students' experiences
- Trauma-informed practices and accommodations
- Community-building elements
- Opportunities for student voice and choice

**Materials & Resources**
- Complete list of needed supplies
- Technology requirements
- Community partnership opportunities

Please generate a complete, educator-ready lesson plan that embodies the Root Work Framework's commitment to weaving academic rigor with healing-centered, biophilic practice. Use plain language and an invitational "we/our" tone throughout.`;

    console.log('Calling Claude API with Root Work Framework prompt...');

    // Call Claude API with proper authentication
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,  // This is the missing authentication header!
        "anthropic-version": "2023-06-01"
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
      const errorText = await response.text();
      console.error('Claude API error:', response.status, response.statusText, errorText);
      throw new Error(`Claude API request failed: ${response.status} - ${response.statusText}`);
    }

    const claudeData = await response.json();
    console.log('Claude API response received successfully');

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
