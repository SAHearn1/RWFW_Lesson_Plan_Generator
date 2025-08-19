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

    // Validate required fields (match your frontend validation exactly)
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

    // Create Root Work Framework prompt that returns structured lesson plan
    const prompt = `Create a comprehensive lesson plan using Root Work Framework principles. Return ONLY a valid JSON object with no markdown formatting.

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

Return a JSON object with exactly these fields:
{
  "title": "Creative lesson title incorporating Root Work Framework",
  "overview": "2-3 sentence description incorporating Root Work principles and healing-centered approach",
  "objectives": ["Array of 3-5 specific learning objectives that integrate SEL and academic goals"],
  "materials": ["Array of needed materials including culturally responsive and biophilic elements"],
  "timeline": [{"time": "0-10 minutes", "activity": "Activity name", "description": "Detailed description with trauma-informed approaches"}],
  "assessment": "Assessment strategies that honor multiple ways of knowing and include self-reflection",
  "differentiation": "Comprehensive accommodations for diverse learners including trauma-informed practices and MTSS support",
  "extensions": "Extension activities connecting to community, real-world applications, and family engagement"
}

Use warm, invitational language throughout. Focus on strengths-based, trauma-informed approaches. Ensure all activities are developmentally appropriate for ${data.gradeLevel}. Include healing-centered practices and cultural responsiveness.`;

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
      
      // Return comprehensive fallback lesson plan
      const fallbackPlan: LessonPlan = {
        title: `Root Work Framework: ${data.topic} - Grade ${data.gradeLevel}`,
        overview: `This ${data.duration} lesson integrates ${data.topic} with Root Work Framework's 5Rs, creating a healing-centered learning environment that builds relationships, establishes routines, ensures relevance, maintains rigor, and promotes reflection through culturally responsive, trauma-informed instruction.`,
        objectives: [
          `Students will understand key concepts in ${data.topic} through culturally responsive, trauma-informed instruction`,
          'Students will engage in collaborative learning that builds authentic community connections',
          'Students will connect new learning to their lived experiences and cultural knowledge',
          'Students will demonstrate mastery through multiple assessment formats that honor diverse ways of knowing',
          'Students will practice self-reflection and develop growth mindset within a healing-centered environment'
        ],
        materials: [
          'Student reflection journals or digital portfolios',
          'Community circle space with flexible seating options',
          'Chart paper, markers, and collaborative workspace materials',
          'Culturally relevant texts, images, and community connection resources',
          'Natural elements for biophilic connection (plants, stones, etc.)',
          'Regulation tools and sensory supports for diverse learners',
          'Technology access for multiple modalities of expression'
        ],
        timeline: [
          {
            time: '0-10 minutes',
            activity: 'Opening Circle & Community Building',
            description: 'Begin with trauma-informed opening ritual. Students share cultural assets and prior knowledge related to the topic. Create psychological safety through predictable routine and community acknowledgment.'
          },
          {
            time: '10-25 minutes', 
            activity: 'Relevance Connection & Cultural Hook',
            description: `Connect ${data.topic} to students' lives, communities, and cultural experiences. Use storytelling, real-world examples, and student voice to bridge prior knowledge with new learning.`
          },
          {
            time: '25-45 minutes',
            activity: 'Rigorous Learning with Healing-Centered Support',
            description: `Engage in ${data.topic} instruction using multiple modalities and collaborative structures. Include hands-on exploration, peer learning, and scaffolded challenges that honor diverse learning styles while maintaining high expectations.`
          },
          {
            time: '45-55 minutes',
            activity: 'Collaborative Application & Practice',
            description: 'Students apply new learning through partner or small group work with choice in demonstration method. Emphasize collective success, peer support, and culturally responsive problem-solving.'
          },
          {
            time: '55-60 minutes',
            activity: 'Reflection Circle & Community Closure',
            description: 'Individual and collective reflection on learning growth. Students share insights, celebrate collective achievements, make connections to their communities, and set intentions for continued learning.'
          }
        ],
        assessment: 'Multi-modal assessment honoring diverse ways of knowing: formative assessment through community sharing and peer feedback; self-reflection on learning process and cultural connections; authentic demonstration of understanding through student choice of expression (verbal, written, artistic, movement, community-based); growth-focused evaluation emphasizing process over product.',
        differentiation: 'Comprehensive MTSS support: Tier 1 - Universal trauma-informed practices, multiple learning modalities, and culturally responsive instruction for all students. Tier 2 - Additional scaffolding, peer support, and regulation breaks for students needing more time. Tier 3 - Individualized accommodations, alternative assessment formats, and specialized support. Include visual supports, movement opportunities, choice in participation level, and strength-based feedback.',
        extensions: 'Community Connections: Students interview family/community members about their knowledge of the topic. Real-World Applications: Explore how the topic appears in students\' neighborhoods and daily lives. Family Engagement: Create take-home materials that honor intergenerational knowledge. Environmental Stewardship: Connect learning to place-based education and care for local ecosystems. Peer Teaching: Opportunities for students to share learning with younger students or community members.'
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
      console.log('Successfully parsed lesson plan:', lessonPlan.title);
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.log('Using fallback lesson plan due to parsing error');
      
      // Use comprehensive fallback if parsing fails
      lessonPlan = {
        title: `Root Work Framework: ${data.topic} - Grade ${data.gradeLevel}`,
        overview: `A comprehensive ${data.duration} lesson plan designed using Root Work Framework principles, integrating trauma-informed care with academically rigorous ${data.topic} instruction for ${data.gradeLevel} students.`,
        objectives: [
          `Students will engage deeply with ${data.topic} concepts through culturally responsive, healing-centered instruction`,
          'Students will practice collaboration and community building while learning',
          'Students will connect academic content to their personal and cultural experiences',
          'Students will demonstrate understanding through multiple, culturally responsive assessment methods',
          'Students will develop self-awareness and reflection skills within a supportive learning community'
        ],
        materials: [
          'Student journals for reflection and note-taking',
          'Community circle space with flexible seating',
          'Collaborative learning supplies (chart paper, markers, sticky notes)',
          'Culturally relevant texts and visual resources',
          'Technology tools for research and presentation',
          'Sensory regulation tools and movement options'
        ],
        timeline: [
          {
            time: '0-15 minutes',
            activity: 'Opening Circle & Cultural Asset Sharing',
            description: 'Begin with community building ritual and cultural knowledge sharing related to the topic'
          },
          {
            time: '15-35 minutes',
            activity: 'Core Learning with Multiple Modalities',
            description: `Engage in ${data.topic} instruction through visual, auditory, kinesthetic, and collaborative approaches`
          },
          {
            time: '35-50 minutes',
            activity: 'Collaborative Application & Practice',
            description: 'Students work together to apply new learning with peer support and choice in demonstration methods'
          },
          {
            time: '50-60 minutes',
            activity: 'Reflection & Community Closure',
            description: 'Individual and group reflection on learning, celebration of growth, and connection to ongoing community learning'
          }
        ],
        assessment: 'Trauma-informed assessment using observation, student self-reflection, peer feedback, and authentic demonstration of learning through multiple modalities',
        differentiation: 'Comprehensive support including visual aids, movement options, choice in participation, culturally responsive materials, and individualized accommodations following MTSS framework',
        extensions: 'Community research projects, family knowledge integration, real-world applications in local context, and opportunities for peer teaching and mentorship'
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
