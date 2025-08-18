'use client'

import { useState } from 'react'

export default function GeneratePage() {
  const [formData, setFormData] = useState({
    subject: '',
    gradeLevel: '',
    objectives: '',
    duration: '60',
    specialNeeds: [] as string[]
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedLesson, setGeneratedLesson] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      const data = await response.json()
      setGeneratedLesson(data.lesson || 'Lesson generation coming soon!')
    } catch (error) {
      setGeneratedLesson('Error generating lesson. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleSpecialNeed = (need: string) => {
    setFormData(prev => ({
      ...prev,
      specialNeeds: prev.specialNeeds.includes(need)
        ? prev.specialNeeds.filter(n => n !== need)
        : [...prev.specialNeeds, need]
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">RW</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Root Work Platform</h1>
            </div>
            <nav className="flex space-x-8">
              <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
              <a href="/generate" className="text-emerald-600 font-medium">Generate</a>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Root Work Framework Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg p-6 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-2">AI Lesson Generator</h2>
          <p className="text-emerald-100 mb-4">Create equity-centered, trauma-informed lesson plans with the Root Work Framework</p>
          <div className="flex flex-wrap gap-3">
            <span className="bg-emerald-500/30 px-3 py-1 rounded-full text-sm">Equity First</span>
            <span className="bg-emerald-500/30 px-3 py-1 rounded-full text-sm">Trauma Informed</span>
            <span className="bg-emerald-500/30 px-3 py-1 rounded-full text-sm">Strength Based</span>
            <span className="bg-emerald-500/30 px-3 py-1 rounded-full text-sm">Community Connected</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generator Form */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Lesson Details</h3>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject Area</label>
                  <select 
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select Subject</option>
                    <option value="mathematics">Mathematics</option>
                    <option value="english">English Language Arts</option>
                    <option value="science">Science</option>
                    <option value="social-studies">Social Studies</option>
                    <option value="steam">STEAM</option>
                    <option value="special-education">Special Education</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
                  <select 
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, gradeLevel: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Select Grade</option>
                    <option value="prek-2">PreK-2 (Early Elementary)</option>
                    <option value="3-5">3-5 (Late Elementary)</option>
                    <option value="6-8">6-8 (Middle School)</option>
                    <option value="9-12">9-12 (High School)</option>
                  </select>
                </div>
              </div>

              {/* Learning Objectives */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Learning Objectives</label>
                <textarea 
                  value={formData.objectives}
                  onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                  rows={4} 
                  placeholder="Describe what students should learn and be able to do..."
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Duration (minutes)</label>
                <select 
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </div>

              {/* Special Considerations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Special Considerations</label>
                <div className="grid grid-cols-2 gap-3">
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
                          ? 'bg-emerald-50 border-2 border-emerald-200'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        formData.specialNeeds.includes(need)
                          ? 'bg-emerald-600 border-emerald-600'
                          : 'border-gray-300'
                      }`}>
                        {formData.specialNeeds.includes(need) && (
                          <span className="text-white text-xs">✓</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-700">{need}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Root Work Framework Check */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h4 className="font-medium text-emerald-900 mb-2">Root Work Framework Integration</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-emerald-700">
                  <div className="flex items-center">
                    <span className="mr-2">✓</span> Equity considerations
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">✓</span> Trauma-informed practices
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">✓</span> Strength-based approach
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2">✓</span> Community connections
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button 
                onClick={handleSubmit}
                disabled={isGenerating || !formData.subject || !formData.gradeLevel || !formData.objectives}
                className="w-full bg-emerald-600 text-white py-3 px-4 rounded-md hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating with Root Work Framework...</span>
                  </>
                ) : (
                  <span>Generate Equity-Centered Lesson Plan</span>
                )}
              </button>
            </div>
          </div>

          {/* Generated Lesson Display */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Generated Lesson Plan</h3>
            
            {generatedLesson ? (
              <div className="prose max-w-none">
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">
                    {generatedLesson}
                  </pre>
                </div>
                
                <div className="mt-6 flex space-x-3">
                  <button className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors">
                    Save Lesson
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
                    Export PDF
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors">
                    Share
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate</h4>
                <p>Fill out the form and click generate to create your equity-centered lesson plan.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
