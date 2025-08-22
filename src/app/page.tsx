// File: src/app/page.tsx
'use client'; 

import React, { useState } from 'react';

export default function HomePage() {
  const [unitTitle, setUnitTitle] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [days, setDays] = useState('3');
  const [standards, setStandards] = useState('');
  const [focus, setFocus] = useState('');
  const [lessonPlan, setLessonPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  // --- UPDATED: Simplified loading state for streaming ---
  const handleGeneratePlan = async () => {
    if (!unitTitle || !gradeLevel || subjects.length === 0) {
      setError('Please fill out all required fields.');
      setTimeout(() => setError(''), 5000);
      return;
    }
    setError('');
    setIsLoading(true);
    setLessonPlan(''); // Clear previous plan

    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitTitle, gradeLevel, subjects, days: parseInt(days), standards, focus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An unknown error occurred.');
      }
      
      if (!response.body) {
        throw new Error('The response body is empty.');
      }

      // --- THIS IS THE KEY UPGRADE ---
      // Read the data from the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        // Append the new chunk to the existing lesson plan text
        setLessonPlan((prev) => prev + chunkValue);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

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
          <img
            src="/images/RWFW Logo 1.jpg"
            alt="Root Work Framework Logo"
            className="mx-auto h-28 w-28 rounded-full shadow-lg mb-6 border-4 border-white"
          />
          <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-deep-canopy tracking-tight font-serif">
            Root Work Framework
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
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  <span>Generating...</span>
                </>
              ) : '🌱 Generate Lesson Plan'}
            </button>
          </div>

          {/* --- UPDATED: Simplified Results Display for Streaming --- */}
          {(error || lessonPlan) && (
            <div className="mt-10 pt-8 border-t border-slate-200">
              {error && <div className="p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg mb-6">{error}</div>}
              {lessonPlan && (
                <>
                  <div className="flex flex-wrap gap-4 items-center justify-between mb-6 bg-slate-50 p-4 rounded-lg">
                    <h2 className="text-xl font-bold text-brand-evergreen font-serif">Your Lesson Plan</h2>
                    <div className="flex gap-4">
                      <button onClick={() => handleDownload('pdf')} disabled={isDownloading || isLoading} className="bg-red-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
                        {isDownloading ? '...' : '📄'} Download PDF
                      </button>
                      <button onClick={() => handleDownload('docx')} disabled={isDownloading || isLoading} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
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
