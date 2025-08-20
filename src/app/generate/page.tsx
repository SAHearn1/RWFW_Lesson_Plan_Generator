// src/app/generate/page.tsx - Enhanced with missing functionality

'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FormData {
  subjects: string[];
  gradeLevel: string;
  topic: string;
  duration: string;
  numberOfDays: string;
  learningObjectives?: string;
  specialNeeds?: string;
  availableResources?: string;
}

const SUBJECTS = [
  'English Language Arts',
  'Mathematics', 
  'Science',
  'Social Studies',
  'STEAM (Integrated)',
  'Special Education',
  'Agriculture',
  'Environmental Science',
  'Life Skills',
  'Social-Emotional Learning',
  'Art',
  'Music',
  'Physical Education',
  'Career & Technical Education',
  'World Languages',
  'Other'
];

const STANDARDS_SHORTCUTS = {
  'georgia standards': 'Georgia Standards of Excellence (GSE)',
  'common core': 'Common Core State Standards (CCSS)',
  'ngss': 'Next Generation Science Standards (NGSS)',
  'casel': 'CASEL Social-Emotional Learning Standards',
  'national standards': 'Relevant National Content Standards',
  'state standards': 'State Academic Standards for selected grade level and subject'
};

export default function GeneratePage() {
  const [formData, setFormData] = useState<FormData>({
    subjects: [],
    gradeLevel: '',
    topic: '',
    duration: '',
    numberOfDays: '',
    learningObjectives: '',
    specialNeeds: '',
    availableResources: ''
  });

  const [lessonPlan, setLessonPlan] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showStandardsHelp, setShowStandardsHelp] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Handle smart standards integration
    if (name === 'learningObjectives' && value.toLowerCase().includes('standards')) {
      const lowerValue = value.toLowerCase();
      for (const [shortcut, fullName] of Object.entries(STANDARDS_SHORTCUTS)) {
        if (lowerValue.includes(shortcut)) {
          setShowStandardsHelp(true);
          setTimeout(() => setShowStandardsHelp(false), 3000);
          break;
        }
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectChange = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError('');

    // Enhanced validation
    const missing: string[] = [];
    if (!formData.subjects.length) missing.push('Subject Area(s)');
    if (!formData.gradeLevel?.trim()) missing.push('Grade Level');
    if (!formData.topic?.trim()) missing.push('Lesson Topic');
    if (!formData.duration?.trim()) missing.push('Duration');
    if (!formData.numberOfDays?.trim()) missing.push('Number of Days');
    
    if (missing.length) {
      setError(`Please fill in: ${missing.join(', ')}`);
      setIsGenerating(false);
      return;
    }

    try {
      // Enhanced payload with intelligent processing
      const enhancedObjectives = processLearningObjectives(formData.learningObjectives, formData.subjects, formData.gradeLevel);
      const enhancedSpecialNeeds = processSpecialNeeds(formData.specialNeeds);

      const response = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: formData.subjects.join(', '), // Send as comma-separated for API compatibility
          gradeLevel: formData.gradeLevel.trim(),
          topic: formData.topic.trim(),
          duration: formData.duration.trim(),
          numberOfDays: formData.numberOfDays.trim(),
          learningObjectives: enhancedObjectives,
          specialNeeds: enhancedSpecialNeeds,
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

  // Intelligent processing functions
  const processLearningObjectives = (objectives: string = '', subjects: string[], gradeLevel: string): string => {
    if (!objectives.trim()) return '';
    
    let processed = objectives;
    const lowerObjectives = objectives.toLowerCase();
    
    // Auto-expand standards shortcuts
    for (const [shortcut, fullName] of Object.entries(STANDARDS_SHORTCUTS)) {
      if (lowerObjectives.includes(shortcut)) {
        processed += `\n\nAI INSTRUCTION: Integrate specific ${fullName} for ${subjects.join(' and ')} at grade ${gradeLevel}. Include standard codes and descriptions.`;
      }
    }
    
    return processed;
  };

  const processSpecialNeeds = (specialNeeds: string = ''): string => {
    if (!specialNeeds.trim()) return '';
    
    let processed = specialNeeds;
    const lower = specialNeeds.toLowerCase();
    
    // Auto-expand common abbreviations
    const expansions = {
      'ell': 'English Language Learners',
      'sped': 'Special Education',
      'iep': 'Individualized Education Program',
      '504': 'Section 504 accommodations',
      'adhd': 'Attention Deficit Hyperactivity Disorder',
      'asd': 'Autism Spectrum Disorder',
      'ptsd': 'Post-Traumatic Stress Disorder'
    };
    
    for (const [abbrev, full] of Object.entries(expansions)) {
      if (lower.includes(abbrev)) {
        processed += `\n\nAI INSTRUCTION: Provide specific evidence-based accommodations and supports for ${full}.`;
      }
    }
    
    return processed;
  };

  // Enhanced download functions
  const downloadAsPDF = async () => {
    if (!lessonPlan) return;
    
    // Create a more formatted version for PDF
    const formattedContent = formatLessonForPDF(lessonPlan);
    
    // For now, create a formatted HTML that can be saved as PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>RWFW Lesson Plan - ${formData.topic}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .header { border-bottom: 3px solid #059669; padding-bottom: 20px; margin-bottom: 30px; }
          .title { color: #047857; font-size: 24px; font-weight: bold; }
          .subtitle { color: #065f46; font-size: 16px; margin-top: 5px; }
          .section { margin: 20px 0; }
          .section-title { color: #047857; font-size: 18px; font-weight: bold; margin-bottom: 10px; border-bottom: 1px solid #d1fae5; }
          .content { margin-left: 20px; }
          .list-item { margin: 5px 0; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Root Work Framework Lesson Plan</div>
          <div class="subtitle">Subject(s): ${formData.subjects.join(', ')} | Grade: ${formData.gradeLevel} | Duration: ${formData.duration} over ${formData.numberOfDays} days</div>
          <div class="subtitle">Topic: ${formData.topic}</div>
        </div>
        ${formattedContent}
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #d1fae5; color: #6b7280; font-size: 12px;">
          Generated by Root Work Framework - Trauma-informed, regenerative learning ecosystem
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RWFW_${formData.topic.replace(/[^a-z0-9]/gi, '_')}_${formData.gradeLevel}_lesson.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsWord = () => {
    if (!lessonPlan) return;
    
    const formattedContent = formatLessonForWord(lessonPlan);
    const blob = new Blob([formattedContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RWFW_${formData.topic.replace(/[^a-z0-9]/gi, '_')}_${formData.gradeLevel}_lesson.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatLessonForPDF = (plan: any) => {
    // Enhanced formatting for PDF output
    let html = `<div class="section">
      <div class="section-title">Overview</div>
      <div class="content">${plan.title || 'Lesson Plan'}</div>
      <div class="content">${plan.overview || ''}</div>
    </div>`;

    if (plan.iCanTargets?.length) {
      html += `<div class="section">
        <div class="section-title">I Can Targets</div>
        <div class="content">`;
      plan.iCanTargets.forEach((target: any, i: number) => {
        html += `<div class="list-item">${i + 1}. ${target.text} (DOK ${target.dok})</div>`;
      });
      html += `</div></div>`;
    }

    if (plan.fiveRsSchedule?.length) {
      html += `<div class="section">
        <div class="section-title">5 Rs Structure</div>
        <div class="content">`;
      plan.fiveRsSchedule.forEach((block: any) => {
        html += `<div class="list-item"><strong>${block.label}</strong> (${block.minutes} min): ${block.purpose}</div>`;
      });
      html += `</div></div>`;
    }

    // Add more sections as needed...
    return html;
  };

  const formatLessonForWord = (plan: any) => {
    // Simple RTF format for Word compatibility
    return `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
\\f0\\fs24 ROOT WORK FRAMEWORK LESSON PLAN\\par
\\par
Topic: ${formData.topic}\\par
Subject(s): ${formData.subjects.join(', ')}\\par
Grade Level: ${formData.gradeLevel}\\par
Duration: ${formData.duration} over ${formData.numberOfDays} days\\par
\\par
${typeof plan === 'object' ? JSON.stringify(plan, null, 2).replace(/\n/g, '\\par\n') : plan}
}`;
  };

  const copyToClipboard = () => {
    if (!lessonPlan) return;
    const text = typeof lessonPlan === 'object' ? JSON.stringify(lessonPlan, null, 2) : lessonPlan;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <nav className="flex items-center space-x-4">
              <Link href="/" className="text-emerald-200 hover:text-white transition-colors">
                Back to Home
              </Link>
              {lessonPlan && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center space-x-1 px-3 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                    </svg>
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={downloadAsPDF}
                    className="flex items-center space-x-1 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={downloadAsWord}
                    className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                    <span>Word</span>
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Enhanced Form */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-emerald-200">
            <h2 className="text-2xl font-bold text-emerald-800 mb-2">
              Create Your Root Work Lesson Plan
            </h2>
            <p className="text-sm text-emerald-600 mb-6">
              Generate trauma-informed, culturally responsive lesson plans using the 5 Rs structure.
              Fields with <span className="text-red-500">*</span> are required.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Multiple Subject Selection */}
              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-2">
                  Subject Area(s) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border-2 border-emerald-200 rounded-lg max-h-40 overflow-y-auto">
                  {SUBJECTS.map(subject => (
                    <label key={subject} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={formData.subjects.includes(subject)}
                        onChange={() => handleSubjectChange(subject)}
                        className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="truncate" title={subject}>{subject}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-emerald-600 mt-1">
                  Select multiple subjects for integrated lessons. Selected: {formData.subjects.length}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-emerald-800 mb-2">
                    Number of Days <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="numberOfDays" 
                    value={formData.numberOfDays} 
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                    required
                  >
                    <option value="">Select Days</option>
                    {[1,2,3,4,5,6,7,8,9,10,15,20].map(days => (
                      <option key={days} value={String(days)}>{days} {days === 1 ? 'day' : 'days'}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-emerald-800 mb-2">
                    Lesson Topic <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" 
                    name="topic" 
                    value={formData.topic} 
                    onChange={handleInputChange}
                    placeholder="e.g., Civil Rights Movement, Ecosystems, Microgreens"
                    className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-emerald-800 mb-2">
                    Duration per Day <span className="text-red-500">*</span>
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
              </div>

              {/* Enhanced Learning Objectives with Smart Help */}
              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-2">
                  Learning Objectives & Standards <span className="text-emerald-600 text-xs">(Optional but recommended)</span>
                </label>
                <textarea
                  name="learningObjectives" 
                  value={formData.learningObjectives} 
                  onChange={handleInputChange}
                  placeholder="Try typing: 'Georgia Standards' or 'Common Core' or 'NGSS' for automatic standard integration..."
                  rows={4}
                  className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {showStandardsHelp && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                    Smart standards detected! The AI will automatically integrate specific standards for your selected subjects and grade level.
                  </div>
                )}
                <p className="text-xs text-emerald-600 mt-1">
                  Shortcuts: "Georgia Standards", "Common Core", "NGSS", "CASEL", "National Standards"
                </p>
              </div>

              {/* Enhanced Special Considerations */}
              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-2">
                  Special Considerations <span className="text-emerald-600 text-xs">(Optional)</span>
                </label>
                <textarea
                  name="specialNeeds" 
                  value={formData.specialNeeds} 
                  onChange={handleInputChange}
                  placeholder="Try: 'ELL supports', 'IEP accommodations', 'ADHD modifications', 'trauma-informed practices'..."
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-emerald-600 mt-1">
                  Smart abbreviations: ELL, SPED, IEP, 504, ADHD, ASD, PTSD will be auto-expanded with specific supports
                </p>
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
                      Generate Enhanced RWFW Lesson
                    </>
                  )}
                </button>
                <p className="text-sm text-emerald-700 mt-2 text-center">
                  Creates comprehensive lessons with intelligent standards integration and evidence-based accommodations
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
                  RWFW Lesson Plan
                </h2>
                <div className="text-sm text-emerald-600">
                  {formData.subjects.join(' + ')} | Grade {formData.gradeLevel} | {formData.numberOfDays} days
                </div>
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
