// src/app/generate/page.tsx - Show formatted HTML (with Raw toggle)

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
  'English Language Arts','Mathematics','Science','Social Studies','STEAM (Integrated)',
  'Special Education','Agriculture','Environmental Science','Life Skills','Social-Emotional Learning',
  'Art','Music','Physical Education','Career & Technical Education','World Languages','Other'
];

const STANDARDS_SHORTCUTS: Record<string, string> = {
  'georgia standards': 'Georgia Standards of Excellence (GSE)',
  'common core': 'Common Core State Standards (CCSS)',
  'ngss': 'Next Generation Science Standards (NGSS)',
  'casel': 'CASEL Social-Emotional Learning Standards',
  'national standards': 'Relevant National Content Standards',
  'state standards': 'State Academic Standards for selected grade level and subject'
};

const LOADING_STAGES = [
  { stage: 'initializing', message: 'Initializing Root Work Framework protocol...', duration: 800 },
  { stage: 'standards', message: 'Integrating academic standards and DOK levels...', duration: 900 },
  { stage: 'trauma-informed', message: 'Applying trauma-informed pedagogy principles...', duration: 900 },
  { stage: 'steam', message: 'Designing STEAM integration and project-based components...', duration: 900 },
  { stage: 'mtss', message: 'Creating MTSS scaffolding and differentiation strategies...', duration: 800 },
  { stage: 'assessment', message: 'Developing assessment tools and rubrics...', duration: 700 },
  { stage: 'finalizing', message: 'Finalizing comprehensive lesson plan structure...', duration: 600 }
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

  const [rawPlan, setRawPlan] = useState<string>('');      // cleaned plain text
  const [htmlPlan, setHtmlPlan] = useState<string>('');    // fully formatted HTML
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [currentStage, setCurrentStage] = useState(0);
  const [showForm, setShowForm] = useState(true);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'formatted'|'raw'>('formatted');

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
    let i = 0;
    const tick = () => {
      if (i < LOADING_STAGES.length) {
        setCurrentStage(i);
        setTimeout(() => { i++; tick(); }, LOADING_STAGES[i].duration);
      }
    };
    tick();
  };

  const processLearningObjectives = (objectives = '', subjects: string[], gradeLevel: string): string => {
    if (!objectives.trim()) return '';
    let processed = objectives;
    const lower = objectives.toLowerCase();
    for (const [shortcut, full] of Object.entries(STANDARDS_SHORTCUTS)) {
      if (lower.includes(shortcut)) {
        processed += `\n\nINTEGRATE: Include specific ${full} for ${subjects.join(' and ')} at grade ${gradeLevel}. Provide actual standard codes and descriptions.`;
      }
    }
    return processed;
  };

  const processSpecialNeeds = (specialNeeds = ''): string => {
    if (!specialNeeds.trim()) return '';
    let processed = specialNeeds;
    const lower = specialNeeds.toLowerCase();
    const expansions: Record<string, string> = {
      'ell': 'English Language Learners',
      'sped': 'Special Education',
      'iep': 'Individualized Education Program',
      '504': 'Section 504 accommodations',
      'adhd': 'Attention Deficit Hyperactivity Disorder',
      'asd': 'Autism Spectrum Disorder',
      'ptsd': 'Post-Traumatic Stress Disorder'
    };
    for (const [abbr, full] of Object.entries(expansions)) {
      if (lower.includes(abbr)) {
        processed += `\n\nPROVIDE: Specific evidence-based accommodations and supports for ${full}.`;
      }
    }
    return processed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError('');
    setCurrentStage(0);
    simulateLoadingStages();

    const missing: string[] = [];
    if (!formData.subjects.length) missing.push('Subject Area(s)');
    if (!formData.gradeLevel?.trim()) missing.push('Grade Level');
    if (!formData.topic?.trim()) missing.push('Lesson Topic');
    if (!formData.duration?.trim()) missing.push('Duration per Day');
    if (!formData.numberOfDays?.trim()) missing.push('Number of Days');

    if (missing.length) {
      setIsGenerating(false);
      setError(`Please complete these required fields: ${missing.join(', ')}`);
      return;
    }

    try {
      const enhancedPayload = {
        subject: formData.subjects.join(', '),
        gradeLevel: formData.gradeLevel.trim(),
        topic: formData.topic.trim(),
        duration: formData.duration.trim(),
        numberOfDays: formData.numberOfDays.trim(),
        learningObjectives: processLearningObjectives(formData.learningObjectives || '', formData.subjects, formData.gradeLevel),
        specialNeeds: processSpecialNeeds(formData.specialNeeds || ''),
        availableResources: formData.availableResources?.trim() || '',
        location: formData.location || 'Savannah, Georgia',
        unitContext: formData.unitContext || '',
        lessonType: 'comprehensive_multi_day',
        requireTeacherNotes: true,
        requireStudentNotes: true,
        includeTraumaInformed: true,
        includeSTEAM: true,
        includeMTSS: true,
        includeAssessment: true,
        includeResources: true,
        gradualRelease: true,
        specialInstructions: `Generate a comprehensive ${formData.numberOfDays}-day lesson plan following the Root Work Framework master prompt structure. Include mandatory [Teacher Note:] and [Student Note:] for every lesson component. Structure each day with: Opening, I Do, We Do, You Do Together, You Do Alone, Closing. Include STEAM integration, trauma-informed practices, MTSS supports, assessment tools, and resource appendix. Use healing-centered, second-person voice for students.`
      };

      const response = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enhancedPayload),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data?.error || `Request failed with status ${response.status}`);

      if (!data?.lessonPlan && !data?.htmlVersion) {
        throw new Error('No lesson plan generated. Please try again.');
      }

      setRawPlan(String(data.lessonPlan || ''));
      setHtmlPlan(String(data.htmlVersion || ''));
      setShowForm(false);
      setViewMode('formatted');
    } catch (err: any) {
      setError(err?.message || 'Failed to generate lesson plan.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAsHTML = () => {
    const html = htmlPlan || '';
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RWFW_${formData.topic.replace(/[^a-z0-9]/gi, '_')}_Grade${formData.gradeLevel}_${formData.numberOfDays}days.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsRTF = () => {
    const txt = rawPlan || '';
    if (!txt) return;
    const rtf = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0\\fswiss Arial;}{\\f1\\froman Times New Roman;}}
{\\colortbl;\\red8\\green42\\blue25;\\red212\\green200\\blue98;}
\\f1\\fs28\\cf1\\b ROOT WORK FRAMEWORK LESSON PLAN\\b0\\par
\\par
\\fs20 Topic: ${formData.topic}\\par
Subject(s): ${formData.subjects.join(', ')}\\par
Grade Level: ${formData.gradeLevel}\\par
Duration: ${formData.duration} over ${formData.numberOfDays} days\\par
\\par
\\f0\\fs18${txt.replace(/\\/g,'\\\\').replace(/\{/g,'\\{').replace(/\}/g,'\\}').replace(/\n/g,'\\par\n')}\\par
\\par
\\cf2 Generated by Root Work Framework — ${new Date().toLocaleDateString()}
}`;
    const blob = new Blob([rtf], { type: 'application/rtf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RWFW_${formData.topic.replace(/[^a-z0-9]/gi, '_')}_Grade${formData.gradeLevel}_${formData.numberOfDays}days.rtf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    const text = viewMode === 'formatted' ? (htmlPlan || '') : (rawPlan || '');
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Loading screen
  if (isGenerating) {
    const stage = LOADING_STAGES[currentStage] || LOADING_STAGES[0];
    const progress = Math.round(((currentStage + 1) / LOADING_STAGES.length) * 100);
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F2F4CA] to-[#082A19] flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-2xl w-full mx-6 border-4 border-[#D4C862]">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#082A19]" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
              Generating Your Lesson Plan
            </h2>
            <p className="text-[#3B523A] mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              {stage.message}
            </p>
          </div>
          <div className="w-full bg-[#F2F4CA] rounded-full h-4 border-2 border-[#3B523A] overflow-hidden">
            <div className="bg-gradient-to-r from-[#D4C862] to-[#082A19] h-4 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-right mt-2 text-sm text-[#3B523A]">{progress}%</p>
        </div>
      </div>
    );
  }

  // Plan display
  if (!showForm && (htmlPlan || rawPlan)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F2F4CA] to-white">
        <header className="bg-[#082A19] text-white shadow-xl">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#D4C862] rounded-full" />
                <div>
                  <h1 className="text-2xl font-bold" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                    {`Root Work Framework: ${formData.topic}`}
                  </h1>
                  <p className="text-[#D4C862] text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {formData.subjects.join(' + ')} • Grade {formData.gradeLevel} • {formData.numberOfDays} days
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-[#3B523A] hover:bg-[#001C10] rounded-lg"
                >
                  New Lesson
                </button>
                <button
                  onClick={() => setViewMode(viewMode === 'formatted' ? 'raw' : 'formatted')}
                  className="px-4 py-2 bg-[#3B523A] hover:bg-[#001C10] rounded-lg"
                >
                  {viewMode === 'formatted' ? 'View Raw' : 'View Formatted'}
                </button>
                <button onClick={copyToClipboard} className="px-4 py-2 bg-[#3B523A] hover:bg-[#001C10] rounded-lg">
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={downloadAsHTML} className="px-4 py-2 bg-[#D4C862] text-[#082A19] font-semibold rounded-lg">
                  Download HTML
                </button>
                <button onClick={downloadAsRTF} className="px-4 py-2 bg-white text-[#082A19] border-2 border-[#D4C862] rounded-lg">
                  Word Doc
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl shadow-xl p-0 border-2 border-[#D4C862]">
            {viewMode === 'formatted' ? (
              <iframe
                title="RWFW Lesson Plan"
                style={{ width: '100%', height: '80vh', border: '0', borderRadius: '1rem' }}
                srcDoc={htmlPlan}
              />
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-[#2B2B2B] leading-relaxed p-6" style={{ fontFamily: 'JetBrains Mono, Consolas, monospace' }}>
                {rawPlan}
              </pre>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Form view
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2F4CA] to-white">
      <header className="bg-[#082A19] text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="font-semibold text-[#D4C862]">← Back to Home</Link>
            <h1 className="text-2xl font-bold">Root Work Framework — Generator</h1>
            <div />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white rounded-3xl shadow-2xl p-10 border-4 border-[#D4C862]">
          <h2 className="text-3xl font-bold text-[#082A19] mb-6" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
            Create Comprehensive Lesson Plan
          </h2>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Subjects */}
            <div>
              <label className="block text-lg font-bold text-[#082A19] mb-3">Subject Area(s) *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 border-2 border-[#3B523A] rounded-xl bg-[#F2F4CA]/30">
                {SUBJECTS.map(subject => (
                  <label key={subject} className="flex items-center space-x-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.subjects.includes(subject)}
                      onChange={() => handleSubjectChange(subject)}
                      className="w-4 h-4 rounded border-[#3B523A]"
                    />
                    <span>{subject}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Grade / Days */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-bold text-[#082A19] mb-3">Grade Level *</label>
                <select
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-lg"
                  required
                >
                  <option value="">Choose Grade</option>
                  <option value="PreK">Pre-K</option>
                  <option value="K">Kindergarten</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={String(i+1)}>Grade {i+1}</option>
                  ))}
                  <option value="Mixed">Mixed Ages</option>
                </select>
              </div>
              <div>
                <label className="block text-lg font-bold text-[#082A19] mb-3">Number of Days *</label>
                <select
                  name="numberOfDays"
                  value={formData.numberOfDays}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-lg"
                  required
                >
                  <option value="">Select Days</option>
                  {[3,4,5,6,7,8,9,10,15,20].map(d => <option key={d} value={String(d)}>{d} {d===1?'day':'days'}</option>)}
                </select>
              </div>
            </div>

            {/* Topic / Duration */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-lg font-bold text-[#082A19] mb-3">Lesson Topic *</label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder="e.g., Photosynthesis, Civil Rights Movement"
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-lg font-bold text-[#082A19] mb-3">Duration per Day *</label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-lg"
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
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-bold text-[#082A19] mb-2">Learning Objectives & Standards (optional)</label>
                <textarea
                  name="learningObjectives"
                  value={formData.learningObjectives}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-lg"
                  placeholder="Shortcuts: 'Georgia Standards', 'Common Core', 'NGSS', 'CASEL' to auto-instruct for codes."
                />
              </div>
              <div>
                <label className="block text-lg font-bold text-[#082A19] mb-2">Unit Context (optional)</label>
                <textarea
                  name="unitContext"
                  value={formData.unitContext}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-lg"
                  placeholder="Where this lesson fits in the broader unit."
                />
              </div>
              <div>
                <label className="block text-lg font-bold text-[#082A19] mb-2">Special Considerations & Accommodations (optional)</label>
                <textarea
                  name="specialNeeds"
                  value={formData.specialNeeds}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-lg"
                  placeholder="Shortcuts: ELL, IEP, ADHD, autism, trauma-informed…"
                />
              </div>
              <div>
                <label className="block text-lg font-bold text-[#082A19] mb-2">Available Resources & Materials (optional)</label>
                <textarea
                  name="availableResources"
                  value={formData.availableResources}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-lg"
                  placeholder="Garden, lab, devices, community partners…"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full bg-[#082A19] hover:bg-[#001C10] text-white font-bold py-4 px-6 rounded-xl border-2 border-[#D4C862]"
            >
              {isGenerating ? 'Generating…' : 'Generate Comprehensive Lesson Plan'}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
