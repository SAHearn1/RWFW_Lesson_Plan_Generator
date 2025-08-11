'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Firebase
import type { User } from 'firebase/auth';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { firebaseConfig } from '@/lib/firebase';

type UsageInfo = { count: number; limit: number };
type GenerateResponse = { lessonPlan: string; usageInfo?: UsageInfo };

export default function HomePage() {
  // View state
  const [view, setView] = useState<'loading' | 'form' | 'results'>('loading');

  // Auth & usage
  const [user, setUser] = useState<User | null>(null);
  const [usageInfo, setUsageInfo] = useState<UsageInfo>({ count: 0, limit: 5 });

  // Form state
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [duration, setDuration] = useState('3');
  const [unitTitle, setUnitTitle] = useState('');
  const [standards, setStandards] = useState('');
  const [focus, setFocus] = useState('');

  // Results & UI
  const [lessonPlan, setLessonPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ----- Effects -----
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!firebaseConfig?.apiKey) {
      setError('Firebase configuration is missing. Please set it in your Vercel environment variables.');
      setView('form');
      return;
    }

    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const auth = getAuth(app);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setView('form');
      } else {
        signInAnonymously(auth).catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Anonymous sign-in error:', err);
          setError(err?.code ? `Auth error: ${err.code}` : 'Could not sign in. Please try again later.');
          setView('form');
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // ----- Handlers -----
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions);
    setSubjects(options.map((o) => o.value));
  };

  const handleCopy = async () => {
    if (!lessonPlan) return;
    try {
      await navigator.clipboard.writeText(lessonPlan);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    if (!lessonPlan) return;
    const blob = new Blob([lessonPlan], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const title = unitTitle?.trim() || 'rootwork-lesson-plan';
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNewPlan = () => {
    setView('form');
    setLessonPlan('');
    setError(null);
  };

  const handleGeneratePlan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      setError('You are not signed in.');
      return;
    }
    if (!gradeLevel || subjects.length === 0) {
      setError('Please select a grade level and at least one subject.');
      return;
    }
    if (usageInfo.count >= usageInfo.limit) {
      setError(`You have reached your monthly limit of ${usageInfo.limit} lesson plans.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setView('loading');

    // Build prompt (concise but strong; your server enhances with system prompt)
    const prompt = `
As an expert in curriculum design specializing in trauma-informed, healing-centered, and culturally responsive education, generate a comprehensive lesson plan using the "Root Work Framework".

**Lesson Details:**
- **Grade Level:** ${gradeLevel}
- **Subject Area(s):** ${subjects.join(', ')}
- **Duration:** ${duration} days (90 minutes per day)
- **Unit Title:** ${unitTitle || 'Rooted in Me: Exploring Culture, Identity, and Expression'}
- **Standards Alignment Input:** ${standards || 'Please align with common core or relevant state standards.'}
- **Additional Focus Areas (accommodations, therapeutic goals):** ${focus || 'None specified.'}

**Required Framework Components (for each day):**
1. **Day Title & Essential Question**
2. **Learning Target** ("I can..." statement)
3. **Standards Alignment** (academic + SEL/CASEL)
4. **Trauma-Informed Design Elements** (safety across physical/psychological/emotional/cultural)
5. **Structured Lesson Flow (90 mins, GRR-aligned)** — Opening Ritual, I Do, We Do, You Do Together, You Do Alone, Closing Circle — each with Teacher Notes and Student Notes
6. **Assessment** (formative/diagnostic/celebratory)
7. **MTSS Supports** (Tier 1–3)
8. **Extension & Enrichment** (advanced learners + family/community engagement)

**Formatting:** Output as clean Markdown with headings, bold, and lists. No conversational intro/outro.
    `.trim();

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/generatePlan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
      });

      // Read text first to avoid JSON parse edge cases
      const raw = await response.text();
      let data: GenerateResponse | null = null;
      try {
        data = raw ? (JSON.parse(raw) as GenerateResponse) : null;
      } catch {
        // leave data null, we’ll surface raw if needed
      }

      if (!response.ok) {
        const msg = (data && ((data as any).error || (data as any).message)) || raw || `HTTP ${response.status}`;
        throw new Error(msg);
      }
      if (!data || typeof data !== 'object' || typeof data.lessonPlan !== 'string') {
        throw new Error('Empty or invalid JSON from /api/generatePlan');
      }

      setLessonPlan(data.lessonPlan);
      if (data.usageInfo) setUsageInfo(data.usageInfo);
      setView('results');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to generate lesson plan: ${message}`);
      setView('form');
    } finally {
      setIsLoading(false);
    }
  };

  // ----- UI -----
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Branded Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700" />
        <div className="relative mx-auto max-w-5xl px-6 py-14 text-white">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm ring-1 ring-white/20 backdrop-blur">
              <span>🌱</span>
              <span className="font-medium">Root Work Framework</span>
            </div>
            <h1 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight">
              Healing-Centered Lesson Plan Generator
            </h1>
            <p className="mt-3 text-white/90 max-w-3xl mx-auto">
  S.T.E.A.M. Powered, Trauma Informed, Project Base Lesson planning for real classrooms
</p>
          </div>
        </div>
      </header>

      {/* Card */}
      <main className="mx-auto -mt-10 mb-16 max-w-4xl px-6">
        <div className="rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 p-6 md:p-8">
          {/* FORM */}
          {view === 'form' && (
            <form onSubmit={handleGeneratePlan} className="space-y-6">
              <div className="rounded-xl bg-emerald-50 ring-1 ring-emerald-200 p-5 text-emerald-900">
                <h3 className="text-lg font-bold mb-1">🌱 Root Work Approach</h3>
                <p>
                  Generate comprehensive plans grounded in trauma-informed practice, healing-centered pedagogy, and
                  culturally responsive education.
                </p>
                <div className="mt-2 font-semibold">
                  Monthly Usage: {usageInfo.count} / {usageInfo.limit}
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-rose-50 ring-1 ring-rose-200 p-4 text-rose-700">{error}</div>
              )}

              {/* Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Grade */}
                <div>
                  <label htmlFor="gradeLevel" className="mb-2 block font-semibold text-slate-700">
                    Grade Level *
                  </label>
                  <select
                    id="gradeLevel"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    required
                    className="w-full rounded-lg border-2 border-slate-200 p-3 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">Select Grade</option>
                    {[...Array(13).keys()].map((i) => {
                      const label =
                        i === 0
                          ? 'Kindergarten'
                          : `${i}${i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'} Grade`;
                      return (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label htmlFor="duration" className="mb-2 block font-semibold text-slate-700">
                    Duration *
                  </label>
                  <select
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                    className="w-full rounded-lg border-2 border-slate-200 p-3 focus:border-indigo-500 focus:outline-none"
                  >
                    {[...Array(5).keys()].map((i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} Day{i > 0 ? 's' : ''} ({(i + 1) * 90} min)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label htmlFor="unitTitle" className="mb-2 block font-semibold text-slate-700">
                    Unit Title
                  </label>
                  <input
                    id="unitTitle"
                    type="text"
                    value={unitTitle}
                    onChange={(e) => setUnitTitle(e.target.value)}
                    placeholder="e.g., Community Storytelling"
                    className="w-full rounded-lg border-2 border-slate-200 p-3 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Subjects */}
              <div>
                <label htmlFor="subject" className="mb-2 block font-semibold text-slate-700">
                  Subject Area(s) *
                </label>
                <select
                  id="subject"
                  multiple
                  required
                  value={subjects}
                  onChange={handleSubjectChange}
                  className="h-44 w-full rounded-lg border-2 border-slate-200 p-3 focus:border-indigo-500 focus:outline-none"
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
                <p className="mt-1 text-sm text-slate-500">Hold Ctrl (Windows) or Cmd (Mac) to select multiple.</p>
              </div>

              {/* Standards & Focus */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="standards" className="mb-2 block font-semibold text-slate-700">
                    Standards Alignment
                  </label>
                  <textarea
                    id="standards"
                    rows={3}
                    value={standards}
                    onChange={(e) => setStandards(e.target.value)}
                    placeholder="Enter relevant state standards or learning objectives..."
                    className="w-full rounded-lg border-2 border-slate-200 p-3 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="focus" className="mb-2 block font-semibold text-slate-700">
                    Additional Focus Areas
                  </label>
                  <textarea
                    id="focus"
                    rows={3}
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    placeholder="Special accommodations, therapeutic goals, etc..."
                    className="w-full rounded-lg border-2 border-slate-200 p-3 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-lg font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {isLoading ? 'Generating…' : 'Generate Comprehensive Lesson Plan'}
              </button>
            </form>
          )}

          {/* LOADING */}
          {(view === 'loading' || (view === 'form' && !user)) && (
            <div className="text-center p-12">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
              <p className="text-slate-600">{view === 'loading' ? 'Generating plan…' : 'Initializing secure session…'}</p>
            </div>
          )}

          {/* RESULTS */}
          {view === 'results' && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">
                  ✨ Your Root Work Lesson Plan is Ready
                </h2>
              </div>

              <div className="mb-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  onClick={handleDownload}
                  className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
                >
                  📥 Download (.md)
                </button>
                <button
                  onClick={handleCopy}
                  className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
                >
                  {copied ? '✅ Copied' : 'Copy to Clipboard'}
                </button>
                <button
                  onClick={handleNewPlan}
                  className="rounded-xl bg-indigo-50 px-5 py-3 font-semibold text-indigo-700 ring-1 ring-indigo-200 transition hover:bg-indigo-100"
                >
                  Create New Plan
                </button>
              </div>

              <div className="prose prose-slate lg:prose-lg max-w-none rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{lessonPlan}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

