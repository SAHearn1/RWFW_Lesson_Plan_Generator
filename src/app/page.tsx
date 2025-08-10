'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';

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

export default function HomePage() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'generator' | 'framework' | 'dashboard'>('generator');

  // Lesson Generator State
  const [view, setView] = useState<'loading' | 'form' | 'results'>('loading');
  const [lessonPlan, setLessonPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  // Root Work Framework State
  const [rootWorkFramework, setRootWorkFramework] = useState<RootWorkFramework>({
    entries: [],
    metadata: { lastUpdated: new Date(), version: '1.0.0', createdBy: 'Root Work Framework User' },
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<RootWorkEntry['category'] | 'all'>('all');
  const [showEntryForm, setShowEntryForm] = useState(false);

  // --- EFFECTS ---

  // Load saved framework once
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

  // --- Handlers ---

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = Array.from(e.target.selectedOptions);
    const values = options.map((o) => o.value);
    setSubjects(values);
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

    // Reset form
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

    const prompt = `
As an expert in curriculum design specializing in trauma-informed, healing-centered, and culturally responsive education, generate a comprehensive lesson plan using the "Rootwork Framework".

**Lesson Details:**
- **Grade Level:** ${gradeLevel}
- **Subject Area(s):** ${subjects.join(', ')}
- **Duration:** ${duration} days (90 minutes per day)
- **Unit Title:** ${unitTitle || 'Rooted in Me: Exploring Culture, Identity, and Expression'}
- **Standards Alignment Input:** ${standards || 'Please align with common core or relevant state standards.'}
- **Additional Focus Areas (accommodations, therapeutic goals):** ${focus || 'None specified.'}

**Required Framework Components (for each day):**
1. **Day Title & Essential Question:** A unique, thematic title and question for the day.
2. **Learning Target:** A student-friendly "I can..." statement.
3. **Standards Alignment:** Connect to relevant academic standards (e.g., CCSS, NGSS) and SEL standards (CASEL).
4. **Trauma-Informed Design Elements:** Explicitly list how physical, psychological, emotional, and cultural safety are ensured.
5. **Structured Lesson Flow (90 mins):** Detail Opening Ritual, I Do, We Do, You Do Together, You Do Alone, and Closing Circle, with Teacher/Student Notes.
6. **Assessment (Trauma-Informed & Strengths-Based):** Formative, diagnostic, and celebratory assessments.
7. **MTSS Tiered Supports:** Universal (Tier 1), Targeted (Tier 2), and Intensive (Tier 3) supports.
8. **Extension & Enrichment:** Activities for advanced learners and family/community engagement.

**Format the entire output in clean, well-structured Markdown.** Use headings, bold text, and lists. Do not include any conversational text.
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
    } catch (err: any) {
      setError(`Failed to generate lesson plan: ${err?.message || 'Unknown error'}`);
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

  // New Entry Form State (placed after funcs to avoid hoisting noise)
  const [newEntry, setNewEntry] = useState<Partial<RootWorkEntry>>({
    title: '',
    description: '',
    category: 'educational',
    priority: 'medium',
    status: 'pending',
    tags: [],
    assignee: '',
  });

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    let filtered = rootWorkFramework.entries;
    if (selectedCategory !== 'all') filtered = filtered.filter((e) => e.category === selectedCategory);
    if (searchQuery) filtered = searchEntries(filtered, searchQuery);
    return sortEntriesByPriority(filtered);
  }, [rootWorkFramework.entries, selectedCategory, searchQuery]);

  // --- UI ---
  return (
    <div className="min-h-screen">
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
              Healing-Centered Lesson Design
            </h1>
            <p className="mt-3 text-white/90 max-w-3xl mx-auto">
              Trauma-informed, culturally responsive planning—made practical and beautiful.
            </p>
          </div>

          {/* Navigation Tabs */}
          <nav className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setActiveTab('generator')}
              className={cn(activeTab === 'generator' ? 'btn-primary' : 'btn-ghost text-white/90 hover:text-white')}
            >
              📚 Lesson Generator
            </button>
            <button
              onClick={() => setActiveTab('framework')}
              className={cn(activeTab === 'framework' ? 'btn-primary' : 'btn-ghost text-white/90 hover:text-white')}
            >
              🗂️ Framework Manager
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={cn(activeTab === 'dashboard' ? 'btn-primary' : 'btn-ghost text-white/90 hover:text-white')}
            >
              📊 Professional Dashboard
            </button>
          </nav>
        </div>
      </header>

      {/* Main card container */}
      <main className="container mx-auto px-6 -mt-10 pb-16">
        <div className="card p-6 md:p-8">
          {/* LESSON GENERATOR TAB */}
          {activeTab === 'generator' && (
            <>
              {view === 'form' && user && (
                <form id="form-section" onSubmit={handleGeneratePlan}>
                  <div className="bg-emerald-50 ring-1 ring-emerald-200 text-emerald-900 p-5 rounded-xl mb-8">
                    <h3 className="text-lg font-bold mb-2">🌱 About the Rootwork Framework</h3>
                    <p>
                      This tool generates comprehensive lesson plans grounded in trauma-informed practices, healing-centered
                      pedagogy, and culturally responsive education.
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
                            {i + 1} Day{i > 0 ? 's' : ''} {(i + 1) * 90} min
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
                    className="btn-primary w-full py-3 text-lg disabled:opacity-60"
                  >
                    {isLoading ? 'Generating…' : 'Generate Comprehensive Lesson Plan'}
                  </button>
                </form>
              )}

              {(view === 'loading' || (view === 'form' && !user)) && (
                <div id="loading-section" className="text-center p-12">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-600">Initializing Secure Session...</p>
                </div>
              )}

              {view === 'results' && (
                <div id="results-section">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-slate-800">
                      ✨ Your Rootwork Framework Lesson Plan is Ready!
                    </h2>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                    <button onClick={handleDownload} className="btn-primary">
                      📥 Download (.md)
                    </button>
                    <button onClick={handleNewPlan} className="btn-ghost">
                      Create New Plan
                    </button>
                  </div>
                  <div className="prose prose-brand lg:prose-lg max-w-none rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                    <ReactMarkdown>{lessonPlan}</ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          )}

          {/* FRAMEWORK MANAGER TAB */}
          {activeTab === 'framework' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Root Work Framework Manager</h2>
                <div className="flex gap-2">
                  <button onClick={() => setShowEntryForm(true)} className="btn-primary">
                    ➕ Add Entry
                  </button>
                  <button onClick={exportFramework} className="btn-ghost">
                    📥 Export CSV
                  </button>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
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
                <div className="bg-slate-50 p-6 rounded-xl border-2 border-slate-200">
                  <h3 className="text-lg font-semibold mb-4">Add New Root Work Entry</h3>
                  {error && (
                    <div className="bg-rose-50 ring-1 ring-rose-200 text-rose-700 p-3 rounded-xl mb-4">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Entry Title *"
                      value={newEntry.title}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, title: e.target.value }))}
                      className="p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                    />
                    <select
                      value={newEntry.category}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, category: e.target.value as any }))}
                      className="p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
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
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 mb-4"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <select
                      value={newEntry.priority}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, priority: e.target.value as any }))}
                      className="p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="critical">Critical Priority</option>
                    </select>

                    <select
                      value={newEntry.status}
                      onChange={(e) => setNewEntry((prev) => ({ ...prev, status: e.target.value as any }))}
                      className="p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
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
                      className="p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={addRootWorkEntry} className="btn-primary">
                      Add Entry
                    </button>
                    <button
                      onClick={() => {
                        setShowEntryForm(false);
                        setError(null);
                      }}
                      className="btn-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Entries List */}
              <div className="space-y-4">
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <p className="text-xl">No entries found</p>
                    <p>Start by adding your first Root Work Framework entry!</p>
                  </div>
                ) : (
                  filteredEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-white border-2 border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-slate-800">{entry.title}</h3>
                            <span className={cn('badge', getCategoryColor(entry.category))}>{entry.category}</span>
                            <span className={cn('badge', getStatusColor(entry.status))}>{entry.status}</span>
                          </div>

                          <p className="text-slate-600 mb-2">{entry.description}</p>

                          {entry.complianceFlags && entry.complianceFlags.length > 0 && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-rose-600">⚠️ Compliance Flags:</span>
                              <ul className="text-sm text-rose-600 ml-4 list-disc">
                                {entry.complianceFlags.map((flag, index) => (
                                  <li key={index}>{flag}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-1 mb-2">
                            {entry.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
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
                            className="p-2 border border-slate-300 rounded text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="blocked">Blocked</option>
                          </select>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="bg-rose-500 text-white px-3 py-2 rounded hover:bg-rose-600 transition duration-300 text-sm"
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-900">Total Entries</h3>
                  <p className="text-3xl font-bold text-blue-600">{rootWorkFramework.entries.length}</p>
                </div>
                <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-200">
                  <h3 className="text-lg font-semibold text-emerald-900">Completed</h3>
                  <p className="text-3xl font-bold text-emerald-600">
                    {rootWorkFramework.entries.filter((e) => e.status === 'completed').length}
                  </p>
                </div>
                <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
                  <h3 className="text-lg font-semibold text-amber-900">In Progress</h3>
                  <p className="text-3xl font-bold text-amber-600">
                    {rootWorkFramework.entries.filter((e) => e.status === 'in-progress').length}
                  </p>
                </div>
                <div className="bg-rose-50 p-6 rounded-lg border border-rose-200">
                  <h3 className="text-lg font-semibold text-rose-900">Compliance Issues</h3>
                  <p className="text-3xl font-bold text-rose-600">
                    {rootWorkFramework.entries.filter((e) => e.complianceFlags && e.complianceFlags.length > 0).length}
                  </p>
                </div>
              </div>

              {/* Framework Metadata */}
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h3 className="text-lg font-semibold mb-4">Framework Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
              <div className="bg-brand-50 p-6 rounded-lg border border-brand-200">
                <h3 className="text-lg font-semibold text-brand-900 mb-4">🎓 Thinkific Course Integration</h3>
                <p className="text-brand-800 mb-4">
                  Your Root Work Framework is ready for integration into your professional development courses. Each
                  framework entry can be transformed into course modules for summer/fall 2025 deployment.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-brand-900">Export Options:</h4>
                    <ul className="list-disc list-inside text-brand-800 mt-2">
                      <li>CSV for data analysis</li>
                      <li>Lesson plans for course content</li>
                      <li>Compliance reports for audit readiness</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-900">Professional Features:</h4>
                    <ul className="list-disc list-inside text-brand-800 mt-2">
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
