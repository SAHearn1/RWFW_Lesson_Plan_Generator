// src/app/generate/page.tsx
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
  'ngss': 'Next Generation Science Standards (NGSS)',
  'casel': 'CASEL Social-Emotional Learning Standards',
  'national standards': 'Relevant National Content Standards',
  'state standards': 'State Academic Standards for selected grade level and subject',
};

// Pedagogy-based loading messages (loops until API returns)
const PEDAGOGY_STAGES = [
  'Rooting in Relationships — building safety and belonging.',
  'Strengthening Routines — predictable structure reduces anxiety.',
  'Lifting Relevance — connecting content to lived experience.',
  'Increasing Rigor — modeling, guided practice, and application.',
  'Reflecting for Growth — metacognition and celebration of progress.',
  'Weaving MTSS — proactive supports for every learner.',
  'Embedding SEL — CASEL competencies integrated with academics.',
  'Healing-Centered Practices — voice, choice, and dignity.',
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

  const [lessonPlanHtml, setLessonPlanHtml] = useState<string | null>(null);
  const [rawLesson, setRawLesson] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Loader progress (capped at 88% until API returns)
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const progressTimer = useRef<NodeJS.Timeout | null>(null);
  const stageTimer = useRef<NodeJS.Timeout | null>(null);

  const startPedagogyLoader = () => {
    // progress
    if (progressTimer.current) clearInterval(progressTimer.current);
    setProgress(0);
    progressTimer.current = setInterval(() => {
      setProgress((p) => (p < 88 ? p + 1 : 88));
    }, 120);

    // stages
    if (stageTimer.current) clearInterval(stageTimer.current);
    setStageIndex(0);
    stageTimer.current = setInterval(() => {
      setStageIndex((i) => (i + 1) % PEDAGOGY_STAGES.length);
    }, 1800);
  };

  const stopPedagogyLoader = (complete = false) => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    if (stageTimer.current) clearInterval(stageTimer.current);
    if (complete) setProgress(100);
  };

  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
      if (stageTimer.current) clearInterval(stageTimer.current);
    };
  }, []);

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

  const processLearningObjectives = (objectives: string = '', subjects: string[], gradeLevel: string): string => {
    if (!objectives.trim()) return '';
    let processed = objectives;
    const lowerObjectives = objectives.toLowerCase();
    for (const [shortcut, fullName] of Object.entries(STANDARDS_SHORTCUTS)) {
      if (lowerObjectives.includes(shortcut)) {
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
    setError('');
    setLessonPlanHtml(null);
    setRawLesson(null);
    setIsGenerating(true);
    startPedagogyLoader();

    // Validate
    const missing: string[] = [];
    if (!formData.subjects.length) missing.push('Subject Area(s)');
    if (!formData.gradeLevel?.trim()) missing.push('Grade Level');
    if (!formData.topic?.trim()) missing.push('Lesson Topic');
    if (!formData.duration?.trim()) missing.push('Duration');
    if (!formData.numberOfDays?.trim()) missing.push('Number of Days');

    if (missing.length) {
      setIsGenerating(false);
      stopPedagogyLoader();
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
        // generation flags
        lessonType: 'comprehensive_multi_day',
        requireTeacherNotes: true,
        requireStudentNotes: true,
        includeTraumaInformed: true,
        includeSTEAM: true,
        includeMTSS: true,
        includeAssessment: true,
        includeResources: true,
        gradualRelease: true,
        specialInstructions:
          `Generate a comprehensive ${formData.numberOfDays}-day lesson using the Root Work Framework. ` +
          `Use a clean heading hierarchy; DO NOT write the words "LEVEL I HEADING" etc. in the output; just output the heading text. ` +
          `For tables, output Markdown pipe tables with headers and rows (no preface text).`,
      };

      const res = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enhancedPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `Request failed with status ${res.status}`);
      }

      // The API now returns both plain text and htmlVersion; render the styled HTML
      if (data?.htmlVersion) {
        setLessonPlanHtml(data.htmlVersion as string);
      }
      if (data?.lessonPlan) {
        setRawLesson(typeof data.lessonPlan === 'string' ? data.lessonPlan : JSON.stringify(data.lessonPlan, null, 2));
      }

      stopPedagogyLoader(true);
    } catch (err: any) {
      stopPedagogyLoader();
      setError(err?.message || 'Failed to generate lesson plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!rawLesson) return;
    navigator.clipboard.writeText(rawLesson);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Loading screen (pedagogy-based)
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F2F4CA] to-[#082A19] flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-2xl w-full border-4 border-[#D4C862]">
          <div className="flex items-center gap-4 mb-6">
            <img src="/logo.png" alt="Root Work Framework" className="w-12 h-12 rounded-full border-2 border-[#D4C862]" />
            <div>
              <h2 className="text-2xl font-extrabold text-[#082A19]" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                Growing a Rooted Lesson
              </h2>
              <p className="text-[#3B523A]" style={{ fontFamily: 'Inter, sans-serif' }}>
                Healing-centered pedagogy in progress…
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="w-full bg-[#F2F4CA] rounded-full h-3 border border-[#3B523A] overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#D4C862] to-[#082A19] h-3"
                style={{ width: `${progress}%`, transition: 'width 600ms ease' }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-[#3B523A]" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span>Preparing plan</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Pedagogy stage message */}
          <div className="bg-[#F2F4CA] border-2 border-[#D4C862] rounded-xl p-4 text-[#082A19] mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
            {PEDAGOGY_STAGES[stageIndex]}
          </div>

          <div className="text-xs text-[#3B523A]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Topic: <b>{formData.topic || '—'}</b> &nbsp;•&nbsp; Grade: <b>{formData.gradeLevel || '—'}</b> &nbsp;•&nbsp; Duration:{' '}
            <b>
              {formData.numberOfDays || '—'} day(s) × {formData.duration || '—'}
            </b>
          </div>
        </div>
      </div>
    );
  }

  // Styled lesson view
  if (lessonPlanHtml) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F2F4CA] to-white">
        <header className="bg-[#082A19] text-white">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Root Work Framework" className="w-10 h-10 rounded-full border-2 border-[#D4C862] bg-white" />
              <div>
                <div className="text-xl font-extrabold" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  {formData.topic || 'Root Work Framework Lesson Plan'}
                </div>
                <div className="text-[#D4C862] text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {formData.subjects.join(' + ') || '—'} • Grade {formData.gradeLevel || '—'} • {formData.numberOfDays || '—'} days
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3" style={{ fontFamily: 'Inter, sans-serif' }}>
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-[#3B523A] hover:bg-[#001C10] rounded-lg font-medium"
              >
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
              <button
                onClick={() => {
                  setLessonPlanHtml(null);
                  setRawLesson(null);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium"
              >
                New Lesson
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Render the styled HTML returned by the API */}
          <iframe
            title="Root Work Framework Lesson Plan"
            srcDoc={lessonPlanHtml}
            className="w-full min-h-[80vh] bg-white rounded-2xl border-2 border-[#D4C862] shadow-xl"
          />
        </div>
      </div>
    );
  }

  // Form view
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2F4CA] to-white">
      <header className="bg-[#082A19] text-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Root Work Framework" className="w-10 h-10 rounded-full border-2 border-[#D4C862]" />
            <div>
              <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                Root Work Framework
              </h1>
              <p className="text-[#D4C862] text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                Professional Lesson Planning
              </p>
            </div>
          </Link>
          <nav style={{ fontFamily: 'Inter, sans-serif' }}>
            <Link href="/" className="text-[#D4C862] hover:text-white font-medium">
              ← Back to Home
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white rounded-3xl shadow-2xl p-10 border-4 border-[#D4C862]">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-extrabold text-[#082A19] mb-3" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
              Create Comprehensive Lesson Plan
            </h2>
            <p className="text-lg text-[#3B523A]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Multi-day structure • Teacher & Student Notes • STEAM • Trauma-informed • MTSS • Assessments
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Subjects */}
            <div>
              <label className="block text-xl font-bold text-[#082A19] mb-3" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                Subject Area(s) <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 border-2 border-[#3B523A] rounded-2xl bg-[#F2F4CA]/30">
                {SUBJECTS.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.subjects.includes(s)}
                      onChange={() => handleSubjectChange(s)}
                      className="w-5 h-5 rounded border-[#3B523A] text-[#D4C862] focus:ring-[#D4C862]"
                    />
                    <span className="text-[#2B2B2B]" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {s}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-[#3B523A] mt-2 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                {formData.subjects.length ? `Selected: ${formData.subjects.join(', ')}` : 'Choose one or more subjects'}
              </p>
            </div>

            {/* Grade / Days */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-3" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Grade Level <span className="text-red-600">*</span>
                </label>
                <select
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl bg-white"
                  required
                >
                  <option value="">Choose Grade Level</option>
                  <option value="PreK">Pre-K</option>
                  <option value="K">Kindergarten</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>
                      Grade {i + 1}
                    </option>
                  ))}
                  <option value="Mixed">Mixed Ages</option>
                </select>
              </div>
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-3" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Number of Days <span className="text-red-600">*</span>
                </label>
                <select
                  name="numberOfDays"
                  value={formData.numberOfDays}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl bg-white"
                  required
                >
                  <option value="">Select Days</option>
                  {[3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map((d) => (
                    <option key={d} value={String(d)}>
                      {d} {d === 1 ? 'day' : 'days'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Topic / Duration */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-3" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Lesson Topic <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder="e.g., Photosynthesis and Plant Growth"
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-3" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Duration per Day <span className="text-red-600">*</span>
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl bg-white"
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

            {/* Optional details */}
            <div className="grid gap-6">
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Learning Objectives & Standards (optional)
                </label>
                <textarea
                  name="learningObjectives"
                  value={formData.learningObjectives}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Smart shortcuts: 'Georgia Standards', 'Common Core', 'NGSS' to auto-integrate specific standards."
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Special Considerations & Accommodations (optional)
                </label>
                <textarea
                  name="specialNeeds"
                  value={formData.specialNeeds}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Shortcuts: ELL, IEP, ADHD, autism… (auto-expands with evidence-based supports)"
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Available Resources & Materials (optional)
                </label>
                <textarea
                  name="availableResources"
                  value={formData.availableResources}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Garden, lab, devices, community partners, field trips…"
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="bg-gradient-to-r from-[#F2F4CA] to-[#D4C862]/40 p-8 rounded-2xl border-4 border-[#D4C862]">
              <button
                type="submit"
                className="w-full bg-[#082A19] hover:bg-[#001C10] text-white font-bold py-4 rounded-xl text-xl"
              >
                Generate Comprehensive Lesson Plan
              </button>
              {error && (
                <p className="mt-4 text-red-700 font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {error}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
