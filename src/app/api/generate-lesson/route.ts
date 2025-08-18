import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Model fallback chain - try newer models first
const MODEL_FALLBACKS = [
  'claude-3-5-sonnet-20241022', // Latest Claude 3.5 Sonnet
  'claude-3-sonnet-20240229',   // Fallback Claude 3 Sonnet
  'claude-3-haiku-20240307'     // Final fallback Claude 3 Haiku
]

// Inline prompts to avoid import issues
const ROOT_WORK_SYSTEM_PROMPT = `You are an expert educator guided by the Root Work Framework. You create lesson plans that are equity-first, trauma-informed, strength-based, and community-connected.

CORE PRINCIPLES:
1. EQUITY FIRST: Ensure all students can access learning regardless of background, ability, or circumstance
2. TRAUMA INFORMED: Create emotionally safe learning environments with predictability and choice
3. STRENGTH BASED: Build on what students bring rather than focusing on deficits
4. COMMUNITY CONNECTED: Connect learning to real-world applications and community partnerships

LESSON STRUCTURE REQUIREMENTS:
- Multiple pathways for learning and demonstration
- Built-in accommodations, not add-ons
- Cultural responsiveness and relevance
- Clear connections to standards
- Assessment that measures growth, not just performance
- Real-world applications and community connections

Always include specific strategies for diverse learners including ELL, students with disabilities, and different cultural backgrounds.`

function buildLessonPrompt(
  subjects: string[],
  gradeLevel: string,
  objectives: string,
  duration: number,
  specialNeeds: string[]
): string {
  const specialNeedsText = specialNeeds.length > 0 
    ? `\n\nSPECIAL CONSIDERATIONS: This lesson must specifically address: ${specialNeeds.join(', ')}`
    : ''

  const subjectText = subjects.length > 1 
    ? `SUBJECTS (Interdisciplinary): ${subjects.join(', ')}`
    : `SUBJECT: ${subjects[0]}`

  return `${ROOT_WORK_SYSTEM_PROMPT}

CREATE A COMPREHENSIVE LESSON PLAN:

${subjectText}
GRADE LEVEL: ${gradeLevel}
DURATION: ${duration} minutes
LEARNING OBJECTIVES: ${objectives}${specialNeedsText}

FORMAT YOUR RESPONSE AS A DETAILED LESSON PLAN INCLUDING:

1. LESSON OVERVIEW
   - Clear learning objectives aligned to standards
   - Root Work Framework integration summary
   ${subjects.length > 1 ? '- Interdisciplinary connections and integration strategies' : ''}

2. MATERIALS AND PREPARATION
   - Required materials with culturally relevant options
   - Preparation steps for equitable access

3. LESSON STRUCTURE
   - Opening (community building and activation)
   - Development (scaffolded, choice-rich instruction)
   - Practice (collaborative and differentiated)
   - Closure (reflection and real-world connections)

4. DIFFERENTIATION STRATEGIES
   - Specific accommodations and modifications
   - Multiple ways to access, engage, and express learning
   - Support for identified special considerations

5. ASSESSMENT
   - Formative assessment strategies
   - Multiple demonstration options
   - Growth-focused evaluation criteria

6. COMMUNITY CONNECTIONS
   - Real-world applications
   - Potential community partnerships
   - Home-school connections

7. REFLECTION PROMPTS
   - Questions to ensure equity and inclusion
   - Growth tracking for students and teacher

Make this practical, actionable, and immediately usable by a teacher. Include specific examples and concrete strategies rather than general statements.`
}

async function generateWithFallback(prompt: string): Promise<any> {
  for (const model of MODEL_FALLBACKS) {
    try {
      const message = await anthropic.messages.create({
        model: model,
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
      
      return {
        content: message.content[0].type === 'text' ? message.content[0].text : 'Unable to generate lesson content',
        model: model,
        usage: message.usage
      }
    } catch (error) {
      console.log(`Model ${model} failed, trying next fallback...`, error)
      continue
    }
  }
  
  throw new Error('All AI models failed to generate content')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subject, subjects, gradeLevel, objectives, duration, specialNeeds } = body

    // Handle both single subject (legacy) and multiple subjects
    const subjectList = subjects && subjects.length > 0 ? subjects : (subject ? [subject] : [])

    // Validate required fields
    if (subjectList.length === 0 || !gradeLevel || !objectives) {
      return NextResponse.json(
        { error: 'Missing required fields: subjects, gradeLevel, and objectives are required' },
        { status: 400 }
      )
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured. Please add ANTHROPIC_API_KEY environment variable.' },
        { status: 500 }
      )
    }

    // Build the Root Work Framework prompt
    const prompt = buildLessonPrompt(
      subjectList,
      gradeLevel,
      objectives,
      parseInt(duration) || 60,
      specialNeeds || []
    )

    // Generate lesson with fallback models
    const result = await generateWithFallback(prompt)

    return NextResponse.json({
      success: true,
      lesson: result.content,
      metadata: {
        rootWorkCompliant: true,
        generatedAt: new Date().toISOString(),
        framework: 'Root Work Framework - Equity First, Trauma Informed, Strength Based, Community Connected',
        subjects: subjectList,
        specialConsiderations: specialNeeds,
        model: result.model,
        prompt_tokens: result.usage?.input_tokens,
        completion_tokens: result.usage?.output_tokens
      }
    })
  } catch (error) {
    console.error('Lesson generation error:', error)
    
    // Handle specific API errors
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `AI service error: ${error.message}` },
        { status: error.status || 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate lesson plan' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'Root Work Framework AI lesson generation service',
    hasApiKey: !!process.env.ANTHROPIC_API_KEY,
    models: MODEL_FALLBACKS,
    framework: 'Equity-centered, trauma-informed lesson planning'
  })
}
