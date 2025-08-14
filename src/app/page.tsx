// File: src/app/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { onAuthStateChanged, User, signOut, getIdToken } from 'firebase/auth';
import { auth } from '../firebase';
import { masterPrompt } from '../masterPrompt';
import dynamic from 'next/dynamic';

const SignIn = dynamic(() => import('../components/SignIn'), { ssr: false });

type Tab = 'generator' | 'results';
type Viewer = 'teacher' | 'student' | 'print';

export default function HomePage() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  // UI state
  const [tab, setTab] = useState<Tab>('generator');
  const [viewer, setViewer] = useState<Viewer>('teacher');

  // Form state
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [duration, setDuration] = useState('3');
  const [unitTitle, setUnitTitle] = useState('');
  const [standards, setStandards] = useState('');
  const [focus, setFocus] = useState('');

  // Generation state
  const [isLoading, setIsLoading] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = () => {
    signOut(auth).catch((error) => console.error('Sign Out Error', error));
  };

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
    e.preventDefault();
    setError(null);

    if (!currentUser) return setError('You must be signed in.');
    if (!gradeLevel) return setError('Please select a grade level.');
    if (subjects.length === 0) return setError('Please select at least one subject.');

    setIsLoading(true);

    try {
      const token = await getIdToken(currentUser);

      const userPrompt = `Grade Level: ${gradeLevel}\nSubject(s): ${subjects.join(', ')}\nDuration: ${duration} day(s)\nUnit Title: ${unitTitle || 'Not specified'}\nStandards: ${standards || 'Align with relevant standards'}\nAdditional Focus: ${focus || 'None'}`;

      const payload = {
        systemPrompt: masterPrompt,
        userPrompt: userPrompt,
      };

      const res = await fetch('/api/generatePlan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate plan.');
      if (!data.lessonPlan) throw new Error('Empty response from generator.');
      
      setLessonPlan(data.lessonPlan);
      setTab('results');
    } catch (err: any) {
      setError(err?.message || 'Failed to generate lesson plan.');
    } finally {
      setIsLoading(false);
    }
  };

  const header = (
    <header className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-600 to-purple-700" />
      <div className="relative container mx-auto px-6 py-10 text-white">
        <div className="flex justify-between items-center">
          <div className="w-24"></div> {/* Spacer */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Healing-Centered Lesson Design
            </h1>
            <p className="mt-3 text-white/90 max-w-3xl mx-auto">
              S.T.E.A.M. Powered, Trauma Informed, Project Based lesson planning.
            </p>
          </div>
          <div className="w-24 flex justify-end">
            {currentUser && (
                <button 
                  onClick={handleSignOut} 
                  className="bg-white/20 text-white font-semibold py-2 px-4 rounded-lg hover:bg-white/30 transition">
                  Sign Out
                </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );

  if (!authLoaded) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-purple-50">
      {header}
      <main className="container mx-auto px-6 -mt-10 pb-16">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6 md:p-8">
          {!currentUser ? (
            <SignIn />
          ) : (
            <>
              {tab === 'generator' && (
                <form onSubmit={handleGeneratePlan}>
                  {error && <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">{error}</div>}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    <div>
                      <label className="block mb-2 font-semibold text-slate-700">Grade Level *</label>
                      <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500" required>
                        <option value="">Select Grade</option>
                        {['Kindergarten', ...Array.from({ length: 12 }, (_, i) => `${i + 1}${[1, 2, 3].includes(i + 1) ? (i + 1 === 1 ? 'st' : i + 1 === 2 ? 'nd' : 'rd') : 'th'} Grade`)].map((g) => (<option key={g} value={g}>{g}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold text-slate-700">Duration *</label>
                      <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500">
                        {[1, 2, 3, 4, 5].map((d) => (<option key={d} value={String(d)}>{d} Day{d > 1 ? 's' : ''}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold text-slate-700">Unit Title</label>
                      <input type="text" value={unitTitle} onChange={(e) => setUnitTitle(e.target.value)} placeholder="e.g., Community Storytelling" className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block mb-2 font-semibold text-slate-700">Subject Area(s) *</label>
                    <select multiple value={subjects} onChange={handleSubjectChange} className="w-full p-3 h-40 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500" required>
                      {['English Language Arts', 'Mathematics', 'Science', 'Social Studies', 'Art', 'Music', 'Physical Education', 'Special Education', 'STEAM', 'Agriculture', 'Career and Technical Education'].map((s) => (<option key={s} value={s}>{s}</option>))}
                    </select>
                    <div className="text-sm text-slate-500 mt-1">Use Cmd/Ctrl to multi-select.</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block mb-2 font-semibold text-slate-700">Standards Alignment</label>
                      <textarea rows={3} value={standards} onChange={(e) => setStandards(e.target.value)} placeholder="Enter relevant state standards or learning objectives…" className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="block mb-2 font-semibold text-slate-700">Additional Focus Areas</label>
                      <textarea rows={3} value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Special accommodations, therapeutic goals, etc." className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full py-3 text-lg font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition disabled:opacity-60">
                    {isLoading ? 'Generating…' : 'Generate Comprehensive Lesson Plan'}
                  </button>
                </form>
              )}
              {tab === 'results' && (
                <div>
                  <div className="flex flex-wrap gap-2 justify-end mb-4">
                    <button className="px-4 py-2 rounded-xl bg-white ring-1 ring-slate-200 hover:bg-slate-50" onClick={() => setTab('generator')}>New Plan</button>
                    <button className="px-4 py-2 rounded-xl bg-white ring-1 ring-slate-200 hover:bg-slate-50" onClick={handleDownloadMarkdown}>Download .md</button>
                  </div>
                  <div className="prose max-w-none">
                    <ReactMarkdown>{lessonPlan}</ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
