// File: src/app/page.tsx
'use client'; // This directive is essential for using hooks like useState

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

  // --- Main Generator Function ---
  const handleGeneratePlan = async () => {
    // 1. Basic validation
    if (!unitTitle || !gradeLevel || subjects.length === 0) {
      setError('Please fill out all required fields: Unit Title, Grade Level, and Subject(s).');
      setTimeout(() => setError(''), 5000);
      return;
    }
    setError('');
    setIsLoading(true);
    setLessonPlan('');

    try {
      // 2. Call the new, correctly structured API endpoint
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unitTitle,
          gradeLevel,
          subjects,
          days: parseInt(days),
          standards,
          focus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If the server returns an error, display it
        throw new Error(data.error || 'An unknown error occurred.');
      }

      setLessonPlan(data.lessonPlan);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- Helper to render Markdown with special formatting for notes ---
  const renderMarkdown = (markdown: string) => {
    if (!markdown) return null;
    
    const teacherNoteHtml = '<div class="teacher-note"><p class="font-bold text-emerald-800">Teacher Note:</p><p>$1</p></div>';
    const studentNoteHtml = '<div class="student-note"><p class="font-bold text-sky-800">Student Note:</p><p>$1</p></div>';
    
    // Basic markdown to HTML conversion
    let html = markdown
      .replace(/\[Teacher Note: (.*?)\]/gs, teacherNoteHtml)
      .replace(/\[Student Note: (.*?)\]/gs, studentNoteHtml)
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold my-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };


  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <style>{`
        .teacher-note { 
          background-color: #f0fdf4; 
          border-left: 4px solid #10b981; 
          padding: 1rem; 
          margin: 1.5rem 0; 
          border-radius: 0 8px 8px 0;
        }
        .student-note { 
          background-color: #eff6ff; 
          border-left: 4px solid #3b82f6; 
          padding: 1rem; 
          margin: 1.5rem 0; 
          border-radius: 0 8px 8px 0;
        }
      `}</style>
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800">
            Root Work Framework
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Lesson Plan Generator
          </p>
        </header>

        <main>
          {/* --- Generator Form --- */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 mb-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="unitTitle" className="block text-sm font-medium text-gray-700 mb-2">Unit Title *</label>
                <input type="text" id="unitTitle" value={unitTitle} onChange={(e) => setUnitTitle(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="e.g., 'The Power of Personal Narrative'" required />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700 mb-2">Grade Level *</label>
                  <select id="gradeLevel" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500" required>
                    <option value="">Select Grade</option>
                    <option value="9th Grade">9th Grade</option>
                    <option value="10th Grade">10th Grade</option>
                    <option value="11th Grade">11th Grade</option>
                    <option value="12th Grade">12th Grade</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <select id="days" value={days} onChange={(e) => setDays(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500">
                    {[...Array(5)].map((_, i) => <option key={i} value={String(i + 1)}>{i + 1} Day{i > 0 ? 's' : ''}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="subjects" className="block text-sm font-medium text-gray-700 mb-2">Subject(s) *</label>
                <select id="subjects" multiple value={subjects} onChange={(e) => setSubjects(Array.from(e.target.selectedOptions, option => option.value))} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 h-32" required>
                  <option value="English Language Arts">English Language Arts</option>
                  <option value="Social Studies">Social Studies</option>
                  <option value="Science">Science</option>
                  <option value="Art">Art</option>
                  <option value="Special Education">Special Education</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple.</p>
              </div>
              
              <button onClick={handleGeneratePlan} disabled={isLoading} className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    <span>Generating...</span>
                  </>
                ) : '🌱 Generate Lesson Plan'}
              </button>
            </div>
          </div>

          {/* --- Results Display --- */}
          {(isLoading || error || lessonPlan) && (
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
              {error && <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg mb-6">{error}</div>}
              {lessonPlan && (
                <article className="prose prose-lg max-w-none">
                  {renderMarkdown(lessonPlan)}
                </article>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
