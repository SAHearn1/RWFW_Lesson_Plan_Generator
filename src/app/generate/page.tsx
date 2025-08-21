// src/app/generate/page.tsx - Professional Full-Screen Generator (indeterminate progress + HTML preview)

'use client';

import { useEffect, useRef, useState } from 'react';
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
  'Other',
];

const STANDARDS_SHORTCUTS: Record<string, string> = {
  'georgia standards': 'Georgia Standards of Excellence (GSE)',
  'common core': 'Common Core State Standards (CCSS)',
  ngss: 'Next Generation Science Standards (NGSS)',
  casel: 'CASEL Social-Emotional Learning Standards',
  'national standards': 'Relevant National Content Standards',
  'state standards': 'State Academic Standards for selected grade level and subject',
};

const LOADING_STAGES = [
  { stage: 'initializing', message: 'Initializing Root Work Framework protocol…' },
  { stage: 'standards', message: 'Integrating academic standards and DOK levels…' },
  { stage: 'trauma-informed', message: 'Applying trauma-informed pedagogy principles…' },
  { stage: 'steam', message: 'Designing STEAM integration and project-based components…' },
  { stage: 'mtss', message: 'Creating MTSS scaffolding and differentiation strategies…' },
  { stage: 'assessment', message: 'Developing assessment tools and rubrics…' },
  { stage: 'finalizing', message: 'Finalizing comprehensive lesson plan structure…' },
  // This last one loops while waiting for the API:
  { stage: 'ai', message: 'AI is composing your lesson plan…' },
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
    unitContext: '',
  });

  const [lessonPlanText, setLessonPlanText] = useState<string | null>(null);
  const [htmlUrl, setHtmlUrl] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Progress controller: grows smoothly up to 93% while waiting, then jumps to 100% on finish
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const progressTimerRef = useRef<number | null>(null);
  const stageTimerRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (stageTimerRef.current) {
      window.clearInterval(stageTimerRef.current);
      stageTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const startIndeterminateProgress = () => {
    // progress: smoothly increase until ~93%
    setProgress(4);
    progressTimerRef.current = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 93) return 93;
        const bump = Math.random() * 2 + 0.8; // 0.8–2.8% bumps
        return Math.min(p + bump, 93);
      });
    }, 500);

    // stages: rotate through stages, then stick on the final "AI is composing…" stage while waiting
    let idx = 0;
    setStageIndex(idx);
    stageTimerRef.current = window.setInterval(() => {
      idx = Math.min(idx + 1, LOADING_STAGES.length - 1);
      setStageIndex(idx);
      // Once we reach the "ai" stage, keep it there
      if (idx === LOADING_STAGES.length - 1 && stageTimerRef.current) {
        window.clearInterval(stageTimerRef.current);
        stageTimerRef.current = null;
      }
    }, 1500);
  };

  const finishProgress = () => {
    setProgress(100);
    clearTimers();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubjectChange = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const processLearningObjectives = (objectives: string = '', subjects: string[], gradeLevel: string) => {
    if (!objectives.trim()) return '';
    let processed = objectives;
    const lower = objectives.toLowerCase();
    for (const [shortcut, fullName] of Object.entries(STANDARDS_SHORTCUTS)) {
      if (lower.includes(shortcut)) {
        processed += `\n\nINTEGRATE: Include specific ${fullName} for ${subjects.join(
          ' and '
        )} at grade ${gradeLevel}. Provide actual standard codes and descriptions.`;
      }
    }
    return processed;
  };

  const processSpecialNeeds = (specialNeeds: string = ''): string => {
    if (!specialNeeds.trim()) return '';
    let processed = specialNeeds;
    const lower = specialNeeds.toLowerCase();
    const expansions: Record<string, string> = {
      ell: 'English Language Learners',
      sped: 'Special Education',
      iep: 'Individualized Education Program',
      '504': 'Section 504 accommodations',
      adhd: 'Attention Deficit Hyperactivity Disorder',
      asd: 'Autism Spectrum Disorder',
      ptsd: 'Post-Traumatic Stress Disorder',
    };
    for (const [abbrev, full] of Object.entries(expansions)) {
      if (lower.includes(abbrev)) {
        processed += `\n\nPROVIDE: Specific evidence-based accommodations and supports for ${full}.`;
      }
    }
    return processed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError('');
    setLessonPlanText(null);
    setHtmlUrl(null);
    setProgress(0);
    setStageIndex(0);
    startIndeterminateProgress();

    // Validate required
    const missing: string[] = [];
    if (!formData.subjects.length) missing.push('Subject Area(s)');
    if (!formData.gradeLevel?.trim()) missing.push('Grade Level');
    if (!formData.topic?.trim()) missing.push('Lesson Topic');
    if (!formData.duration?.trim()) missing.push('Duration per Day');
    if (!formData.numberOfDays?.trim()) missing.push('Number of Days');

    if (missing.length) {
      setIsGenerating(false);
      clearTimers();
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
        learningObjectives: processLearningObjectives(
          formData.learningObjectives,
          formData.subjects,
          formData.gradeLevel
        ),
        specialNeeds: processSpecialNeeds(formData.specialNeeds),
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
        includeResources: false, // keep token budget focused on complete lesson plan
        gradualRelease: true,
        specialInstructions:
          'Generate a comprehensive plan following the Root Work Framework with mandatory [Teacher Note:] and [Student Note:] on each component. No placeholders. No meta comments. No “would continue”. Complete all sections.',
      };

      const response = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enhancedPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || `Request failed with status ${response.status}`);
      }

      if (!data?.lessonPlan) {
        throw new Error('No lesson plan generated. Please try again.');
      }

      // Text for copy
      const planText =
        typeof data.lessonPlan === 'string'
          ? data.lessonPlan
          : JSON.stringify(data.lessonPlan, null, 2);
      setLessonPlanText(planText);

      // If server provided a full HTML doc, show it in an iframe
      if (data.htmlVersion && typeof data.htmlVersion === 'string') {
        const blob = new Blob([data.htmlVersion], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        setHtmlUrl(url);
      }

      finishProgress();
    } catch (err: any) {
      clearTimers();
      setError(err?.message || 'Failed to generate lesson plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAsHTML = () => {
    if (!lessonPlanText) return;
    // Prefer the server-styled HTML if present
    if (htmlUrl) {
      const link = document.createElement('a');
      link.href = htmlUrl;
      link.download = `RWFW_${formData.topic.replace(/[^a-z0-9]/gi, '_')}_Grade${
        formData.gradeLevel
      }_${formData.numberOfDays}days.html`;
      link.click();
      return;
    }
    // Fallback: raw text inside minimal HTML
    const minimal = `<!DOCTYPE html><meta charset="utf-8"><pre>${(lessonPlanText || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}</pre>`;
    const blob = new Blob([minimal], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RWFW_${formData.topic.replace(/[^a-z0-9]/gi, '_')}_Grade${
      formData.gradeLevel
    }_${formData.numberOfDays}days.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsRTF = () => {
    if (!lessonPlanText) return;
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
\\f0\\fs18${lessonPlanText
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\par\n')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}') }\\par
\\par
\\cf2 Generated by Root Work Framework — ${new Date().toLocaleDateString()}
}`;
    const blob = new Blob([rtf], { type: 'application/rtf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RWFW_${formData.topic.replace(/[^a-z0-9]/gi, '_')}_Grade${
      formData.gradeLevel
    }_${formData.numberOfDays}days.rtf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    if (!lessonPlanText) return;
    navigator.clipboard.writeText(lessonPlanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Loading screen
  if (isGenerating) {
    const current = LOADING_STAGES[stageIndex] ?? LOADING_STAGES[LOADING_STAGES.length - 1];
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F2F4CA] to-[#082A19] flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full mx-6 border-4 border-[#D4C862]">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-[#082A19] rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="animate-spin">
                <svg className="w-12 h-12 text-[#D4C862]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" />
                </svg>
              </div>
            </div>
            <h2
              className="text-3xl font-bold text-[#082A19] mb-3"
              style={{ fontFamily: 'Merriweather, Georgia, serif' }}
            >
              Generating Your Lesson Plan
            </h2>
            <p className="text-[#3B523A] text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
              Please keep this tab open while we build your comprehensive plan.
            </p>
          </div>

          {/* Progress Bar (indeterminate until finalize) */}
          <div className="mb-8">
            <div className="w-full bg-[#F2F4CA] rounded-full h-4 border-2 border-[#3B523A] overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#D4C862] to-[#082A19] h-full transition-all duration-500 ease-out"
                style={{ width: `${Math.round(progress)}%` }}
              />
            </div>
            <div
              className="flex justify-between mt-2 text-sm text-[#3B523A]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Stage message */}
          <div className="text-center">
            <div className="bg-[#F2F4CA] border-2 border-[#D4C862] rounded-xl p-6">
              <h3
                className="text-xl font-semibold text-[#082A19] mb-2"
                style={{ fontFamily: 'Merriweather, Georgia, serif' }}
              >
                {current.stage === 'ai' ? 'Finalizing with AI' : 'Step in progress'}
              </h3>
              <p className="text-[#2B2B2B] text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
                {current.message}
                {current.stage === 'ai' && (
                  <span className="inline-block animate-pulse ml-1">•••</span>
                )}
              </p>
            </div>
          </div>

          {/* Summary details */}
          <div className="mt-8 p-4 bg-[#F2F4CA]/50 rounded-xl border border-[#3B523A]">
            <h4
              className="font-semibold text-[#082A19] mb-2"
              style={{ fontFamily: 'Merriweather, Georgia, serif' }}
            >
              Generating:
            </h4>
            <div
              className="text-sm text-[#2B2B2B] space-y-1"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <div>
                <strong>Topic:</strong> {formData.topic}
              </div>
              <div>
                <strong>Subjects:</strong> {formData.subjects.join(', ')}
              </div>
              <div>
                <strong>Grade:</strong> {formData.gradeLevel}
              </div>
              <div>
                <strong>Duration:</strong> {formData.numberOfDays} days × {formData.duration}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Result view
  if ((lessonPlanText || htmlUrl) && !isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F2F4CA] to-white">
        <header className="bg-[#082A19] text-white shadow-xl">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-[#D4C862] rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-[#082A19]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" />
                  </svg>
                </div>
                <div>
                  <h1
                    className="text-2xl font-bold"
                    style={{ fontFamily: 'Merriweather, Georgia, serif' }}
                  >
                    Root Work Framework — Lesson Plan
                  </h1>
                  <p className="text-[#D4C862] text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {formData.subjects.join(' + ')} • Grade {formData.gradeLevel} •{' '}
                    {formData.numberOfDays} days
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => {
                    setLessonPlanText(null);
                    setHtmlUrl(null);
                    setError('');
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#3B523A] hover:bg-[#001C10] text-white rounded-lg transition-colors font-medium"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <span>New Lesson</span>
                </button>

                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#3B523A] hover:bg-[#001C10] text-white rounded-lg transition-colors font-medium"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>

                <button
                  onClick={downloadAsHTML}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#D4C862] hover:bg-[#96812A] text-[#082A19] rounded-lg transition-colors font-semibold"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <span>Download HTML</span>
                </button>

                <button
                  onClick={downloadAsRTF}
                  className="flex items-center space-x-2 px-4 py-2 bg-white text-[#082A19] border-2 border-[#D4C862] hover:bg-[#F2F4CA] rounded-lg transition-colors font-medium"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <span>Word (RTF)</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-[#D4C862]">
            {htmlUrl ? (
              <iframe
                src={htmlUrl}
                className="w-full"
                style={{ height: 'calc(100vh - 220px)', border: 0, borderRadius: '1rem' }}
              />
            ) : (
              <pre
                className="whitespace-pre-wrap text-sm text-[#2B2B2B] leading-relaxed font-sans bg-[#F2F4CA]/20 p-6 rounded-xl border border-[#3B523A]"
                style={{ fontFamily: 'JetBrains Mono, Consolas, monospace' }}
              >
                {lessonPlanText}
              </pre>
            )}
          </div>

          {error && (
            <div className="mt-6 p-6 bg-red-50 border-4 border-red-200 rounded-2xl">
              <p
                className="text-red-800 font-bold text-xl mb-2"
                style={{ fontFamily: 'Merriweather, Georgia, serif' }}
              >
                Issue
              </p>
              <p className="text-red-700 text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
                {error}
              </p>
            </div>
          )}
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
            <Link href="/" className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-[#D4C862] rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-[#082A19]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" />
                </svg>
              </div>
              <div>
                <h1
                  className="text-2xl font-bold"
                  style={{ fontFamily: 'Merriweather, Georgia, serif' }}
                >
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

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-3xl shadow-2xl p-12 border-4 border-[#D4C862]">
          <div className="text-center mb-12">
            <h2
              className="text-4xl font-bold text-[#082A19] mb-4"
              style={{ fontFamily: 'Merriweather, Georgia, serif' }}
            >
              Create Comprehensive Lesson Plan
            </h2>
            <p
              className="text-xl text-[#3B523A] leading-relaxed max-w-3xl mx-auto"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Generate multi-day, trauma-informed lesson plans with STEAM integration, MTSS scaffolding,
              and comprehensive assessment tools using the Root Work Framework.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Subjects */}
              <div className="lg:col-span-2">
                <label
                  className="block text-xl font-bold text-[#082A19] mb-4"
                  style={{ fontFamily: 'Merriweather, Georgia, serif' }}
                >
                  Subject Area(s) <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-6 rounded-2xl bg-[#F2F4CA]/30 border border-[#3B523A]">
                  {SUBJECTS.map((subject) => (
                    <label
                      key={subject}
                      className="flex items-center space-x-3 text-sm cursor-pointer hover:bg-white/70 p-3 rounded-lg transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.subjects.includes(subject)}
                        onChange={() => handleSubjectChange(subject)}
                        className="w-5 h-5 rounded border-[#3B523A] text-[#D4C862] focus:ring-[#D4C862] focus:ring-2"
                      />
                      <span
                        className="text-[#2B2B2B] font-medium"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {subject}
                      </span>
                    </label>
                  ))}
                </div>
                <p
                  className="text-[#3B523A] mt-3 text-lg"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <span className="font-bold text-[#082A19]">{formData.subjects.length}</span>{' '}
                  selected
                  {formData.subjects.length > 0 && `: ${formData.subjects.join(', ')}`}
                </p>
              </div>

              {/* Grade Level */}
              <div>
                <label
                  className="block text-xl font-bold text-[#082A19] mb-4"
                  style={{ fontFamily: 'Merriweather, Georgia, serif' }}
                >
                  Grade Level <span className="text-red-600">*</span>
                </label>
                <select
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 text-lg border border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  required
                >
                  <option value="">Choose Grade Level</option>
                  <option value="PreK">Pre-K</option>
                  <option value="K">Kindergarten</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={String(i + 1)}>
                      Grade {i + 1}
                    </option>
                  ))}
                  <option value="Mixed">Mixed Ages</option>
                </select>
              </div>

              {/* Number of Days */}
              <div>
                <label
                  className="block text-xl font-bold text-[#082A19] mb-4"
                  style={{ fontFamily: 'Merriweather, Georgia, serif' }}
                >
                  Number of Days <span className="text-red-600">*</span>
                </label>
                <select
                  name="numberOfDays"
                  value={formData.numberOfDays}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 text-lg border border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  required
                >
                  <option value="">Select Days</option>
                  {[3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map((days) => (
                    <option key={days} value={String(days)}>
                      {days} {days === 1 ? 'day' : 'days'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div>
                <label
                  className="block text-xl font-bold text-[#082A19] mb-4"
                  style={{ fontFamily: 'Merriweather, Georgia, serif' }}
                >
                  Lesson Topic <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder="e.g., Photosynthesis and Plant Growth, Civil Rights Movement"
                  className="w-full px-6 py-4 text-lg border border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B]"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                  required
                />
              </div>

              {/* Duration */}
              <div>
                <label
                  className="block text-xl font-bold text-[#082A19] mb-4"
                  style={{ fontFamily: 'Merriweather, Georgia, serif' }}
                >
                  Duration per Day <span className="text-red-600">*</span>
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 text-lg border border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B]"
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
              <div>
                <label
                  className="block text-xl font-bold text-[#082A19] mb-4"
                  style={{ fontFamily: 'Merriweather, Georgia, serif' }}
                >
                  Learning Objectives & Standards
                  <span className="text-[#3B523A] text-lg font-normal ml-3">(Optional)</span>
                </label>
                <textarea
                  name="learningObjectives"
                  value={formData.learningObjectives}
                  onChange={handleInputChange}
                  placeholder="Type 'Georgia Standards', 'Common Core', or 'NGSS' to auto-integrate; or write your objectives."
                  rows={5}
                  className="w-full px-6 py-4 text-lg border border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B] resize-vertical"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              <div>
                <label
                  className="block text-xl font-bold text-[#082A19] mb-4"
                  style={{ fontFamily: 'Merriweather, Georgia, serif' }}
                >
                  Unit Context
                  <span className="text-[#3B523A] text-lg font-normal ml-3">(Optional)</span>
                </label>
                <textarea
                  name="unitContext"
                  value={formData.unitContext}
                  onChange={handleInputChange}
                  placeholder="What larger unit does this connect to? What have students done previously?"
                  rows={3}
                  className="w-full px-6 py-4 text-lg border border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B] resize-vertical"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              <div>
                <label
                  className="block text-xl font-bold text-[#082A19] mb-4"
                  style={{ fontFamily: 'Merriweather, Georgia, serif' }}
                >
                  Special Considerations & Accommodations
                  <span className="text-[#3B523A] text-lg font-normal ml-3">(Optional)</span>
                </label>
                <textarea
                  name="specialNeeds"
                  value={formData.specialNeeds}
                  onChange={handleInputChange}
                  placeholder="Smart shortcuts: 'ELL', 'IEP', 'ADHD', 'autism', 'trauma-informed'—we’ll expand with evidence-based supports."
                  rows={4}
                  className="w-full px-6 py-4 text-lg border border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B] resize-vertical"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>

              <div>
                <label
                  className="block text-xl font-bold text-[#082A19] mb-4"
                  style={{ fontFamily: 'Merriweather, Georgia, serif' }}
                >
                  Available Resources & Materials
                  <span className="text-[#3B523A] text-lg font-normal ml-3">(Optional)</span>
                </label>
                <textarea
                  name="availableResources"
                  value={formData.availableResources}
                  onChange={handleInputChange}
                  placeholder="Garden space, tech lab, manipulatives, community partners, field trips, etc."
                  rows={4}
                  className="w-full px-6 py-4 text-lg border border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B] resize-vertical"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#F2F4CA] to-[#D4C862]/40 p-10 rounded-3xl border-4 border-[#D4C862]">
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-[#082A19] hover:bg-[#001C10] disabled:bg-[#3B523A] text-white font-bold py-6 px-10 rounded-2xl transition-all duration-300 flex items-center justify-center text-2xl shadow-2xl hover:shadow-3xl"
                style={{ fontFamily: 'Merriweather, Georgia, serif' }}
              >
                Generate Comprehensive Lesson Plan
              </button>
              <p
                className="text-[#082A19] mt-4 text-center text-lg font-semibold"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Includes: 5 Rs • Teacher & Student Notes • STEAM • MTSS • Assessments
              </p>
            </div>
          </form>

          {error && (
            <div className="mt-10 p-8 bg-red-50 border-4 border-red-200 rounded-2xl">
              <div className="flex items-start">
                <svg
                  className="w-8 h-8 text-red-500 mr-4 flex-shrink-0 mt-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p
                    className="text-red-800 font-bold text-xl mb-2"
                    style={{ fontFamily: 'Merriweather, Georgia, serif' }}
                  >
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
