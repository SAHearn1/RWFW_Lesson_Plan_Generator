'use client'

import { useState } from 'react'
import { BookOpen, Users, Shield, CheckCircle, AlertCircle, Clock, Download, Share, Save, X, Calendar, Target } from 'lucide-react'

export default function GeneratePage() {
  const [formData, setFormData] = useState({
    subjects: [] as string[],
    gradeLevel: '',
    topic: '',
    objectives: '',
    duration: '1', // Changed to days instead of minutes
    standards: '',
    specialNeeds: [] as string[],
    technology: ''
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLesson, setGeneratedLesson] = useState('')
  const [error, setError] = useState('')
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStage, setGenerationStage] = useState('')

  const subjectOptions = [
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'english', label: 'English Language Arts' },
    { value: 'science', label: 'Science' },
    { value: 'social-studies', label: 'Social Studies' },
    { value: 'steam', label: 'STEAM Integration' },
    { value: 'special-education', label: 'Special Education' },
    { value: 'social-emotional-learning', label: 'Social-Emotional Learning' },
    { value: 'arts', label: 'Arts' },
    { value: 'physical-education', label: 'Physical Education' },
    { value: 'world-languages', label: 'World Languages' },
    { value: 'career-technical', label: 'Career & Technical Education' }
  ]

  const handleSubmit = async () => {
    setIsGenerating(true)
    setError('')
    setGenerationProgress(0)
    setGenerationStage('Initializing Root Work Framework...')
    
    // Simulate progress stages
    const progressStages = [
      { progress: 15, stage: 'Analyzing equity considerations...' },
      { progress: 30, stage: 'Integrating trauma-informed practices...' },
      { progress: 45, stage: 'Building strength-based activities...' },
      { progress: 60, stage: 'Creating community connections...' },
      { progress: 75, stage: 'Structuring 4E instructional model...' },
      { progress: 90, stage: 'Finalizing comprehensive lesson plan...' },
      { progress: 100, stage: 'Root Work lesson plan complete!' }
    ]
    
    let currentStage = 0
    const progressInterval = setInterval(() => {
      if (currentStage < progressStages.length) {
        setGenerationProgress(progressStages[currentStage].progress)
        setGenerationStage(progressStages[currentStage].stage)
        currentStage++
      }
    }, 800)
    
    try {
      // Call the correct API endpoint with enhanced prompting for intelligent completion
      const response = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { 
              role: "user", 
              content: `Create a comprehensive ${formData.duration}-day lesson plan that integrates Root Work Framework principles (equity-centered, trauma-informed, strength-based, community-connected) with the 4E instructional model structure.

**INTELLIGENT AUTO-COMPLETION:** For any missing or incomplete information in the requirements below, use your educational expertise to intelligently fill in appropriate, high-quality content that aligns with Root Work Framework principles and the specified grade level.

**LESSON REQUIREMENTS:**
- Subject(s): ${formData.subjects.join(', ')}
- Grade Level: ${formData.gradeLevel}
- Topic: ${formData.topic || '[AI: Please select an engaging, grade-appropriate topic for these subjects]'}
- Duration: ${formData.duration} day(s)
- Standards: ${formData.standards || '[AI: Please identify and cite relevant national/state standards]'}
- Learning Objectives: ${formData.objectives || '[AI: Please create measurable, student-centered learning objectives]'}
- Special Considerations: ${formData.specialNeeds.join(', ') || '[AI: Please include universal design principles and general accommodations]'}
- Technology Integration: ${formData.technology || '[AI: Please suggest age-appropriate educational technology tools]'}

**HYBRID FRAMEWORK STRUCTURE:**
Create lesson plans that blend Root Work Framework principles with the 4E instructional model:

1. **ENGAGE** (10-15 minutes) - Root Work Community Circle/Opening:
   - Relationship building and community connection
   - Cultural asset activation and prior knowledge connection
   - Hook/activator that honors student experiences
   - Trauma-informed safe space establishment

2. **EXPLORE** (15-20 minutes) - Root Work Strength-Based Direct Instruction:
   - Teacher modeling with cultural responsiveness
   - Direct instruction that builds on community knowledge
   - Mini-lesson with equity considerations
   - Explicit Bloom's Taxonomy level identification

3. **APPLY** (25-40 minutes) - Root Work Collaborative & Individual Practice:
   - "We do" collaborative practice with peer support
   - "You do" independent practice with choice and voice
   - Student-centered activities that honor diverse learning styles
   - Multiple ways to demonstrate understanding

4. **REFLECT** (5-10 minutes) - Root Work Community Sharing & Closure:
   - Check for understanding through community dialogue
   - Student self-reflection and goal setting
   - Celebration of learning and cultural contributions
   - Preview connections to next lesson

**OUTPUT REQUIREMENTS:**
Generate a professional lesson plan in clean, well-formatted HTML with proper CSS styling:

<div style="font-family: Inter, sans-serif; max-width: 100%; margin: 0 auto; background: white;">
<header style="background: linear-gradient(135deg, #082A19 0%, #3B523A 100%); color: white; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
  <h1 style="margin: 0; font-family: Merriweather, serif; font-size: 28px;">Root Work Framework Lesson Plan</h1>
  <p style="margin: 8px 0 0 0; color: #F2F4CA; font-size: 16px;">Equity-Centered • Trauma-Informed • Strength-Based • Community-Connected</p>
</header>

Then include all sections with proper formatting...

1. **Lesson Header Information:**
   - Course, week, teacher information placeholders
   - Deconstructed standards with specific citations
   - "I Can" learning targets (student-facing statements)
   - Essential questions that connect to student experiences
   - Literacy skills integration with specific strategies

2. **Daily 4E Structure** (for each day):
   - ENGAGE: Community circle with cultural connections (10-15 min)
   - EXPLORE: Strength-based direct instruction (15-20 min) 
   - APPLY: Collaborative and independent practice with choice (25-40 min)
   - REFLECT: Community sharing and reflection (5-10 min)
   - Bloom's Taxonomy levels explicitly identified for each phase
   - Differentiation strategies embedded throughout

3. **Comprehensive Accommodations:**
   - 504 Plan accommodations with specific strategies
   - Gifted and Talented extensions with higher-order thinking
   - SPED accommodations with UDL principles
   - ELL supports with language scaffolding
   - Trauma-informed modifications

4. **Co-Teaching Integration:**
   - Recommended co-teaching model (if applicable)
   - Role definitions for general and special education teachers
   - Collaborative strategies that support all learners

5. **Resources & Materials** with ACTUAL working links:
   - Educational websites (Khan Academy, Crash Course, PBS Learning Media)
   - Video resources (YouTube educational channels)
   - Interactive tools and culturally relevant materials
   - Assessment rubrics and tools
   - Community resource connections

6. **Assessment Strategy:**
   - Formative assessment throughout each phase
   - Summative assessment options with multiple modalities
   - Student self-assessment opportunities
   - Progress monitoring tools

7. **Reteaching Plan:**
   - Specific strategies for students who don't master objectives
   - Alternative approaches honoring different learning styles
   - Additional scaffolding and support options
   - Community and family engagement for reinforcement

8. **Community Extensions:**
   - Family engagement opportunities
   - Community expert connections
   - Real-world application projects
   - Service learning possibilities

**FORMATTING REQUIREMENTS:**
- Use proper HTML structure with inline CSS for clean presentation
- Include actual working hyperlinks to educational resources
- Maintain professional formatting with specific time allocations
- Use consistent color scheme: #082A19 (dark green), #D4C862 (gold), #F2F4CA (light cream)
- Emphasize both 4E structure AND Root Work principles throughout
- Provide detailed, actionable descriptions for immediate implementation
- Ensure all content is culturally responsive and trauma-informed

Generate comprehensive content that meets district template requirements while maintaining Root Work Framework integrity for equitable, community-centered learning experiences.`
            }
          ]
        }),
      })

      clearInterval(progressInterval)
      setGenerationProgress(100)
      setGenerationStage('Root Work lesson plan complete!')

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate lesson')
      }

      const data = await response.json()
      setGeneratedLesson(data.lesson)
    } catch (err) {
      clearInterval(progressInterval)
      setError(err instanceof Error ? err.message : 'Error generating lesson. Please try again.')
    } finally {
      setTimeout(() => setIsGenerating(false), 1000) // Keep progress visible briefly
    }
  }

  const handleSave = () => {
    if (!generatedLesson) return
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    const filename = `Root_Work_Lesson_Plan_${timestamp}.html`
    
    const blob = new Blob([generatedLesson], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    if (!generatedLesson) return
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Root Work Lesson Plan</title>
          <style>
            body { 
              font-family: Inter, sans-serif; 
              margin: 20px; 
              line-height: 1.6; 
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${generatedLesson}
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
    }
  }

  const handleShare = async () => {
    if (!generatedLesson) return
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Root Work Framework Lesson Plan',
          text: 'Check out this equity-centered lesson plan created with Root Work Framework principles',
          url: window.location.href
        })
      } catch (error) {
        // Fallback to clipboard
        handleCopyToClipboard()
      }
    } else {
      handleCopyToClipboard()
    }
  }

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLesson)
      alert('Lesson plan copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      alert('Unable to copy. Please manually select and copy the lesson plan.')
    }
  }

  const toggleSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }))
  }

  const removeSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s !== subject)
    }))
  }

  const toggleSpecialNeed = (need: string) => {
    setFormData(prev => ({
      ...prev,
      specialNeeds: prev.specialNeeds.includes(need)
        ? prev.specialNeeds.filter(n => n !== need)
        : [...prev.specialNeeds, need]
    }))
  }

  const growthStages = [
    { name: 'Seed', color: 'bg-yellow-100 text-yellow-800', description: 'Planting curiosity' },
    { name: 'Sprout', color: 'bg-green-100 text-green-800', description: 'Understanding emerges' },
    { name: 'Bloom', color: 'bg-amber-100 text-amber-800', description: 'Creative expression' },
    { name: 'Harvest', color: 'bg-orange-200 text-orange-900', description: 'Sharing knowledge' }
  ]

  return (
    <div className="min-h-screen bg-stone-50" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Professional Header */}
      <header className="border-b border-gray-200 shadow-sm" style={{ backgroundColor: '#082A19' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#D4C862' }}>
                  <BookOpen className="w-5 h-5" style={{ color: '#082A19' }} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>Root Work Platform</h1>
                  <p className="text-xs" style={{ color: '#D4C862' }}>Equity-Centered Learning Design</p>
                </div>
              </div>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-300 hover:text-white font-medium transition-colors">Dashboard</a>
              <a href="/generate" className="border-b-2 px-3 py-2 text-sm font-medium text-white" style={{ borderColor: '#D4C862' }}>Generate</a>
              <a href="#" className="text-gray-300 hover:text-white font-medium transition-colors">My Lessons</a>
              <a href="#" className="text-gray-300 hover:text-white font-medium transition-colors">Frameworks</a>
            </nav>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-300 hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </button>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: '#D4C862', color: '#082A19' }}>
                U
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Root Work Framework Banner */}
        <div className="rounded-xl p-6 mb-8 text-white" style={{ background: 'linear-gradient(135deg, #082A19 0%, #3B523A 50%, #082A19 100%)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>Comprehensive Lesson Generation</h2>
              <p className="mb-4" style={{ color: '#F2F4CA' }}>Create equity-centered lesson plans with Root Work Framework integration</p>
              <div className="flex flex-wrap gap-3">
                <span className="backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium border" style={{ backgroundColor: 'rgba(212, 200, 98, 0.2)', borderColor: 'rgba(212, 200, 98, 0.3)', color: '#F2F4CA' }}>
                  Equity First
                </span>
                <span className="backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium border" style={{ backgroundColor: 'rgba(212, 200, 98, 0.2)', borderColor: 'rgba(212, 200, 98, 0.3)', color: '#F2F4CA' }}>
                  Trauma Informed
                </span>
                <span className="backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium border" style={{ backgroundColor: 'rgba(212, 200, 98, 0.2)', borderColor: 'rgba(212, 200, 98, 0.3)', color: '#F2F4CA' }}>
                  Strength Based
                </span>
                <span className="backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium border" style={{ backgroundColor: 'rgba(212, 200, 98, 0.2)', borderColor: 'rgba(212, 200, 98, 0.3)', color: '#F2F4CA' }}>
                  Community Connected
                </span>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="w-24 h-24 rounded-full flex items-center justify-center border-2" style={{ backgroundColor: 'rgba(212, 200, 98, 0.2)', borderColor: 'rgba(212, 200, 98, 0.3)' }}>
                <Shield className="w-12 h-12" style={{ color: '#D4C862' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lesson Generator - Main Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold" style={{ color: '#2B2B2B', fontFamily: 'Merriweather, Georgia, serif' }}>Lesson Plan Generator</h3>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#D4C862', color: '#082A19' }}>
                  Root Work Powered
                </span>
              </div>

              <div className="space-y-6">
                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#2B2B2B' }}>
                    Subject Areas (Select one or more for interdisciplinary lessons)
                  </label>
                  
                  {/* Selected Subjects Display */}
                  {formData.subjects.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {formData.subjects.map((subject) => {
                          const subjectLabel = subjectOptions.find(opt => opt.value === subject)?.label || subject
                          return (
                            <span
                              key={subject}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                              style={{ backgroundColor: '#F2F4CA', color: '#082A19' }}
                            >
                              {subjectLabel}
                              <button
                                onClick={() => removeSubject(subject)}
                                className="ml-2 hover:bg-stone-200 rounded-full p-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Subject Selection Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {subjectOptions.map((option) => (
                      <div
                        key={option.value}
                        onClick={() => toggleSubject(option.value)}
                        className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-colors ${
                          formData.subjects.includes(option.value)
                            ? 'border-2'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                        style={formData.subjects.includes(option.value) ? 
                          { backgroundColor: '#F2F4CA', borderColor: '#3B523A' } : 
                          {}
                        }
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          formData.subjects.includes(option.value)
                            ? ''
                            : 'border-gray-300'
                        }`}
                        style={formData.subjects.includes(option.value) ? 
                          { backgroundColor: '#082A19', borderColor: '#082A19' } : 
                          {}
                        }
                        >
                          {formData.subjects.includes(option.value) && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="text-sm" style={{ color: '#2B2B2B' }}>{option.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grade Level */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2B2B2B' }}>
                    Grade Level
                  </label>
                  <select 
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, gradeLevel: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg transition-colors focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  >
                    <option value="">Select Grade</option>
                    <option value="prek-2">PreK-2 (Early Elementary)</option>
                    <option value="3-5">3-5 (Late Elementary)</option>
                    <option value="6-8">6-8 (Middle School)</option>
                    <option value="9-12">9-12 (High School)</option>
                  </select>
                </div>

                {/* Topic Field */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2B2B2B' }}>
                    Lesson Topic/Unit
                  </label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg transition-colors focus:ring-2 focus:ring-green-600 focus:border-green-600"
                    placeholder="e.g., Fractions, Photosynthesis, Civil Rights Movement"
                  />
                </div>

                {/* Duration in Days */}
                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center" style={{ color: '#2B2B2B' }}>
                    <Calendar className="w-4 h-4 mr-2" style={{ color: '#3B523A' }} />
                    Lesson Duration (Days)
                  </label>
                  <select 
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg transition-colors focus:ring-2 focus:ring-green-600 focus:border-green-600"
                  >
                    <option value="1">1 Day</option>
                    <option value="2">2 Days</option>
                    <option value="3">3 Days</option>
                    <option value="4">4 Days</option>
                    <option value="5">5 Days (1 Week)</option>
                    <option value="10">10 Days (2 Weeks)</option>
                    <option value="15">15 Days (3 Weeks)</option>
                    <option value="20">20 Days (4 Weeks)</option>
                  </select>
                </div>

                {/* Standards Field */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2B2B2B' }}>
                    Academic Standards
                  </label>
                  <input
                    type="text"
                    value={formData.standards}
                    onChange={(e) => setFormData(prev => ({ ...prev, standards: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg transition-colors focus:ring-2 focus:ring-green-600 focus:border-green-600"
                    placeholder="e.g., CCSS.MATH.3.NF.A.1, NGSS.5-PS1-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2B2B2B' }}>
                    Learning Objectives & Goals
                  </label>
                  <textarea 
                    value={formData.objectives}
                    onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg transition-colors focus:ring-2 focus:ring-green-600 focus:border-green-600" 
                    rows={5} 
                    placeholder="Describe what students will learn and be able to do. Example: 'Students will understand fractions by connecting them to real-world situations like cooking and sharing. They will compare fractions and explain their thinking using both visual models and mathematical language. This lesson will engage students who face math anxiety and connect to their cultural backgrounds.'"
                  />
                </div>

                {/* Technology Integration */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2B2B2B' }}>
                    Technology Integration
                  </label>
                  <input
                    type="text"
                    value={formData.technology}
                    onChange={(e) => setFormData(prev => ({ ...prev, technology: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg transition-colors focus:ring-2 focus:ring-green-600 focus:border-green-600"
                    placeholder="iPads, Chromebooks, interactive whiteboard, online tools"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#2B2B2B' }}>
                    Learning Support & Accommodations
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      'English Language Learners',
                      'Students with Disabilities',
                      'Gifted & Talented',
                      'Trauma-Informed Practices',
                      'Culturally Responsive',
                      'Behavioral Support'
                    ].map((need) => (
                      <div 
                        key={need}
                        onClick={() => toggleSpecialNeed(need)}
                        className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-colors ${
                          formData.specialNeeds.includes(need)
                            ? 'border-2'
                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                        }`}
                        style={formData.specialNeeds.includes(need) ? 
                          { backgroundColor: '#F2F4CA', borderColor: '#3B523A' } : 
                          {}
                        }
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          formData.specialNeeds.includes(need)
                            ? ''
                            : 'border-gray-300'
                        }`}
                        style={formData.specialNeeds.includes(need) ? 
                          { backgroundColor: '#082A19', borderColor: '#082A19' } : 
                          {}
                        }
                        >
                          {formData.specialNeeds.includes(need) && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="text-sm" style={{ color: '#2B2B2B' }}>{need}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                      <span className="text-red-800">{error}</span>
                    </div>
                  </div>
                )}

                {/* Root Work Framework Validation */}
                <div className="border rounded-lg p-4" style={{ backgroundColor: '#F2F4CA', borderColor: '#3B523A' }}>
                  <h4 className="font-semibold mb-3 flex items-center" style={{ color: '#082A19' }}>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Root Work Framework Integration
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center" style={{ color: '#082A19' }}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Equity considerations active
                    </div>
                    <div className="flex items-center" style={{ color: '#082A19' }}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Trauma-informed design enabled
                    </div>
                    <div className="flex items-center" style={{ color: '#082A19' }}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Strength-based approach integrated
                    </div>
                    <div className="flex items-center" style={{ color: '#082A19' }}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Community connections embedded
                    </div>
                  </div>
                </div>

                {/* Generation Progress Bar */}
                {isGenerating && (
                  <div className="border rounded-lg p-6 mb-6" style={{ backgroundColor: '#F2F4CA', borderColor: '#3B523A' }}>
                    <h4 className="font-semibold mb-4 flex items-center" style={{ color: '#082A19' }}>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 mr-3" style={{ borderColor: '#082A19' }}></div>
                      Creating Your Root Work Lesson Plan
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium" style={{ color: '#082A19' }}>{generationStage}</span>
                        <span className="text-sm font-bold" style={{ color: '#082A19' }}>{generationProgress}%</span>
                      </div>
                      
                      <div className="w-full bg-white rounded-full h-3 border" style={{ borderColor: '#3B523A' }}>
                        <div 
                          className="h-3 rounded-full transition-all duration-500 ease-out"
                          style={{ 
                            width: `${generationProgress}%`,
                            background: 'linear-gradient(90deg, #082A19 0%, #3B523A 50%, #D4C862 100%)'
                          }}
                        ></div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs mt-4" style={{ color: '#082A19' }}>
                        <div className="flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          <span>Equity-Centered Design</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          <span>Trauma-Informed Practices</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          <span>Strength-Based Approach</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          <span>Community Connections</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleSubmit}
                  disabled={isGenerating || formData.subjects.length === 0 || !formData.gradeLevel || !formData.objectives}
                  className="w-full text-white py-4 px-6 rounded-lg transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  style={{ background: isGenerating ? '#6B7280' : 'linear-gradient(135deg, #082A19 0%, #3B523A 100%)' }}
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Creating your lesson plan...</span>
                    </>
                  ) : (
                    <span>Generate {formData.subjects.length > 1 ? 'Interdisciplinary' : ''} Lesson Plan</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Garden to Growth Journey */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#2B2B2B', fontFamily: 'Merriweather, Georgia, serif' }}>Garden to Growth Journey</h3>
              <div className="space-y-4">
                {growthStages.map((stage, index) => (
                  <div key={stage.name} className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full ${stage.color} flex items-center justify-center text-sm font-bold`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: '#2B2B2B' }}>{stage.name}</p>
                      <p className="text-sm text-gray-600">{stage.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Pro Tips */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#2B2B2B', fontFamily: 'Merriweather, Georgia, serif' }}>Pro Tips</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <span className="mt-1" style={{ color: '#D4C862' }}>•</span>
                  <span className="text-gray-700">Select multiple subjects for interdisciplinary lessons</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="mt-1" style={{ color: '#D4C862' }}>•</span>
                  <span className="text-gray-700">Multi-day plans include detailed daily breakdowns</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="mt-1" style={{ color: '#D4C862' }}>•</span>
                  <span className="text-gray-700">Generated plans include working resource links</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="mt-1" style={{ color: '#D4C862' }}>•</span>
                  <span className="text-gray-700">Include cultural considerations and student interests</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="mt-1" style={{ color: '#D4C862' }}>•</span>
                  <span className="text-gray-700">Includes assessment rubrics and differentiation</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Generated Lesson Display */}
        {generatedLesson && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: '#2B2B2B', fontFamily: 'Merriweather, Georgia, serif' }}>Generated Lesson Plan</h3>
              <div className="flex space-x-3">
                <button 
                  onClick={handleSave}
                  className="text-white px-4 py-2 rounded-md transition-colors flex items-center space-x-2 hover:opacity-90" 
                  style={{ backgroundColor: '#082A19' }}
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="border text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2" 
                  style={{ borderColor: '#3B523A' }}
                >
                  <Download className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>
                <button 
                  onClick={handleShare}
                  className="border text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2" 
                  style={{ borderColor: '#3B523A' }}
                >
                  <Share className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
            
            {/* FIXED: Proper HTML rendering instead of plain text */}
            <div className="prose max-w-none">
              <div 
                className="p-6 rounded-lg border overflow-auto max-h-96"
                style={{ backgroundColor: '#F2F4CA', borderColor: '#3B523A' }}
                dangerouslySetInnerHTML={{ __html: generatedLesson }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
