// File: src/app/api/generate-lesson/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface LessonRequest {
  subject: string;
  gradeLevel: string;
  topic: string;
  duration: string;
  learningObjectives: string;
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
    
    const prompt = `
Generate a comprehensive lesson plan for the following requirements:

Subject: ${data.subject}
Grade Level: ${data.gradeLevel}
Topic: ${data.topic}
Duration: ${data.duration}
Learning Objectives: ${data.learningObjectives}
Special Considerations: ${data.specialNeeds || 'None specified'}
Available Resources: ${data.availableResources || 'Standard classroom resources'}

Please provide a detailed lesson plan in JSON format with the following structure:
{
  "title": "Engaging lesson title",
  "overview": "Brief overview of the lesson",
  "objectives": ["List of 3-5 specific learning objectives"],
  "materials": ["List of materials needed"],
  "timeline": [
    {
      "time": "5 minutes",
      "activity": "Activity name",
      "description": "Detailed description of the activity"
    }
  ],
  "assessment": "Assessment strategies and methods",
  "differentiation": "Strategies for different learning needs",
  "extensions": "Extension activities for advanced learners"
}

Requirements:
- Align with educational best practices and standards
- Include engaging, age-appropriate activities
- Provide clear, actionable instructions
- Consider diverse learning styles
- Include formative and summative assessment strategies
- Ensure the timeline fits within the specified duration
- Make activities interactive and student-centered

Respond only with valid JSON. Do not include any text outside of the JSON structure.
`;

    // Primary model attempt
    let response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const apiData = await response.json();
    let responseText = apiData.content[0].text;

    // Clean up response - remove markdown formatting if present
    responseText = responseText.replace(/```json\s?/g, "").replace(/```\s?/g, "").trim();

    let lessonPlan: LessonPlan;
    
    try {
      lessonPlan = JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON parsing failed:", parseError);
      // Fallback lesson plan structure
      lessonPlan = createFallbackLessonPlan(data);
    }

    // Validate and ensure all required fields are present
    lessonPlan = validateLessonPlan(lessonPlan, data);

    return NextResponse.json({ 
      lessonPlan,
      success: true 
    });

  } catch (error) {
    console.error('Error generating lesson plan:', error);
    
    // Return fallback lesson plan on error
    const fallbackPlan = createFallbackLessonPlan(await request.json());
    
    return NextResponse.json({ 
      lessonPlan: fallbackPlan,
      success: true,
      fallback: true
    });
  }
}

function createFallbackLessonPlan(data: LessonRequest): LessonPlan {
  const durationMinutes = parseInt(data.duration.split(' ')[0]);
  const warmUpTime = Math.min(5, Math.floor(durationMinutes * 0.1));
  const mainTime = Math.floor(durationMinutes * 0.7);
  const wrapUpTime = Math.floor(durationMinutes * 0.2);

  return {
    title: `${data.topic} - ${data.gradeLevel} ${data.subject}`,
    overview: `This lesson introduces students to ${data.topic} through engaging activities and hands-on learning. Students will explore key concepts and develop understanding through guided practice and collaborative work.`,
    objectives: [
      `Students will understand the main concepts of ${data.topic}`,
      `Students will demonstrate knowledge through practical application`,
      `Students will engage in collaborative learning activities`,
      `Students will reflect on their learning and make connections`
    ],
    materials: [
      'Whiteboard/smartboard',
      'Student worksheets',
      'Writing materials',
      'Visual aids or diagrams',
      data.availableResources || 'Standard classroom supplies'
    ].filter(Boolean),
    timeline: [
      {
        time: `${warmUpTime} minutes`,
        activity: "Warm-up and Introduction",
        description: `Begin with a brief review of prior knowledge and introduce the topic of ${data.topic}. Engage students with a thought-provoking question or activity.`
      },
      {
        time: `${mainTime} minutes`,
        activity: "Main Learning Activity",
        description: `Guide students through the core concepts of ${data.topic}. Use interactive teaching methods, examples, and student participation to ensure understanding.`
      },
      {
        time: `${wrapUpTime} minutes`,
        activity: "Closure and Assessment",
        description: "Summarize key learning points, check for understanding, and preview upcoming lessons. Assign any homework or extension activities."
      }
    ],
    assessment: "Formative assessment through questioning, observation of student work, and exit tickets. Summative assessment through completion of activities and demonstration of understanding.",
    differentiation: data.specialNeeds ? 
      `Address special considerations: ${data.specialNeeds}. Provide multiple ways for students to access and demonstrate learning, including visual, auditory, and kinesthetic approaches.` :
      "Provide multiple ways for students to access and demonstrate learning. Use varied instructional strategies to meet different learning styles and abilities.",
    extensions: `Advanced students can explore additional aspects of ${data.topic}, conduct research, or help support their peers. Provide challenging questions and real-world applications.`
  };
}

function validateLessonPlan(plan: any, data: LessonRequest): LessonPlan {
  // Ensure all required fields exist and have reasonable content
  return {
    title: plan.title || `${data.topic} - ${data.gradeLevel} ${data.subject}`,
    overview: plan.overview || `A comprehensive lesson on ${data.topic}`,
    objectives: Array.isArray(plan.objectives) && plan.objectives.length > 0 ? 
      plan.objectives : [`Students will understand ${data.topic}`],
    materials: Array.isArray(plan.materials) && plan.materials.length > 0 ? 
      plan.materials : ['Whiteboard', 'Student materials'],
    timeline: Array.isArray(plan.timeline) && plan.timeline.length > 0 ? 
      plan.timeline : [
        {
          time: "10 minutes",
          activity: "Introduction",
          description: `Introduce ${data.topic}`
        },
        {
          time: "30 minutes", 
          activity: "Main Activity",
          description: `Explore ${data.topic} concepts`
        },
        {
          time: "5 minutes",
          activity: "Closure",
          description: "Review and summarize"
        }
      ],
    assessment: plan.assessment || "Observe student participation and check for understanding",
    differentiation: plan.differentiation || "Provide support for diverse learning needs",
    extensions: plan.extensions || "Additional activities for advanced learners"
  };
}
