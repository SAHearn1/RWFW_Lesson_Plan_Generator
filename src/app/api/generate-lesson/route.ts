import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// Vercel-specific configuration
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Initialize the Anthropic AI client
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Helper function for making the API call
const generateLessonPlan = async (model: string, messages: any[]) => {
  return client.messages.create({
    model: model,
    max_tokens: 32000,
    temperature: 0.3,
    messages: messages,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Get the Anthropic API key from environment variables
    const apiKey = process.env.ANTHROPIC_API_KEY
    
    if (!apiKey) {
      console.error("CRITICAL: ANTHROPIC_API_KEY is not configured.")
      return NextResponse.json(
        { error: 'Application not configured correctly.' },
        { status: 500 }
      )
    }

    // Primary Attempt: Use the premium Opus 4.1 model
    console.log('Attempting generation with primary model: claude-opus-4-1-20250805')
    
    try {
      const response = await generateLessonPlan('claude-opus-4-1-20250805', body.messages)
      
      const lessonPlan = response.content?.[0]?.type === 'text' ? response.content[0].text : ''
      if (!lessonPlan) throw new Error('The AI returned an empty response.')
      
      return NextResponse.json({ lesson: lessonPlan })
      
    } catch (error: any) {
      // Fallback Logic: Check for an "overloaded" error
      if (error.status === 529 || (error.error?.type === 'overloaded_error')) {
        console.warn('Primary model overloaded. Attempting fallback to claude-sonnet-4-20250514...')
        
        try {
          // Secondary Attempt: Use the powerful Sonnet 4 model
          const fallbackResponse = await generateLessonPlan('claude-sonnet-4-20250514', body.messages)
          
          const lessonPlan = fallbackResponse.content?.[0]?.type === 'text' ? fallbackResponse.content[0].text : ''
          if (!lessonPlan) throw new Error('The fallback AI model also returned an empty response.')
          
          return NextResponse.json({ lesson: lessonPlan })
          
        } catch (fallbackError: any) {
          console.error('[FALLBACK_API_ERROR]', fallbackError)
          return NextResponse.json({ 
            error: 'The service is currently experiencing high demand. Please try again in a few moments.' 
          }, { status: 503 })
        }
      }
      
      // Handle all other errors
      console.error('[PRIMARY_API_ERROR]', error)
      const errorMessage = error.error?.message || 'An unexpected error occurred during generation.'
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in generate-lesson API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
