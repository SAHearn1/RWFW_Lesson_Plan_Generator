// src/app/generate/page.tsx - Complete and Fixed

'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FormData {
  subject: string;
  gradeLevel: string;
  topic: string;
  duration: string;
  learningObjectives?: string;
  specialNeeds?: string;
  availableResources?: string;
}

export default function GeneratePage() {
  const [formData, setFormData] = useState<FormData>({
    subject: '',
    gradeLevel: '',
    topic: '',
    duration: '',
    learningObjectives: '',
    specialNeeds: '',
    availableResources: ''
  });

  const [lessonPlan, setLessonPlan] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError('');

    // Validation
    const missing: string[] = [];
    if (!formData.subject?.trim()) missing.push('Subject Area');
    if (!formData.gradeLevel?.trim()) missing.push('Grade Level');
    if (!formData.topic?.trim()) missing.push('Lesson Topic');
    if (!formData.duration?.trim()) missing.push('Duration');
    
    if (missing.length) {
      setError(`Please fill in: ${missing.join(', ')}`);
      setIsGenerating(false);
      return;
    }

    try {
      const response = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: formData.subject.trim(),
          gradeLevel: formData.gradeLevel.trim(),
          topic: formData.topic.trim(),
          duration: formData.duration.trim(),
          learningObjectives: formData.learningObjectives?.trim() || '',
          specialNeeds: formData.specialNeeds?.trim() || '',
          availableResources: formData.availableResources?.trim() || '',
        }),
      });

      const data = await response.json();
      console.log('Response:', data);

      if (!response.ok || !data?.lessonPlan) {
        throw new Error(data?.error || `Request failed (${response.status})`);
      }

      setLessonPlan(data.lessonPlan);
    } catch (err: any) {
      setError(`Failed to generate lesson plan: ${err?.message || 'Unknown error'}`);
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!lessonPlan) return;
    const text = typeof lessonPlan === 'object' ? JSON.stringify(lessonPlan, null, 2) : lessonPlan;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadLessonPlan = () => {
    if (!lessonPlan) return;
    const text = typeof lessonPlan === 'object' ? JSON.stringify(lessonPlan, null, 2) : lessonPlan;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rwfw_lesson_${formData.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50">
      {/* Header */}
      <header className="bg-emerald-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">Root Work Framework</h1>
                <p className="text-emerald-200 text-sm">AI-Powered Lesson Planning</p>
              </div>
            </Link>
            <nav className="flex items-center space-x-6">
              <Link 
                href="/" 
                className="text-emerald-200 hover:text-white transition-colors"
              >
                Back to Home
              </Link>
              {lessonPlan && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                    </svg>
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={downloadLessonPlan}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-white text-emerald-800 border border-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                    <span>Download</span>
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-emerald-200">
            <h2 className="text-2xl font-bold text-emerald-800 mb-2">
              Create Your Root Work Lesson Plan
            </h2>
            <p className="text-sm text-emerald-600 mb-6">
              Generate trauma-informed, culturally responsive lesson plans using the 5 Rs structure.
              Fields with <span className="text-red-500">*</span> are required.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-800 mb-2">
                    Subject Area <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="subject" 
                    value={formData.subject} 
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="">Select Subject Area</option>
                    <option value="English Language Arts">English Language Arts</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="Social Studies">Social Studies</option>
                    <option value="STEAM">STEAM (Integrated)</option>
                    <option value="Special Education">Special Education</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Environmental Science">Environmental Science</option>
                    <option value="Life Skills">Life Skills</option>
                    <option value="SEL">Social-Emotional Learning</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-800 mb-2">
                    Grade Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gradeLevel" 
                    value={formData.gradeLevel} 
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                    required
                  >
                    <option value="">Select Grade Level</option>
                    <option value="PreK">Pre-K</option>
                    <option value="K">Kindergarten</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i+1} value={String(i+1)}>{i+1}th Grade</option>
                    ))}
                    <option value="Mixed">Mixed Ages</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-2">
                  Lesson Topic <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" 
                  name="topic" 
                  value={formData.topic} 
                  onChange={handleInputChange}
                  placeholder="e.g., Civil Rights Movement, Ecosystems, Algebraic Expressions, Microgreens"
                  className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-2">
                  Duration <span className="text-red-500">*</span>
                </label>
                <select
                  name="duration" 
                  value={formData.duration} 
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                  required
                >
                  <option value="">Select Duration</option>
                  <option value="30 minutes">30 minutes</option>
                  <option value="45 minutes">45 minutes</option>
                  <option value="50 minutes">50 minutes</option>
                  <option value="60 minutes">60 minutes</option>
                  <option value="75 minutes">75 minutes</option>
                  <option value="90 minutes">90 minutes (Block)</option>
                  <option value="120 minutes">120 minutes (Extended)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-2">
                  Learning Objectives & Standards <span className="text-emerald-600 text-xs">(Optional)</span>
                </label>
                <textarea
                  name="learningObjectives" 
                  value={formData.learningObjectives} 
                  onChange={handleInputChange}
                  placeholder="Include specific learning objectives and academic standards..."
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-2">
                  Special Considerations <span className="text-emerald-600 text-xs">(Optional)</span>
                </label>
                <textarea
                  name="specialNeeds" 
                  value={formData.specialNeeds} 
                  onChange={handleInputChange}
                  placeholder="ELL supports, autism accommodations, trauma-informed modifications, behavioral supports..."
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-2">
                  Available Resources <span className="text-emerald-600 text-xs">(Optional)</span>
                </label>
                <textarea
                  name="availableResources" 
                  value={formData.availableResources} 
                  onChange={handleInputChange}
                  placeholder="Garden space, technology lab, manipulatives, community partners, field trip options..."
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Submit Button */}
              <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-200">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center text-lg"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating Root Work Framework Lesson...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                      </svg>
                      Generate Root Work Framework Lesson
                    </>
                  )}
                </button>
                <p className="text-sm text-emerald-700 mt-2 text-center">
                  Creates a comprehensive lesson using the 5 Rs: Relationships, Routines, Relevance, Rigor, and Reflection
                </p>
              </div>
            </form>

            {/* Error Display */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-red-700 font-medium">Error generating lesson plan</p>
                </div>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            )}
          </div>

          {/* Lesson Plan Display */}
          {lessonPlan && (
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-emerald-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-emerald-800">
                  Root Work Framework Lesson Plan
                </h2>
              </div>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans bg-emerald-50 p-4 rounded border border-emerald-200 overflow-auto max-h-96">
                  {typeof lessonPlan === 'object' ? JSON.stringify(lessonPlan, null, 2) : lessonPlan}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
