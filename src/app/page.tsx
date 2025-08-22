// File: src/app/page.tsx
'use client'; 

import React, { useState } from 'react';

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
  const [progress, setProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  // Branded status messages aligned with the 5Rs
  const statusMessages = [
    "Establishing Relationships & Routines...",
    "Connecting content to Relevant experiences...",
    "Designing Rigorous, trauma-informed activities...",
    "Curating resources for Reflection...",
    "Finalizing your healing-centered lesson plan...",
  ];

  // --- Main Generator Function ---
  const handleGeneratePlan = async () => {
    if (!unitTitle || !gradeLevel || subjects.length === 0) {
      setError('Please fill out all required fields.');
      setTimeout(() => setError(''), 5000);
      return;
    }
    setError('');
    setIsLoading(true);
    setLessonPlan('');
    setProgress(0);
    setGenerationStatus('Initializing generation...');

    const progressInterval = setInterval(() => {
        setProgress(prev => {
            const newProgress = prev + 10;
            if (newProgress > 95) return 95;
            const messageIndex = Math.floor((newProgress / 100) * statusMessages.length);
            setGenerationStatus(statusMessages[messageIndex]);
            return newProgress;
        });
    }, 2000); // Slower interval for a more deliberate feel

    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitTitle, gradeLevel, subjects, days: parseInt(days), standards, focus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'An unknown error occurred.');
      setLessonPlan(data.lessonPlan);
      setProgress(100);
      setGenerationStatus('✅ Your lesson plan is ready!');
    } catch (err: any) {
      setError(err.message);
      setGenerationStatus('❌ An error occurred.');
    } finally {
      clearInterval(progressInterval);
      setIsLoading(false);
    }
  };

  // --- Download Handler ---
  const handleDownload = async (format: 'pdf' | 'docx') => {
    if (!lessonPlan) return;
    setIsDownloading(true);
    setError('');
    try {
      const response = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: lessonPlan, title: unitTitle }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate ${format.toUpperCase()} file.`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${unitTitle.replace(/[^a-zA-Z0-9]/g, '_') || 'lesson-plan'}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDownloading(false);
    }
  };
  
  // --- Markdown Renderer ---
  const renderMarkdown = (markdown: string): string => {
    if (!markdown) return ''; 
    const teacherNoteHtml = '<div class="teacher-note"><p class="font-bold text-brand-leaf">Teacher Note:</p><p>$1</p></div>';
    const studentNoteHtml = '<div class="student-note"><p class="font-bold text-blue-800">Student Note:</p><p>$1</p></div>';
    let html = markdown
      .replace(/\[Teacher Note: (.*?)\]/gs, teacherNoteHtml)
      .replace(/\[Student Note: (.*?)\]/gs, studentNoteHtml)
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold my-4 font-serif text-brand-deep-canopy">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-8 mb-3 font-serif text-brand-evergreen">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-6 mb-2 text-brand-leaf">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return html.split('\n').map((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('<') || trimmedLine === '') return line;
        return `<p class="my-3 text-brand-charcoal">${line}</p>`;
    }).join('');
  };

  return (
    <div className="min-h-screen bg-brand-canvas-light font-sans text-brand-charcoal">
      <style>{`
        .teacher-note { background-color: #f2f4ca; border-left: 4px solid #3B523A; padding: 1rem; margin: 1.5rem 0; border-radius: 0 8px 8px 0; }
        .student-note { background-color: #eff6ff; border-left: 4px solid #4F7DA5; padding: 1rem; margin: 1.5rem 0; border-radius: 0 8px 8px 0; }
      `}</style>
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-5xl">
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-3 rounded-full bg-white text-brand-evergreen px-5 py-2 mb-4 shadow-sm border border-slate-200">
            <span className="text-2xl">🌱</span>
            <h2 className="font-semibold tracking-wide text-lg font-serif">Root Work Framework</h2>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-deep-canopy tracking-tight font-serif">
            Lesson Plan Generator
          </h1>
          <p className="mt-4 text-lg text-slate-700 max-w-2xl mx-auto">
            Weaving academic rigor with healing-centered, biophilic practice.
          </p>
        </header>

        <main className="bg-white rounded-2xl shadow-xl p-6 sm:p-10">
          <div className="space-y-8">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="unitTitle" className="block text-sm font-medium text-brand-charcoal mb-2">Unit Title *</label>
                <input type="text" id="unitTitle" value={unitTitle} onChange={(e) => setUnitTitle(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-leaf" placeholder="e.g., 'The Power of Personal Narrative'" required />
              </div>
              <div>
                <label htmlFor="gradeLevel" className="block text-sm font-medium text-brand-charcoal mb-2">Grade Level *</label>
                <select id="gradeLevel" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-leaf" required>
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
                <label htmlFor="subjects" className="block text-sm font-medium text-brand-charcoal mb-2">Subject(s) *</label>
                <select id="subjects" multiple value={subjects} onChange={(e) => setSubjects(Array.from(e.target.selectedOptions, option => option.value))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-leaf h-32" required>
                  <option value="English Language Arts">English Language Arts</option>
                  <option value="Social Studies">Social Studies</option>
                  <option value="Science">Science</option>
                  <option value="Art">Art</option>
                  <option value="Special Education">Special Education</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">Hold Ctrl/Cmd to select multiple.</p>
              </div>
              <div>
                <label htmlFor="days" className="block text-sm font-medium text-brand-charcoal mb-2">Duration</label>
                <select id="days" value={days} onChange={(e) => setDays(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-leaf">
                  {[...Array(5)].map((_, i) => <option key={i} value={String(i + 1)}>{i + 1} Day{i > 0 ? 's' : ''}</option>)}
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="standards" className="block text-sm font-medium text-brand-charcoal mb-2">Standards Alignment</label>
                    <textarea id="standards" value={standards} onChange={(e) => setStandards(e.target.value)} rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-leaf" placeholder="Enter relevant state standards, learning objectives, or leave blank..."></textarea>
                </div>
                <div>
                    <label htmlFor="focus" className="block text-sm font-medium text-brand-charcoal mb-2">Learning Focus & Approach</label>
                    <textarea id="focus" value={focus} onChange={(e) => setFocus(e.target.value)} rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-leaf" placeholder="Describe any specific focus areas, e.g., 'Project-based learning with a focus on community interviews...'"></textarea>
                </div>
            </div>
            <button onClick={handleGeneratePlan} disabled={isLoading} className="w-full bg-brand-evergreen text-white py-4 px-6 rounded-lg font-semibold hover:bg-brand-deep-canopy disabled:opacity-50 flex items-center justify-center text-lg transition-all duration-300 shadow-lg hover:shadow-xl font-serif tracking-wide">
              Generate Lesson Plan
            </button>
          </div>

          {(isLoading || error || lessonPlan) && (
            <div className="mt-10 pt-8 border-t border-slate-200">
              {isLoading && (
                <div className="p-6 rounded-lg border bg-brand-canvas-light border-slate-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-leaf"></div>
                    <h3 className="text-lg font-medium text-brand-evergreen font-serif">Building your lesson...</h3>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-brand-leaf h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                  </div>
                  <p className="text-center text-sm text-brand-evergreen mt-2 font-medium">{generationStatus}</p>
                </div>
              )}
              {error && <div className="p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg mb-6">{error}</div>}
              {!isLoading && lessonPlan && (
                <>
                  <div className="flex flex-wrap gap-4 items-center justify-between mb-6 bg-slate-50 p-4 rounded-lg">
                    <h2 className="text-xl font-bold text-brand-evergreen font-serif">Your Lesson Plan is Ready</h2>
                    <div className="flex gap-4">
                      <button onClick={() => handleDownload('pdf')} disabled={isDownloading} className="bg-red-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                        {isDownloading ? '...' : '📄'} Download PDF
                      </button>
                      <button onClick={() => handleDownload('docx')} disabled={isDownloading} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                        {isDownloading ? '...' : '📝'} Download DOCX
                      </button>
                    </div>
                  </div>
                  <article className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(lessonPlan) }} />
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
