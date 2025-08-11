'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

/** Minimal runtime type for the structured JSON your API returns */
type LessonPlanData = {
  meta: {
    unitTitle: string;
    gradeLevel: string;
    subjects: string[];
    durationDays: number;
  };
  days: Array<{
    dayNumber: number;
    title: string;
  }>;
  appendixA?: Array<{
    fileName: string;
    type?: string;
    description?: string;
    altText?: string;
    figure?: string;
    link?: string;
  }>;
};

export default function HomePage() {
  // View state
  const [view, setView] = useState<'form' | 'loading' | 'results'>('form');

  // Form state
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [duration, setDuration] = useState('3');
  const [unitTitle, setUnitTitle] = useState('');
  const [standards, setStandards] = useState('');
  const [focus, setFocus] = useState('');

  // Output state
  const [planJson, setPlanJson] = useState<LessonPlanData | null>(null);
  const [lessonPlanTeacher, setLessonPlanTeacher] = useState(''); // Teacher Markdown
  const [lessonPlanStudent, setLessonPlanStudent] = useState(''); // Student Markdown
  const [activeView, setActiveView] = useState<'teacher' | 'student' | 'print'>('teacher');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helpers
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions);
    const values = options.map((o) => o.value);
    setSubjects(values);
  };

  const handleNewPlan = () => {
    setView('form');
    setPlanJson(null);
    setLessonPlanTeacher('');
    setLessonPlanStudent('');
    setActiveView('teacher');
    setError(null);
  };

  // --- Generate plan ---
  const handleGeneratePlan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!gradeLevel || subjects.length === 0) {
      setError('Please select a grade level and at least one subject.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setView('loading');

    try {
      const payload = {
        gradeLevel,
        subjects,
        duration, // server will coerce string -> number
        unitTitle,
        standards,
        focus,
      };

      const response = await fetch('/api/generatePlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = (data && (data.error || data.message)) || `HTTP ${response.status}`;
        throw new Error(typeof msg === 'string' ? msg : 'Generation failed');
      }

      // Expect: { lessonPlan: <JSON>, markdown: { teacher: string, student: string } }
      setPlanJson(data.lessonPlan || null);
      setLessonPlanTeacher((data.markdown && data.markdown.teacher) || '');
      setLessonPlanStudent((data.markdown && data.markdown.student) || '');
      setActiveView('teacher');
      setView('results');
    } catch (err: any) {
      setError(`Failed to generate lesson plan: ${err?.message || 'Unknown error'}`);
      setView('form');
    } finally {
      setIsLoading(false);
    }
  };

  // --- UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50">
      {/* Branded Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-700 via-brand-600 to-purple-700" />
        <div className="relative container mx-auto px-6 py-14 text-white">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm ring-1 ring-white/20 backdrop-blur">
              <span>🌱</span>
              <span className="font-medium">Root Work Framework</span>
            </div>
            <h1 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight">
              S.T.E.A.M. Powered, Trauma Informed, Project Base Lesson planning for real classrooms
            </h1>
            <p className="mt-3 text-white/90 max-w-3xl mx-auto">
              Generate healing-centered, GRR-aligned plans with MTSS, SEL, and student-facing scaffolds—ready to teach.
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-6 -mt-10 pb-16">
        <div className="card p-6 md:p-8">
          {/* FORM */}
          {view === 'form' && (
            <form id="form-section" onSubmit={handleGeneratePlan}>
              <div className="bg-emerald-50 ring-1 ring-emerald-200 text-emerald-900 p-5 rounded-xl mb-8">
                <h3 className="text-lg font-bold mb-2">🌿 Root Work Lesson Generator</h3>
                <p>
                  Create comprehensive lesson plans grounded in trauma-informed practice, healing-centered pedagogy, and culturally responsive education.
                </p>
              </div>

              {error && (
                <div className="bg-rose-50 ring-1 ring-rose-200 text-rose-700 p-4 rounded-xl mb-6">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div className="form-group">
                  <label htmlFor="gradeLevel" className="block mb-2 font-semibold text-slate-700">
                    Grade Level *
                  </label>
                  <select
                    id="gradeLevel"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    required
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Select Grade</option>
                    {[...Array(13).keys()].map((i) => {
                      const grade = i === 0 ? 'K' : `${i}th`;
                      const label =
                        i === 0
                          ? 'Kindergarten'
                          : `${i}${i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'} Grade`;
                      return (
                        <option key={grade} value={label}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="duration" className="block mb-2 font-semibold text-slate-700">
                    Duration *
                  </label>
                  <select
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                  >
                    {[...Array(5).keys()].map((i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} Day{i > 0 ? 's' : ''} ({(i + 1) * 90} min)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="unitTitle" className="block mb-2 font-semibold text-slate-700">
                    Unit Title
                  </label>
                  <input
                    type="text"
                    id="unitTitle"
                    value={unitTitle}
                    onChange={(e) => setUnitTitle(e.target.value)}
                    placeholder="e.g., Community Storytelling"
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="form-group mb-4">
                <label htmlFor="subject" className="block mb-2 font-semibold text-slate-700">
                  Subject Area(s) *
                </label>
                <select
                  id="subject"
                  multiple
                  value={subjects}
                  onChange={handleSubjectChange}
                  required
                  className="w-full p-3 h-40 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                >
                  {[
                    'English Language Arts',
                    'Mathematics',
                    'Science',
                    'Social Studies',
                    'Art',
                    'Music',
                    'Physical Education',
                    'Special Education',
                    'STEAM',
                    'Agriculture',
                    'Career and Technical Education',
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <div className="text-sm text-slate-500 mt-1">
                  Hold Ctrl (Windows) or Cmd (Mac) to select multiple subjects.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="form-group">
                  <label htmlFor="standards" className="block mb-2 font-semibold text-slate-700">
                    Standards Alignment
                  </label>
                  <textarea
                    id="standards"
                    value={standards}
                    onChange={(e) => setStandards(e.target.value)}
                    rows={3}
                    placeholder="Enter relevant state standards or learning objectives..."
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="focus" className="block mb-2 font-semibold text-slate-700">
                    Additional Focus Areas
                  </label>
                  <textarea
                    id="focus"
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    rows={3}
                    placeholder="Special accommodations, therapeutic goals, etc..."
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-lg disabled:opacity-60">
                {isLoading ? 'Generating…' : 'Generate Comprehensive Lesson Plan'}
              </button>
            </form>
          )}

          {/* LOADING */}
          {view === 'loading' && (
            <div id="loading-section" className="text-center p-12">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Building your lesson plan…</p>
            </div>
          )}

          {/* RESULTS */}
          {view === 'results' && planJson && (
            <div id="results-section">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">✨ Your Lesson Plan is Ready</h2>
                <p className="text-slate-600 mt-1">Switch views, export, or grab the full Ready-to-Teach pack.</p>
              </div>

              {/* Tabs */}
              <div className="flex justify-center gap-2 mb-4">
                <button
                  className={activeView === 'teacher' ? 'btn-primary' : 'btn-ghost'}
                  onClick={() => setActiveView('teacher')}
                >
                  Teacher
                </button>
                <button
                  className={activeView === 'student' ? 'btn-primary' : 'btn-ghost'}
                  onClick={() => setActiveView('student')}
                >
                  Student
                </button>
                <button
                  className={activeView === 'print' ? 'btn-primary' : 'btn-ghost'}
                  onClick={() => setActiveView('print')}
                >
                  Print
                </button>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {/* DOCX export (respects current tab) */}
                <button
                  className="btn-primary"
                  onClick={async () => {
                    if (!planJson) return;
                    const res = await fetch('/api/export/docx', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ lessonPlan: planJson, variant: activeView }),
                    });
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${planJson.meta.unitTitle}-${activeView}.docx`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } else {
                      alert('DOCX export failed');
                    }
                  }}
                >
                  Download DOCX
                </button>

                {/* PDF export (always uses "print" content for clean printing) */}
                <button
                  className="btn-ghost"
                  onClick={async () => {
                    if (!planJson) return;
                    const res = await fetch('/api/export/pdf', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ lessonPlan: planJson, variant: 'print' }),
                    });
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${planJson.meta.unitTitle}-print.pdf`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } else {
                      alert('PDF export failed');
                    }
                  }}
                >
                  Download PDF
                </button>

                {/* Ready-to-Teach Pack */}
                <button
                  className="btn-primary"
                  onClick={async () => {
                    if (!planJson) return;

                    // Fire-and-forget asset generation (safe to ignore errors)
                    fetch('/api/generateAssets', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        unitTitle: planJson.meta.unitTitle,
                        gradeLevel: planJson.meta.gradeLevel,
                        subject: planJson.meta.subjects[0],
                        appendixA: planJson.appendixA ?? [],
                      }),
                    }).catch(()onClick={(e) => e.preventDefault()}


                    // Immediately deliver Teacher DOCX
                    const res = await fetch('/api/export/docx', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ lessonPlan: planJson, variant: 'teacher' }),
                    });
                    if (res.ok) {
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${planJson.meta.unitTitle}-TeacherPack.docx`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } else {
                      alert('Could not create Teacher Pack');
                    }
                  }}
                >
                  Ready-to-Teach Pack
                </button>

                {/* Start over */}
                <button onClick={handleNewPlan} className="btn-ghost">
                  Create New Plan
                </button>
              </div>

              {/* Content */}
              <div className="prose prose-brand lg:prose-lg max-w-none rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                {activeView === 'teacher' && <ReactMarkdown>{lessonPlanTeacher}</ReactMarkdown>}
                {activeView === 'student' && <ReactMarkdown>{lessonPlanStudent}</ReactMarkdown>}
                {activeView === 'print' && <ReactMarkdown>{lessonPlanTeacher}</ReactMarkdown>}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
