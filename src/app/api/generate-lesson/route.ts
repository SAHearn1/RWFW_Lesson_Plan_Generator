import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { buildLessonPrompt } from '@/lib/prompts'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subject, gradeLevel, objectives, duration, specialNeeds } = body

    // Validate required fields
    if (!subject || !gradeLevel || !objectives) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, gradeLevel, and objectives are required' },
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
      subject,
      gradeLevel,
      objectives,
      parseInt(duration) || 60,
      specialNeeds || []
    )

    // Generate lesson with Anthropic Claude
    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    const lessonContent = message.content[0].type === 'text' 
      ? message.content[0].text 
      : 'Unable to generate lesson content'

    return NextResponse.json({
      success: true,
      lesson: lessonContent,
      metadata: {
        rootWorkCompliant: true,
        generatedAt: new Date().toISOString(),
        framework: 'Root Work Framework - Equity First, Trauma Informed, Strength Based, Community Connected',
        specialConsiderations: specialNeeds,
        model: 'claude-3-sonnet-20240229',
        prompt_tokens: message.usage?.input_tokens,
        completion_tokens: message.usage?.output_tokens
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
    framework: 'Equity-centered, trauma-informed lesson planning'
  })
}
