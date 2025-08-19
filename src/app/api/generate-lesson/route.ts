// src/app/api/generate-lesson/route.ts

import { NextRequest, NextResponse } from 'next/server';

interface LessonRequest {
  subject: string;
  gradeLevel: string;
  topic: string;
  duration: string;
  learningObjectives?: string;
  specialNeeds?: string;
  availableResources?: string;
}

interface LessonPlan {
  title: string;
  overview: string;
  objectives: string[];
  materials: string[];
  timeline: Array<{
    time: string;
    activity: string;
    description: string;
  }>;
  assessment: string;
  differentiation: string;
  extensions: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: LessonRequest = await request.json();
    
    console.log('Received request data:', data);

    // Validate required fields (match your frontend validation)
    const missingFields = [];
    if (!data.subject?.trim()) missingFields.push('subject');
    if (!data.gradeLevel?.trim()) missingFields.push('gradeLevel');
    if (!data.topic?.trim()) missingFields.push('topic');
    if (!data.duration?.trim()) missingFields.push('duration');

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
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    // Create Root Work Framework prompt
    const prompt = `Create a comprehensive lesson plan using Root Work Framework principles:

LESSON DETAILS:
- Subject: ${data.subject}
- Grade Level: ${data.gradeLevel}
- Topic: ${data.topic}
- Duration: ${data.duration}
${data.learningObjectives ? `- Learning Objectives: ${data.learningObjectives}` : ''}
${data.specialNeeds ? `- Special Considerations: ${data.specialNeeds}` : ''}
${data.availableResources ? `- Available Resources: ${data.availableResources}` : ''}

ROOT WORK FRAMEWORK REQUIREMENTS:
Structure this lesson around the 5Rs:
1. RELATIONSHIPS - Build authentic connections and community
2. ROUTINES - Establish predictable, healing-centered structures  
3. RELEVANCE - Connect learning to students' lives and experiences
4. RIGOR - Maintain high academic expectations with support
5. REFLECTION - Include metacognitive and restorative practices

Please provide a detailed lesson plan in JSON format with these sections:
- title: Creative lesson title
- overview: 2-3 sentence description incorporating Root Work principles
- objectives: Array of 3-5 learning objectives
- materials: Array of needed materials and resources
- timeline: Array of timeline objects with time, activity, and description
- assessment: Assessment strategies honoring multiple ways of knowing
- differentiation: Accommodations for diverse learners including trauma-informed practices
- extensions: Extension activities connecting to community and real-world applications

Use warm, invitational language throughout. Focus on strengths-based, trauma-informed approaches. Ensure all activities are developmentally appropriate for ${data.gradeLevel}.

Return ONLY valid JSON - no markdown formatting or explanations.`;

    console.log('Calling Claude API...');

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
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
      
      // Return fallback lesson plan
      const fallbackPlan: LessonPlan = {
        title: `Root Work Framework: ${data.topic} (Grade ${data.gradeLevel})`,
        overview: `This ${data.duration} lesson integrates ${data.topic} with Root Work Framework's 5Rs, building relationships, establishing routines, ensuring relevance, maintaining rigor, and promoting reflection through healing-centered, academically challenging learning.`,
        objectives: [
          `Students will understand key concepts in ${data.topic} through culturally responsive instruction`,
          'Students will engage in collaborative learning that builds community',
          'Students will connect learning to their lived experiences',
          'Students will demonstrate mastery through multiple assessment formats',
          'Students will reflect on their learning and growth'
        ],
        materials: [
          'Student notebooks or digital devices',
          'Whiteboard or projector',
          'Art supplies for creative expression',
          'Natural elements for biophilic connection',
          'Culturally relevant materials',
          'Assessment rubrics'
        ],
        timeline: [
          {
            time: '0-10 minutes',
            activity: 'Opening Circle & Community Building',
            description: 'Begin with mindful moment and community check-in. Share learning intentions and acknowledge the spaces and people that support our growth.'
          },
          {
            time: '10-20 minutes', 
            activity: 'Relevance Connection & Hook',
            description: `Connect ${data.topic} to students' lives, communities, and interests using culturally responsive examples and real-world applications.`
          },
          {
            time: '20-40 minutes',
            activity: 'Core Learning with Rigor & Support',
            description: `Engage in ${data.topic} instruction using multiple modalities, collaborative work, and scaffolded challenges that honor diverse learning styles.`
          },
          {
            time: '40-50 minutes',
            activity: 'Application & Practice',
            description: 'Students apply new learning through guided practice with peer support and instructor feedback, emphasizing growth mindset.'
          },
          {
            time: '50-60 minutes',
            activity: 'Reflection & Closing Circle',
            description: 'Individual and collective reflection on learning. Share insights, celebrate growth, and set intentions for continued learning.'
          }
        ],
        assessment: 'Formative assessment through observation, peer feedback, and student self-reflection. Summative assessment honors multiple ways of demonstrating knowledge including verbal, written, artistic, and community-based expressions.',
        differentiation: 'Provide multiple entry points for learning, visual and auditory supports, movement opportunities, and culturally responsive materials. Use trauma-informed practices including choice, collaboration, and strength-based feedback.',
        extensions: 'Connect learning to family and community knowledge. Explore real-world applications in students\' neighborhoods. Create opportunities for students to teach others and engage in community problem-solving.'
      };

      return NextResponse.json({
        lessonPlan: fallbackPlan,
        fallback: true,
        success: true
      });
    }

    const claudeData = await response.json();
    console.log('Claude API response received');

    let rawLessonPlan = claudeData.content[0].text;
    
    // Clean up response - remove markdown if present
    rawLessonPlan = rawLessonPlan.replace(/```json\s?/g, "").replace(/```\s?/g, "").trim();

    let lessonPlan: LessonPlan;
    try {
      lessonPlan = JSON.parse(rawLessonPlan);
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      
      // Use fallback if parsing fails
      lessonPlan = {
        title: `Root Work Framework: ${data.topic} (Grade ${data.gradeLevel})`,
        overview: `A comprehensive lesson plan designed using Root Work Framework principles for ${data.gradeLevel} students learning about ${data.topic}.`,
        objectives: [
          `Students will engage with ${data.topic} through Root Work Framework principles`,
          'Students will practice collaboration and community building',
          'Students will connect learning to personal experiences',
          'Students will demonstrate understanding through multiple modalities'
        ],
        materials: [
          'Basic classroom supplies',
          'Student notebooks',
          'Collaborative learning materials',
          'Technology access as available'
        ],
        timeline: [
          {
            time: '0-15 minutes',
            activity: 'Opening & Community Building',
            description: 'Begin with community circle and cultural asset sharing related to the topic'
          },
          {
            time: '15-45 minutes',
            activity: 'Core Learning Experience',
            description: `Engage in ${data.topic} learning through multiple modalities and collaborative exploration`
          },
          {
            time: '45-60 minutes',
            activity: 'Reflection & Closure',
            description: 'Students reflect on learning and make connections to their lives and community'
          }
        ],
        assessment: 'Multiple forms of assessment including self-reflection, peer feedback, and authentic demonstration of learning',
        differentiation: 'Trauma-informed practices, multiple learning modalities, and culturally responsive approaches',
        extensions: 'Community connections and real-world applications of learning'
      };
    }

    return NextResponse.json({ 
      lessonPlan,
      success: true 
    });

  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate lesson plan',
        success: false 
      },
      { status: 500 }
    );
  }
}
