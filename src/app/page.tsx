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

/* ------------------------------ RWF PROMPT ------------------------------ */
type BuildPromptArgs = {
  gradeLevel: string;
  subjects: string[];
  duration: string; // days (string from form)
  unitTitle: string;
  standards: string;
  focus: string;
  mode: 'Full Unit' | 'Single Lesson' | 'Project Only' | 'Student-Facing Task Only' | 'Diagnostic/Exit Activity';
};

function buildRWFPrompt({
  gradeLevel,
  subjects,
  duration,
  unitTitle,
  standards,
  focus,
  mode,
}: BuildPromptArgs) {
  return `
REFINED MASTER LLM PROMPT for Trauma-Informed STEAM Lesson Plan Generator with Mandatory Teacher & Student Notes

🧑‍🏫 Persona to Assume:
You are an expert curriculum designer with 20+ years of experience in K–12 (general & special ed), PBL, Trauma-Informed Care, Living Learning Labs, CASEL SEL, MTSS, student agency, and equity-centered pedagogy.
You are familiar with *From Garden to Growth* (Table 1.1, Figure 1.3, Table 2.1, Figure 2.3), the Trauma-Informed STEAM Lesson Design Rubric, STEAM-PBL Unit Planner for LLLs, Trauma-Responsive PBL Unit Template, and Trauma-Informed PBL Implementation Rubric.

🎯 Objective:
Generate a ${duration}-day **${mode}** lesson plan that integrates:
- Trauma-informed care (SAMHSA 6 principles)
- STEAM + Project-Based Learning
- Living Learning Lab methodology
- CASEL SEL competencies
- MTSS scaffolding
- Student agency and differentiated modalities
- GRR (Gradual Release of Responsibility)
- Garden/nature-based regulation practices where appropriate

Render **polished Markdown** (GitHub-flavored). Use tables and checklists. No chit-chat.

## LESSON CONTEXT
- **Grade Level:** ${gradeLevel}
- **Subjects:** ${subjects.join(', ')}
- **Duration:** ${duration} day(s), 90 minutes/day
- **Unit Title:** ${unitTitle || 'Rooted in Me: Exploring Culture, Identity, and Expression'}
- **Standards Input:** ${standards || 'Align to relevant state/CCSS/NGSS standards'}
- **Additional Focus:** ${focus || 'None specified'}

## GLOBAL TOP SECTIONS (exact order)
1) # Lesson Plan: ${unitTitle || 'Rooted in Me'}
2) **Grade**, **Subject(s)**, **Duration**
3) ---
4) ## Standards & Success Criteria
   - 2–4 specific academic standards (e.g., CCSS/NGSS)
   - SEL competencies (CASEL)
   - **Success Criteria** (3–5 “I can…”)
5) ## Materials & Prep
   - Materials (texts, handouts, tech)
   - Prep notes (printing, room setup, accommodations)
6) ## Assessment Map
   - Table with rows: Diagnostic | Formative | Summative/Celebratory
   - Columns: What | When | Evidence | Tool/Rubric

## DAILY PLANS (repeat for each day, exactly ${duration} days)
For each day:
- # Day {n}: {Short Title}
- **Essential Question** (1 line)
- **Learning Target** (single “I can…” aligned to Success Criteria)
- **Trauma-Informed Design**: 4 bullets — Physical, Psychological, Emotional, Cultural

### Structured Lesson Flow (90 mins, GRR)
Use **this exact table** and fill every cell with explicit detail:

| Segment | Time (mins) | Teacher Moves | Student Moves | CFUs (Checks) | Materials/UDL Options |
|---|---:|---|---|---|---|
| Opening Ritual | 10 | ... | ... | ... | ... |
| I Do (Direct Instruction) | 15 | ... | ... | ... | ... |
| We Do (Guided) | 20 | ... | ... | ... | ... |
| You Do Together (Collaborative) | 20 | ... | ... | ... | ... |
| You Do Alone (Independent) | 15 | ... | ... | ... | ... |
| Closing Circle | 10 | ... | ... | ... | ... |

**MANDATORY TEACHER & STUDENT NOTES PROTOCOL (for EVERY segment above, placed in the narrative immediately after the table row’s description):**
- [Teacher Note: 1–3 sentences; rationale, trauma-informed facilitation, differentiation, assessment insight, Rootwork Framework connections]
- [Student Note: 1–2 sentences; warm, empowering, second-person coaching; regulation/self-advocacy]

> Do not omit these notes. If a segment is missing notes, regenerate that segment before continuing.

### Differentiation (MTSS)
- **Tier 1 (Universal):** 3–4 bullets
- **Tier 2 (Targeted):** 3–4 bullets (concrete scaffolds/interventions)
- **Tier 3 (Intensive):** 2–3 bullets (individualized supports)

### Extension & Enrichment
- 2 bullets for advanced learners
- 1 bullet for **Family/Community** connection

### Additional Required per Day
- Student-facing instructions & scaffolds
- Facilitator modeling guidance
- SEL competencies addressed
- Regulation rituals (Figure 2.3 reference where applicable)
- Choices for expression
- Multimedia integration (use placeholder links like “[Insert link here]”; do not fabricate)
- Clear formative or summative assessment task
- Reflection or peer feedback mechanism

## APPENDIX A: Resource & Visual Asset Directory
For each referenced asset:
- **File name** (use convention: {LessonCode}_{GradeLevel}{SubjectAbbrev}_{DescriptiveTitle}.{ext})
- **Type** (image, PDF, docx…)
- **Description & instructional purpose**
- **Alt-text & accessibility notes**
- **How to create/use** (e.g., DALL·E/Canva/Docs), include image prompts
- **Hyperlink placeholder:** [Insert link ...]
- **Media source instructions**, **Figure #** if used in body

## VALIDATION CHECKS (must be satisfied)
- Standards-aligned; student-facing language; Daily Essential Question
- GRR present each day with full table columns completed
- STEAM + PBL + LLL elements; SAMHSA principles embedded
- MTSS scaffolding; Student agency; Multimodal resources; CASEL SEL
- Assessment tools and facilitator modeling provided
- Cultural relevance present
- **Every major component includes both [Teacher Note:] and [Student Note:] immediately after the component description and BEFORE MTSS**
- If any component lacks both notes, regenerate that component
- Keep tone professional, clear, and healing-centered; avoid labels like “TIC/CASEL”—embed naturally
- Use garden/nature metaphors for regulation where appropriate

Render the final deliverable in polished Markdown with tables and checklists, ready for a teacher-facing document.
  `.trim();
}

/* --------------------------------- PAGE --------------------------------- */
export default function HomePage() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'generator' | 'framework' | 'dashboard'>('generator');

  // Generator state
  const [view, setView] = useState<'loading' | 'form' | 'results'>('loading');
  const [lessonPlan, setLessonPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth & usage
  const [user, setUser] = useState<User | null>(null);
  const [usageInfo, setUsageInfo] = useState({ count: 0, limit: 5 });

  // Form state
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [duration, setDuration] = useState('3');
  const [unitTitle, setUnitTitle] = useState('');
  const [standards, setStandards] = useState('');
  const [focus, setFocus] = useState('');
  const [mode, setMode] = useState<BuildPromptArgs['mode']>('Full Unit');

  // Framework state
  const [rootWorkFramework, setRootWorkFramework] = useState<RootWorkFramework>({
    entries: [],
    metadata: { lastUpdated: new Date(), version: '1.0.0', createdBy: 'Root Work Framework User' },
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RootWorkEntry['category'] | 'all'>('all');
  const [showEntryForm, setShowEntryForm] = useState(false);

  // New entry state
  const [newEntry, setNewEntry] = useState<Partial<RootWorkEntry>>({
    title: '',
    description: '',
    category: 'educational',
    priority: 'medium',
    status: 'pending',
    tags: [],
    assignee: '',
  });

  /* ------------------------------- EFFECTS ------------------------------- */
  // Load saved framework
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = loadFromLocalStorage('rootWorkFramework', rootWorkFramework);
    setRootWorkFramework(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist framework
  useEffect(() => {
    saveToLocalStorage('rootWorkFramework', rootWorkFramework);
  }, [rootWorkFramework]);

  // Firebase anon auth
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

  /* ------------------------------ HANDLERS ------------------------------- */
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions);
    setSubjects(options.map((o) => o.value));
  };

  const handleDownload = () => {
    if (!lessonPlan) return;
    const blob = new Blob([lessonPlan], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${unitTitle || 'rootwork-lesson-plan'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const addRootWorkEntry = () => {
    const errors = validateRootWorkEntry(newEntry);
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    const entry: RootWorkEntry = {
      ...(newEntry as RootWorkEntry),
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      complianceFlags: checkComplianceFlags(newEntry as RootWorkEntry),
    };

    setRootWorkFramework((prev) => ({
      ...prev,
      entries: [...prev.entries, entry],
      metadata: { ...prev.metadata, lastUpdated: new Date() },
    }));

    setNewEntry({
      title: '',
      description: '',
      category: 'educational',
      priority: 'medium',
      status: 'pending',
      tags: [],
      assignee: '',
    });
    setShowEntryForm(false);
    setError(null);
  };

  const updateEntryStatus = (id: string, status: RootWorkEntry['status']) => {
    setRootWorkFramework((prev) => ({
      ...prev,
      entries: prev.entries.map((entry) =>
        entry.id === id ? { ...entry, status, updatedAt: new Date() } : entry
      ),
      metadata: { ...prev.metadata, lastUpdated: new Date() },
    }));
  };

  const deleteEntry = (id: string) => {
    setRootWorkFramework((prev) => ({
      ...prev,
      entries: prev.entries.filter((entry) => entry.id !== id),
      metadata: { ...prev.metadata, lastUpdated: new Date() },
    }));
  };

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

  /* -------------------------- HANDLE GENERATE PLAN -------------------------- */
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

    const prompt = buildRWFPrompt({
      gradeLevel,
      subjects,
      duration,
      unitTitle,
      standards,
      focus,
      mode,
    });

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
      let data: unknown = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        // If provider streams partial text or returns non-JSON, we'll surface it below.
      }

      if (!response.ok) {
        const msg =
          (data && typeof data === 'object' && (data as any)['error']) ||
          (data && typeof data === 'object' && (data as any)['message']) ||
          raw ||
          `HTTP ${response.status}`;
        throw new Error(String(msg));
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Empty or invalid JSON from /api/generatePlan');
      }

      const lesson = (data as { lessonPlan?: string; usageInfo?: { count: number; limit: number } }).lessonPlan || '';
      const usage = (data as { usageInfo?: { count: number; limit: number } }).usageInfo;

      setLessonPlan(lesson);
      if (usage) setUsageInfo(usage);
      setView('results');

      // Auto-create a Root Work entry tied to the generated plan
      const lessonEntry: RootWorkEntry = {
        id: generateId(),
        title: `Lesson Plan: ${unitTitle || 'Rooted in Me'}`,
        description: `${gradeLevel} ${subjects.join(', ')} lesson plan - ${duration} days`,
        category: 'educational',
        priority: 'medium',
        status: 'completed',
        tags: ['lesson-plan', 'rootwork-framework', ...subjects.map((s) => s.toLowerCase().replace(/\s+/g, '-'))],
        assignee: 'Generated by AI',
        createdAt: new Date(),
        updatedAt: new Date(),
        complianceFlags: [],
      };

      setRootWorkFramework((prev) => ({
        ...prev,
        entries: [...prev.entries, lessonEntry],
        metadata: { ...prev.metadata, lastUpdated: new Date() },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to generate lesson plan: ${msg}`);
      setView('form');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPlan = () => {
    setView('form');
    setLessonPlan('');
    setError(null);
  };

  // Filter & search
  const filteredEntries = useMemo(() => {
    let filtered = rootWorkFramework.entries;
    if (selectedCategory !== 'all') filtered = filtered.filter((e) => e.category === selectedCategory);
    if (searchQuery) filtered = searchEntries(filtered, searchQuery);
    return sortEntriesByPriority(filtered);
  }, [rootWorkFramework.entries, selectedCategory, searchQuery]);

  /* --------------------------------- UI ---------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
      {/* Branded Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700" />
        <div className="relative mx-auto max-w-6xl px-6 py-16 text-white">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm ring-1 ring-white/20 backdrop-blur">
              <span>🌱</span>
              <span className="font-medium">Root Work Framework</span>
            </div>
            <h1 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight">
              Healing-Centered Lesson Design
            </h1>
            <p className="mt-3 text-white/90 max-w-3xl mx-auto">
              Trauma-informed, culturally responsive planning—made practical and beautiful.
            </p>
          </div>

          {/* Tabs */}
          <nav className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setActiveTab('generator')}
              className={cn(
                'rounded-lg px-5 py-2 font-semibold shadow',
                activeTab === 'generator'
                  ? 'bg-white text-indigo-700'
                  : 'bg-white/10 text-white hover:bg-white/20'
              )}
            >
              📚 Lesson Generator
            </button>
            <button
              onClick={() => setActiveTab('framework')}
              className={cn(
                'rounded-lg px-5 py-2 font-semibold shadow',
                activeTab === 'framework'
                  ? 'bg-white text-indigo-700'
                  : 'bg-white/10 text-white hover:bg-white/20'
              )}
            >
              🗂️ Framework Manager
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                'rounded-lg px-5 py-2 font-semibold shadow',
                activeTab === 'dashboard'
                  ? 'bg-white text-indigo-700'
                  : 'bg-white/10 text-white hover:bg-white/20'
              )}
            >
              📊 Professional Dashboard
            </button>
          </nav>
        </div>
      </header>

      {/* Main container */}
      <main className="mx-auto -mt-10 max-w-6xl px-6 pb-16">
        <div className="rounded-2xl bg-white p-6 md:p-8 shadow-xl ring-1 ring-slate-200">
          {/* LESSON GENERATOR TAB */}
          {activeTab === 'generator' && (
            <>
              {view === 'form' && user && (
                <form id="form-section" onSubmit={handleGeneratePlan}>
                  <div className="rounded-xl bg-emerald-50 p-5 text-emerald-900 ring-1 ring-emerald-200 mb-8">
                    <h3 className="text-lg font-bold mb-2">🌱 About the Rootwork Framework</h3>
                    <p>
                      This tool generates comprehensive lesson plans grounded in trauma-informed practices,
                      healing-centered pedagogy, and culturally responsive education.
                    </p>
                    <div className="mt-2 font-semibold">
                      Monthly Usage: {usageInfo.count} / {usageInfo.limit}
                    </div>
                  </div>

                  {error && (
                    <div className="mb-6 rounded-xl bg-rose-50 p-4 text-rose-700 ring-1 ring-rose-200">{error}</div>
                  )}

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-4 mb-4">
                    <div className="md:col-span-1">
                      <label htmlFor="gradeLevel" className="mb-2 block font-semibold text-slate-700">
                        Grade Level *
                      </label>
                      <select
                        id="gradeLevel"
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value)}
                        required
                        className="w-full rounded-lg border-2 border-slate-200 p-3 focus:outline-none focus:border-indigo-500"
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

                    <div className="md:col-span-1">
                      <label htmlFor="duration" className="mb-2 block font-semibold text-slate-700">
                        Duration *
                      </label>
                      <select
                        id="duration"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        required
                        className="w-full rounded-lg border-2 border-slate-200 p-3 focus:outline-none focus:border-indigo-500"
                      >
                        {[...Array(5).keys()].map((i) => (
                          <option key={i + 1} value={i + 1}>
                            {i + 1} Day{i > 0 ? 's' : ''} ({(i + 1) * 90} min)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="unitTitle" className="mb-2 block font-semibold text-slate-700">
                        Unit Title
                      </label>
                      <input
                        id="unitTitle"
                        type="text"
                        value={unitTitle}
                        onChange={(e) => setUnitTitle(e.target.value)}
                        placeholder="e.g., Community Storytelling"
                        className="w-full rounded-lg border-2 border-slate-200 p-3 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-4">
                    <div>
                      <label htmlFor="subject" className="mb-2 block font-semibold text-slate-700">
                        Subject Area(s) *
                      </label>
                      <select
                        id="subject"
                        multiple
                        value={subjects}
                        onChange={handleSubjectChange}
                        required
                        className="h-40 w-full rounded-lg border-2 border-slate-200 p-3 focus:outline-none focus:border-indigo-500"
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
                      <div className="mt-1 text-sm text-slate-500">
                        Hold Ctrl (Windows) or Cmd (Mac) to select multiple subjects.
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label htmlFor="mode" className="mb-2 block font-semibold text-slate-700">
                          Mode
                        </label>
                        <select
                          id="mode"
                          value={mode}
                          onChange={(e) => setMode(e.target.value as BuildPromptArgs['mode'])}
                          className="w-full rounded-lg border-2 border-slate-200 p-3 focus:outline-none focus:border-indigo-500"
                        >
                          <option>Full Unit</option>
                          <option>Single Lesson</option>
                          <option>Project Only</option>
                          <option>Student-Facing Task Only</option>
                          <option>Diagnostic/Exit Activity</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="standards" className="mb-2 block font-semibold text-slate-700">
                          Standards Alignment
                        </label>
                        <textarea
                          id="standards"
                          value={standards}
                          onChange={(e) => setStandards(e.target.value)}
                          rows={3}
                          placeholder="Enter relevant state standards or learning objectives..."
                          className="w-full rounded-lg border-2 border-slate-200 p-3 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="focus" className="mb-2 block font-semibold text-slate-700">
                      Additional Focus Areas
                    </label>
                    <textarea
                      id="focus"
                      value={focus}
                      onChange={(e) => setFocus(e.target.value)}
                      rows={3}
                      placeholder="Special accommodations, therapeutic goals, etc..."
                      className="w-full rounded-lg border-2 border-slate-200 p-3 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-lg bg-indigo-600 py-3 text-lg font-semibold text-white shadow hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {isLoading ? 'Generating…' : 'Generate Comprehensive Lesson Plan'}
                  </button>
                </form>
              )}

              {(view === 'loading' || (view === 'form' && !user)) && (
                <div id="loading-section" className="p-12 text-center">
                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
                  <p className="text-slate-600">Initializing Secure Session...</p>
                </div>
              )}

              {view === 'results' && (
                <div id="results-section">
                  <div className="mb-8 text-center">
                    <h2 className="text-3xl font-bold text-slate-800">
                      ✨ Your Rootwork Framework Lesson Plan is Ready!
                    </h2>
                  </div>
                  <div className="mb-8 flex flex-col justify-center gap-4 sm:flex-row">
                    <button
                      onClick={handleDownload}
                      className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white shadow hover:bg-emerald-700"
                    >
                      📥 Download (.md)
                    </button>
                    <button
                      onClick={handleNewPlan}
                      className="rounded-lg bg-slate-100 px-6 py-3 font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-200"
                    >
                      Create New Plan
                    </button>
                  </div>
                  <div className="prose prose-indigo max-w-none rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{lessonPlan}</ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          )}

          {/* FRAMEWORK MANAGER TAB */}
          {activeTab === 'framework' && (
            <div className="space-y-6">
              <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <h2 className="text-2xl font-bold text-slate-800">Root Work Framework Manager</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEntryForm(true)}
                    className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white shadow hover:bg-indigo-700"
                  >
                    ➕ Add Entry
                  </button>
                  <button
                    onClick={exportFramework}
                    className="rounded-lg bg-slate-100 px-4 py-2 font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-200"
                  >
                    📥 Export CSV
                  </button>
                </div>
              </div>

              {/* Search + Filter */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-lg border-2 border-slate-200 p-3 focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="rounded-lg border-2 border-slate-200 p-3 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All Categories</option>
                  <option value="legal">Legal</option>
                  <option value="educational">Educational</option>
                  <option value="compliance">Compliance</option>
                  <option value="policy">Policy</option>
                  <option value="planning">Planning</option>
                </select>
              </div>

              {/* Add Entry Form */}
              {showEntryForm && (
                <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-6">
                  <h3 className="mb-4 text-lg font-semibold">Add New Root Work Entry</h3>
                  {error && (
                    <div className="mb-4 rounded-xl bg-rose-50 p-3 text-rose-700 ring-1 ring-rose-200">
                      {error}
                    </div>
                  )}

                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Entry Title *"
                      value={newEntry.title}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, title: e.target.value }))}
                      className="rounded-lg border-2 border-slate-200 p-3 focus:outline-none focus:border-indigo-500"
                    />
                    <select
                      value={newEntry.category}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, category: e.target.value as any }))}
                      className="rounded-lg border-2 border-slate-200 p-3 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="legal">Legal</option>
                      <option value="educational">Educational</option>
                      <option value="compliance">Compliance</option>
                      <option value="policy">Policy</option>
                      <option value="planning">Planning</option>
                    </select>
                  </div>

                  <textarea
                    placeholder="Description *"
                    value={newEntry.description}
                    onChange={(e) => setNewEntry((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="mb-4 w-full rounded-lg border-2 border-slate-200 p-3 focus:outline-none focus:border-indigo-500"
                  />

                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <select
                      value={newEntry.priority}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, priority: e.target.value as any }))}
                      className="rounded-lg border-2 border-slate-200 p-3 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="critical">Critical Priority</option>
                    </select>

                    <select
                      value={newEntry.status}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, status: e.target.value as any }))}
                      className="rounded-lg border-2 border-slate-200 p-3 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Assignee"
                      value={newEntry.assignee}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, assignee: e.target.value }))}
                      className="rounded-lg border-2 border-slate-200 p-3 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={addRootWorkEntry}
                      className="rounded-lg bg-indigo-600 px-6 py-2 font-semibold text-white shadow hover:bg-indigo-700"
                    >
                      Add Entry
                    </button>
                    <button
                      onClick={() => {
                        setShowEntryForm(false);
                        setError(null);
                      }}
                      className="rounded-lg bg-slate-100 px-6 py-2 font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Entries List */}
              <div className="space-y-4">
                {filteredEntries.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <p className="text-xl">No entries found</p>
                    <p>Start by adding your first Root Work Framework entry!</p>
                  </div>
                ) : (
                  filteredEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-xl border-2 border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
                    >
                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div className="flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-800">{entry.title}</h3>
                            <span className={cn('rounded-full px-2 py-1 text-xs font-medium', getCategoryColor(entry.category))}>
                              {entry.category}
                            </span>
                            <span className={cn('rounded-full px-2 py-1 text-xs font-medium', getStatusColor(entry.status))}>
                              {entry.status}
                            </span>
                          </div>

                          <p className="mb-2 text-slate-600">{entry.description}</p>

                          {entry.complianceFlags && entry.complianceFlags.length > 0 && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-rose-600">⚠️ Compliance Flags:</span>
                              <ul className="ml-4 list-disc text-sm text-rose-600">
                                {entry.complianceFlags.map((flag, index) => (
                                  <li key={index}>{flag}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="mb-2 flex flex-wrap gap-1">
                            {entry.tags.map((tag, index) => (
                              <span key={index} className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                                {tag}
                              </span>
                            ))}
                          </div>

                          <div className="text-sm text-slate-500">
                            {entry.assignee && <span>Assigned to: {entry.assignee} • </span>}
                            Updated: {formatDate(entry.updatedAt)}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <select
                            value={entry.status}
                            onChange={(e) => updateEntryStatus(entry.id, e.target.value as any)}
                            className="rounded border border-slate-300 p-2 text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="blocked">Blocked</option>
                          </select>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="rounded bg-rose-500 px-3 py-2 text-sm text-white transition hover:bg-rose-600"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* PROFESSIONAL DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800">Professional Development Dashboard</h2>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <h3 className="text-lg font-semibold text-blue-900">Total Entries</h3>
                  <p className="text-3xl font-bold text-blue-600">{rootWorkFramework.entries.length}</p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
                  <h3 className="text-lg font-semibold text-emerald-900">Completed</h3>
                  <p className="text-3xl font-bold text-emerald-600">
                    {rootWorkFramework.entries.filter((e) => e.status === 'completed').length}
                  </p>
                </div>
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
                  <h3 className="text-lg font-semibold text-amber-900">In Progress</h3>
                  <p className="text-3xl font-bold text-amber-600">
                    {rootWorkFramework.entries.filter((e) => e.status === 'in-progress').length}
                  </p>
                </div>
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-6">
                  <h3 className="text-lg font-semibold text-rose-900">Compliance Issues</h3>
                  <p className="text-3xl font-bold text-rose-600">
                    {rootWorkFramework.entries.filter((e) => e.complianceFlags && e.complianceFlags.length > 0).length}
                  </p>
                </div>
              </div>

              {/* Framework Metadata */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
                <h3 className="mb-4 text-lg font-semibold">Framework Information</h3>
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                  <div>
                    <span className="font-medium">Version:</span> {rootWorkFramework.metadata.version}
                  </div>
                  <div>
                    <span className="font-medium">Created by:</span> {rootWorkFramework.metadata.createdBy}
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span> {formatDate(rootWorkFramework.metadata.lastUpdated)}
                  </div>
                </div>
              </div>

              {/* Integration Info */}
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-6">
                <h3 className="mb-4 text-lg font-semibold text-indigo-900">🎓 Thinkific Course Integration</h3>
                <p className="mb-4 text-indigo-800">
                  Your Root Work Framework is ready for integration into your professional development courses. Each
                  framework entry can be transformed into course modules for summer/fall 2025 deployment.
                </p>
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold text-indigo-900">Export Options:</h4>
                    <ul className="mt-2 list-inside list-disc text-indigo-800">
                      <li>CSV for data analysis</li>
                      <li>Lesson plans for course content</li>
                      <li>Compliance reports for audit readiness</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-indigo-900">Professional Features:</h4>
                    <ul className="mt-2 list-inside list-disc text-indigo-800">
                      <li>IDEA, FERPA, HIPAA compliance tracking</li>
                      <li>Priority-based workflow management</li>
                      <li>Educational standards alignment</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
