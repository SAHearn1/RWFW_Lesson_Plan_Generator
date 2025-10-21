'use client';

import React, { FormEvent, useMemo, useState } from 'react';
import { useChat } from 'ai/react';

type GeneratorClientProps = {
  userName?: string | null;
};

export default function GeneratorClient({ userName }: GeneratorClientProps) {
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

  const latestAssistantMessage = useMemo(() => {
    const lastMessage = messages[messages.length - 1];
    return lastMessage?.role === 'assistant' ? lastMessage.content : '';
  }, [messages]);

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!unitTitle || !gradeLevel || subjects.length === 0) {
      return;
    }

    const prompt = `Please generate a lesson plan with the following specifications:\n- Grade Level: ${gradeLevel}\n- Subject(s): ${subjects.join(', ')}\n- Duration: ${days} day(s)\n- Unit Title: ${unitTitle || 'Not specified'}\n- Standards: ${standards || 'Align with relevant national or state standards.'}\n- Additional Focus Areas: ${focus || 'None specified.'}`;

    void append({ role: 'user', content: prompt });
  };

  const handleDownload = async (format: 'pdf' | 'docx') => {
    if (!latestAssistantMessage) return;

    setIsDownloading(true);

    try {
      const response = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown: latestAssistantMessage, title: unitTitle }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate ${format.toUpperCase()} file.`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${unitTitle.replace(/[^a-zA-Z0-9]/g, '_') || 'lesson-plan'}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (downloadError) {
      console.error(downloadError);
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

    return markdown
      .replace(/\[Teacher Note: ([\s\S]*?)\]/g, teacherNoteHtml)
      .replace(/\[Student Note: ([\s\S]*?)\]/g, studentNoteHtml)
      .replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold my-4 font-serif text-brand-deep-canopy">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold mt-8 mb-3 font-serif text-brand-evergreen">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold mt-6 mb-2 text-brand-leaf">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .split('\n')
      .map((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('<') || trimmedLine === '') return line;
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
      <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-serif font-extrabold tracking-tight text-brand-deep-canopy sm:text-5xl">
            Lesson Plan Generator
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-700">
            Weaving academic rigor with healing-centered, biophilic practice.
          </p>
          {userName && (
            <p className="mt-2 text-base text-brand-evergreen">
              Welcome back, <span className="font-semibold">{userName}</span>!
            </p>
          )}
        </header>

        <main className="rounded-2xl bg-white p-6 shadow-xl sm:p-10">
          <form onSubmit={handleFormSubmit} className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="unitTitle"
                  className="mb-2 block text-sm font-medium text-brand-charcoal"
                >
                  Unit Title *
                </label>
                <input
                  type="text"
                  id="unitTitle"
                  value={unitTitle}
                  onChange={(event) => setUnitTitle(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-brand-leaf"
                  placeholder="e.g., 'The Power of Personal Narrative'"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="gradeLevel"
                  className="mb-2 block text-sm font-medium text-brand-charcoal"
                >
                  Grade Level *
                </label>
                <select
                  id="gradeLevel"
                  value={gradeLevel}
                  onChange={(event) => setGradeLevel(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-brand-leaf"
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
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="subjects"
                  className="mb-2 block text-sm font-medium text-brand-charcoal"
                >
                  Subject(s) *
                </label>
                <select
                  id="subjects"
                  multiple
                  value={subjects}
                  onChange={(event) =>
                    setSubjects(
                      Array.from(event.target.selectedOptions, (option) => option.value),
                    )
                  }
                  className="h-40 w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-brand-leaf"
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
                  <option value="Career & Technical Education (CTE)">
                    Career & Technical Education (CTE)
                  </option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Special Education">Special Education</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">Hold Ctrl/Cmd to select multiple.</p>
              </div>
              <div>
                <label
                  htmlFor="days"
                  className="mb-2 block text-sm font-medium text-brand-charcoal"
                >
                  Duration
                </label>
                <select
                  id="days"
                  value={days}
                  onChange={(event) => setDays(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-brand-leaf"
                >
                  <option value="1">1 Day</option>
                  <option value="2">2 Days</option>
                  <option value="3">3 Days</option>
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Note: 1-3 days is recommended to ensure maximum detail and quality.
                </p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="standards"
                  className="mb-2 block text-sm font-medium text-brand-charcoal"
                >
                  Standards Alignment
                </label>
                <textarea
                  id="standards"
                  value={standards}
                  onChange={(event) => setStandards(event.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-brand-leaf"
                  placeholder="Enter relevant state standards, learning objectives, or leave blank..."
                />
              </div>
              <div>
                <label
                  htmlFor="focus"
                  className="mb-2 block text-sm font-medium text-brand-charcoal"
                >
                  Learning Focus &amp; Approach
                </label>
                <textarea
                  id="focus"
                  value={focus}
                  onChange={(event) => setFocus(event.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-brand-leaf"
                  placeholder="Describe any specific focus areas, e.g., 'Project-based learning with a focus on community interviews...'"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-brand-evergreen px-6 py-4 text-lg font-semibold tracking-wide text-white shadow-lg transition-all duration-300 hover:bg-brand-deep-canopy hover:shadow-xl disabled:opacity-50 font-serif"
            >
              {isLoading ? (
                <>
                  <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                  <span>Generating...</span>
                </>
              ) : (
                '🌱 Generate Lesson Plan'
              )}
            </button>
          </form>

          {(error || latestAssistantMessage) && (
            <div className="mt-10 border-t border-slate-200 pt-8">
              {error && (
                <div className="mb-6 rounded-lg border border-red-300 bg-red-100 p-4 text-red-800">
                  {error.message}
                </div>
              )}
              {latestAssistantMessage && (
                <>
                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-slate-50 p-4">
                    <h2 className="font-serif text-xl font-bold text-brand-evergreen">Your Lesson Plan</h2>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleDownload('pdf')}
                        disabled={isDownloading || isLoading}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                        type="button"
                      >
                        {isDownloading ? '...' : '📄'} Download PDF
                      </button>
                      <button
                        onClick={() => handleDownload('docx')}
                        disabled={isDownloading || isLoading}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                        type="button"
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
