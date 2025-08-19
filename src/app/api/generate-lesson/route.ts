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
    // Parse request data
    let data: LessonRequest;
    try {
      data = await request.json();
    } catch (parseError) {
      console.error('Request parsing failed:', parseError);
      return NextResponse.json({ 
        error: 'Invalid request format',
        success: false 
      }, { status: 400 });
    }

    // Validate required fields
    if (!data.subject || !data.gradeLevel || !data.topic || !data.duration || !data.learningObjectives) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        success: false 
      }, { status: 400 });
    }

    // Create the prompt for Claude
    const prompt = `
You are generating a lesson plan using the Root Work Framework, a trauma-informed, regenerative learning ecosystem 
developed by Dr. S.A. Hearn. This framework integrates:

FOUNDATIONAL PRINCIPLES:
- SAMHSA's Six Trauma-Informed Principles: Safety, Trustworthiness, Peer Support, Collaboration, Empowerment, and Cultural Responsiveness
- CASEL's SEL Competencies: Emotional regulation, relationship building, responsible decision-making
- MTSS and UDL Principles for neurodiversity and behavioral health needs
- Place-based, project-based STEAM education
- Regenerative urban homesteading and environmental stewardship
- Culturally responsive pedagogy
- Living Learning Labs (LLLs) approach

LESSON REQUIREMENTS:
Subject: ${data.subject}
Grade Level: ${data.gradeLevel}
Topic: ${data.topic}
Duration: ${data.duration}
Learning Objectives: ${data.learningObjectives}
Special Considerations: ${data.specialNeeds || 'None specified'}
Available Resources: ${data.availableResources || 'Standard classroom resources'}

Generate a comprehensive lesson plan that embeds Root Work Framework principles in JSON format:

{
  "title": "Engaging lesson title that reflects trauma-informed, place-based learning",
  "overview": "Brief overview emphasizing community connection, healing, and regenerative learning",
  "objectives": ["3-5 learning objectives that integrate academic standards with SEL competencies"],
  "materials": ["Materials that support hands-on, place-based learning when possible"],
  "timeline": [
    {
      "time": "X minutes",
      "activity": "Activity name reflecting trauma-informed practices",
      "description": "Detailed description incorporating safety, collaboration, and empowerment"
    }
  ],
  "assessment": "Assessment strategies that honor diverse ways of knowing and cultural responsiveness",
  "differentiation": "Trauma-informed differentiation strategies addressing diverse learning needs and cultural backgrounds",
  "extensions": "Extension activities that connect to community, environmental stewardship, or intergenerational learning"
}

SPECIFIC ROOT WORK REQUIREMENTS:
- Create psychologically safe learning environments
- Build on students' cultural assets and community knowledge
- Incorporate collaborative, peer-support structures
- Include opportunities for student agency and empowerment
- Connect learning to place, community, and environmental stewardship when possible
- Address the whole child (academic, social, emotional, physical well-being)
- Use restorative rather than punitive approaches
- Honor diverse ways of learning and expressing knowledge
- Include opportunities for reflection and meaning-making
- Connect to broader systems of healing and community transformation

Respond only with valid JSON. Do not include any text outside of the JSON structure.
`;

    let lessonPlan: LessonPlan;

    // Try Claude API call
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
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
        throw new Error(`Claude API failed: ${response.status}`);
      }

      const apiData = await response.json();
      
      if (!apiData.content || !apiData.content[0] || !apiData.content[0].text) {
        throw new Error('Invalid API response structure');
      }

      let responseText = apiData.content[0].text;

      // Clean up response - remove markdown formatting if present
      responseText = responseText.replace(/```json\s?/g, "").replace(/```\s?/g, "").trim();

      try {
        lessonPlan = JSON.parse(responseText);
        // Validate the parsed lesson plan
        lessonPlan = validateLessonPlan(lessonPlan, data);
      } catch (parseError) {
        console.error("JSON parsing failed:", parseError);
        throw new Error('Failed to parse AI response');
      }

    } catch (aiError) {
      console.error('AI generation failed:', aiError);
      // Use fallback lesson plan if AI fails
      lessonPlan = createFallbackLessonPlan(data);
    }

    return NextResponse.json({ 
      lessonPlan,
      success: true 
    });

  } catch (error) {
    console.error('General error in lesson generation:', error);
    
    // Try to create fallback plan even on general error
    try {
      const requestData = await request.clone().json();
      const fallbackPlan = createFallbackLessonPlan(requestData);
      
      return NextResponse.json({ 
        lessonPlan: fallbackPlan,
        success: true,
        fallback: true
      });
    } catch (fallbackError) {
      console.error('Fallback creation failed:', fallbackError);
      
      return NextResponse.json({ 
        error: 'Unable to generate lesson plan',
        success: false 
      }, { status: 500 });
    }
  }
}

function createFallbackLessonPlan(data: LessonRequest): LessonPlan {
  const durationMinutes = parseInt(data.duration.split(' ')[0]) || 45;
  const warmUpTime = Math.min(10, Math.floor(durationMinutes * 0.15));
  const mainTime = Math.floor(durationMinutes * 0.65);
  const wrapUpTime = Math.floor(durationMinutes * 0.2);

  return {
    title: `${data.topic}: A Root Work Framework Learning Experience - ${data.gradeLevel} ${data.subject}`,
    overview: `This trauma-informed lesson connects students to ${data.topic} through place-based learning, cultural responsiveness, and community connection. Students will engage in collaborative exploration while building on their cultural assets and prior knowledge in a psychologically safe environment.`,
    objectives: [
      `Students will explore ${data.topic} through culturally responsive, hands-on investigation`,
      `Students will practice SEL competencies including collaboration, responsible decision-making, and emotional regulation`,
      `Students will make meaningful connections between ${data.topic} and their community experiences`,
      `Students will demonstrate learning through multiple modalities that honor diverse ways of knowing`,
      `Students will engage in reflection and meaning-making about their learning journey`
    ],
    materials: [
      'Chart paper and markers for collaborative work',
      'Student journals for reflection',
      'Community connection materials (photos, maps, stories)',
      'Hands-on manipulatives or real-world materials when possible',
      data.availableResources || 'Culturally relevant resources and materials'
    ],
    timeline: [
      {
        time: `${warmUpTime} minutes`,
        activity: "Community Circle and Cultural Asset Building",
        description: `Begin with a community circle to create psychological safety. Invite students to share prior knowledge about ${data.topic} from their personal, family, or community experiences. Honor diverse perspectives and create connections between student assets and the lesson content.`
      },
      {
        time: `${Math.floor(mainTime * 0.6)} minutes`,
        activity: "Collaborative Exploration of Core Concepts",
        description: `Guide students through ${data.topic} using hands-on, place-based methods when possible. Emphasize peer support, collaboration, and multiple ways of engaging with content. Incorporate movement, discussion, and real-world connections to community and environmental contexts.`
      },
      {
        time: `${Math.floor(mainTime * 0.4)} minutes`,
        activity: "Student Agency and Application",
        description: `Provide opportunities for students to take ownership of their learning through choice in how they demonstrate understanding. Connect learning to community stewardship, environmental awareness, or intergenerational knowledge sharing when relevant.`
      },
      {
        time: `${wrapUpTime} minutes`,
        activity: "Reflection Circle and Community Connection",
        description: "Gather in a closing circle for reflection and meaning-making. Invite students to share insights, ask questions, and make connections to their lives and communities. Preview how this learning connects to ongoing community transformation and stewardship."
      }
    ],
    assessment: `Use culturally responsive assessment that honors diverse ways of knowing and expressing understanding. Include peer feedback, self-reflection, and authentic demonstration of learning. Focus on growth, effort, and community contribution rather than deficit-based evaluation. Document student engagement, collaboration, and connection-making.`,
    differentiation: data.specialNeeds ? 
      `Address specific considerations: ${data.specialNeeds}. Provide trauma-informed supports including choice, movement, sensory breaks, and multiple communication modalities. Use MTSS and UDL principles to ensure all students can access and demonstrate learning. Build on cultural assets and honor neurodiversity.` :
      "Implement trauma-informed practices including flexible seating, movement breaks, and multiple communication options. Honor diverse learning styles, cultural backgrounds, and neurodiversity. Provide scaffolding and peer support systems. Use restorative rather than punitive approaches to behavior.",
    extensions: `Advanced learners can become peer mentors, investigate community connections to ${data.topic}, research environmental or cultural applications, or develop projects that contribute to community healing and transformation. Connect to intergenerational learning opportunities and real-world stewardship activities.`
  };
}

function validateLessonPlan(plan: any, data: LessonRequest): LessonPlan {
  // Ensure all required fields exist and have reasonable content
  return {
    title: plan.title || `${data.topic} - ${data.gradeLevel} ${data.subject}`,
    overview: plan.overview || `A comprehensive Root Work Framework lesson on ${data.topic}`,
    objectives: Array.isArray(plan.objectives) && plan.objectives.length > 0 ? 
      plan.objectives : [`Students will understand ${data.topic} through trauma-informed, culturally responsive approaches`],
    materials: Array.isArray(plan.materials) && plan.materials.length > 0 ? 
      plan.materials : ['Community circle space', 'Collaborative learning materials', 'Student reflection journals'],
    timeline: Array.isArray(plan.timeline) && plan.timeline.length > 0 ? 
      plan.timeline : [
        {
          time: "10 minutes",
          activity: "Community Circle Opening",
          description: `Create psychological safety and connect to ${data.topic}`
        },
        {
          time: "25 minutes", 
          activity: "Collaborative Exploration",
          description: `Explore ${data.topic} through culturally responsive methods`
        },
        {
          time: "10 minutes",
          activity: "Reflection Circle",
          description: "Share insights and make community connections"
        }
      ],
    assessment: plan.assessment || "Use culturally responsive assessment methods that honor diverse ways of knowing",
    differentiation: plan.differentiation || "Implement trauma-informed practices and support diverse learning needs",
    extensions: plan.extensions || "Connect learning to community stewardship and intergenerational knowledge sharing"
  };
}
