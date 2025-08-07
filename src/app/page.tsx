'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';

// --- Firebase Configuration ---
const firebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_CONFIG ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG) : {};

// --- Main App Component ---
export default function HomePage() {
  // App State
  const [view, setView] = useState('loading'); // loading, form, results
  const [lessonPlan, setLessonPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // User and Usage State
  const [user, setUser] = useState<User | null>(null);
  const [usageInfo, setUsageInfo] = useState({ count: 0, limit: 5 });

  // Form State
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [duration, setDuration] = useState('3');
  const [unitTitle, setUnitTitle] = useState('');
  const [standards, setStandards] = useState('');
  const [focus, setFocus] = useState('');

  // --- Firebase Authentication Effect ---
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (!firebaseConfig.apiKey) {
        setError("Firebase configuration is missing. Please set it in your Vercel environment variables.");
        setView('form');
        return;
    }
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setView('form');
      } else {
        signInAnonymously(auth).catch(err => {
            setError("Could not sign in. Please try again later.");
            console.error("Anonymous sign-in error:", err);
        });
      }
    });
  }, []);

  // --- Form Input Handlers ---
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = [...e.target.selectedOptions];
    const values = options.map(option => option.value);
    setSubjects(values);
  };

  // --- API Call to Backend Serverless Function ---
  const handleGeneratePlan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
        setError("You are not signed in.");
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
      1.  **Day Title & Essential Question:** A unique, thematic title and question for the day.
      2.  **Learning Target:** A student-friendly "I can..." statement.
      3.  **Standards Alignment:** Connect to relevant academic standards (e.g., CCSS, NGSS) and Social-Emotional Learning standards (CASEL).
      4.  **Trauma-Informed Design Elements:** Explicitly list how physical, psychological, emotional, and cultural safety are ensured.
      5.  **Structured Lesson Flow (90 mins):** Detail activities for Opening Ritual, I Do, We Do, You Do Together, You Do Alone, and Closing Circle, including Teacher and Student Notes.
      6.  **Assessment (Trauma-Informed & Strengths-Based):** Describe formative, diagnostic, and celebratory assessment methods.
      7.  **MTSS Tiered Supports:** Outline Universal (Tier 1), Targeted (Tier 2), and Intensive (Tier 3) supports.
      8.  **Extension and Enrichment:** Provide activities for advanced learners and family/community engagement.
      **Format the entire output in clean, well-structured Markdown.** Use headings, bold text, and lists. Do not include any introductory or concluding conversational text.
    `;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/generatePlan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An unknown error occurred.');
      }
      
      setLessonPlan(data.lessonPlan);
      setUsageInfo(data.usageInfo);
      setView('results');

    } catch (err: any) {
      setError(`Failed to generate lesson plan: ${err.message}`);
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

  // --- Render UI ---
  return (
    <div className="bg-slate-100 font-sans p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg">
        <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8 rounded-t-xl text-center">
          <h1 className="text-4xl font-bold">Rootwork Framework</h1>
          <p className="text-lg opacity-90 mt-2">AI-Powered Curriculum Design for Healing-Centered Classrooms</p>
        </header>

        <main className="p-8">
          {view === 'form' && user && (
            <form id="form-section" onSubmit={handleGeneratePlan}>
              <div className="bg-green-50 border border-green-200 text-green-800 p-5 rounded-lg mb-8">
                <h3 className="text-lg font-bold text-green-900 mb-2">🌱 About the Rootwork Framework</h3>
                <p>This tool generates comprehensive lesson plans grounded in trauma-informed practices, healing-centered pedagogy, and culturally responsive education.</p>
                 <div className="mt-2 font-semibold">Monthly Usage: {usageInfo.count} / {usageInfo.limit}</div>
              </div>

              {error && <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

              {/* Form fields remain the same */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div className="form-group">
                  <label htmlFor="gradeLevel" className="block mb-2 font-semibold text-slate-700">Grade Level *</label>
                  <select id="gradeLevel" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} required className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500">
                    <option value="">Select Grade</option>
                    {[...Array(13).keys()].map(i => {
                      const grade = i === 0 ? 'K' : `${i}th`;
                      const label = i === 0 ? 'Kindergarten' : `${i}${i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th'} Grade`;
                      return <option key={grade} value={label}>{label}</option>
                    })}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="duration" className="block mb-2 font-semibold text-slate-700">Duration *</label>
                  <select id="duration" value={duration} onChange={e => setDuration(e.target.value)} required className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500">
                    {[...Array(5).keys()].map(i => (
                      <option key={i+1} value={i+1}>{i+1} Day{i > 0 ? 's' : ''} ({ (i+1) * 90 } min)</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="unitTitle" className="block mb-2 font-semibold text-slate-700">Unit Title</label>
                  <input type="text" id="unitTitle" value={unitTitle} onChange={e => setUnitTitle(e.target.value)} placeholder="e.g., Community Storytelling" className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"/>
                </div>
              </div>
              <div className="form-group mb-4">
                <label htmlFor="subject" className="block mb-2 font-semibold text-slate-700">Subject Area(s) *</label>
                <select id="subject" multiple value={subjects} onChange={handleSubjectChange} required className="w-full p-3 h-40 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500">
                   {['English Language Arts', 'Mathematics', 'Science', 'Social Studies', 'Art', 'Music', 'Physical Education', 'Special Education', 'STEAM', 'Agriculture', 'Career and Technical Education'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="text-sm text-slate-500 mt-1">Hold Ctrl (Windows) or Cmd (Mac) to select multiple subjects.</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="form-group">
                  <label htmlFor="standards" className="block mb-2 font-semibold text-slate-700">Standards Alignment</label>
                  <textarea id="standards" value={standards} onChange={e => setStandards(e.target.value)} rows="3" placeholder="Enter relevant state standards or learning objectives..." className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"></textarea>
                </div>
                <div className="form-group">
                  <label htmlFor="focus" className="block mb-2 font-semibold text-slate-700">Additional Focus Areas</label>
                  <textarea id="focus" value={focus} onChange={e => setFocus(e.target.value)} rows="3" placeholder="Special accommodations, therapeutic goals, etc..." className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"></textarea>
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white p-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition duration-300 disabled:bg-indigo-300">
                Generate Comprehensive Lesson Plan
              </button>
            </form>
          )}

          {(view === 'loading' || (view === 'form' && !user)) && (
            <div id="loading-section" className="text-center p-12">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Initializing Secure Session...</p>
            </div>
          )}

          {view === 'results' && (
            <div id="results-section">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800">✨ Your Rootwork Framework Lesson Plan is Ready!</h2>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                <button onClick={() => { /* Download functionality can be added here */ }} className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition duration-300">
                  📥 Download (.md)
                </button>
                <button onClick={handleNewPlan} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-300">
                  Create New Plan
                </button>
              </div>
              <div className="prose prose-indigo lg:prose-lg max-w-none rounded-lg border border-slate-200 bg-slate-50 p-6 sm:p-8">
                 <ReactMarkdown>{lessonPlan}</ReactMarkdown>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
