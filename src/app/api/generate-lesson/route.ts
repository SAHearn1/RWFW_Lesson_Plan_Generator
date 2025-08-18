import { NextRequest, NextResponse } from 'next/server'

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

    // For now, return a structured lesson plan template
    // Later this will be replaced with actual AI generation
    const lessonPlan = generateLessonTemplate({
      subject,
      gradeLevel,
      objectives,
      duration,
      specialNeeds
    })

    return NextResponse.json({
      success: true,
      lesson: lessonPlan,
      metadata: {
        rootWorkCompliant: true,
        generatedAt: new Date().toISOString(),
        framework: 'Root Work Framework integrated',
        specialConsiderations: specialNeeds
      }
    })
  } catch (error) {
    console.error('Lesson generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate lesson plan' },
      { status: 500 }
    )
  }
}

function generateLessonTemplate({
  subject,
  gradeLevel,
  objectives,
  duration,
  specialNeeds
}: {
  subject: string
  gradeLevel: string
  objectives: string
  duration: string
  specialNeeds: string[]
}) {
  const rootWorkPrinciples = {
    equityFirst: "This lesson ensures all students can access learning through multiple pathways and cultural responsiveness.",
    traumaInformed: "The lesson structure provides predictability, choice, and emotional safety for all learners.",
    strengthBased: "Students' prior knowledge and cultural assets are honored and leveraged throughout.",
    communityConnected: "Learning connects to real-world applications and community partnerships."
  }

  const accommodations = specialNeeds.length > 0 
    ? `\n\n🛡️ BUILT-IN ACCOMMODATIONS:\n${specialNeeds.map(need => `• ${need}: Specific supports integrated throughout lesson`).join('\n')}`
    : ''

  return `
🌱 ROOT WORK FRAMEWORK LESSON PLAN

📚 SUBJECT: ${subject.charAt(0).toUpperCase() + subject.slice(1)}
🎯 GRADE LEVEL: ${gradeLevel}
⏱️ DURATION: ${duration} minutes

🎯 LEARNING OBJECTIVES:
${objectives}

🌿 ROOT WORK FRAMEWORK INTEGRATION:
✊ EQUITY FIRST: ${rootWorkPrinciples.equityFirst}
💚 TRAUMA INFORMED: ${rootWorkPrinciples.traumaInformed}
💪 STRENGTH BASED: ${rootWorkPrinciples.strengthBased}
🏘️ COMMUNITY CONNECTED: ${rootWorkPrinciples.communityConnected}

📋 LESSON STRUCTURE:

🌱 OPENING (5-10 minutes)
• Community circle or greeting ritual
• Review previous learning connections
• Establish emotional safety and lesson expectations
• Activate prior knowledge through cultural connections

🌿 EXPLORATION PHASE (15-20 minutes)
• Multiple entry points for different learning styles
• Hands-on, collaborative investigation
• Students bring their cultural knowledge and experiences
• Teacher facilitates rather than directs

🌸 DEVELOPMENT PHASE (20-30 minutes)
• Scaffolded instruction with choice in how to engage
• Peer collaboration and multiple ways to demonstrate understanding
• Real-world connections and community applications
• Strength-based feedback and recognition

🍯 SYNTHESIS & REFLECTION (10-15 minutes)
• Students share learning in various formats
• Connect to broader community and future applications
• Reflection on growth and next steps
• Celebration of diverse contributions

📊 ASSESSMENT STRATEGIES:
• Formative: Ongoing observation, peer feedback, self-reflection
• Multiple modalities: Verbal, visual, kinesthetic options
• Strength-based rubrics focusing on growth
• Portfolio documentation of learning journey

🎨 MATERIALS NEEDED:
• Culturally relevant texts and resources
• Manipulatives for hands-on learning
• Technology options (but not required)
• Choice in tools for final products
• Community connection materials

🌍 COMMUNITY CONNECTIONS:
• How does this connect to students' lived experiences?
• What community partnerships could enhance this learning?
• How can students share their learning with authentic audiences?

♿ UNIVERSAL DESIGN FOR LEARNING:
• Multiple means of representation (visual, auditory, text)
• Multiple means of engagement (choice, relevance, challenge)
• Multiple means of expression (various ways to show learning)
${accommodations}

📈 DIFFERENTIATION:
• Advanced learners: Extension opportunities and leadership roles
• Emerging learners: Additional scaffolds and peer support
• English learners: Visual supports and native language connections
• Students with disabilities: Built-in accommodations and modifications

🔄 REFLECTION QUESTIONS:
• How did this lesson honor each student's cultural background?
• What evidence do I have that all students felt emotionally safe?
• How did students use their strengths and prior knowledge?
• What community connections were made or could be strengthened?

💡 NEXT STEPS:
• How will learning be applied in real-world contexts?
• What community action might emerge from this learning?
• How can students teach others what they've learned?

---
Generated with Root Work Framework - Equity First, Trauma Informed, Strength Based, Community Connected
  `.trim()
}

// Health check for this endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'Root Work Framework lesson generation API is ready',
    framework: 'Equity-centered, trauma-informed lesson planning'
  })
}
