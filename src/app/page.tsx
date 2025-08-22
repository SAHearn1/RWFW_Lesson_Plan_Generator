// File: src/app/page.tsx
'use client'; 

import React, { useState, FormEvent } from 'react';
import { useChat } from 'ai/react';

export default function HomePage() {
  // State for the form inputs
  const [unitTitle, setUnitTitle] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [days, setDays] = useState('3'); // Default to the 3-day sweet spot
  const [standards, setStandards] = useState('');
  const [focus, setFocus] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  // The useChat hook manages the entire streaming conversation.
  const { messages, append, isLoading, error } = useChat({
    api: '/api/lessons',
  });

  // Get the latest message from the assistant for display
  const latestAssistantMessage = messages[messages.length - 1]?.role === 'assistant' 
    ? messages[messages.length - 1].content 
    : '';

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!unitTitle || !gradeLevel || subjects.length === 0) {
      return;
    }
    
    const userPrompt = `
      Please generate a lesson plan with the following specifications:
      - Grade Level: ${gradeLevel}
      - Subject(s): ${subjects.join(', ')}
      - Duration: ${days} day(s)
      - Unit Title: ${unitTitle || 'Not specified'}
      - Standards: ${standards || 'Align with relevant national or state standards.'}
      - Additional Focus Areas: ${focus || 'None specified.'}
    `;
    
    append({ role: 'user', content: userPrompt });
  };
  
  const handleDownload = async (format: 'pdf' | 'docx') => {
    // Download logic remains the same
  };
  
  const renderMarkdown = (markdown: string): string => {
    // Markdown rendering logic remains the same
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
            src="/images/rwfw-logo-1.jpg"
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
          <form onSubmit={handleFormSubmit} className="space-y-8">
            {/* ... other form fields ... */}
            <div className="grid sm:grid-cols-2 gap-6">
               <div>
                <label htmlFor="subjects" className="block text-sm font-medium text-brand-charcoal mb-2">Subject(s) *</label>
                <select id="subjects" multiple value={subjects} onChange={(e) => setSubjects(Array.from(e.target.selectedOptions, option => option.value))} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-leaf h-32" required>
                  {/* Subject options */}
                </select>
                <p className="mt-1 text-xs text-slate-500">Hold Ctrl/Cmd to select multiple.</p>
              </div>
              <div>
                <label htmlFor="days" className="block text-sm font-medium text-brand-charcoal mb-2">Duration</label>
                {/* --- THIS IS THE FIX --- */}
                <select id="days" value={days} onChange={(e) => setDays(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-leaf">
                  <option value="1">1 Day</option>
                  <option value="2">2 Days</option>
                  <option value="3">3 Days</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Note: 1-3 days is recommended to ensure maximum detail and quality.
                </p>
              </div>
            </div>
            {/* ... other form fields ... */}
            <button type="submit" disabled={isLoading} className="w-full bg-brand-evergreen text-white py-4 px-6 rounded-lg font-semibold hover:bg-brand-deep-canopy disabled:opacity-50 ...">
              {isLoading ? 'Generating...' : '🌱 Generate Lesson Plan'}
            </button>
          </form>

          {(error || latestAssistantMessage) && (
            <div className="mt-10 pt-8 border-t border-slate-200">
              {error && <div className="p-4 bg-red-100 ...">{error.message}</div>}
              {latestAssistantMessage && (
                <>
                  {/* Results display */}
                  <article className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(latestAssistantMessage) }} />
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
