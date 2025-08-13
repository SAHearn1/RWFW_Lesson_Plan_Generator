'use client';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
// If you installed remark-gfm, uncomment the next line and add: import remarkGfm from 'remark-gfm';
// import remarkGfm from 'remark-gfm';

type Tab = 'generator' | 'results';

export default function HomePage() {
  // UI state
  const [tab, setTab] = useState<Tab>('generator');

  // Form state
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [duration, setDuration] = useState('3');
  const [unitTitle, setUnitTitle] = useState('');
  const [standards, setStandards] = useState('');
  const [focus, setFocus] = useState('');

  // Gen state
  const [isLoading, setIsLoading] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Helpers
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions).map((o) => o.value);
    setSubjects(values);
  };

  const handleDownloadMarkdown = () => {
    if (!lessonPlan) return;
    const blob = new Blob([lessonPlan], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${unitTitle || 'rootwork-lesson-plan'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGeneratePlan: React.FormEventHandler<HTMLFormElement> = async (e) => {
    console.log('🚀 handleGeneratePlan called!', e);
    
    try {
      e.preventDefault();
      console.log('✅ preventDefault() called');

      setError(null);
      console.log('📝 Form data:', { gradeLevel, subjects, duration, unitTitle, standards, focus });

      // basic validations
      if (!gradeLevel) {
        console.log('❌ Validation failed: No grade level');
        return setError('Please select a grade level.');
      }
      if (subjects.length === 0) {
        console.log('❌ Validation failed: No subjects');
        return setError('Please select at least one subject.');
      }

      console.log('✅ Validation passed');

      // Build the correct payload format that matches your API expectations
      const payload = {
        gradeLevel,
        subjects,
        duration: parseInt(duration, 10), // Convert to number
        unitTitle: unitTitle || 'Rooted in Me: Exploring Culture, Identity, and Expression',
        standards: standards || 'Please align with relevant standards (CCSS/NGSS/etc.)',
        focus: focus || 'None specified'
      };

      console.log('📦 Payload:', payload);

      setIsLoading(true);
      console.log('🔄 Making API call...');
      
      const res = await fetch('/api/generatePlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('📡 API Response:', res.status, res.statusText);

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.log('❌ API Error:', txt);
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const data = await res.json();
      console.log('📋 API Data:', data);

      // Handle the response format from your API
      const teacherMarkdown = data?.plan?.markdown || '';
      if (!teacherMarkdown) {
        throw new Error(data?.error || 'Empty response from generator');
      }

      setLessonPlan(teacherMarkdown);
      setTab('results');
      console.log('✅ Success! Switching to results tab');
      
    } catch (err: any) {
      console.error('❌ Error in handleGeneratePlan:', err);
      setError(err?.message || 'Failed to generate lesson plan.');
    } finally {
      setIsLoading(false);
      console.log('🏁 handleGeneratePlan finished');
    }
  };

  const heading = (
    <header className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-600 to-purple-700" />
      <div className="relative container mx-auto px-6 py-14 text-white">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm ring-1 ring-white/20 backdrop-blur">
            <span>🌱</span>
            <span className="font-medium">Root Work Framework</span>
          </div>
          <h1 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight">
            Healing-Centered Lesson Design
          </h1>
          <p className="mt-3 text-white/90 max-w-3xl mx-auto">
            S.T.E.A.M. Powered, Trauma Informed, Project Based lesson planning for real classrooms.
          </p>
        </div>
      </div>
    </header>
  );

  // --- UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-purple-50">
      {heading}

      <main className="container mx-auto px-6 -mt-10 pb-16">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6 md:p-8">
          {tab === 'generator' && (
            <form onSubmit={handleGeneratePlan}>
              {error && (
                <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
                  {error}
                </div>
              )}

              <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
                <h3 className="text-lg font-bold mb-1">🌱 Root Work Framework</h3>
                <p>Trauma-informed, culturally responsive, GRR-aligned planning—beautiful and practical.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div>
                  <label className="block mb-2 font-semibold text-slate-700">Grade Level *</label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Grade</option>
                    {['Kindergarten', ...Array.from({ length: 12 }, (_, i) => `${i + 1}${[1, 2, 3].includes(i + 1) ? (i + 1 === 1 ? 'st' : i + 1 === 2 ? 'nd' : 'rd') : 'th'} Grade`)].map(
                      (g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-slate-700">Duration *</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  >
                    {[1, 2, 3, 4, 5].map((d) => (
                      <option key={d} value={String(d)}>
                        {d} Day{d > 1 ? 's' : ''} ({d * 90} min total)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-slate-700">Unit Title</label>
                  <input
                    type="text"
                    value={unitTitle}
                    onChange={(e) => setUnitTitle(e.target.value)}
                    placeholder="e.g., Community Storytelling"
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-semibold text-slate-700">Subject Area(s) *</label>
                <select
                  multiple
                  value={subjects}
                  onChange={handleSubjectChange}
                  className="w-full p-3 h-40 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
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
                <div className="text-sm text-slate-500 mt-1">Use Cmd/Ctrl to multi-select.</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block mb-2 font-semibold text-slate-700">Standards Alignment</label>
                  <textarea
                    rows={3}
                    value={standards}
                    onChange={(e) => setStandards(e.target.value)}
                    placeholder="Enter relevant state standards or learning objectives…"
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-slate-700">Additional Focus Areas</label>
                  <textarea
                    rows={3}
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    placeholder="Special accommodations, therapeutic goals, etc."
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-lg font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition disabled:opacity-60"
              >
                {isLoading ? 'Generating…' : 'Generate Comprehensive Lesson Plan'}
              </button>
            </form>
          )}

          {tab === 'results' && (
            <div>
              {error && (
                <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">{error}</div>
              )}

              {/* Top actions */}
              <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between mb-6">
                <div className="flex flex-wrap gap-2">
                  <button
                    className="px-4 py-2 rounded-xl bg-white ring-1 ring-slate-200 hover:bg-slate-50"
                    onClick={() => setTab('generator')}
                  >
                    Generate New Plan
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
                    onClick={handleDownloadMarkdown}
                  >
                    Download Lesson Plan (.md)
                  </button>
                </div>
              </div>

              {/* Rendered plan */}
              <div className="prose max-w-none prose-headings:scroll-mt-24">
                <ReactMarkdown /* remarkPlugins={[remarkGfm]} */>{lessonPlan}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
