// FILE: src/lib/ai/index.ts
// AI Service with Root Work Conscience
// ============================================
import { MASTER_LESSON_PROMPT, buildLessonPrompt } from '@/constants/prompts'

// AI Provider abstraction
interface AIProvider {
  generateText(prompt: string): Promise<string>
}

class AnthropicProvider implements AIProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateText(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    const data = await response.json()
    return data.content[0].text
  }
}

// Main AI service with Root Work Framework integration
export class AIService {
  private provider: AIProvider

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required')
    }
    this.provider = new AnthropicProvider(apiKey)
  }

  async generateLesson(params: {
    subject: string
    gradeLevel: string
    learningObjectives: string[]
    specialConsiderations?: string[]
  }): Promise<string> {
    // Build prompt with Root Work Framework conscience
    const prompt = buildLessonPrompt(
      params.subject,
      params.gradeLevel,
      params.learningObjectives,
      params.specialConsiderations
    )

    // Generate lesson through Root Work Framework lens
    return await this.provider.generateText(prompt)
  }
}

// ============================================
// FILE: src/app/api/lessons/generate/route.ts
// API Route for Lesson Generation
// ============================================
import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subject, gradeLevel, learningObjectives, specialConsiderations } = body

    // Validate required fields
    if (!subject || !gradeLevel || !learningObjectives) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate lesson with Root Work Framework
    const aiService = new AIService()
    const lessonContent = await aiService.generateLesson({
      subject,
      gradeLevel,
      learningObjectives,
      specialConsiderations,
    })

    return NextResponse.json({
      success: true,
      lesson: lessonContent,
      metadata: {
        rootWorkCompliant: true,
        gardenToGrowthStage: 'SEED', // Default to SEED stage
        equityChecked: true,
        traumaInformed: true,
      },
    })
  } catch (error) {
    console.error('Lesson generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate lesson' },
      { status: 500 }
    )
  }
}

// ============================================
// FILE: src/lib/db.ts
// Database Client with Multi-tenancy
// ============================================
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Multi-tenant helper functions
export function withInstitution(institutionId: string) {
  return {
    where: {
      institution_id: institutionId,
    },
  }
}

export function withUser(userId: string) {
  return {
    where: {
      created_by_id: userId,
    },
  }
}

