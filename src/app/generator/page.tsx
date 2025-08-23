// File: src/app/generator/page.tsx
'use client';

import React, { useState, FormEvent } from 'react';
import { useChat } from 'ai/react';

export default function GeneratorPage() {
  // State for the form inputs
  const [unitTitle, setUnitTitle] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [days, setDays] = useState('3');
  const [standards, setStandards] = useState('');
  const [focus, setFocus] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  // The useChat hook manages the entire streaming conversation.
  const { messages, append, isLoading, error } = useChat({
    api: '/api/lessons',
  });

  // Get the latest message from the assistant for display
  const latestAssistantMessage =
    messages[messages.length - 1]?.role === 'assistant'
      ? messages[messages.length - 1].content
      : '';

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!unitTitle || !gradeLevel || subjects.length === 0) {
      // Add additional user feedback if desired
      return;
    }

    // Construct the user prompt from our form state
    const userPrompt = `
Please generate a lesson plan with the following specifications:
- Grade Level: ${gradeLevel}
- Subject(s): ${subjects.join(', ')}
- Duration: ${days} day(s)
- Unit Title: ${unitTitle || 'Not specified'}
- Standards: ${standards || 'Align with relevant national or state standards.'}
- Additional Focus Areas: ${focus || 'None specified.'}
    `.trim();

    // Send the message to the API
    append({ role: 'user', content: userPrompt });
  };

  // ---- Downloads ----
  const sanitize = (s: string) =>
    (s || 'lesson-plan').replace(/[^a-zA-Z0-9-_]+/g, '_');

  const handleDownload = async (format: 'pdf' | 'docx') => {
    if (!latestAssistantMessage?.trim()) return;
    setIsDownloading(true);
    try {
      const filename = `${sanitize(unitTitle)}.${format}`;
      const route = format === 'pdf' ? '/api/export/pdf' : '/api/export/docx';

      // IMPORTANT: API expects { content, filename }
      const res = await fetch(route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: latestAssistantMessage,
          filename,
        }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(`Failed to generate ${format.toUpperCase()} (${res.status}): ${msg}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // Optional: surface error to the UI
      console.error('Download error:', err);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const renderMarkdown = (markdown: string): string => {
    if (!markdown) return '';
    const teacherNoteHtml =
      '<div class="teacher-note"><p class="font-bold text-brand-leaf">Teacher Note:</p><p>$1</p></div>';
    const studentNoteHtml =
      '<div class="student-note"><p class="font-bold text-blue-800">Student Note:</p><p>$1</p></div>';
    let html = markdown
      .replace(/\[Teacher Note: (.*?)\]/gs, teacherNoteHtml)
      .replace(/\[Student Note: (.*?)\]/gs, studentNoteHtml)
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold my-4 font-serif text-brand-deep-canopy">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-8 mb-3 font-serif text-brand-evergreen">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-6 mb-2 text-brand-leaf">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    return html
      .split('\n')
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('<') || trimmed === '') return line;
        return `<p class="my-3 text-brand-charcoal">${line}</p>`;
      })
      .join('');
  };

  return (
    <div className="min-h-screen bg-brand-canvas-light font-sans text-brand-charcoal">
      <style>{`
        .teacher-note { background-color: #f2f4ca; border-left: 4px solid #3B523A; padding: 1rem; margin: 1.5rem 0; border-radius: 0 8px 8px 0; }
        .student-note { background-color: #eff6ff; border-left: 4px solid #4F7DA5; padding: 1rem; margin: 1.5rem 0; border-radius: 0 8px 8px 0; }
      `}</style>

      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-5xl">
        <header className="text-center mb-12">
          <a href="/" className="inline-block">
            <img
              src="/assets/rwfw-logo-1.jpg"  // <-- fixed path to match your public/assets
              alt="Root Work Framework Logo"
              className="mx-auto h-28 w-28 rounded-full shadow-lg mb-6 border-4 border-white"
            />
          </a>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-deep-canopy tracking-tight font-serif">
            Lesson Plan Generator
          </h1>
          <p className="mt-4 text-lg text-slate-700 max-w-2xl mx-auto">
            Weaving academic rigor with healing-centered, biophilic practice.
          </p>
        </header>

        <main className="bg-white rounded-2xl shadow-xl p-6 sm:p-10">
          <form onSubmit={handleFormSubmit} className="space-y-8">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="unitTitle" className="block text-sm font-medium text-brand-charcoal mb-2">
                  Unit Title *
                </label>
                <input
                  type="text"
                  id="unitTitle"
                  value={unitTitle}
                  onChange={(e) => setUnitTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-leaf"
                  placeholder="e.g., 'The Power of Personal Narrative'"
                  required
                />
              </div>

              <div>
                <label htmlFor="gradeLevel" className="block text-sm font-medium text-brand-charcoal mb-2">
                  Grade Level *
                </label>
                <select
                  id="gradeLevel"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-leaf"
                  required
                >
                  <option value="">Select Grade</option>
                  <option value="Kindergarten">Kindergarten</option>
                  <option value="1st Grade">1st Grade</option>
                  <option value="2nd Grade">2nd Grade</option>
                  <option value="3rd Grade">3rd Grade</option>
                  <option value="4th Grade">4th Grade</option>
                  <option value="5th Grade">5th Grade</option>
                  <option value="6th Grade">6th Grade</option>
                  <option value="7th Grade">7th Grade</option>
                  <option value="8th Grade">8th Grade</option>
                  <option value="9th Grade">9th Grade</option>
                  <option value="10th Grade">10th Grade</option>
                  <option value="11th Grade">11th Grade</option>
                  <option value="12th Grade">12th Grade</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="subjects" className="block text-sm font-medium text-brand-charcoal mb-2">
                  Subject(s) *
                </label>
                <select
                  id="subjects"
                  multiple
                  value={subjects}
                  onChange={(e) => setSubjects(Array.from(e.target.selectedOptions, (opt) => opt.value))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-leaf h-40"
                  required
                >
                  <option value="English Language Arts">English Language Arts</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Science">Science</option>
                  <option value="Social Studies / History">Social Studies / History</option>
                  <option value="Art">Art</option>
                  <option value="Music">Music</option>
                  <option value="Physical Education">Physical Education</option>
                  <option value="Health">Health</option>
                  <option value="World Languages">World Languages</option>
                  <option value="Career & Technical Education (CTE)">Career & Technical Education (CTE)</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Special Education">Special Education</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">Hold Ctrl/Cmd to select multiple.</p>
              </div>

              <div>
                <label htmlFor="days" className="block text-sm font-medium text-brand-charcoal mb-2">
                  Duration
                </label>
                <select
                  id="days"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-leaf"
                >
                  <option value="1">1 Day</option>
                  <option value="2">2 Days</option>
                  <option value="3">3 Days</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Note: 1–3 days is recommended to ensure maximum detail and quality.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="standards" className="block text-sm font-medium text-brand-charcoal mb-2">
                  Standards Alignment
                </label>
                <textarea
                  id="standards"
                  value={standards}
                  onChange={(e) => setStandards(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-leaf"
                  placeholder="Enter relevant state standards, learning objectives, or leave blank..."
                />
              </div>

              <div>
                <label htmlFor="focus" className="block text-sm font-medium text-brand-charcoal mb-2">
                  Learning Focus & Approach
                </label>
                <textarea
                  id="focus"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-leaf"
                  placeholder="Describe any specific focus areas, e.g., 'Project-based learning with a focus on community interviews...'"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-evergreen text-white py-4 px-6 rounded-lg font-semibold hover:bg-brand-deep-canopy disabled:opacity-50 flex items-center justify-center text-lg transition-all duration-300 shadow-lg hover:shadow-xl font-serif tracking-wide"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                  <span>Generating...</span>
                </>
              ) : (
                '🌱 Generate Lesson Plan'
              )}
            </button>
          </form>

          {(error || latestAssistantMessage) && (
            <div className="mt-10 pt-8 border-t border-slate-200">
              {error && (
                <div className="p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg mb-6">
                  {error.message}
                </div>
              )}

              {latestAssistantMessage && (
                <>
                  <div className="flex flex-wrap gap-4 items-center justify-between mb-6 bg-slate-50 p-4 rounded-lg">
                    <h2 className="text-xl font-bold text-brand-evergreen font-serif">
                      Your Lesson Plan
                    </h2>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleDownload('pdf')}
                        disabled={isDownloading || isLoading}
                        className="bg-red-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {isDownloading ? '...' : '📄'} Download PDF
                      </button>
                      <button
                        onClick={() => handleDownload('docx')}
                        disabled={isDownloading || isLoading}
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                      >
                        {isDownloading ? '...' : '📝'} Download DOCX
                      </button>
                    </div>
                  </div>

                  <article
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(latestAssistantMessage) }}
                  />
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
