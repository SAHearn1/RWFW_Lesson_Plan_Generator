// File: src/app/api/generate-lesson/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface LessonRequest {
  unitTitle: string;
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
    if (!data.unitTitle?.trim()) missingFields.push('unitTitle');
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
      unitTitle: data.unitTitle.trim(),
      gradeLevel: data.gradeLevel.trim(),
      numberOfDays: data.numberOfDays.trim(),
      minutes: data.minutes.trim(),
      standards: data.standards?.trim() || '',
      focusArea: data.focusArea?.trim() || ''
    };

    console.log('Cleaned data for processing:', cleanData);

    // Create comprehensive Root Work Framework master prompt - FULL VERSION
    const prompt = `
🧑‍🏫 Persona to Assume: You are an expert curriculum designer with 20+ years of experience in:
- K–12 education (general and special education)
- Project-Based Learning (PBL)
- Trauma-Informed Care (TIC) in schools
- Living Learning Labs (LLLs) and STEAM integration
- CASEL-aligned Social Emotional Learning (SEL)
- MTSS design and classroom regulation
- Student agency and equity-centered pedagogy

You are also familiar with the book From Garden to Growth and its frameworks, including:
- Table 1.1: "Foundations of Trauma-Informed Pedagogy"
- Figure 1.3: "Regulation Rituals in Garden-Based Learning"
- Table 2.1: "Cultural Anchoring in Learning Design"
- Figure 2.3: "The Garden-Based Regulation Protocol"
- The Trauma-Informed STEAM Lesson Design Rubric
- The STEAM-PBL Unit Planner for LLLs
- The Trauma-Responsive PBL Unit Template
- The Trauma-Informed PBL Implementation Rubric

Your lesson plans are meticulously crafted to include essential components such as Opening, Mini-Lesson, Work Session, and Closing. You incorporate deconstructed State Standards and formulate essential questions at varying Depths of Knowledge (DOK) levels. Each lesson plan is detailed with daily learning targets, ensuring clarity and purpose. You also specialize in integrating environmental sustainability and gardening elements into these plans. Your approach includes providing clear and engaging teacher scripts, a variety of project options, and the inclusion of social-emotional learning components.

🎯 MANDATORY TEACHER & STUDENT NOTES PROTOCOL: Every lesson component MUST include both note types in this exact format:

Teacher Notes Format:
- Appear as [Teacher Note: ] immediately after each activity description
- Include: pedagogical rationale, trauma-informed considerations, differentiation strategies, assessment insights, Rootwork Framework connections
- Tone: Professional, supportive mentor to colleague
- Length: 1-3 sentences maximum
- Must address therapeutic context and trauma-informed facilitation

Student Notes Format:
- Appear as [Student Note: ] immediately after teacher notes
- Include: coaching language, success strategies, self-advocacy prompts, growth mindset reinforcement, connection to personal growth
- Tone: Warm, empowering, second-person voice aligned with Rootwork Framework
- Length: 1-2 sentences maximum
- Must support student agency and emotional regulation

Placement Rules:
- Notes appear immediately after activity descriptions, before MTSS supports
- Both note types required for every major lesson component (Opening, I Do, We Do, You Do Together, You Do Alone, Closing)
- No lesson component may be generated without both note types
- Notes must maintain therapeutic Rootwork Framework context throughout

LESSON REQUIREMENTS:
Grade Level: ${cleanData.gradeLevel}
Number of Days: ${cleanData.numberOfDays}
Minutes per Day: ${cleanData.minutes}

TEACHER'S STANDARDS & OBJECTIVES DESCRIPTION:
${cleanData.standards || 'No specific standards provided - please generate grade-appropriate learning objectives that align with Root Work Framework principles and common educational standards for this grade level.'}

TEACHER'S FOCUS AREA & CONSIDERATIONS:
${cleanData.focusArea || 'No specific focus area provided - please incorporate trauma-informed practices, cultural responsiveness, and differentiation strategies appropriate for diverse learners.'}

🎯 Objective: Generate a ${cleanData.numberOfDays}-day, student-facing lesson plan that integrates:
- Trauma-informed care (SAMHSA 6 Principles)
- STEAM and Project-Based Learning
- Living Learning Lab methodology
- CASEL SEL competencies
- MTSS scaffolding
- Student agency and differentiated learning modalities
- Gradual Release of Responsibility (GRR)

The lesson must include resources or explicit instructions to create the following:
- Student-facing templates
- Multimedia links or embedded tools
- Assessment rubrics
- Peer/self-reflection tools
- Garden or nature-based regulation rituals

🧾 MANDATORY Output Format - Each Component Required:

For each lesson day, provide in this exact order:

HEADER SECTION:
- Day #, Lesson Title, Essential Question, "I Can" Learning Target, Standards, DOK Level
- [Teacher Note: Pedagogical context for this lesson's objectives and trauma-informed considerations]
- [Student Note: What you're building toward and why it matters for your growth]

STRUCTURED LESSON FLOW:

Opening (10-15 minutes)
- Activity description with specific instructions
- [Teacher Note: Facilitation tips, trauma-informed considerations, and Rootwork Framework connections]
- [Student Note: Coaching language for engagement and self-regulation strategies]

I Do: Direct Instruction (15-20 minutes)
- Content and modeling description
- [Teacher Note: Key teaching points, differentiation strategies, and therapeutic facilitation approaches]
- [Student Note: What to focus on during instruction and how this builds your skills]

Work Session (25-40 minutes)
We Do: Collaborative exploration or modeling
- Activity description
- [Teacher Note: Scaffolding tips and trauma-informed group facilitation]
- [Student Note: Success strategies and collaboration expectations]

You Do Together: Partner or small group task
- Activity description
- [Teacher Note: Monitoring guidance and support indicators]
- [Student Note: Partnership strategies and self-advocacy reminders]

You Do Alone: Independent work or reflection
- Activity description
- [Teacher Note: Individual support strategies and regulation monitoring]
- [Student Note: Self-management strategies and growth mindset reinforcement]

Closing (5-10 minutes)
- Activity description with reflection components
- [Teacher Note: Assessment insights, next steps, and trauma-informed closure]
- [Student Note: Reflection prompts and growth recognition strategies]

Additional Required Sections Per Day:
- Student-facing instructions and scaffolds
- Facilitator modeling guidance
- MTSS tiered supports (Tier 1–3)
- SEL competencies addressed
- Regulation rituals (referencing Figure 2.3 where applicable)
- Choices for student expression
- Multimedia integration: embed or link video, Flipgrid, Canva, etc.
- Clear formative or summative assessment tasks
- Reflection or peer feedback mechanisms
- Optional extension or enrichment opportunities
- Literacy Skills Integration (with specific components)
- Bloom's Taxonomy Alignment with DOK levels
- Specific Accommodation Categories:
  * 504 Accommodations
  * Gifted Learner Extensions  
  * SPED Modifications
- Co-teaching Model Integration (specify model used)
- Reteaching Plans (for students needing additional support)

🔍 MANDATORY NOTES QUALITY CHECK: Before finalizing any lesson component, verify it contains:
- [Teacher Note: ] with specific pedagogical guidance addressing trauma-informed practice
- [Student Note: ] with encouraging coaching language supporting student agency
- Both notes align with Rootwork Framework therapeutic principles
- Notes address the healing-centered educational context appropriately
- If ANY component lacks both note types, regenerate entire lesson component

🛑 FINAL GENERATION PROTOCOL:
1. Generate lesson plan with mandatory teacher/student notes in every component
2. Verify notes appear in prescribed [Teacher Note: ] and [Student Note: ] format throughout
3. Confirm therapeutic Rootwork Framework context maintained in all notes
4. Run final check ensuring no component lacks both note types
5. Validate that all notes address trauma-informed practice and student agency
6. Only output complete lesson if ALL validation criteria met, including note requirements

🧭 Mode Selection: Full Unit Generation with Project-Based Learning Focus

🧠 CRITICAL LLM Behavioral Constraints:
1. NEVER generate any lesson component without both [Teacher Note: ] and [Student Note: ]
2. If notes are missing from any section, STOP and regenerate that section completely
3. Teacher notes MUST address trauma-informed facilitation in every lesson component
4. Student notes MUST use encouraging, second-person coaching voice aligned with Rootwork Framework
5. Notes appear BEFORE MTSS supports in each section
6. Do not fabricate links, tools, or citations. If needed, generate a placeholder (e.g. "[Insert Flipgrid link here]").
7. Do not label elements as "TIC" or "CASEL" — embed them naturally and substantively.
8. Use warm, empowering second-person voice in student-facing instructions.
9. Assume a ${cleanData.minutes}-minute block schedule by default.
10. Use sensory-friendly metaphors, garden/nature references, and identity-rooted rituals.
11. Maintain therapeutic context and healing-centered approach throughout all components

INTELLIGENT INTERPRETATION INSTRUCTIONS:
1. If the teacher provided standards/objectives description, interpret their intent and create specific, measurable learning objectives that align with their description while incorporating Root Work principles.
2. If the teacher provided focus area description, interpret their needs and incorporate those elements throughout the lesson plan (differentiation, special populations, available resources, pedagogical approaches, etc.).
3. If either narrative box is empty, intelligently fill in appropriate content based on:
   - Grade level expectations
   - Root Work Framework principles
   - Best practices for trauma-informed education
   - Culturally responsive teaching methods
   - SEL integration

Create specific, actionable content that directly addresses the teacher's requirements while maintaining Root Work Framework principles throughout. Respond with detailed lesson plans that include all required components with mandatory teacher and student notes in every section.

CRITICAL: NEVER generate any lesson component without both [Teacher Note: ] and [Student Note: ]. Always ask clarifying questions to a 98% confidence level that you will develop what the user has requested, ensuring the therapeutic context of the Rootwork Framework is maintained throughout.
`;

    let lessonPlan: LessonPlan;

    // Try Claude API call with comprehensive debugging
    try {
      console.log('Attempting Claude API call with Root Work Framework master prompt...');
      
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          messages: [
            { role: "user", content: prompt }
          ]
        })
      });

      console.log('Claude API response status:', response.status);

      if (!response.ok) {
        console.error('Claude API failed with status:', response.status);
        const errorText = await response.text();
        console.error('Claude API error response:', errorText);
        throw new Error(`Claude API failed: ${response.status} - ${errorText}`);
      }

      const apiData = await response.json();
      console.log('Claude API response received, content length:', apiData.content?.[0]?.text?.length || 0);
      
      if (!apiData.content || !apiData.content[0] || !apiData.content[0].text) {
        console.error('Invalid Claude API response structure:', apiData);
        throw new Error('Invalid API response structure');
      }

      let responseText = apiData.content[0].text;
      console.log('Raw Claude response preview:', responseText.substring(0, 500) + '...');

      // Clean up response - remove markdown formatting if present
      responseText = responseText.replace(/```json\s?/g, "").replace(/```\s?/g, "").trim();

      try {
        lessonPlan = JSON.parse(responseText);
        console.log('Successfully parsed JSON from Claude - lesson title:', lessonPlan.title);
        // Validate the parsed lesson plan
        lessonPlan = validateLessonPlan(lessonPlan, cleanData);
      } catch (parseError) {
        console.error("JSON parsing failed:", parseError);
        console.error("Failed to parse text preview:", responseText.substring(0, 200));
        
        // Try to extract JSON if it's embedded in text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            lessonPlan = JSON.parse(jsonMatch[0]);
            console.log('Successfully extracted and parsed JSON from response');
            lessonPlan = validateLessonPlan(lessonPlan, cleanData);
          } catch (extractError) {
            console.error("JSON extraction also failed:", extractError);
            throw new Error('Failed to parse AI response as JSON');
          }
        } else {
          throw new Error('No JSON found in AI response');
        }
      }

    } catch (aiError) {
      console.error('AI generation failed with error:', aiError);
      console.log('Falling back to Root Work Framework template lesson plan');
      // Use enhanced fallback lesson plan that follows Root Work Framework
      lessonPlan = createRootWorkFallbackLessonPlan(cleanData);
    }

    console.log('Returning lesson plan with title:', lessonPlan.title);

    return NextResponse.json({ 
      lessonPlan,
      success: true 
    });

  } catch (error) {
    console.error('General error in lesson generation:', error);
    
    // Try to create fallback plan even on general error
    try {
      const requestData = await request.clone().json();
      const fallbackPlan = createRootWorkFallbackLessonPlan(requestData);
      
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

function createRootWorkFallbackLessonPlan(data: LessonRequest): LessonPlan {
  const numDays = parseInt(data.numberOfDays) || 1;
  const minutesPerDay = parseInt(data.minutes) || 90;
  
  // Create structured timeline following Root Work Framework GRR model
  const timeline = [];
  
  for (let day = 1; day <= numDays; day++) {
    const topic = data.standards ? extractTopicFromStandards(data.standards) : `Day ${day} Learning Focus`;
    
    timeline.push({
      time: `Day ${day}: Opening/Hook (10-15 min)`,
      activity: "Community Circle and Cultural Asset Building",
      description: `Begin Day ${day} with trauma-informed opening circle. Students share prior knowledge about ${topic} from personal/cultural experiences. [Teacher Note: Create psychological safety through predictable routine and cultural validation. Monitor for emotional regulation needs.] [Student Note: This is your space to connect what you already know to new learning. Take deep breaths and share what feels comfortable.]`
    });

    timeline.push({
      time: `Day ${day}: I Do - Direct Instruction (15-20 min)`,
      activity: "Modeling and Demonstration",
      description: `Teacher models key concepts related to ${topic} using multiple modalities and culturally responsive examples. [Teacher Note: Use think-aloud strategy and provide visual, auditory, and kinesthetic input. Watch for signs of overwhelm and adjust pacing.] [Student Note: Focus on the learning process being modeled. Notice how experts think through problems and strategies you can use.]`
    });

    timeline.push({
      time: `Day ${day}: We Do - Collaborative Exploration (10-15 min)`,
      activity: "Guided Practice Together",
      description: `Collaborative exploration of ${topic} with teacher guidance and peer support. [Teacher Note: Facilitate rather than direct. Use proximity and positive narration to support student engagement. Provide choice in participation level.] [Student Note: This is practice time with support. Ask questions, share ideas, and learn from your classmates' perspectives.]`
    });

    timeline.push({
      time: `Day ${day}: You Do Together - Partner/Small Group (15-20 min)`,
      activity: "Partner Application and Exploration",
      description: `Students work in partnerships or small groups to apply learning about ${topic}. [Teacher Note: Use intentional grouping strategies. Circulate to provide just-in-time support. Honor different communication styles and collaboration preferences.] [Student Note: Work together to deepen understanding. Use your partnership skills and remember everyone learns differently.]`
    });

    timeline.push({
      time: `Day ${day}: You Do Alone - Independent Practice (15-20 min)`,
      activity: "Individual Reflection and Application",
      description: `Independent work allowing students to demonstrate understanding of ${topic} through chosen modality. [Teacher Note: Provide multiple options for demonstrating learning. Use regulation check-ins and offer movement breaks. Support self-advocacy skills.] [Student Note: Show what you know in the way that works best for you. Use your self-regulation strategies and ask for support when needed.]`
    });

    timeline.push({
      time: `Day ${day}: Closing/Reflection (5-10 min)`,
      activity: "Reflection Circle and Community Connection",
      description: `Close Day ${day} with reflection on learning and connections to community/life experiences. [Teacher Note: Use restorative closure practices. Celebrate growth and effort. Preview next day to reduce anxiety.] [Student Note: Reflect on your learning growth today. Think about how this connects to your life and goals.]`
    });
  }

  return {
    title: `Root Work Framework ${numDays}-Day Learning Experience: ${data.standards ? extractTopicFromStandards(data.standards) : 'Student-Centered Learning'} - Grade ${data.gradeLevel}`,
    overview: `This ${numDays}-day trauma-informed lesson sequence (${minutesPerDay} minutes per day) integrates SAMHSA trauma-informed principles, CASEL SEL competencies, and Root Work Framework methodology. Students engage in culturally responsive, place-based learning that honors their assets while building academic skills through STEAM integration and Living Learning Lab approaches.`,
    objectives: [
      `Students will engage in trauma-informed, culturally responsive learning experiences over ${numDays} days`,
      `Students will practice CASEL SEL competencies including self-awareness, social awareness, and responsible decision-making`,
      `Students will demonstrate learning through multiple modalities that honor diverse ways of knowing`,
      `Students will make meaningful connections between academic content and their cultural/community experiences`,
      `Students will develop self-regulation and self-advocacy skills within a healing-centered learning environment`
    ],
    materials: [
      'Community circle space with flexible seating options',
      'Student reflection journals with choice of formats',
      'Chart paper, markers, and collaborative work materials',
      'Culturally relevant texts, images, and community connection resources',
      'STEAM integration materials (science tools, art supplies, technology access)',
      'Regulation tools (fidgets, movement options, quiet space access)',
      data.focusArea ? `Specific materials for: ${data.focusArea}` : 'Materials responsive to student interests and needs'
    ],
    timeline: timeline,
    assessment: `MTSS-aligned assessment using multiple modalities: Tier 1 - Universal formative assessment through observation, student self-reflection, and peer feedback. Tier 2 - Additional check-ins and scaffolded support for students needing more time. Tier 3 - Individualized assessment accommodations and alternative demonstration methods. All assessment honors cultural responsiveness and trauma-informed principles, focusing on growth rather than deficit-based evaluation.`,
    differentiation: `Comprehensive differentiation following Root Work Framework: 504 Accommodations - Extended time, preferred seating, movement breaks, alternative formats. Gifted Extensions - Complex problem-solving, peer mentoring, independent research projects. SPED Modifications - Visual supports, chunked instructions, sensory accommodations, communication alternatives. Co-teaching Model: ${getRandomCoTeachingModel()} with shared responsibility for trauma-informed facilitation. ${data.focusArea ? `Specific considerations: ${data.focusArea}` : 'Standard trauma-informed practices with cultural responsiveness.'}`,
    extensions: `Reteaching Plans: For students needing additional support - use alternative modalities, peer tutoring, and additional practice with trauma-informed approaches. Extension Activities: Advanced learners can engage in community research projects, mentor younger students, create resources for families, or develop environmental stewardship initiatives. Literacy Integration: Include vocabulary development, reading comprehension strategies, and writing across curriculum. STEAM Connections: ${generateSTEAMConnections(data.standards || 'interdisciplinary learning')}. Living Learning Lab opportunities for hands-on, place-based learning that extends beyond the ${numDays}-day sequence.`
  };
}

function extractTopicFromStandards(standards: string): string {
  // Simple extraction of likely topic from standards text
  const keywords = standards.toLowerCase().match(/\b(genetics|literature|math|science|history|writing|reading|analysis|investigation|research|study|exploration)\b/g);
  if (keywords && keywords.length > 0) {
    return keywords[0].charAt(0).toUpperCase() + keywords[0].slice(1);
  }
  return 'Interdisciplinary Learning';
}

function getRandomCoTeachingModel(): string {
  const models = [
    'One Teach, One Support',
    'Parallel Teaching',
    'Alternative Teaching',
    'Station Teaching',
    'Team Teaching'
  ];
  return models[Math.floor(Math.random() * models.length)];
}

function generateSTEAMConnections(topic: string): string {
  return `Science - observation and hypothesis formation; Technology - digital tools for research and presentation; Engineering - problem-solving and design thinking; Arts - creative expression and cultural representation; Mathematics - data analysis and pattern recognition related to ${topic}`;
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
          description: `Create psychological safety and connect to learning content [Teacher Note: Use trauma-informed facilitation] [Student Note: This is your safe space to learn and grow]`
        }
      ],
    assessment: plan.assessment || "Use culturally responsive assessment methods that honor diverse ways of knowing",
    differentiation: plan.differentiation || "Implement trauma-informed practices and support diverse learning needs with MTSS framework",
    extensions: plan.extensions || "Connect learning to community stewardship and intergenerational knowledge sharing with STEAM integration"
  };
}
