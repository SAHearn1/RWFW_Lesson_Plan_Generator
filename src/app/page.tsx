// File: src/app/page.tsx
'use client'; 

import React, { useState, FormEvent } from 'react';
import { useChat } from 'ai/react';

export default function HomePage() {
  const [unitTitle, setUnitTitle] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [days, setDays] = useState('3');
  const [standards, setStandards] = useState('');
  const [focus, setFocus] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const { messages, append, isLoading, error } = useChat({
    api: '/api/lessons',
  });

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
    // Download logic...
  };
  
  const renderMarkdown = (markdown: string): string => {
    // Markdown rendering logic...
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
      <style>{/* Styles */}</style>
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-5xl">
        <header className="text-center mb-12">
          <img
            // --- THIS IS THE FIX ---
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
            {/* All form fields remain the same */}
            <button type="submit" disabled={isLoading} className="w-full bg-brand-evergreen text-white py-4 px-6 rounded-lg font-semibold hover:bg-brand-deep-canopy disabled:opacity-50 ...">
              {isLoading ? 'Generating...' : '🌱 Generate Lesson Plan'}
            </button>
          </form>

          {(error || latestAssistantMessage) && (
            <div className="mt-10 pt-8 border-t border-slate-200">
              {error && <div className="p-4 bg-red-100 ...">{error.message}</div>}
              {latestAssistantMessage && (
                <>
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
