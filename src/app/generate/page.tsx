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
  'English Language Arts','Mathematics','Science','Social Studies','STEAM (Integrated)',
  'Special Education','Agriculture','Environmental Science','Life Skills','Social-Emotional Learning',
  'Art','Music','Physical Education','Career & Technical Education','World Languages','Other'
];

const STANDARDS_SHORTCUTS: Record<string,string> = {
  'georgia standards': 'Georgia Standards of Excellence (GSE)',
  'common core': 'Common Core State Standards (CCSS)',
  'ngss': 'Next Generation Science Standards (NGSS)',
  'casel': 'CASEL Social-Emotional Learning Standards',
  'national standards': 'Relevant National Content Standards',
  'state standards': 'State Academic Standards for selected grade level and subject',
};

// Pedagogy-focused loading stages (Root Work Framework lens)
const LOADING_STAGES = [
  { key: 'relationships', label: 'Nurturing Relationships', msg: 'Grounding in community, belonging, and safety.' },
  { key: 'routines', label: 'Establishing Routines', msg: 'Setting predictable structure and success criteria.' },
  { key: 'relevance', label: 'Building Relevance', msg: 'Connecting content to lived experience and culture.' },
  { key: 'rigor', label: 'Designing Rigor', msg: 'Challenging thinking with scaffolded practice.' },
  { key: 'reflection', label: 'Inviting Reflection', msg: 'Processing growth, agency, and next steps.' },
  { key: 'mtss', label: 'Layering MTSS Supports', msg: 'Universal, targeted, and intensive support planning.' },
  { key: 'assessment', label: 'Crafting Assessments', msg: 'Checks for understanding, rubrics, and evidence.' },
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

  const [lessonPlan, setLessonPlan] = useState<string | null>(null);
  const [htmlPlan, setHtmlPlan] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [stageIndex, setStageIndex] = useState(0);
  const [showForm, setShowForm] = useState(true);
  const [copied, setCopied] = useState(false);
  const progressRef = useRef<number>(0);
  const progressCapWhileWaiting = 90; // stop at 90% until the API responds

  useEffect(() => {
    let timer: any;
    if (isGenerating) {
      // cycle through pedagogy stages up to 90%
      timer = setInterval(() => {
        setStageIndex((i) => {
          const next = Math.min(i + 1, LOADING_STAGES.length - 1);
          const pctPerStage = Math.floor(progressCapWhileWaiting / LOADING_STAGES.length);
          progressRef.current = Math.min(progressRef.current + pctPerStage, progressCapWhileWaiting);
          return next;
        });
      }, 1300);
    }
    return () => clearInterval(timer);
  }, [isGenerating]);

  const progressPercent = () => {
    return isGenerating ? Math.min(progressRef.current, progressCapWhileWaiting) : 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const processLearningObjectives = (obj: string = '', subjects: string[], grade: string) => {
    if (!obj.trim()) return '';
    let processed = obj;
    const lower = obj.toLowerCase();
    for (const [shortcut, full] of Object.entries(STANDARDS_SHORTCUTS)) {
      if (lower.includes(shortcut)) {
        processed += `\n\nINTEGRATE: Include specific ${full} for ${subjects.join(' and ')} at grade ${grade}. Provide actual standard codes and descriptions.`;
      }
    }
    return processed;
  };

  const processSpecialNeeds = (sn: string = '') => {
    if (!sn.trim()) return '';
    const expansions: Record<string,string> = {
      'ell': 'English Language Learners',
      'sped': 'Special Education',
      'iep': 'Individualized Education Program',
      '504': 'Section 504 accommodations',
      'adhd': 'Attention Deficit Hyperactivity Disorder',
      'asd': 'Autism Spectrum Disorder',
      'ptsd': 'Post-Traumatic Stress Disorder'
    };
    let processed = sn;
    const lower = sn.toLowerCase();
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
    progressRef.current = 0;
    setStageIndex(0);

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
      const payload = {
        subject: formData.subjects.join(', '),
        gradeLevel: formData.gradeLevel.trim(),
        topic: formData.topic.trim(),
        duration: formData.duration.trim(),
        numberOfDays: formData.numberOfDays.trim(),
        learningObjectives: processLearningObjectives(formData.learningObjectives, formData.subjects, formData.gradeLevel),
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
        includeResources: false,
        gradualRelease: true,
      };

      const res = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || `Request failed with status ${res.status}`);

      // bump progress to 100% now that we’ve got a response
      progressRef.current = 100;

      // Prefer enhanced HTML if present; otherwise use plain text
      const html = typeof data?.htmlVersion === 'string' ? data.htmlVersion : null;
      const text = typeof data?.lessonPlan === 'string' ? data.lessonPlan : null;

      if (!html && !text) throw new Error('No lesson plan generated. Please try again.');

      setHtmlPlan(html);
      setLessonPlan(text);
      setShowForm(false);
      setIsGenerating(false);
    } catch (err: any) {
      setIsGenerating(false);
      setError(err?.message || 'Failed to generate lesson plan. Please try again.');
    }
  };

  const downloadAsHTML = () => {
    const src = htmlPlan || lessonPlan;
    if (!src) return;
    const blob = new Blob([src], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RWFW_${formData.topic.replace(/[^a-z0-9]/gi, '_')}_Grade${formData.gradeLevel}_${formData.numberOfDays}days.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsRTF = () => {
    const text = lessonPlan || '';
    if (!text) return;
    const rtf = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0\\fswiss Arial;}}\\fs18 ${text
      .replace(/\\/g,'\\\\').replace(/{/g,'\\{').replace(/}/g,'\\}')
      .replace(/\n/g,'\\par ')} }`;
    const blob = new Blob([rtf], { type: 'application/rtf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RWFW_${formData.topic.replace(/[^a-z0-9]/gi, '_')}_Grade${formData.gradeLevel}_${formData.numberOfDays}days.rtf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    const text = htmlPlan || lessonPlan || '';
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Loading screen
  if (isGenerating) {
    const pct = progressPercent();
    const current = LOADING_STAGES[Math.min(stageIndex, LOADING_STAGES.length - 1)];
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-[#F2F4CA] to-[#082A19]">
        <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-2xl border-4 border-[#D4C862]">
          <div className="flex items-center gap-4 mb-6">
            <img
              src="/logo.png"
              alt="Root Work Framework"
              width={56}
              height={56}
              className="rounded-full border-2 border-[#D4C862] bg-white"
            />
            <div>
              <h2 className="text-2xl font-extrabold text-[#082A19]" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                Root Work Framework
              </h2>
              <p className="text-sm text-[#3B523A]" style={{ fontFamily: 'Inter, sans-serif' }}>
                Professional, trauma-informed learning design
              </p>
            </div>
          </div>

          <h3 className="text-xl font-bold text-[#082A19] mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
            Generating your comprehensive lesson plan…
          </h3>
          <p className="text-[#3B523A] mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
            {current.label}: {current.msg}
          </p>

          <div className="mb-3">
            <div className="w-full bg-[#F2F4CA] rounded-full h-3 border-2 border-[#3B523A]">
              <div
                className="bg-gradient-to-r from-[#D4C862] to-[#082A19] h-full rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-[#3B523A]" style={{ fontFamily: 'Inter, sans-serif' }}>
              <span>{pct < 100 ? 'Preparing structure & supports…' : 'Finalizing'}</span>
              <span>{pct}%</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {LOADING_STAGES.map((s, i) => (
              <div
                key={s.key}
                className={`px-3 py-2 rounded-lg border-2 ${
                  i <= stageIndex ? 'bg-[#D4C862] border-[#082A19] text-[#082A19]' : 'bg-white border-[#3B523A] text-[#3B523A]'
                }`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {i < stageIndex ? '✓ ' : `${i + 1}. `}{s.label}
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-[#F2F4CA]/40 rounded-xl border border-[#D4C862] text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
            <div><b>Topic:</b> {formData.topic}</div>
            <div><b>Grade:</b> {formData.gradeLevel} &nbsp; • &nbsp; <b>Subjects:</b> {formData.subjects.join(', ')}</div>
            <div><b>Schedule:</b> {formData.numberOfDays} days × {formData.duration}</div>
          </div>
        </div>
      </div>
    );
  }

  // Plan view
  if (!showForm && (htmlPlan || lessonPlan)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F2F4CA] to-white">
        <header className="bg-[#082A19] text-white shadow-xl">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center gap-4">
                <img
                  src="/logo.png"
                  alt="Root Work Framework"
                  width={48}
                  height={48}
                  className="rounded-full border-2 border-[#D4C862] bg-white"
                />
                <div>
                  <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                    Root Work Framework — Lesson Plan
                  </h1>
                  <p className="text-[#D4C862] text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {formData.subjects.join(' + ')} • Grade {formData.gradeLevel} • {formData.numberOfDays} days
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setShowForm(true); setLessonPlan(null); setHtmlPlan(null); }}
                  className="px-4 py-2 bg-[#3B523A] hover:bg-[#001C10] rounded-lg font-medium"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  New Lesson
                </button>
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-[#3B523A] hover:bg-[#001C10] rounded-lg font-medium"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={downloadAsHTML}
                  className="px-4 py-2 bg-[#D4C862] hover:bg-[#96812A] text-[#082A19] rounded-lg font-semibold"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Download HTML
                </button>
                <button
                  onClick={downloadAsRTF}
                  className="px-4 py-2 bg-white text-[#082A19] border-2 border-[#D4C862] hover:bg-[#F2F4CA] rounded-lg font-medium"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Word/RTF
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-[#D4C862]">
            {htmlPlan ? (
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlPlan }}
              />
            ) : (
              <pre className="whitespace-pre-wrap text-sm leading-relaxed bg-[#F2F4CA]/20 p-6 rounded-xl border border-[#3B523A]" style={{ fontFamily: 'JetBrains Mono, Consolas, monospace' }}>
                {lessonPlan}
              </pre>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2F4CA] to-white">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white rounded-3xl shadow-2xl p-10 border-4 border-[#D4C862]">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/logo.png" alt="Root Work Framework" width={56} height={56} className="rounded-full border-2 border-[#D4C862] bg-white" />
              <h2 className="text-3xl font-extrabold text-[#082A19]" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                Create Comprehensive Lesson Plan
              </h2>
            </div>
            <p className="text-[#3B523A]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Multi-day structure • Teacher & Student Notes • STEAM • Trauma-Informed • MTSS • Assessments
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Subjects */}
              <div className="lg:col-span-2">
                <label className="block text-xl font-bold text-[#082A19] mb-4" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Subject Area(s) <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4 border-2 border-[#3B523A] rounded-2xl bg-[#F2F4CA]/30">
                  {SUBJECTS.map(subject => (
                    <label key={subject} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.subjects.includes(subject)}
                        onChange={() => handleSubjectChange(subject)}
                        className="w-5 h-5 rounded border-[#3B523A] text-[#D4C862] focus:ring-[#D4C862]"
                      />
                      <span className="text-[#2B2B2B]" style={{ fontFamily: 'Inter, sans-serif' }}>{subject}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[#3B523A] mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                  <b>{formData.subjects.length}</b> selected{formData.subjects.length ? `: ${formData.subjects.join(', ')}` : ''}
                </p>
              </div>

              {/* Grade */}
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Grade Level <span className="text-red-600">*</span>
                </label>
                <select name="gradeLevel" value={formData.gradeLevel} onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl bg-white" required>
                  <option value="">Choose Grade Level</option>
                  <option value="PreK">Pre-K</option>
                  <option value="K">Kindergarten</option>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i+1} value={String(i+1)}>Grade {i+1}</option>
                  ))}
                  <option value="Mixed">Mixed Ages</option>
                </select>
              </div>

              {/* Days */}
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Number of Days <span className="text-red-600">*</span>
                </label>
                <select name="numberOfDays" value={formData.numberOfDays} onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl bg-white" required>
                  <option value="">Select Days</option>
                  {[3,4,5,6,7,8,9,10,15,20].map(d => <option key={d} value={String(d)}>{d} {d===1?'day':'days'}</option>)}
                </select>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Lesson Topic <span className="text-red-600">*</span>
                </label>
                <input type="text" name="topic" value={formData.topic} onChange={handleInputChange}
                       placeholder="e.g., Urban Environmental Sustainability"
                       className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl bg-white" required />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Duration per Day <span className="text-red-600">*</span>
                </label>
                <select name="duration" value={formData.duration} onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl bg-white" required>
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

            {/* Enhanced fields */}
            <div className="space-y-6">
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Learning Objectives & Standards <span className="text-[#3B523A] text-sm font-normal ml-2">(optional)</span>
                </label>
                <textarea name="learningObjectives" value={formData.learningObjectives} onChange={handleInputChange}
                          rows={5} placeholder="Use keywords: 'Georgia Standards', 'Common Core', 'NGSS', etc."
                          className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl bg-white resize-vertical" />
              </div>

              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Unit Context <span className="text-[#3B523A] text-sm font-normal ml-2">(optional)</span>
                </label>
                <textarea name="unitContext" value={formData.unitContext} onChange={handleInputChange}
                          rows={3} placeholder="Larger unit/theme connection, prior knowledge, etc."
                          className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl bg-white resize-vertical" />
              </div>

              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Special Considerations & Accommodations <span className="text-[#3B523A] text-sm font-normal ml-2">(optional)</span>
                </label>
                <textarea name="specialNeeds" value={formData.specialNeeds} onChange={handleInputChange}
                          rows={4} placeholder="Shortcuts: ELL, IEP, ADHD, autism, trauma-informed…"
                          className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl bg-white resize-vertical" />
              </div>

              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Available Resources & Materials <span className="text-[#3B523A] text-sm font-normal ml-2">(optional)</span>
                </label>
                <textarea name="availableResources" value={formData.availableResources} onChange={handleInputChange}
                          rows={4} placeholder="Garden space, tech lab, manipulatives, partners, materials…"
                          className="w-full px-4 py-3 border-2 border-[#3B523A] rounded-xl bg-white resize-vertical" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#F2F4CA] to-[#D4C862]/40 p-8 rounded-3xl border-4 border-[#D4C862]">
              <button type="submit" className="w-full bg-[#082A19] hover:bg-[#001C10] text-white font-bold py-5 px-8 rounded-2xl text-xl"
                      style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                Generate Lesson Plan
              </button>
              <p className="text-[#082A19] mt-3 text-center text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                Includes multi-day 5Rs, teacher/student notes, MTSS, SEL, trauma-informed practices, and assessments.
              </p>
            </div>
          </form>

          {error && (
            <div className="mt-8 p-6 bg-red-50 border-2 border-red-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 mt-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 5h2v6H9V5zm0 8h2v2H9v-2z" clipRule="evenodd"/></svg>
                <div>
                  <p className="text-red-800 font-bold mb-1" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>Unable to Generate</p>
                  <p className="text-red-700" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
