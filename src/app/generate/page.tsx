// src/app/generate/page.tsx
'use client';

import { useState } from 'react';
import { Calendar, Clock, Users, Target, BookOpen, Download, Copy, Check, FileText } from 'lucide-react';

interface LessonPlan {
  title: string;
  overview: string;
  objectives: string[];
  materials: string[];
  timeline: Array<{
    time: string;
    activity: string;
    description: string;
  }>;
  assessment: string;
  differentiation: string;
  extensions: string;
}

export default function GeneratePage() {
  const [formData, setFormData] = useState({
    subject: '',
    gradeLevel: '',
    topic: '',
    duration: '',
    learningObjectives: '',
    specialNeeds: '',
    availableResources: ''
  });
  
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError('');

    // Only validate the most essential fields
    const missingFields = [];
    if (!formData.subject?.trim()) missingFields.push('Subject Area');
    if (!formData.gradeLevel?.trim()) missingFields.push('Grade Level');
    if (!formData.topic?.trim()) missingFields.push('Lesson Topic');
    if (!formData.duration?.trim()) missingFields.push('Duration');

    if (missingFields.length > 0) {
      setError(`Please fill in these required fields: ${missingFields.join(', ')}`);
      setIsGenerating(false);
      return;
    }

    // Create a clean payload with defaults
    const payload = {
      subject: formData.subject.trim(),
      gradeLevel: formData.gradeLevel.trim(),
      topic: formData.topic.trim(),
      duration: formData.duration.trim(),
      learningObjectives: formData.learningObjectives?.trim() || '',
      specialNeeds: formData.specialNeeds?.trim() || '',
      availableResources: formData.availableResources?.trim() || ''
    };

    console.log('Submitting payload:', payload);

    try {
      const response = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);
      
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || `Server error: ${response.status}`);
      }

      if (responseData.lessonPlan) {
        setLessonPlan(responseData.lessonPlan);
        if (responseData.fallback) {
          setError('Generated using backup system - lesson plan created successfully!');
        }
      } else {
        throw new Error('No lesson plan received from server');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to generate lesson plan: ${errorMessage}`);
      console.error('Form submission error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!lessonPlan) return;
    
    const text = formatLessonPlanText(lessonPlan);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadLessonPlan = () => {
    if (!lessonPlan) return;
    
    const text = formatLessonPlanText(lessonPlan);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lessonPlan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_lesson_plan.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsPDF = () => {
    if (!lessonPlan) return;
    
    // Create a comprehensive HTML structure for PDF generation
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Root Work Framework - ${lessonPlan.title}</title>
      <style>
        body { 
          font-family: 'Inter', Arial, sans-serif; 
          line-height: 1.6; 
          color: #2B2B2B; 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 40px 20px;
        }
        .header { 
          text-align: center; 
          border-bottom: 3px solid #D4C862; 
          padding-bottom: 20px; 
          margin-bottom: 30px;
        }
        .header h1 { 
          color: #082A19; 
          font-family: 'Merriweather', serif; 
          font-size: 28px; 
          margin: 0;
        }
        .header p { 
          color: #3B523A; 
          font-style: italic; 
          margin: 5px 0 0 0;
        }
        .section { 
          margin: 25px 0; 
        }
        .section h2 { 
          color: #082A19; 
          font-size: 20px; 
          border-left: 4px solid #D4C862; 
          padding-left: 15px;
          margin-bottom: 15px;
        }
        .section h3 { 
          color: #3B523A; 
          font-size: 18px; 
          margin-bottom: 10px;
        }
        ul, ol { 
          padding-left: 25px; 
        }
        li { 
          margin: 8px 0; 
        }
        .timeline-item { 
          border-left: 3px solid #D4C862; 
          padding-left: 15px; 
          margin: 15px 0;
        }
        .timeline-time { 
          font-weight: bold; 
          color: #082A19;
        }
        .timeline-desc { 
          color: #3B523A; 
          margin-top: 5px;
        }
        .footer { 
          text-align: center; 
          margin-top: 40px; 
          padding-top: 20px; 
          border-top: 2px solid #F2F4CA; 
          color: #3B523A; 
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Root Work Framework</h1>
        <p>Healing-Centered, Biophilic Lesson Plan</p>
      </div>
      
      <div class="section">
        <h2>${lessonPlan.title}</h2>
        <p>${lessonPlan.overview}</p>
      </div>

      <div class="section">
        <h3>Learning Objectives</h3>
        <ul>
          ${lessonPlan.objectives.map(obj => `<li>${obj}</li>`).join('')}
        </ul>
      </div>

      <div class="section">
        <h3>Materials Needed</h3>
        <ul>
          ${lessonPlan.materials.map(material => `<li>${material}</li>`).join('')}
        </ul>
      </div>

      <div class="section">
        <h3>Lesson Timeline</h3>
        ${lessonPlan.timeline.map(item => `
          <div class="timeline-item">
            <div class="timeline-time">${item.time} - ${item.activity}</div>
            <div class="timeline-desc">${item.description}</div>
          </div>
        `).join('')}
      </div>

      <div class="section">
        <h3>Assessment Strategies</h3>
        <p>${lessonPlan.assessment}</p>
      </div>

      <div class="section">
        <h3>Differentiation & Accommodations</h3>
        <p>${lessonPlan.differentiation}</p>
      </div>

      <div class="section">
        <h3>Extension Activities</h3>
        <p>${lessonPlan.extensions}</p>
      </div>

      <div class="footer">
        <p>Generated by Root Work Framework Lesson Plan Generator</p>
        <p>Weaving academic rigor with healing-centered, biophilic practice</p>
      </div>
    </body>
    </html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lessonPlan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_RWF_lesson_plan.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatLessonPlanText = (plan: LessonPlan) => {
    return `
ROOT WORK FRAMEWORK LESSON PLAN: ${plan.title}

OVERVIEW:
${plan.overview}

LEARNING OBJECTIVES:
${plan.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

MATERIALS NEEDED:
${plan.materials.map(material => `• ${material}`).join('\n')}

LESSON TIMELINE:
${plan.timeline.map(item => `${item.time} - ${item.activity}\n   ${item.description}`).join('\n\n')}

ASSESSMENT STRATEGIES:
${plan.assessment}

DIFFERENTIATION & ACCOMMODATIONS:
${plan.differentiation}

EXTENSION ACTIVITIES:
${plan.extensions}

Generated by Root Work Framework
Weaving academic rigor with healing-centered, biophilic practice
`.trim();
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #F2F4CA, #ffffff)' }}>
      {/* Header */}
      <header className="border-b-2 border-[#D4C862] bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#082A19] rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-[#D4C862]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#082A19]" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>Root Work Framework</h1>
                <p className="text-sm text-[#3B523A]" style={{ fontFamily: 'Inter, sans-serif' }}>Lesson Plan Generator</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/generate"
                className="bg-[#082A19] text-[#D4C862] px-4 py-2 rounded-lg hover:bg-[#001C10] transition-colors border border-[#D4C862]"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Generate Lesson
              </a>
              <a
                href="/"
                className="text-[#082A19] hover:text-[#3B523A] font-medium"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Back to Home
              </a>
              {/* Root Work Framework Logo - Brand Compliant */}
              <div className="w-12 h-12 rounded-full border-2 p-1 flex-shrink-0" style={{ backgroundColor: '#082A19', borderColor: '#D4C862' }}>
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Background Circle - Evergreen */}
                  <circle cx="50" cy="50" r="48" fill="#082A19" stroke="#D4C862" strokeWidth="2"/>
                  
                  {/* Central Plant */}
                  <g transform="translate(50,50)">
                    {/* Plant stem - Gold Leaf */}
                    <path d="M0,-15 L0,15" stroke="#D4C862" strokeWidth="3" fill="none"/>
                    {/* Central leaves - Leaf color */}
                    <path d="M-8,-5 Q-12,-8 -8,-12 Q-4,-8 0,-5" fill="#3B523A"/>
                    <path d="M8,-5 Q12,-8 8,-12 Q4,-8 0,-5" fill="#3B523A"/>
                    <path d="M-6,5 Q-10,2 -6,-2 Q-2,2 0,5" fill="#3B523A"/>
                    <path d="M6,5 Q10,2 6,-2 Q2,2 0,5" fill="#3B523A"/>
                    
                    {/* Radiating lines - Gold Leaf */}
                    <g stroke="#D4C862" strokeWidth="1.5">
                      <path d="M-12,0 L-8,0"/>
                      <path d="M8,0 L12,0"/>
                      <path d="M0,-12 L0,-8"/>
                      <path d="M0,8 L0,12"/>
                      <path d="M-8,-8 L-6,-6"/>
                      <path d="M8,-8 L6,-6"/>
                      <path d="M-8,8 L-6,6"/>
                      <path d="M8,8 L6,6"/>
                    </g>
                  </g>
                  
                  {/* Scales of Justice - Upper Left - Gold Leaf */}
                  <g transform="translate(25,25) scale(0.7)">
                    <path d="M0,-8 L0,8" stroke="#D4C862" strokeWidth="2"/>
                    <path d="M-8,0 L8,0" stroke="#D4C862" strokeWidth="1.5"/>
                    <ellipse cx="-6" cy="4" rx="4" ry="2" fill="none" stroke="#D4C862" strokeWidth="1.5"/>
                    <ellipse cx="6" cy="4" rx="4" ry="2" fill="none" stroke="#D4C862" strokeWidth="1.5"/>
                  </g>
                  
                  {/* Book - Upper Right - Gold Leaf */}
                  <g transform="translate(75,25) scale(0.7)">
                    <rect x="-6" y="-4" width="12" height="8" fill="none" stroke="#D4C862" strokeWidth="2"/>
                    <path d="M-6,-4 L6,-4 L6,4 L-6,4 Z" fill="none" stroke="#D4C862" strokeWidth="1"/>
                    <path d="M0,-4 L0,4" stroke="#D4C862" strokeWidth="1.5"/>
                    <path d="M-3,-1 L3,-1" stroke="#D4C862" strokeWidth="1"/>
                    <path d="M-3,1 L3,1" stroke="#D4C862" strokeWidth="1"/>
                  </g>
                  
                  {/* Brain - Lower Left - Gold Leaf */}
                  <g transform="translate(25,75) scale(0.7)">
                    <path d="M-6,-4 Q-8,-6 -4,-6 Q0,-8 4,-6 Q8,-6 6,-4 Q8,-2 6,0 Q8,2 6,4 Q4,6 0,4 Q-4,6 -6,4 Q-8,2 -6,0 Q-8,-2 -6,-4" 
                          fill="none" stroke="#D4C862" strokeWidth="2"/>
                    <path d="M-2,-2 Q0,-4 2,-2" stroke="#D4C862" strokeWidth="1.2" fill="none"/>
                    <path d="M-2,2 Q0,0 2,2" stroke="#D4C862" strokeWidth="1.2" fill="none"/>
                  </g>
                  
                  {/* Science Flask - Lower Right - Gold Leaf */}
                  <g transform="translate(75,75) scale(0.7)">
                    <path d="M-2,-6 L-2,-2 L-6,4 L6,4 L2,-2 L2,-6" fill="none" stroke="#D4C862" strokeWidth="2"/>
                    <circle cx="0" cy="2" r="1.5" fill="#D4C862"/>
                    <path d="M-4,-6 L4,-6" stroke="#D4C862" strokeWidth="1.5"/>
                  </g>
                  
                  {/* Decorative vines - Leaf color */}
                  <g fill="none" stroke="#3B523A" strokeWidth="1.5">
                    <path d="M15,35 Q20,30 25,35 Q30,40 35,35"/>
                    <path d="M65,35 Q70,30 75,35 Q80,40 85,35"/>
                    <path d="M15,65 Q20,70 25,65 Q30,60 35,65"/>
                    <path d="M65,65 Q70,70 75,65 Q80,60 85,65"/>
                  </g>
                  
                  {/* Small leaves on vines - Leaf color */}
                  <g fill="#3B523A">
                    <ellipse cx="20" cy="32" rx="2.5" ry="1.2" transform="rotate(45 20 32)"/>
                    <ellipse cx="30" cy="38" rx="2.5" ry="1.2" transform="rotate(-45 30 38)"/>
                    <ellipse cx="70" cy="32" rx="2.5" ry="1.2" transform="rotate(-45 70 32)"/>
                    <ellipse cx="80" cy="38" rx="2.5" ry="1.2" transform="rotate(45 80 38)"/>
                    <ellipse cx="20" cy="68" rx="2.5" ry="1.2" transform="rotate(-45 20 68)"/>
                    <ellipse cx="30" cy="62" rx="2.5" ry="1.2" transform="rotate(45 30 62)"/>
                    <ellipse cx="70" cy="68" rx="2.5" ry="1.2" transform="rotate(45 70 68)"/>
                    <ellipse cx="80" cy="62" rx="2.5" ry="1.2" transform="rotate(-45 80 62)"/>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-[#D4C862]">
            <h2 className="text-2xl font-bold text-[#082A19] mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>Create Your Root Work Lesson Plan</h2>
            <p className="text-sm text-[#3B523A] mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              Fields marked with <span className="text-red-500">*</span> are required. 
              Our AI generates comprehensive, healing-centered lesson plans with just the basics!
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#082A19] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Subject Area <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="e.g., Mathematics, Science, English"
                    className="w-full px-3 py-2 border-2 border-[#3B523A] rounded-lg focus:ring-2 focus:ring-[#D4C862] focus:border-[#D4C862]"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#082A19] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Grade Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="gradeLevel"
                    value={formData.gradeLevel}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border-2 border-[#3B523A] rounded-lg focus:ring-2 focus:ring-[#D4C862] focus:border-[#D4C862]"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                    required
                  >
                    <option value="">Select Grade Level</option>
                    <option value="PreK">Pre-K</option>
                    <option value="K">Kindergarten</option>
                    <option value="1">1st Grade</option>
                    <option value="2">2nd Grade</option>
                    <option value="3">3rd Grade</option>
                    <option value="4">4th Grade</option>
                    <option value="5">5th Grade</option>
                    <option value="6">6th Grade</option>
                    <option value="7">7th Grade</option>
                    <option value="8">8th Grade</option>
                    <option value="9">9th Grade</option>
                    <option value="10">10th Grade</option>
                    <option value="11">11th Grade</option>
                    <option value="12">12th Grade</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#082A19] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Lesson Topic <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder="e.g., Photosynthesis, Quadratic Equations, Character Development"
                  className="w-full px-3 py-2 border-2 border-[#3B523A] rounded-lg focus:ring-2 focus:ring-[#D4C862] focus:border-[#D4C862]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#082A19] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <Clock className="inline h-4 w-4 mr-1 text-[#D4C862]" />
                  Duration <span className="text-red-500">*</span>
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border-2 border-[#3B523A] rounded-lg focus:ring-2 focus:ring-[#D4C862] focus:border-[#D4C862]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  required
                >
                  <option value="">Select Duration</option>
                  <option value="30 minutes">30 minutes</option>
                  <option value="45 minutes">45 minutes</option>
                  <option value="50 minutes">50 minutes</option>
                  <option value="60 minutes">60 minutes</option>
                  <option value="90 minutes">90 minutes</option>
                  <option value="120 minutes">120 minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#082A19] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <Target className="inline h-4 w-4 mr-1 text-[#D4C862]" />
                  Learning Objectives <span className="text-[#3B523A] text-xs">(Optional - AI will generate if blank)</span>
                </label>
                <textarea
                  name="learningObjectives"
                  value={formData.learningObjectives}
                  onChange={handleInputChange}
                  placeholder="What should students be able to do by the end of this lesson? (Leave blank for AI-generated objectives)"
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-[#3B523A] rounded-lg focus:ring-2 focus:ring-[#D4C862] focus:border-[#D4C862]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#082A19] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <Users className="inline h-4 w-4 mr-1 text-[#D4C862]" />
                  Special Considerations <span className="text-[#3B523A] text-xs">(Optional)</span>
                </label>
                <textarea
                  name="specialNeeds"
                  value={formData.specialNeeds}
                  onChange={handleInputChange}
                  placeholder="ELL students, special education needs, differentiation requirements, trauma-informed considerations..."
                  rows={2}
                  className="w-full px-3 py-2 border-2 border-[#3B523A] rounded-lg focus:ring-2 focus:ring-[#D4C862] focus:border-[#D4C862]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#082A19] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Available Resources <span className="text-[#3B523A] text-xs">(Optional)</span>
                </label>
                <textarea
                  name="availableResources"
                  value={formData.availableResources}
                  onChange={handleInputChange}
                  placeholder="Technology, materials, lab equipment, outdoor spaces, etc."
                  rows={2}
                  className="w-full px-3 py-2 border-2 border-[#3B523A] rounded-lg focus:ring-2 focus:ring-[#D4C862] focus:border-[#D4C862]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-red-800">
                  <p style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-[#082A19] text-[#D4C862] py-4 px-6 rounded-lg font-semibold hover:bg-[#001C10] disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-2 border-[#D4C862]"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {isGenerating ? 'Generating Root Work Lesson Plan...' : 'Generate Root Work Lesson Plan'}
              </button>
            </form>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-[#D4C862]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#082A19]" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>Your Root Work Lesson Plan</h2>
              {lessonPlan && (
                <div className="flex space-x-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-[#F2F4CA] hover:bg-[#D4C862] text-[#082A19] rounded-lg transition-colors border border-[#3B523A]"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={downloadLessonPlan}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-[#F2F4CA] hover:bg-[#D4C862] text-[#082A19] rounded-lg transition-colors border border-[#3B523A]"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <Download className="h-4 w-4" />
                    <span>Download TXT</span>
                  </button>
                  <button
                    onClick={downloadAsPDF}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-[#082A19] hover:bg-[#001C10] text-[#D4C862] rounded-lg transition-colors border border-[#D4C862]"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Download HTML/PDF</span>
                  </button>
                </div>
              )}
            </div>

            {!lessonPlan ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-[#D4C862] mx-auto mb-4" />
                <p className="text-[#3B523A]" style={{ fontFamily: 'Inter, sans-serif' }}>Fill out the form to generate your Root Work Framework lesson plan</p>
              </div>
            ) : (
              <div className="space-y-6 max-h-96 overflow-y-auto">
                <div>
                  <h3 className="text-lg font-semibold text-[#082A19] mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>{lessonPlan.title}</h3>
                  <p className="text-[#2B2B2B]" style={{ fontFamily: 'Inter, sans-serif' }}>{lessonPlan.overview}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#082A19] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Learning Objectives:</h4>
                  <ul className="list-disc list-inside space-y-1 text-[#2B2B2B]" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {lessonPlan.objectives.map((objective, index) => (
                      <li key={index}>{objective}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-[#082A19] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Materials Needed:</h4>
                  <ul className="list-disc list-inside space-y-1 text-[#2B2B2B]" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {lessonPlan.materials.map((material, index) => (
                      <li key={index}>{material}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-[#082A19] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Lesson Timeline:</h4>
                  <div className="space-y-3">
                    {lessonPlan.timeline.map((item, index) => (
                      <div key={index} className="border-l-4 border-[#D4C862] pl-4">
                        <div className="font-medium text-[#082A19]" style={{ fontFamily: 'Inter, sans-serif' }}>{item.time} - {item.activity}</div>
                        <div className="text-[#2B2B2B] text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>{item.description}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-[#082A19] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Assessment:</h4>
                  <p className="text-[#2B2B2B]" style={{ fontFamily: 'Inter, sans-serif' }}>{lessonPlan.assessment}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#082A19] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Differentiation:</h4>
                  <p className="text-[#2B2B2B]" style={{ fontFamily: 'Inter, sans-serif' }}>{lessonPlan.differentiation}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-[#082A19] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>Extension Activities:</h4>
                  <p className="text-[#2B2B2B]" style={{ fontFamily: 'Inter, sans-serif' }}>{lessonPlan.extensions}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
