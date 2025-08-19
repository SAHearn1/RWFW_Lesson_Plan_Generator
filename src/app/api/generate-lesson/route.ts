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

function parseClaudeResponse(text: string): LessonPlan {
  // Parse the Claude response into the structured format your UI expects
  const lines = text.split('\n');
  
  // Extract title
  const titleMatch = text.match(/(?:LESSON PLAN:|TITLE:|UNIT:)\s*(.+)/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Root Work Framework Lesson Plan';
  
  // Extract overview
  const overviewMatch = text.match(/(?:OVERVIEW|INTRODUCTION|DESCRIPTION):\s*([\s\S]*?)(?=\n(?:[A-Z\s]+:|$))/i);
  const overview = overviewMatch ? overviewMatch[1].trim() : 'A comprehensive lesson plan designed using Root Work Framework principles.';
  
  // Extract objectives
  const objectivesMatch = text.match(/(?:OBJECTIVES?|GOALS?):\s*([\s\S]*?)(?=\n(?:[A-Z\s]+:|$))/i);
  let objectives = ['Students will engage with the topic through Root Work Framework principles'];
  if (objectivesMatch) {
    objectives = objectivesMatch[1]
      .split(/\n/)
      .filter(line => line.trim())
      .map(line => line.replace(/^[-•*\d.]\s*/, '').trim())
      .filter(line => line.length > 10);
  }
  
  // Extract materials
  const materialsMatch = text.match(/(?:MATERIALS?|RESOURCES?):\s*([\s\S]*?)(?=\n(?:[A-Z\s]+:|$))/i);
  let materials = ['Basic classroom supplies', 'Student notebooks', 'Whiteboard/projector'];
  if (materialsMatch) {
    materials = materialsMatch[1]
      .split(/\n/)
      .filter(line => line.trim())
      .map(line => line.replace(/^[-•*\d.]\s*/, '').trim())
      .filter(line => line.length > 3);
  }
  
  // Extract timeline/activities
  const timelineMatch = text.match(/(?:TIMELINE|ACTIVITIES?|LESSON STRUCTURE):\s*([\s\S]*?)(?=\n(?:[A-Z\s]+:|$))/i);
  let timeline = [
    { time: '0-5 minutes', activity: 'Opening Circle', description: 'Community building and mindful transition' },
    { time: '5-40 minutes', activity: 'Main Learning', description: 'Core content with Root Work Framework integration' },
    { time: '40-45 minutes', activity: 'Reflection & Closure', description: 'Metacognitive processing and community circle' }
  ];
  
  if (timelineMatch) {
    const timelineText = timelineMatch[1];
    const timeItems = timelineText.split(/\n/).filter(line => line.trim());
    timeline = timeItems.map((item, index) => {
      const timeMatch = item.match(/(\d+[-–]\d+|\d+)\s*(?:min|minutes?)/i);
      const time = timeMatch ? timeMatch[0] : `${index * 15}-${(index + 1) * 15} minutes`;
      const cleanItem = item.replace(/^[-•*\d.]\s*/, '').trim();
      const [activity, ...descParts] = cleanItem.split(/[:-]/);
      return {
        time,
        activity: activity.trim() || `Activity ${index + 1}`,
        description: descParts.join(':').trim() || 'Root Work Framework aligned activity'
      };
    }).slice(0, 6); // Limit to 6 activities max
  }
  
  // Extract assessment
  const assessmentMatch = text.match(/(?:ASSESSMENT|EVALUATION):\s*([\s\S]*?)(?=\n(?:[A-Z\s]+:|$))/i);
  const assessment = assessmentMatch ? assessmentMatch[1].trim() : 'Formative assessment through observation, student reflection, and community sharing aligned with Root Work Framework principles.';
  
  // Extract differentiation
  const differentiationMatch = text.match(/(?:DIFFERENTIATION|ACCOMMODATIONS?):\s*([\s\S]*?)(?=\n(?:[A-Z\s]+:|$))/i);
  const differentiation = differentiationMatch ? differentiationMatch[1].trim() : 'Multiple learning modalities, trauma-informed approaches, and culturally responsive practices following Root Work Framework guidelines.';
  
  // Extract extensions
  const extensionsMatch = text.match(/(?:EXTENSIONS?|ENRICHMENT):\s*([\s\S]*?)(?=\n(?:[A-Z\s]+:|$))/i);
  const extensions = extensionsMatch ? extensionsMatch[1].trim() : 'Community connections, real-world applications, and deeper inquiry opportunities that honor Root Work Framework values.';
  
  return {
    title,
    overview,
    objectives: objectives.slice(0, 5), // Limit to 5 objectives
    materials: materials.slice(0, 8), // Limit to 8 materials
    timeline,
    assessment,
    differentiation,
    extensions
  };
}

export async function POST(request: NextRequest) {
  try {
    const data: LessonRequest = await request.json();
    
    console.log('Received RWF lesson request:', data);

    // Validate required fields
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

    // Check for API key - use your existing environment variable name
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'API configuration error. Please check environment variables.' },
        { status: 500 }
      );
    }

    // Construct the comprehensive Root Work Framework prompt
    const prompt = `You are an expert educator specializing in the Root Work Framework - a dual-purpose pedagogy that weaves academic rigor with healing-centered, biophilic practice. Create a comprehensive lesson plan using the 5Rs methodology.

LESSON SPECIFICATIONS:
- Subject: ${data.subject}
- Grade Level: ${data.gradeLevel} 
- Topic: ${data.topic}
- Duration: ${data.duration}
${data.learningObjectives ? `- Instructor's Learning Goals: ${data.learningObjectives}` : ''}
${data.specialNeeds ? `- Special Considerations: ${data.specialNeeds}` : ''}
${data.availableResources ? `- Available Resources: ${data.availableResources}` : ''}

ROOT WORK FRAMEWORK REQUIREMENTS:
Structure this lesson around the 5Rs of Root Work Framework:

1. **RELATIONSHIPS** - Build authentic connections and community
2. **ROUTINES** - Establish predictable, healing-centered structures  
3. **RELEVANCE** - Connect learning to students' lives and cultural experiences
4. **RIGOR** - Maintain high academic expectations with appropriate scaffolding
5. **REFLECTION** - Include metacognitive and restorative practices

LESSON PLAN FORMAT:
Create a detailed lesson plan with these sections:

**TITLE:** [Creative, engaging title that reflects the topic and Root Work approach]

**OVERVIEW:**
Write a 2-3 sentence overview explaining how this lesson embodies Root Work Framework principles while achieving academic goals.

**LEARNING OBJECTIVES:**
Create 3-5 specific, measurable objectives that:
- Align with grade-level standards
- Integrate social-emotional learning
- Honor diverse learning styles
- Connect to students' lived experiences

**MATERIALS NEEDED:**
List 5-8 materials including:
- Traditional academic supplies
- Technology if appropriate
- Natural/biophilic elements when possible
- Community/cultural resources

**LESSON TIMELINE:**
Create a detailed ${data.duration} timeline with specific time stamps:
- Opening Circle/Relationships (5-10 minutes) - community building
- Introduction/Hook (5-10 minutes) - relevance connection
- Main Learning Activities (majority of time) - rigor with support
- Guided Practice - scaffolded learning
- Reflection/Closure (5-10 minutes) - metacognitive processing
Include specific Root Work strategies for each segment.

**ASSESSMENT:**
Describe both formative and summative assessments that:
- Honor multiple ways of knowing
- Include self-reflection components
- Connect to community and cultural values
- Provide authentic feedback opportunities

**DIFFERENTIATION:**
Explain specific accommodations for:
- English Language Learners
- Students with disabilities
- Gifted/advanced learners
- Trauma-informed practices
- Culturally responsive approaches

**EXTENSION ACTIVITIES:**
Suggest 2-3 ways to extend learning through:
- Community connections
- Real-world applications
- Cross-curricular integration
- Family/home connections

Use warm, invitational language throughout. Write in "we/our" voice. Focus on strengths-based, trauma-informed approaches. Ensure all activities are developmentally appropriate for ${data.gradeLevel}.

Generate a complete, ready-to-implement lesson plan that truly embodies Root Work Framework's commitment to healing-centered, academically rigorous education.`;

    console.log('Calling Claude API with Root Work Framework prompt...');

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
      
      // Return a fallback lesson plan if Claude API fails
      const fallbackPlan: LessonPlan = {
        title: `Root Work Framework: ${data.topic} (${data.gradeLevel})`,
        overview: `This lesson integrates ${data.topic} with Root Work Framework's 5Rs: building relationships, establishing routines, ensuring relevance, maintaining rigor, and promoting reflection. Students will engage in healing-centered, academically challenging learning.`,
        objectives: [
          `Students will understand key concepts in ${data.topic} through culturally responsive instruction`,
          'Students will engage in collaborative learning that builds community',
          'Students will connect learning to their lived experiences and cultural backgrounds',
          'Students will demonstrate mastery through multiple assessment formats',
          'Students will reflect on their learning and growth mindset development'
        ],
        materials: [
          'Student notebooks or digital devices',
          'Whiteboard or projector for whole-group instruction',
          'Art supplies for creative expression',
          'Natural elements (plants, stones, etc.) for biophilic connection',
          'Community resources or guest speaker (if available)',
          'Culturally relevant texts or materials',
          'Assessment rubrics with student-friendly language'
        ],
        timeline: [
          {
            time: '0-5 minutes',
            activity: 'Opening Circle & Community Building',
            description: 'Begin with a mindful moment and community check-in. Share intention for learning and acknowledge the spaces and people that support our growth.'
          },
          {
            time: '5-15 minutes', 
            activity: 'Relevance Connection & Hook',
            description: `Connect ${data.topic} to students' lives, communities, and interests. Use culturally responsive examples and real-world applications.`
          },
          {
            time: '15-35 minutes',
            activity: 'Core Learning with Rigor & Support',
            description: `Engage in ${data.topic} instruction using multiple modalities. Include collaborative work, hands-on activities, and scaffolded challenges that honor diverse learning styles.`
          },
          {
            time: '35-45 minutes',
            activity: 'Application & Practice',
            description: 'Students apply new learning through guided practice with peer support and instructor feedback. Emphasize growth mindset and collective success.'
          },
          {
            time: '45-50 minutes',
            activity: 'Reflection & Closing Circle',
            description: 'Individual and collective reflection on learning. Share insights, celebrate growth, and set intentions for continued learning.'
          }
        ],
        assessment: 'Formative assessment through observation, peer feedback, and student self-reflection. Summative assessment honors multiple ways of demonstrating knowledge including verbal, written, artistic, and community-based expressions. Focus on growth and learning process rather than deficit-based evaluation.',
        differentiation: 'Provide multiple entry points for learning, visual and auditory supports, movement opportunities, and culturally responsive materials. Use trauma-informed practices including choice, collaboration, and strength-based feedback. Accommodate diverse learning needs while maintaining high expectations for all students.',
        extensions: 'Connect learning to family and community knowledge. Explore real-world applications in students\' neighborhoods. Create opportunities for students to teach others and engage in community problem-solving related to the topic.'
      };

      return NextResponse.json({
        lessonPlan: fallbackPlan,
        fallback: true,
        success: true
      });
    }

    const claudeData = await response.json();
    console.log('Claude API response received successfully');

    const rawLessonPlan = claudeData.content[0].text;
    
    // Parse the Claude response into structured format
    const structuredLessonPlan = parseClaudeResponse(rawLessonPlan);

    return NextResponse.json({ 
      lessonPlan: structuredLessonPlan,
      success: true 
    });

  } catch (error) {
    console.error('RWF API Error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate Root Work Framework lesson plan',
        success: false 
      },
      { status: 500 }
    );
  }
}
