// File: src/app/api/generate-lesson/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface LessonRequest {
  gradeLevel: string;
  numberOfDays: string;
  minutes: string;
  standards?: string;
  focusArea?: string;
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

    // Log the received data for debugging
    console.log('Received lesson request data:', JSON.stringify(data, null, 2));

    // Validate essential fields
    const missingFields = [];
    if (!data.gradeLevel?.trim()) missingFields.push('gradeLevel');
    if (!data.numberOfDays?.trim()) missingFields.push('numberOfDays');  
    if (!data.minutes?.trim()) missingFields.push('minutes');

    if (missingFields.length > 0) {
      console.log('Validation failed. Missing fields:', missingFields);
      return NextResponse.json({ 
        error: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields: missingFields,
        success: false 
      }, { status: 400 });
    }

    // Clean and prepare data
    const cleanData = {
      gradeLevel: data.gradeLevel.trim(),
      numberOfDays: data.numberOfDays.trim(),
      minutes: data.minutes.trim(),
      standards: data.standards?.trim() || '',
      focusArea: data.focusArea?.trim() || ''
    };

    console.log('Cleaned data for processing:', cleanData);

    // Create intelligent prompt that can interpret narrative descriptions
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
Grade Level: ${cleanData.gradeLevel}
Number of Days: ${cleanData.numberOfDays}
Minutes per Day: ${cleanData.minutes}

TEACHER'S STANDARDS & OBJECTIVES DESCRIPTION:
${cleanData.standards || 'No specific standards provided - please generate grade-appropriate learning objectives that align with Root Work Framework principles and common educational standards for this grade level.'}

TEACHER'S FOCUS AREA & CONSIDERATIONS:
${cleanData.focusArea || 'No specific focus area provided - please incorporate trauma-informed practices, cultural responsiveness, and differentiation strategies appropriate for diverse learners.'}

INTELLIGENT INTERPRETATION INSTRUCTIONS:
1. If the teacher provided standards/objectives description, interpret their intent and create specific, measurable learning objectives that align with their description while incorporating Root Work principles.

2. If the teacher provided focus area description, interpret their needs and incorporate those elements throughout the lesson plan (differentiation, special populations, available resources, pedagogical approaches, etc.).

3. If either narrative box is empty, intelligently fill in appropriate content based on:
   - Grade level expectations
   - Root Work Framework principles
   - Best practices for trauma-informed education
   - Culturally responsive teaching methods
   - SEL integration

4. Create a comprehensive ${cleanData.numberOfDays}-day lesson plan with each day being ${cleanData.minutes} minutes long.

5. Ensure the lesson plan follows this structure for JSON response:

{
  "title": "Engaging lesson title that reflects trauma-informed, place-based learning",
  "overview": "Brief overview emphasizing community connection, healing, and regenerative learning across ${cleanData.numberOfDays} days",
  "objectives": ["3-5 learning objectives that integrate academic standards with SEL competencies"],
  "materials": ["Materials that support hands-on, place-based learning when possible"],
  "timeline": [
    {
      "time": "Day 1: Minutes 1-${cleanData.minutes}",
      "activity": "Activity name reflecting trauma-informed practices",
      "description": "Detailed description incorporating safety, collaboration, and empowerment"
    },
    {
      "time": "Day 2: Minutes 1-${cleanData.minutes}",
      "activity": "Next day's activity",
      "description": "Detailed description building on previous day"
    }
    // Continue for all ${cleanData.numberOfDays} days
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
          max_tokens: 3000,
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
        lessonPlan = validateLessonPlan(lessonPlan, cleanData);
      } catch (parseError) {
        console.error("JSON parsing failed:", parseError);
        throw new Error('Failed to parse AI response');
      }

    } catch (aiError) {
      console.error('AI generation failed:', aiError);
      // Use fallback lesson plan if AI fails
      lessonPlan = createFallbackLessonPlan(cleanData);
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
  const numDays = parseInt(data.numberOfDays) || 1;
  const minutesPerDay = parseInt(data.minutes) || 45;
  
  // Create timeline for multiple days
  const timeline = [];
  for (let day = 1; day <= numDays; day++) {
    const warmUpTime = Math.min(10, Math.floor(minutesPerDay * 0.15));
    const mainTime = Math.floor(minutesPerDay * 0.65);
    const wrapUpTime = Math.floor(minutesPerDay * 0.2);

    timeline.push({
      time: `Day ${day}: Opening Community Circle (${warmUpTime} min)`,
      activity: "Community Circle and Cultural Asset Building",
      description: `Begin Day ${day} with a community circle to create psychological safety. Connect to previous learning and build on students' cultural assets and community knowledge.`
    });

    timeline.push({
      time: `Day ${day}: Main Learning Activity (${mainTime} min)`,
      activity: "Collaborative Exploration and Application",
      description: `Day ${day} core learning activities incorporating trauma-informed practices, hands-on engagement, and Root Work Framework principles. Emphasize peer support, collaboration, and multiple ways of engaging with content.`
    });

    timeline.push({
      time: `Day ${day}: Reflection and Connection (${wrapUpTime} min)`,
      activity: "Reflection Circle and Community Connection",
      description: `Close Day ${day} with reflection and meaning-making. Connect learning to students' lives, communities, and future applications of knowledge.`
    });
  }

  return {
    title: `Root Work Framework Multi-Day Learning Experience - Grade ${data.gradeLevel}`,
    overview: `This ${numDays}-day trauma-informed lesson sequence (${minutesPerDay} minutes per day) connects students to learning through place-based education, cultural responsiveness, and community connection. Students will engage in collaborative exploration while building on their cultural assets and prior knowledge in psychologically safe environments.`,
    objectives: [
      `Students will engage in culturally responsive, hands-on learning over ${numDays} days`,
      `Students will practice SEL competencies including collaboration, responsible decision-making, and emotional regulation`,
      `Students will make meaningful connections between learning content and their community experiences`,
      `Students will demonstrate learning through multiple modalities that honor diverse ways of knowing`,
      `Students will engage in daily reflection and meaning-making about their learning journey`
    ],
    materials: [
      'Chart paper and markers for collaborative work',
      'Student reflection journals',
      'Community connection materials (photos, maps, stories)',
      'Hands-on manipulatives or real-world materials',
      data.focusArea ? 'Materials specific to focus area considerations' : 'Culturally relevant resources and materials'
    ],
    timeline: timeline,
    assessment: `Use culturally responsive assessment that honors diverse ways of knowing and expressing understanding. Include daily peer feedback, self-reflection, and authentic demonstration of learning across ${numDays} days. Focus on growth, effort, and community contribution rather than deficit-based evaluation. Document student engagement, collaboration, and connection-making throughout the sequence.`,
    differentiation: data.focusArea ? 
      `Address specific considerations: ${data.focusArea}. Provide trauma-informed supports including choice, movement, sensory breaks, and multiple communication modalities. Use MTSS and UDL principles to ensure all students can access and demonstrate learning across ${numDays} days. Build on cultural assets and honor neurodiversity.` :
      `Implement trauma-informed practices including flexible seating, movement breaks, and multiple communication options across all ${numDays} days. Honor diverse learning styles, cultural backgrounds, and neurodiversity. Provide scaffolding and peer support systems. Use restorative rather than punitive approaches to behavior.`,
    extensions: `Advanced learners can become peer mentors, investigate community connections to learning content, research environmental or cultural applications, or develop projects that contribute to community healing and transformation. Connect to intergenerational learning opportunities and real-world stewardship activities that extend beyond the ${numDays}-day sequence.`
  };
}

function validateLessonPlan(plan: any, data: LessonRequest): LessonPlan {
  // Ensure all required fields exist and have reasonable content
  return {
    title: plan.title || `Root Work Framework Lesson - Grade ${data.gradeLevel}`,
    overview: plan.overview || `A comprehensive ${data.numberOfDays}-day Root Work Framework lesson sequence`,
    objectives: Array.isArray(plan.objectives) && plan.objectives.length > 0 ? 
      plan.objectives : [`Students will engage in trauma-informed, culturally responsive learning over ${data.numberOfDays} days`],
    materials: Array.isArray(plan.materials) && plan.materials.length > 0 ? 
      plan.materials : ['Community circle space', 'Collaborative learning materials', 'Student reflection journals'],
    timeline: Array.isArray(plan.timeline) && plan.timeline.length > 0 ? 
      plan.timeline : [
        {
          time: `Day 1: Community Circle Opening (10 min)`,
          activity: "Community Circle Opening",
          description: `Create psychological safety and connect to learning content`
        },
        {
          time: `Day 1: Main Learning Activity (${parseInt(data.minutes) - 20} min)`, 
          activity: "Collaborative Exploration",
          description: `Engage in trauma-informed, culturally responsive learning activities`
        },
        {
          time: `Day 1: Reflection Circle (10 min)`,
          activity: "Reflection Circle",
          description: "Share insights and make community connections"
        }
      ],
    assessment: plan.assessment || "Use culturally responsive assessment methods that honor diverse ways of knowing",
    differentiation: plan.differentiation || "Implement trauma-informed practices and support diverse learning needs",
    extensions: plan.extensions || "Connect learning to community stewardship and intergenerational knowledge sharing"
  };
}
