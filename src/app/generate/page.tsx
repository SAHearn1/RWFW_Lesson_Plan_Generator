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
    
    try {
      // Enhanced API call with comprehensive prompting
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [
            { 
              role: "user", 
              content: `Create a comprehensive ${formData.duration}-day lesson plan using the Root Work Framework (equity-centered, trauma-informed, strength-based, community-connected) with the following specifications:

**LESSON REQUIREMENTS:**
- Subject(s): ${formData.subjects.join(', ')}
- Grade Level: ${formData.gradeLevel}
- Topic: ${formData.topic || 'Based on objectives provided'}
- Duration: ${formData.duration} day(s)
- Standards: ${formData.standards || 'Appropriate grade-level standards'}
- Learning Objectives: ${formData.objectives}
- Special Considerations: ${formData.specialNeeds.join(', ') || 'Universal design principles'}
- Technology Integration: ${formData.technology || 'Age-appropriate educational technology'}

**ROOT WORK FRAMEWORK INTEGRATION:**
- Equity First: Ensure all activities are accessible and culturally responsive
- Trauma-Informed: Create safe, predictable learning environments
- Strength-Based: Build on student assets and community knowledge
- Community-Connected: Include authentic connections to student lives and communities

**OUTPUT REQUIREMENTS:**
Generate a professional, comprehensive lesson plan in HTML format with:

1. **Framework Overview** with:
   - Root Work Framework alignment explanation
   - Clear learning objectives with equity considerations
   - Essential questions that connect to student experiences
   - Key vocabulary with cultural context
   - Assessment strategies that honor diverse ways of knowing

2. **Daily Breakdown** (for each day):
   - Community Circle/Opening (relationship building)
   - Direct instruction with cultural connections (15-20 min)
   - Collaborative learning activities (20-25 min)
   - Individual reflection and choice (10-15 min)
   - Closing circle and community sharing (5-10 min)

3. **Resources & Materials** with ACTUAL working links:
   - Educational websites (Khan Academy, Crash Course, PBS Learning Media)
   - Video resources (YouTube educational channels, documentaries)
   - Interactive tools and simulations
   - Culturally relevant books and media
   - Community resource connections
   - Assessment rubrics and tools

4. **Equity-Centered Differentiation** for:
   - English Language Learners (with language supports)
   - Students with disabilities (UDL principles)
   - Gifted and talented students (extension activities)
   - Trauma-informed accommodations
   - Culturally and linguistically diverse learners

5. **Assessment & Reflection**:
   - Multiple ways to demonstrate learning
   - Student self-reflection opportunities
   - Community sharing and celebration
   - Ongoing formative assessment strategies

6. **Community Extensions**:
   - Family engagement opportunities
   - Community expert connections
   - Real-world application projects
   - Service learning possibilities

**FORMATTING REQUIREMENTS:**
- Use proper HTML structure with headers, lists, and formatting
- Include actual working hyperlinks to educational resources
- Make it visually organized and professional
- Include specific time allocations for each day
- Provide detailed descriptions that honor Root Work principles
- Emphasize student voice, choice, and agency throughout

Generate comprehensive, culturally responsive content that teachers can immediately implement to create equitable learning experiences.`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      setGeneratedLesson(data.content[0].text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating lesson. Please try again.');
    } finally {
      setIsGenerating(false);
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg transition-colors"
                    style={{ focusRingColor: '#3B523A', focusBorderColor: '#3B523A' }}
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg transition-colors"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg transition-colors"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg transition-colors"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg transition-colors" 
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg transition-colors"
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
                <button className="text-white px-4 py-2 rounded-md transition-colors flex items-center space-x-2" style={{ backgroundColor: '#082A19' }}>
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button className="border text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2" style={{ borderColor: '#3B523A' }}>
                  <Download className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>
                <button className="border text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2" style={{ borderColor: '#3B523A' }}>
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
