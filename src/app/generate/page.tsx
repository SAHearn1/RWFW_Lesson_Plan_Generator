// src/app/generate/page.tsx - Professional Full-Screen Generator

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
  location?: string;
  unitContext?: string;
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

const LOADING_STAGES = [
  { stage: 'initializing', message: 'Initializing Root Work Framework protocol...', duration: 2000 },
  { stage: 'standards', message: 'Integrating academic standards and DOK levels...', duration: 3000 },
  { stage: 'trauma-informed', message: 'Applying trauma-informed pedagogy principles...', duration: 4000 },
  { stage: 'steam', message: 'Designing STEAM integration and project-based components...', duration: 5000 },
  { stage: 'mtss', message: 'Creating MTSS scaffolding and differentiation strategies...', duration: 3000 },
  { stage: 'assessment', message: 'Developing assessment tools and rubrics...', duration: 2000 },
  { stage: 'finalizing', message: 'Finalizing comprehensive lesson plan structure...', duration: 2000 }
];

export default function GeneratePage() {
  const [formData, setFormData] = useState<FormData>({
    subjects: [],
    gradeLevel: '',
    topic: '',
    duration: '',
    numberOfDays: '',
    learningObjectives: '',
    specialNeeds: '',
    availableResources: '',
    location: 'Savannah, Georgia',
    unitContext: ''
  });

  const [lessonPlan, setLessonPlan] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [currentStage, setCurrentStage] = useState(0);
  const [showForm, setShowForm] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
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

  const simulateLoadingStages = () => {
    let stageIndex = 0;
    const progressStage = () => {
      if (stageIndex < LOADING_STAGES.length) {
        setCurrentStage(stageIndex);
        setTimeout(() => {
          stageIndex++;
          progressStage();
        }, LOADING_STAGES[stageIndex]?.duration || 2000);
      }
    };
    progressStage();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError('');
    setCurrentStage(0);
    
    simulateLoadingStages();

    // Enhanced validation
    const missing: string[] = [];
    if (!formData.subjects.length) missing.push('Subject Area(s)');
    if (!formData.gradeLevel?.trim()) missing.push('Grade Level');
    if (!formData.topic?.trim()) missing.push('Lesson Topic');
    if (!formData.duration?.trim()) missing.push('Duration');
    if (!formData.numberOfDays?.trim()) missing.push('Number of Days');
    
    if (missing.length) {
      setError(`Please complete these required fields: ${missing.join(', ')}`);
      setIsGenerating(false);
      return;
    }

    try {
      // Enhanced payload for comprehensive lesson plans
      const enhancedPayload = {
        // Core fields your API expects
        subject: formData.subjects.join(', '),
        gradeLevel: formData.gradeLevel.trim(),
        topic: formData.topic.trim(),
        duration: formData.duration.trim(),
        numberOfDays: formData.numberOfDays.trim(),
        learningObjectives: processLearningObjectives(formData.learningObjectives, formData.subjects, formData.gradeLevel),
        specialNeeds: processSpecialNeeds(formData.specialNeeds),
        availableResources: formData.availableResources?.trim() || '',
        
        // Enhanced fields for comprehensive lesson generation
        location: formData.location || 'Savannah, Georgia',
        unitContext: formData.unitContext || '',
        
        // Master prompt compliance instructions
        lessonType: 'comprehensive_multi_day',
        requireTeacherNotes: true,
        requireStudentNotes: true,
        includeTraumaInformed: true,
        includeSTEAM: true,
        includeMTSS: true,
        includeAssessment: true,
        includeResources: true,
        gradualRelease: true,
        
        // Instruction for AI to follow master prompt structure
        specialInstructions: `Generate a comprehensive ${formData.numberOfDays}-day lesson plan following the Root Work Framework master prompt structure. Include mandatory [Teacher Note:] and [Student Note:] for every lesson component. Structure each day with: Opening, I Do, We Do, You Do Together, You Do Alone, Closing. Include STEAM integration, trauma-informed practices, MTSS supports, assessment tools, and resource appendix. Use healing-centered, second-person voice for students.`
      };

      console.log('Sending enhanced payload:', enhancedPayload);

      const response = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enhancedPayload),
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (!response.ok) {
        throw new Error(data?.error || `Request failed with status ${response.status}`);
      }

      if (!data?.lessonPlan) {
        console.error('No lesson plan in response:', data);
        throw new Error('No lesson plan generated. Please try again.');
      }

      // Validate we got comprehensive content
      const planContent = typeof data.lessonPlan === 'string' ? data.lessonPlan : JSON.stringify(data.lessonPlan);
      if (planContent.length < 2000) {
        console.warn('Lesson plan seems too short for comprehensive multi-day plan:', planContent.length, 'characters');
      }

      setLessonPlan(data.lessonPlan);
      setShowForm(false); // Hide form, show full-screen lesson plan
      
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err?.message || 'Failed to generate lesson plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const processLearningObjectives = (objectives: string = '', subjects: string[], gradeLevel: string): string => {
    if (!objectives.trim()) return '';
    
    let processed = objectives;
    const lowerObjectives = objectives.toLowerCase();
    
    for (const [shortcut, fullName] of Object.entries(STANDARDS_SHORTCUTS)) {
      if (lowerObjectives.includes(shortcut)) {
        processed += `\n\nINTEGRATE: Include specific ${fullName} for ${subjects.join(' and ')} at grade ${gradeLevel}. Provide actual standard codes and descriptions.`;
      }
    }
    
    return processed;
  };

  const processSpecialNeeds = (specialNeeds: string = ''): string => {
    if (!specialNeeds.trim()) return '';
    
    let processed = specialNeeds;
    const lower = specialNeeds.toLowerCase();
    
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
        processed += `\n\nPROVIDE: Specific evidence-based accommodations and supports for ${full}.`;
      }
    }
    
    return processed;
  };

  const downloadAsHTML = () => {
    if (!lessonPlan) return;
    
    const htmlContent = createProfessionalHTML(lessonPlan);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RWFW_${formData.topic.replace(/[^a-z0-9]/gi, '_')}_Grade${formData.gradeLevel}_${formData.numberOfDays}days.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsRTF = () => {
    if (!lessonPlan) return;
    
    const rtfContent = createProfessionalRTF(lessonPlan);
    const blob = new Blob([rtfContent], { type: 'application/rtf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RWFW_${formData.topic.replace(/[^a-z0-9]/gi, '_')}_Grade${formData.gradeLevel}_${formData.numberOfDays}days.rtf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const createProfessionalHTML = (plan: any) => {
    const planTitle = plan.title || `Root Work Framework: ${formData.topic}`;
    const planContent = typeof plan === 'object' ? JSON.stringify(plan, null, 2) : plan;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${planTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      line-height: 1.6; 
      color: #2B2B2B; 
      max-width: 8.5in; 
      margin: 0 auto; 
      padding: 1in;
      background: #FFFFFF;
    }
    h1, h2, h3 { 
      font-family: 'Merriweather', Georgia, serif; 
      color: #082A19; 
      margin-bottom: 1rem;
    }
    h1 { 
      font-size: 32px; 
      border-bottom: 3px solid #D4C862; 
      padding-bottom: 0.5rem; 
      margin-bottom: 1.5rem;
    }
    h2 { font-size: 24px; margin-top: 2rem; }
    h3 { font-size: 18px; margin-top: 1.5rem; }
    .header {
      background: #F2F4CA;
      padding: 1.5rem;
      margin: -1in -1in 2rem -1in;
      border-bottom: 4px solid #D4C862;
    }
    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
      font-size: 14px;
      color: #3B523A;
    }
    .content {
      white-space: pre-wrap;
      background: #F9F9F9;
      padding: 1.5rem;
      border-left: 4px solid #D4C862;
      border-radius: 0 8px 8px 0;
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 12px;
      line-height: 1.5;
    }
    .footer {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 2px solid #F2F4CA;
      text-align: center;
      font-size: 12px;
      color: #3B523A;
    }
    @media print {
      body { margin: 0.5in; }
      .header { margin: -0.5in -0.5in 1rem -0.5in; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Root Work Framework Lesson Plan</h1>
    <div class="meta">
      <div><strong>Topic:</strong> ${formData.topic}</div>
      <div><strong>Grade Level:</strong> ${formData.gradeLevel}</div>
      <div><strong>Subject(s):</strong> ${formData.subjects.join(', ')}</div>
      <div><strong>Duration:</strong> ${formData.duration} × ${formData.numberOfDays} days</div>
    </div>
  </div>
  
  <div class="content">${planContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
  
  <div class="footer">
    <p>Generated by Root Work Framework — Trauma-informed, regenerative learning ecosystem</p>
    <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
</body>
</html>`;
  };

  const createProfessionalRTF = (plan: any) => {
    const planContent = typeof plan === 'object' ? JSON.stringify(plan, null, 2) : plan;
    return `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0\\fswiss Arial;}{\\f1\\froman Times New Roman;}}
{\\colortbl;\\red8\\green42\\blue25;\\red212\\green200\\blue98;}
\\f1\\fs28\\cf1\\b ROOT WORK FRAMEWORK LESSON PLAN\\b0\\par
\\par
\\fs20 Topic: ${formData.topic}\\par
Subject(s): ${formData.subjects.join(', ')}\\par
Grade Level: ${formData.gradeLevel}\\par
Duration: ${formData.duration} over ${formData.numberOfDays} days\\par
\\par
\\f0\\fs18${planContent.replace(/\n/g, '\\par\n').replace(/\{/g, '\\{').replace(/\}/g, '\\}')}\\par
\\par
\\cf2 Generated by Root Work Framework — ${new Date().toLocaleDateString()}
}`;
  };

  const copyToClipboard = () => {
    if (!lessonPlan) return;
    const text = typeof lessonPlan === 'object' ? JSON.stringify(lessonPlan, null, 2) : lessonPlan;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Loading screen component
  if (isGenerating) {
    const currentLoadingStage = LOADING_STAGES[currentStage] || LOADING_STAGES[0];
    const progress = ((currentStage + 1) / LOADING_STAGES.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F2F4CA] to-[#082A19] flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full mx-6 border-4 border-[#D4C862]">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-[#082A19] rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="animate-spin">
                <svg className="w-12 h-12 text-[#D4C862]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-[#082A19] mb-3" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
              Generating Your Lesson Plan
            </h2>
            <p className="text-[#3B523A] text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
              Creating comprehensive {formData.numberOfDays}-day lesson using Root Work Framework
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="w-full bg-[#F2F4CA] rounded-full h-4 border-2 border-[#3B523A]">
              <div 
                className="bg-gradient-to-r from-[#D4C862] to-[#082A19] h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-[#3B523A]" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Current Stage */}
          <div className="text-center">
            <div className="bg-[#F2F4CA] border-2 border-[#D4C862] rounded-xl p-6 mb-6">
              <h3 className="text-xl font-semibold text-[#082A19] mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                Current Stage: {currentStage + 1} of {LOADING_STAGES.length}
              </h3>
              <p className="text-[#2B2B2B] text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
                {currentLoadingStage.message}
              </p>
            </div>

            {/* Stage List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {LOADING_STAGES.map((stage, index) => (
                <div 
                  key={stage.stage}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    index <= currentStage 
                      ? 'bg-[#D4C862] border-[#082A19] text-[#082A19]' 
                      : 'bg-white border-[#3B523A] text-[#3B523A]'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                      index <= currentStage ? 'bg-[#082A19] text-[#D4C862]' : 'bg-[#F2F4CA] text-[#3B523A]'
                    }`}>
                      {index < currentStage ? '✓' : index + 1}
                    </div>
                    <span className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {stage.message.split(':')[0]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lesson Details */}
          <div className="mt-8 p-4 bg-[#F2F4CA]/50 rounded-xl border border-[#3B523A]">
            <h4 className="font-semibold text-[#082A19] mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
              Generating:
            </h4>
            <div className="text-sm text-[#2B2B2B] space-y-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              <div><strong>Topic:</strong> {formData.topic}</div>
              <div><strong>Subjects:</strong> {formData.subjects.join(', ')}</div>
              <div><strong>Grade:</strong> {formData.gradeLevel}</div>
              <div><strong>Duration:</strong> {formData.numberOfDays} days × {formData.duration}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full-screen lesson plan display
  if (lessonPlan && !showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F2F4CA] to-white">
        {/* Header with actions */}
        <header className="bg-[#082A19] text-white shadow-xl">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#D4C862] rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-[#082A19]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                    {lessonPlan.title || `Root Work Framework: ${formData.topic}`}
                  </h1>
                  <p className="text-[#D4C862] text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {formData.subjects.join(' + ')} • Grade {formData.gradeLevel} • {formData.numberOfDays} days
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#3B523A] hover:bg-[#001C10] text-white rounded-lg transition-colors font-medium"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
                  </svg>
                  <span>New Lesson</span>
                </button>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#3B523A] hover:bg-[#001C10] text-white rounded-lg transition-colors font-medium"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                  </svg>
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  onClick={downloadAsHTML}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#D4C862] hover:bg-[#96812A] text-[#082A19] rounded-lg transition-colors font-semibold"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={downloadAsRTF}
                  className="flex items-center space-x-2 px-4 py-2 bg-white text-[#082A19] border-2 border-[#D4C862] hover:bg-[#F2F4CA] rounded-lg transition-colors font-medium"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                  <span>Word Doc</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Full-screen lesson plan content */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-[#D4C862]">
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-[#2B2B2B] leading-relaxed font-sans bg-[#F2F4CA]/20 p-6 rounded-xl border border-[#3B523A]" style={{ fontFamily: 'JetBrains Mono, Consolas, monospace' }}>
                {typeof lessonPlan === 'object' ? JSON.stringify(lessonPlan, null, 2) : lessonPlan}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form view (full-screen)
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2F4CA] to-white">
      {/* Header */}
      <header className="bg-[#082A19] text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#D4C862] rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-[#082A19]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Root Work Framework
                </h1>
                <p className="text-[#D4C862] text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Professional Lesson Planning
                </p>
              </div>
            </Link>
            <nav>
              <Link 
                href="/" 
                className="text-[#D4C862] hover:text-white transition-colors font-medium"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                ← Back to Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Full-screen form */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-3xl shadow-2xl p-12 border-4 border-[#D4C862]">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#082A19] mb-4" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
              Create Comprehensive Lesson Plan
            </h2>
            <p className="text-xl text-[#3B523A] leading-relaxed max-w-3xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
              Generate multi-day, trauma-informed lesson plans with STEAM integration, MTSS scaffolding, 
              and comprehensive assessment tools using the Root Work Framework.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Core Information */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Subjects */}
              <div className="lg:col-span-2">
                <label className="block text-xl font-bold text-[#082A19] mb-4" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Subject Area(s) <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-6 border-3 border-[#3B523A] rounded-2xl bg-[#F2F4CA]/30">
                  {SUBJECTS.map(subject => (
                    <label key={subject} className="flex items-center space-x-3 text-sm cursor-pointer hover:bg-white/70 p-3 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.subjects.includes(subject)}
                        onChange={() => handleSubjectChange(subject)}
                        className="w-5 h-5 rounded border-[#3B523A] text-[#D4C862] focus:ring-[#D4C862] focus:ring-2"
                      />
                      <span className="text-[#2B2B2B] font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {subject}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-[#3B523A] mt-3 text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <span className="font-bold text-[#082A19]">{formData.subjects.length}</span> selected
                  {formData.subjects.length > 0 && `: ${formData.subjects.join(', ')}`}
                </p>
              </div>

              {/* Grade Level */}
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-4" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Grade Level <span className="text-red-600">*</span>
                </label>
                <select
                  name="gradeLevel" 
                  value={formData.gradeLevel} 
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 text-lg border-3 border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B]" 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  required
                >
                  <option value="">Choose Grade Level</option>
                  <option value="PreK">Pre-K</option>
                  <option value="K">Kindergarten</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={String(i+1)}>Grade {i+1}</option>
                  ))}
                  <option value="Mixed">Mixed Ages</option>
                </select>
              </div>

              {/* Number of Days */}
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-4" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Number of Days <span className="text-red-600">*</span>
                </label>
                <select
                  name="numberOfDays" 
                  value={formData.numberOfDays} 
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 text-lg border-3 border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B]" 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  required
                >
                  <option value="">Select Days</option>
                  {[3,4,5,6,7,8,9,10,15,20].map(days => (
                    <option key={days} value={String(days)}>{days} {days === 1 ? 'day' : 'days'}</option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-4" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Lesson Topic <span className="text-red-600">*</span>
                </label>
                <input
                  type="text" 
                  name="topic" 
                  value={formData.topic} 
                  onChange={handleInputChange}
                  placeholder="e.g., Photosynthesis and Plant Growth, Civil Rights Movement"
                  className="w-full px-6 py-4 text-lg border-3 border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B]" 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  required
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-4" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Duration per Day <span className="text-red-600">*</span>
                </label>
                <select
                  name="duration" 
                  value={formData.duration} 
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 text-lg border-3 border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B]" 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  required
                >
                  <option value="">Select Duration</option>
                  <option value="45 minutes">45 minutes</option>
                  <option value="50 minutes">50 minutes</option>
                  <option value="60 minutes">60 minutes</option>
                  <option value="75 minutes">75 minutes</option>
                  <option value="90 minutes">90 minutes (Block)</option>
                  <option value="120 minutes">120 minutes (Extended)</option>
                </select>
              </div>
            </div>

            {/* Enhanced Fields */}
            <div className="space-y-8">
              {/* Location */}
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-4" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Location Context
                </label>
                <input
                  type="text" 
                  name="location" 
                  value={formData.location} 
                  onChange={handleInputChange}
                  placeholder="e.g., Savannah, Georgia (helps with local relevance)"
                  className="w-full px-6 py-4 text-lg border-3 border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B]" 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              {/* Learning Objectives */}
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-4" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Learning Objectives & Standards
                  <span className="text-[#3B523A] text-lg font-normal ml-3">(Optional but recommended)</span>
                </label>
                <textarea
                  name="learningObjectives" 
                  value={formData.learningObjectives} 
                  onChange={handleInputChange}
                  placeholder="Smart shortcuts: Type 'Georgia Standards', 'Common Core', 'NGSS' for automatic integration. Or specify learning objectives directly."
                  rows={5}
                  className="w-full px-6 py-4 text-lg border-3 border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B] resize-vertical"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              {/* Unit Context */}
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-4" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Unit Context
                  <span className="text-[#3B523A] text-lg font-normal ml-3">(Optional)</span>
                </label>
                <textarea
                  name="unitContext" 
                  value={formData.unitContext} 
                  onChange={handleInputChange}
                  placeholder="What larger unit or theme does this lesson connect to? What have students learned previously?"
                  rows={3}
                  className="w-full px-6 py-4 text-lg border-3 border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B] resize-vertical"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              {/* Special Considerations */}
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-4" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Special Considerations & Accommodations
                  <span className="text-[#3B523A] text-lg font-normal ml-3">(Optional)</span>
                </label>
                <textarea
                  name="specialNeeds" 
                  value={formData.specialNeeds} 
                  onChange={handleInputChange}
                  placeholder="Smart shortcuts: 'ELL', 'IEP', 'ADHD', 'autism', 'trauma-informed' - will auto-expand with evidence-based supports"
                  rows={4}
                  className="w-full px-6 py-4 text-lg border-3 border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B] resize-vertical"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              {/* Available Resources */}
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-4" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Available Resources & Materials
                  <span className="text-[#3B523A] text-lg font-normal ml-3">(Optional)</span>
                </label>
                <textarea
                  name="availableResources" 
                  value={formData.availableResources} 
                  onChange={handleInputChange}
                  placeholder="Garden space, technology lab, manipulatives, community partners, field trip opportunities, specific materials..."
                  rows={4}
                  className="w-full px-6 py-4 text-lg border-3 border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B] resize-vertical"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="bg-gradient-to-r from-[#F2F4CA] to-[#D4C862]/40 p-10 rounded-3xl border-4 border-[#D4C862]">
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-[#082A19] hover:bg-[#001C10] disabled:bg-[#3B523A] text-white font-bold py-6 px-10 rounded-2xl transition-all duration-300 flex items-center justify-center text-2xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
                style={{ fontFamily: 'Merriweather, Georgia, serif' }}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-3 border-[#D4C862] mr-4"></div>
                    Generating Professional Lesson Plan...
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8 mr-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                    </svg>
                    Generate Comprehensive Lesson Plan
                  </>
                )}
              </button>
              <p className="text-[#082A19] mt-4 text-center text-lg font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                Includes: Multi-day structure • Teacher & Student Notes • STEAM Integration • Trauma-informed practices • MTSS Scaffolding • Assessment tools
              </p>
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-10 p-8 bg-red-50 border-4 border-red-200 rounded-2xl">
              <div className="flex items-start">
                <svg className="w-8 h-8 text-red-500 mr-4 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <div>
                  <p className="text-red-800 font-bold text-xl mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                    Unable to Generate Lesson Plan
                  </p>
                  <p className="text-red-700 text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
