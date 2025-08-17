// File: src/app/page.tsx
'use client'; // This directive is essential for using hooks like useState

import React, { useState, useEffect } from 'react';

// --- Main App Component ---
export default function HomePage() {
  // State for the form inputs
  const [unitTitle, setUnitTitle] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [days, setDays] = useState('3');
  const [standards, setStandards] = useState('');
  const [focus, setFocus] = useState('');

  // State for the application's status
  const [lessonPlan, setLessonPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State for the premium loading status
  const [progress, setProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');

  // Branded status messages
  const statusMessages = [
    "Integrating Root Work Framework principles...",
    "Crafting trauma-informed PBL activities...",
    "Scaffolding for diverse learners (MTSS)...",
    "Developing student-facing coaching notes...",
    "Finalizing your healing-centered lesson plan...",
  ];

  // --- Main Generator Function ---
  const handleGeneratePlan = async () => {
    if (!unitTitle || !gradeLevel || subjects.length === 0) {
      setError('Please fill out all required fields: Unit Title, Grade Level, and Subject(s).');
      setTimeout(() => setError(''), 5000);
      return;
    }
    setError('');
    setIsLoading(true);
    setLessonPlan('');
    setProgress(0);
    setGenerationStatus('Initializing generation...');

    // Progress simulation
    const progressInterval = setInterval(() => {
        setProgress(prev => {
            const newProgress = prev + 10;
            if (newProgress > 95) {
                return 95; // Stop just before 100%
            }
            // Update status message based on progress
            const messageIndex = Math.floor((newProgress / 100) * statusMessages.length);
            setGenerationStatus(statusMessages[messageIndex]);
            return newProgress;
        });
    }, 1500); // Update every 1.5 seconds

    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitTitle, gradeLevel, subjects, days: parseInt(days), standards, focus }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'An unknown error occurred.');
      
      setLessonPlan(data.lessonPlan);
      setProgress(100); // Complete progress
      setGenerationStatus('✅ Your lesson plan is ready!');

    } catch (err: any) {
      setError(err.message);
      setGenerationStatus('❌ An error occurred.');
    } finally {
      clearInterval(progressInterval); // Stop the simulation
      setIsLoading(false);
    }
  };
  
  const renderMarkdown = (markdown: string): string => {
    if (!markdown) return ''; 
    const teacherNoteHtml = '<div class="teacher-note"><p class="font-bold text-emerald-800">Teacher Note:</p><p>$1</p></div>';
    const studentNoteHtml = '<div class="student-note"><p class="font-bold text-sky-800">Student Note:</p><p>$1</p></div>';
    let html = markdown
      .replace(/\[Teacher Note: (.*?)\]/gs, teacherNoteHtml)
      .replace(/\[Student Note: (.*?)\]/gs, studentNoteHtml)
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold my-4 text-slate-800">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-6 mb-3 text-slate-700">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-5 mb-2 pb-2 border-b border-slate-200 text-slate-600">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return html.split('\n').map((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('<') || trimmedLine === '') return line;
        return `<p class="my-3">${line}</p>`;
    }).join('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-purple-50 font-sans">
      <style>{`
        .teacher-note { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 1rem; margin: 1.5rem 0; border-radius: 0 8px 8px 0; }
        .student-note { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 1rem; margin: 1.5rem 0; border-radius: 0 8px 8px 0; }
      `}</style>
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-5xl">
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-3 rounded-full bg-emerald-100 text-emerald-800 px-4 py-2 mb-4">
            <span className="text-xl">🌱</span>
            <h2 className="font-semibold tracking-wide">Root Work Framework</h2>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight">Lesson Plan Generator</h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">Create professionally designed, trauma-informed lesson plans that embody your educational philosophy.</p>
        </header>

        <main className="bg-white rounded-2xl shadow-xl p-6 sm:p-10">
          <div className="space-y-8">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="unitTitle" className="block text-sm font-medium text-slate-700 mb-2">Unit Title *</label>
                <input type="text" id="unitTitle" value={unitTitle} onChange={(e) => setUnitTitle(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="e.g., 'The Power of Personal Narrative'" required />
              </div>
              <div>
                <label htmlFor="gradeLevel" className="block text-sm font-medium text-slate-700 mb-2">Grade Level *</label>
                <select id="gradeLevel" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" required>
                  <option value="">Select Grade</option>
                  <option value="9th Grade">9th Grade</option>
                  <option value="10th Grade">10th Grade</option>
                  <option value="11th Grade">11th Grade</option>
                  <option value="12th Grade">12th Grade</option>
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
               <div>
                <label htmlFor="subjects" className="block text-sm font-medium text-slate-700 mb-2">Subject(s) *</label>
                <select id="subjects" multiple value={subjects} onChange={(e) => setSubjects(Array.from(e.target.selectedOptions, option => option.value))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 h-32" required>
                  <option value="English Language Arts">English Language Arts</option>
                  <option value="Social Studies">Social Studies</option>
                  <option value="Science">Science</option>
                  <option value="Art">Art</option>
                  <option value="Special Education">Special Education</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">Hold Ctrl/Cmd to select multiple.</p>
              </div>
              <div>
                <label htmlFor="days" className="block text-sm font-medium text-slate-700 mb-2">Duration</label>
                <select id="days" value={days} onChange={(e) => setDays(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                  {[...Array(5)].map((_, i) => <option key={i} value={String(i + 1)}>{i + 1} Day{i > 0 ? 's' : ''}</option>)}
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="standards" className="block text-sm font-medium text-slate-700 mb-2">Standards Alignment</label>
                    <textarea id="standards" value={standards} onChange={(e) => setStandards(e.target.value)} rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Enter relevant state standards, learning objectives, or leave blank for AI suggestions..."></textarea>
                </div>
                <div>
                    <label htmlFor="focus" className="block text-sm font-medium text-slate-700 mb-2">Learning Focus & Approach</label>
                    <textarea id="focus" value={focus} onChange={(e) => setFocus(e.target.value)} rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Describe any specific focus areas, e.g., 'Project-based learning with a focus on community interviews' or 'Include accommodations for ELL students.'"></textarea>
                </div>
            </div>
            <button onClick={handleGeneratePlan} disabled={isLoading} className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg transition-all duration-300 shadow-md hover:shadow-lg">
              Generate Lesson Plan
            </button>
          </div>

          {(isLoading || error || lessonPlan) && (
            <div className="mt-10 pt-8 border-t border-slate-200">
              {isLoading && (
                <div className="p-6 rounded-lg border bg-emerald-50 border-emerald-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                    <h3 className="text-lg font-medium text-emerald-800">Building your lesson...</h3>
                  </div>
                  <div className="w-full bg-emerald-200 rounded-full h-2.5">
                    <div className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                  </div>
                  <p className="text-center text-sm text-emerald-700 mt-2 font-medium">{generationStatus}</p>
                </div>
              )}
              {error && <div className="p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg mb-6">{error}</div>}
              {!isLoading && lessonPlan && (
                <article className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(lessonPlan) }} />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
