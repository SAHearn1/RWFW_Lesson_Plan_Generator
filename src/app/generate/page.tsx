// /src/app/generate/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

type ApiResponse = {
  success: boolean;
  lessonPlan: string;      // cleaned plain text
  htmlVersion?: string;    // styled HTML version
  resources?: {
    textResources?: Array<{ filename: string; content: string; type: string }>;
  };
  warnings?: string[];
  fallback?: boolean;
};

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

// Pedagogy-grounded loading stages (RWFW)
const RWFW_STAGES = [
  { key: 'relationships', label: 'Building Relationships', blurb: 'Establishing belonging & psychological safety.' },
  { key: 'routines', label: 'Setting Routines', blurb: 'Creating predictable structure & success criteria.' },
  { key: 'relevance', label: 'Connecting Relevance', blurb: 'Bridging learning to students, place & culture.' },
  { key: 'rigor', label: 'Designing Rigor', blurb: 'Sequencing modeling, practice, and application.' },
  { key: 'reflection', label: 'Planning Reflection', blurb: 'Centering wellness, metacognition, next steps.' },
  { key: 'mtss', label: 'Scaffolding MTSS', blurb: 'Tiers 1–3 supports and progress monitoring.' },
  { key: 'assessment', label: 'Crafting Assessment', blurb: 'Formative checks, rubrics, and evidence.' },
  { key: 'finalize', label: 'Finalizing Plan', blurb: 'Assembling styled plan for download & print.' },
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

  const [api, setApi] = useState<ApiResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);           // 0..100
  const [error, setError] = useState('');
  const [view, setView] = useState<'styled' | 'text'>('styled');
  const intervalRef = useRef<number | null>(null);
  const requestDoneRef = useRef(false);

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
        : [...prev.subjects, subject],
    }));
  };

  // Smooth progress runner: climbs to 90% until the request resolves; then jumps to 100%.
  const startProgress = () => {
    stopProgress();
    setProgress(2);
    requestDoneRef.current = false;
    intervalRef.current = window.setInterval(() => {
      setProgress(prev => {
        if (requestDoneRef.current) return Math.min(prev + 4, 100);
        const cap = 90;
        if (prev >= cap) return cap;
        const step = prev < 40 ? 4 : prev < 70 ? 2 : 1;
        return Math.min(prev + step, cap);
      });
    }, 200) as unknown as number;
  };
  const stopProgress = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const currentStage = useMemo(() => {
    // map progress to the RWFW stages (even spacing up to 90%)
    const idx = Math.min(
      RWFW_STAGES.length - 1,
      Math.floor((Math.min(progress, 90) / 90) * RWFW_STAGES.length)
    );
    return RWFW_STAGES[idx];
  }, [progress]);

  const validate = (): string[] => {
    const missing: string[] = [];
    if (!formData.subjects.length) missing.push('Subject Area(s)');
    if (!formData.gradeLevel?.trim()) missing.push('Grade Level');
    if (!formData.topic?.trim()) missing.push('Lesson Topic');
    if (!formData.duration?.trim()) missing.push('Duration per Day');
    if (!formData.numberOfDays?.trim()) missing.push('Number of Days');
    return missing;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const missing = validate();
    if (missing.length) {
      setError(`Please complete: ${missing.join(', ')}`);
      return;
    }

    setIsGenerating(true);
    setApi(null);
    setView('styled');
    startProgress();

    try {
      const payload = {
        subject: formData.subjects.join(', '),
        gradeLevel: formData.gradeLevel.trim(),
        topic: formData.topic.trim(),
        duration: formData.duration.trim(),
        numberOfDays: formData.numberOfDays.trim(),
        learningObjectives: formData.learningObjectives || '',
        specialNeeds: formData.specialNeeds || '',
        availableResources: formData.availableResources || '',
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
        specialInstructions:
          `Generate a comprehensive ${formData.numberOfDays}-day lesson plan using RWFW. ` +
          `Include mandatory [Teacher Note:] and [Student Note:] for each section. ` +
          `Daily structure: Relationships, Routines, Relevance, Rigor (I Do/We Do/You Do Together), Reflection. ` +
          `Include MTSS tables, assessments tables, and return a styled HTML version.`,
      };

      const res = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: ApiResponse = await res.json();

      requestDoneRef.current = true;       // let progress complete to 100
      setTimeout(() => setProgress(100), 250); // quick finish

      if (!res.ok || !data?.lessonPlan) {
        throw new Error(data as unknown as string || `Request failed (${res.status})`);
      }

      setApi(data);
    } catch (err: any) {
      requestDoneRef.current = true;
      setProgress(100);
      setError(err?.message || 'Failed to generate plan.');
    } finally {
      setIsGenerating(false);
      setTimeout(stopProgress, 1200);
    }
  };

  useEffect(() => () => stopProgress(), []);

  const downloadHTML = () => {
    if (!api) return;
    const html = api.htmlVersion || `<pre>${(api.lessonPlan || '').replace(/[&<>]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[s]!) )}</pre>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RWFW_${formData.topic.replace(/[^a-z0-9]/gi, '_')}_Grade${formData.gradeLevel}_${formData.numberOfDays}days.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadRTF = () => {
    if (!api) return;
    const safe = (api.lessonPlan || '').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
    const rtf = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0\\fswiss Arial;}{\\f1\\froman Times New Roman;}}
{\\colortbl;\\red8\\green42\\blue25;\\red212\\green200\\blue98;}
\\f1\\fs28\\cf1\\b ROOT WORK FRAMEWORK LESSON PLAN\\b0\\par
\\fs20 Topic: ${formData.topic}\\par Grade: ${formData.gradeLevel}\\par Duration: ${formData.duration} × ${formData.numberOfDays} days\\par\\par
\\f0\\fs18 ${safe.replace(/\n/g, '\\par\n')}
\\par\\cf2 Generated by Root Work Framework — ${new Date().toLocaleDateString()}
}`;
    const blob = new Blob([rtf], { type: 'application/rtf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RWFW_${formData.topic.replace(/[^a-z0-9]/gi, '_')}_Grade${formData.gradeLevel}_${formData.numberOfDays}days.rtf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTextResource = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------- UI ---------- */

  // Loading screen – pedagogy-based with logo and progress
  if (isGenerating) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-[#F2F4CA] to-[#082A19]">
        <div className="bg-white w-full max-w-2xl mx-6 rounded-3xl shadow-2xl border-4 border-[#D4C862] p-10 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <img
              src="/logo.png"
              alt="Root Work Framework"
              width={64}
              height={64}
              className="rounded-full border-2 border-[#D4C862] bg-white object-contain"
            />
            <h2 className="text-3xl font-extrabold text-[#082A19]">Assembling Your RWFW Plan</h2>
          </div>

          <div className="mb-6 text-[#3B523A]">
            <div className="text-lg font-semibold">{currentStage.label}</div>
            <div className="text-sm">{currentStage.blurb}</div>
          </div>

          <div className="w-full bg-[#F2F4CA] border-2 border-[#3B523A] rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D4C862] to-[#082A19] transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-4 text-sm text-[#3B523A]">{Math.round(progress)}%</div>

          <div className="mt-8 grid grid-cols-2 gap-3 text-left">
            {RWFW_STAGES.map((s, i) => (
              <div
                key={s.key}
                className={`p-3 rounded-lg border-2 ${
                  i * (90 / RWFW_STAGES.length) <= progress
                    ? 'bg-[#D4C862] border-[#082A19] text-[#082A19]'
                    : 'bg-white border-[#3B523A] text-[#3B523A]'
                }`}
              >
                <div className="font-semibold">{s.label}</div>
                <div className="text-sm opacity-80">{s.blurb}</div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm text-[#3B523A]">
            RWFW emphasizes Relationships → Routines → Relevance → Rigor → Reflection. We’re composing those layers now.
          </p>
        </div>
      </div>
    );
  }

  // Results view
  if (api?.lessonPlan) {
    return (
      <div className="min-h-screen">
        <header className="bg-[#082A19] text-white shadow">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center gap-4">
                <img
                  src="/logo.png"
                  alt="RWFW"
                  width={48}
                  height={48}
                  className="rounded-full border-2 border-[#D4C862] bg-white object-contain"
                />
                <div>
                  <h1 className="text-2xl font-extrabold">
                    {`RWFW: ${formData.topic} — Grade ${formData.gradeLevel}`}
                  </h1>
                  <p className="text-[#D4C862] text-sm">
                    {formData.subjects.join(' + ')} • {formData.numberOfDays} day(s) × {formData.duration}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setApi(null)}
                  className="px-4 py-2 bg-[#3B523A] hover:bg-[#001C10] rounded-lg"
                >
                  New Lesson
                </button>
                <button onClick={downloadHTML} className="px-4 py-2 bg-[#D4C862] text-[#082A19] rounded-lg font-semibold">
                  Download HTML
                </button>
                <button onClick={downloadRTF} className="px-4 py-2 border-2 border-[#D4C862] text-white rounded-lg">
                  Word/RTF
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
          {/* View switcher */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setView('styled')}
              className={`px-4 py-2 rounded-lg border ${view === 'styled' ? 'bg-[#082A19] text-[#D4C862] border-[#D4C862]' : 'bg-white border-[#3B523A]'}`}
            >
              Styled View
            </button>
            <button
              onClick={() => setView('text')}
              className={`px-4 py-2 rounded-lg border ${view === 'text' ? 'bg-[#082A19] text-[#D4C862] border-[#D4C862]' : 'bg-white border-[#3B523A]'}`}
            >
              Plain Text
            </button>
          </div>

          {/* Plan body */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-[#D4C862] overflow-hidden">
            {view === 'styled' ? (
              <article
                className="prose max-w-none"
                // We trust our own API’s sanitizer/formatter for this HTML version
                dangerouslySetInnerHTML={{ __html: api.htmlVersion || `<pre style="white-space:pre-wrap;padding:1rem">${api.lessonPlan}</pre>` }}
              />
            ) : (
              <pre className="whitespace-pre-wrap text-sm p-6 font-mono bg-[#F2F4CA]/40">
                {api.lessonPlan}
              </pre>
            )}
          </div>

          {/* Text resources (first-run helpful artifacts) */}
          {!!api.resources?.textResources?.length && (
            <section className="mt-8 bg-white rounded-2xl shadow border-2 border-[#D4C862] p-6">
              <h3 className="text-xl font-bold text-[#082A19] mb-3">Text Resources</h3>
              <p className="text-sm text-[#3B523A] mb-4">
                Helpful handouts and prompts generated from your plan. (Teacher Guide & Student Workbook with images will be part of a premium tier.)
              </p>
              <ul className="space-y-2">
                {api.resources.textResources.map((r, i) => (
                  <li key={i} className="flex items-center justify-between border rounded-lg p-3">
                    <span className="truncate">{r.filename}</span>
                    <button
                      className="ml-3 px-3 py-1 bg-[#082A19] text-[#D4C862] rounded-md"
                      onClick={() => downloadTextResource(r.filename, r.content)}
                    >
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Warnings (e.g., fallback) */}
          {!!api.warnings?.length && (
            <div className="mt-6 p-4 bg-amber-50 border-2 border-amber-300 rounded-lg text-sm text-amber-900">
              <b>Notes:</b> {api.warnings.join(' • ')}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Form
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white rounded-3xl shadow-2xl p-10 border-4 border-[#D4C862]">
          <div className="text-center mb-10">
            <img
              src="/logo.png"
              alt="Root Work Framework"
              width={72}
              height={72}
              className="mx-auto mb-4 rounded-full border-2 border-[#D4C862] bg-white object-contain"
            />
            <h2 className="text-4xl font-extrabold text-[#082A19] mb-3">Create Comprehensive Lesson Plan</h2>
            <p className="text-lg text-[#3B523A]">
              Multi-day RWFW plans with Teacher & Student Notes, MTSS tables, and assessments.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Subjects */}
            <div>
              <label className="block text-xl font-bold text-[#082A19] mb-2">
                Subject Area(s) <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#F2F4CA]/40 border-2 border-[#3B523A]">
                {SUBJECTS.map(subject => (
                  <label key={subject} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.subjects.includes(subject)}
                      onChange={() => handleSubjectChange(subject)}
                      className="w-5 h-5 rounded border-[#3B523A] text-[#D4C862] focus:ring-[#D4C862]"
                    />
                    <span>{subject}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-[#3B523A] mt-1">
                {formData.subjects.length ? `${formData.subjects.length} selected: ${formData.subjects.join(', ')}` : 'Choose one or more.'}
              </p>
            </div>

            {/* Grid: Grade/Days/Topic/Duration */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-2">
                  Grade Level <span className="text-red-600">*</span>
                </label>
                <select
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl"
                  required
                >
                  <option value="">Choose Grade Level</option>
                  <option value="PreK">Pre-K</option>
                  <option value="K">Kindergarten</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={String(i + 1)}>{`Grade ${i + 1}`}</option>
                  ))}
                  <option value="Mixed">Mixed Ages</option>
                </select>
              </div>

              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-2">
                  Number of Days <span className="text-red-600">*</span>
                </label>
                <select
                  name="numberOfDays"
                  value={formData.numberOfDays}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl"
                  required
                >
                  <option value="">Select Days</option>
                  {[3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map(days => (
                    <option key={days} value={String(days)}>
                      {days} {days === 1 ? 'day' : 'days'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-2">
                  Lesson Topic <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder="e.g., Photosynthesis & Plant Growth"
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-2">
                  Duration per Day <span className="text-red-600">*</span>
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl"
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

            {/* Optional fields */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-2">
                  Learning Objectives & Standards
                  <span className="ml-2 text-sm font-normal text-[#3B523A]">(optional)</span>
                </label>
                <textarea
                  name="learningObjectives"
                  rows={4}
                  value={formData.learningObjectives}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl"
                  placeholder="Shortcuts: “Georgia Standards”, “Common Core”, “NGSS” to auto-integrate."
                />
              </div>
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-2">
                  Unit Context <span className="ml-2 text-sm font-normal text-[#3B523A]">(optional)</span>
                </label>
                <textarea
                  name="unitContext"
                  rows={4}
                  value={formData.unitContext}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl"
                  placeholder="Where does this lesson sit in the unit? What came before?"
                />
              </div>
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-2">
                  Special Considerations & Accommodations
                  <span className="ml-2 text-sm font-normal text-[#3B523A]">(optional)</span>
                </label>
                <textarea
                  name="specialNeeds"
                  rows={4}
                  value={formData.specialNeeds}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl"
                  placeholder="Shortcuts: ELL, IEP, ADHD, Autism, Trauma-informed…"
                />
              </div>
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-2">
                  Available Resources & Materials
                  <span className="ml-2 text-sm font-normal text-[#3B523A]">(optional)</span>
                </label>
                <textarea
                  name="availableResources"
                  rows={4}
                  value={formData.availableResources}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl"
                  placeholder="Garden space, community partners, lab equipment, devices, etc."
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-800">{error}</div>
            )}

            <div className="bg-gradient-to-r from-[#F2F4CA] to-[#D4C862]/50 p-6 rounded-2xl border-4 border-[#D4C862]">
              <button
                type="submit"
                className="w-full bg-[#082A19] hover:bg-[#001C10] text-white font-bold py-4 rounded-xl"
              >
                Generate RWFW Lesson Plan
              </button>
              <p className="text-center text-sm text-[#082A19] mt-3">
                Includes Teacher & Student Notes • MTSS • Assessments • Styled HTML export
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
