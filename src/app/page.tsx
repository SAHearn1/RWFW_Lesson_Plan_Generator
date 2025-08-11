'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Firebase
import type { User } from 'firebase/auth';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { firebaseConfig } from '@/lib/firebase';

// Utils
import {
  RootWorkEntry,
  RootWorkFramework,
  checkComplianceFlags,
  cn,
  exportToCSV,
  formatDate,
  generateId,
  getCategoryColor,
  getStatusColor,
  loadFromLocalStorage,
  saveToLocalStorage,
  searchEntries,
  sortEntriesByPriority,
  validateRootWorkEntry,
} from '@/lib/utils';

// ———————————————————————————————————————————————————————————
// Types for asset generation response
type GeneratedImage = {
  fileName: string;
  alt: string;
  b64: string; // base64 image from the API
};

type GenerateAssetsResponse = {
  images: GeneratedImage[];
  message?: string;
};
// ———————————————————————————————————————————————————————————

export default function HomePage() {
  // Navigation is removed — this is now a pure generator screen.
  // Lesson Generator State
  const [view, setView] = useState<'loading' | 'form' | 'results'>('loading');
  const [lessonPlan, setLessonPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User & Usage State
  const [user, setUser] = useState<User | null>(null);
  const [usageInfo, setUsageInfo] = useState({ count: 0, limit: 5 });

  // Form State
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [duration, setDuration] = useState('3');
  const [unitTitle, setUnitTitle] = useState('');
  const [standards, setStandards] = useState('');
  const [focus, setFocus] = useState('');

  // Generated visual assets
  const [images, setImages] = useState<GeneratedImage[]>([]);

  // Root Work Framework (kept for export + future analytics, but not UI)
  const [rootWorkFramework, setRootWorkFramework] = useState<RootWorkFramework>({
    entries: [],
    metadata: { lastUpdated: new Date(), version: '1.0.0', createdBy: 'Root Work Framework User' },
  });

  // Load saved framework once (so usage can be exported if needed later)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = loadFromLocalStorage('rootWorkFramework', rootWorkFramework);
    setRootWorkFramework(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist framework on changes
  useEffect(() => {
    saveToLocalStorage('rootWorkFramework', rootWorkFramework);
  }, [rootWorkFramework]);

  // Firebase anonymous auth
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

  // Handlers
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions);
    const values = options.map((o) => o.value);
    setSubjects(values);
  };

  const handleDownload = () => {
    if (!lessonPlan) return;
    const blob = new Blob([lessonPlan], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const name = unitTitle || 'rootwork-lesson-plan';
    a.download = `${name.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateAssets = async () => {
    if (!lessonPlan || !user) return;
    setAssetsLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/generateAssets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lessonPlan }),
      });

      const raw = await response.text();
      let data: GenerateAssetsResponse | null = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        /* ignore parse err, show raw below if !ok */
      }

      if (!response.ok) {
        const msg = (data && (data as any).error) || raw || `HTTP ${response.status}`;
        throw new Error(msg);
      }

      if (!data || !Array.isArray(data.images)) {
        throw new Error('Empty or invalid JSON from /api/generateAssets');
      }

      setImages(data.images);
    } catch (err: any) {
      setError(`Failed to generate visual assets: ${err?.message || 'Unknown error'}`);
    } finally {
      setAssetsLoading(false);
    }
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
    setImages([]);
    setView('loading');

    const prompt = `
You are an expert curriculum designer (20+ years) specializing in K–12, PBL, Trauma-Informed Care, Living Learning Labs, CASEL SEL, MTSS, GRR, and STEAM integration.
Use the Root Work Framework therapeutic context and generate a ${duration}-day lesson plan.

Inputs:
- Grade Level: ${gradeLevel}
- Subject Area(s): ${subjects.join(', ')}
- Duration: ${duration} days (90 minutes per day)
- Unit Title: ${unitTitle || 'Rooted in Me: Exploring Culture, Identity, and Expression'}
- Standards Alignment Input: ${standards || 'Please align with CCSS or relevant state standards.'}
- Additional Focus Areas: ${focus || 'None specified.'}

MANDATORY Teacher & Student Notes protocol:
- After every major component (Opening, I Do, We Do, You Do Together, You Do Alone, Closing) include:
  [Teacher Note: ...] (1–3 sentences; trauma-informed facilitation, rationale, differentiation, assessment cues)
  [Student Note: ...] (1–2 sentences; warm second-person coaching, self-advocacy, regulation)
- Notes must appear immediately after the activity description and BEFORE MTSS supports.

Mandatory format per Day (in this order):
HEADER:
- Day #, Lesson Title, Essential Question, Learning Target, Standards
[Teacher Note: ...]
[Student Note: ...]

STRUCTURED LESSON FLOW (total 90 minutes):
- Opening (X min)
  Activity...
  [Teacher Note: ...]
  [Student Note: ...]
- I Do: Direct Instruction (X min)
  Content/modeling...
  [Teacher Note: ...]
  [Student Note: ...]
- Work Session (X min) — include:
  We Do (X min) → description + notes
  You Do Together (X min) → description + notes
  You Do Alone (X min) → description + notes
- Closing (X min)
  Reflection...
  [Teacher Note: ...]
  [Student Note: ...]

Additional required sections per day:
- Student-facing instructions and scaffolds
- Facilitator modeling guidance
- MTSS tiered supports (Tier 1–3)
- SEL competencies addressed
- Regulation rituals (garden/nature-based when appropriate)
- Choices for student expression
- Multimedia integration (use placeholders like [Insert Flip link here])
- Clear assessment tasks (formative or summative)
- Reflection/peer feedback mechanisms
- Optional extension or enrichment

Appendix A (exact Markdown table, 8 columns):
| File Name | Type | Description/Purpose | Alt-text | How to Generate/Use | Link Placeholder | Media Source Instructions | Figure Ref |
|-----------|------|---------------------|----------|---------------------|------------------|--------------------------|------------|
(List all assets referenced. Include at least 2 image assets with explicit natural-language prompts and alt-text.)

Quality Pass (DO THIS BEFORE RETURNING):
- Verify every section includes BOTH [Teacher Note:] and [Student Note:].
- Fix Markdown tables to be valid GFM (header + pipes).
- Keep tone professional, warm, student-facing where applicable.
- Do NOT include meta commentary—return only the lesson content in Markdown.
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

      const raw = await response.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        // Keep data as null; we'll show a useful error below if needed.
      }

      if (!response.ok) {
        const msg = (data && (data.error || data.message)) || raw || `HTTP ${response.status}`;
        throw new Error(msg);
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Empty or invalid JSON from /api/generatePlan');
      }

      setLessonPlan(data.lessonPlan || '');
      if (data.usageInfo) setUsageInfo(data.usageInfo);
      setView('results');

      // (Optional) Record a simple entry for internal analytics
      const entry: RootWorkEntry = {
        id: generateId(),
        title: `Lesson Plan: ${unitTitle || 'Rooted in Me'}`,
        description: `${gradeLevel} ${subjects.join(', ')} lesson plan - ${duration} days`,
        category: 'educational',
        priority: 'medium',
        status: 'completed',
        tags: [
          'lesson-plan',
          'rootwork-framework',
          ...subjects.map((s) => s.toLowerCase().replace(/\s+/g, '-')),
        ],
        assignee: 'Generated by AI',
        createdAt: new Date(),
        updatedAt: new Date(),
        complianceFlags: [],
      };

      setRootWorkFramework((prev) => ({
        ...prev,
        entries: [...prev.entries, entry],
        metadata: { ...prev.metadata, lastUpdated: new Date() },
      }));
    } catch (err: any) {
      setError(`Failed to generate lesson plan: ${err?.message || 'Unknown error'}`);
      setView('form');
    } finally {
      setIsLoading(false);
    }
  };

  // Simple export (kept for convenience)
  const exportFramework = () => {
    const csv = exportToCSV(rootWorkFramework.entries);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `root-work-framework-${formatDate(new Date())}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // ————————————————— UI —————————————————
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
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
              S.T.E.A.M. Powered, Trauma Informed, Project Based Lesson planning for real classrooms
            </h1>
            <p className="mt-3 text-white/90 max-w-3xl mx-auto">
              Healing-centered design, GRR flow, and MTSS supports—all aligned to standards and built for student agency.
            </p>
          </div>
        </div>
      </header>

      {/* Main card */}
      <main className="container mx-auto px-6 -mt-10 pb-16">
        <div className="rounded-2xl bg-white shadow-xl ring-1 ring-black/5 p-6 md:p-8">
          {/* FORM */}
          {view === 'form' && (
            <form id="form-section" onSubmit={handleGeneratePlan}>
              <div className="bg-emerald-50 ring-1 ring-emerald-200 text-emerald-900 p-5 rounded-xl mb-8">
                <h3 className="text-lg font-bold mb-2">🌱 About the Rootwork Generator</h3>
                <p>
                  Generate robust, student-facing lesson plans grounded in trauma-informed, healing-centered pedagogy with STEAM/PBL integration.
                </p>
                <div className="mt-2 font-semibold">Monthly Usage: {usageInfo.count} / {usageInfo.limit}</div>
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 text-white py-3 font-semibold hover:bg-brand-700 transition disabled:opacity-60"
              >
                {isLoading ? 'Generating…' : 'Generate Comprehensive Lesson Plan'}
              </button>
            </form>
          )}

          {/* LOADING */}
          {view === 'loading' && (
            <div id="loading-section" className="text-center p-12">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Building your lesson with the Root Work Framework…</p>
            </div>
          )}

          {/* RESULTS */}
          {view === 'results' && (
            <div id="results-section" className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-800">
                  ✨ Your Rootwork Framework Lesson Plan is Ready!
                </h2>
                <p className="text-slate-500 mt-1">Professionally formatted with GRR, MTSS, SEL, and TIC.</p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button onClick={handleDownload} className="rounded-lg bg-brand-600 text-white px-5 py-2 font-semibold hover:bg-brand-700 transition">
                  📥 Download (.md)
                </button>
                <button
                  onClick={handleGenerateAssets}
                  disabled={assetsLoading}
                  className="rounded-lg bg-purple-600 text-white px-5 py-2 font-semibold hover:bg-purple-700 transition disabled:opacity-60"
                >
                  {assetsLoading ? 'Generating Visual Assets…' : '🎨 Generate Visual Assets'}
                </button>
                <button
                  onClick={() => {
                    setView('form');
                    setLessonPlan('');
                    setImages([]);
                    setError(null);
                  }}
                  className="rounded-lg border border-slate-300 text-slate-700 px-5 py-2 font-semibold hover:bg-slate-50 transition"
                >
                  Create New Plan
                </button>
              </div>

              {error && (
                <div className="bg-rose-50 ring-1 ring-rose-200 text-rose-700 p-4 rounded-xl">
                  {error}
                </div>
              )}

              {/* Branded wrapper + responsive tables */}
              <div className="rounded-xl ring-1 ring-slate-200 overflow-hidden">
                {/* Branded banner above the plan */}
                <div className="bg-gradient-to-r from-brand-600 to-purple-600 text-white px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌱</span>
                    <div>
                      <div className="font-semibold leading-tight">Root Work Framework</div>
                      <div className="text-white/80 text-sm">
                        Healing-Centered Education • STEAM • PBL • GRR • MTSS
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-0">
                  <div className="overflow-x-auto p-6">
                    <article className="prose prose-slate prose-headings:scroll-mt-24 prose-a:text-brand-700 max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {lessonPlan}
                      </ReactMarkdown>
                    </article>
                  </div>
                </div>
              </div>

              {/* Render generated images (if any) */}
              {images.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-800">Generated Visual Assets</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {images.map((img) => {
                      const dataUrl = `data:image/png;base64,${img.b64}`;
                      return (
                        <figure key={img.fileName} className="rounded-xl ring-1 ring-slate-200 overflow-hidden bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={dataUrl} alt={img.alt} className="w-full h-56 object-cover" />
                          <figcaption className="p-4">
                            <div className="font-medium text-slate-800">{img.fileName}</div>
                            <div className="text-slate-500 text-sm line-clamp-2">{img.alt}</div>
                            <div className="mt-3">
                              <a
                                href={dataUrl}
                                download={img.fileName}
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm hover:bg-slate-800 transition"
                              >
                                ⤓ Download
                              </a>
                            </div>
                          </figcaption>
                        </figure>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Tiny admin action (optional) */}
              <div className="text-center">
                <button onClick={exportFramework} className="text-sm text-slate-500 hover:text-slate-700 underline">
                  Export generation log (CSV)
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
