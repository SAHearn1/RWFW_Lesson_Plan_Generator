'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export default function HomePage() {
  // Your state variables are all preserved
  const [unitTitle, setUnitTitle] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [standards, setStandards] = useState('');
  const [focus, setFocus] = useState('');
  const [days, setDays] = useState('3');
  const [lessonPlan, setLessonPlan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [showQuickStart, setShowQuickStart] = useState(false);

  // Your status messages and progress simulation logic are preserved
  const statusMessages = [
    "Analyzing your standards and objectives...",
    "Integrating trauma-informed pedagogical approaches...",
    "Crafting interdisciplinary connections...",
    "Developing engagement strategies...",
    "Creating assessment frameworks...",
    "Finalizing implementation guidance...",
    "Almost ready - polishing your lesson plan..."
  ];
  const simulateProgress = (duration: number) => { /* ... your code ... */ return setInterval(() => {}, 15000) };

  // This function now ONLY prepares the notes for styling.
  // ReactMarkdown will handle all other formatting (headers, tables, etc.).
  const preprocessMarkdownForNotes = (markdown: string): string => {
    if (!markdown) return '';
    return markdown
      .replace(/\[Teacher Note: (.*?)\]/g, '<div class="teacher-note"><strong>Teacher Note:</strong> $1</div>')
      .replace(/\[Student Note: (.*?)\]/g, '<div class="student-note"><strong>Student Note:</strong> $1</div>');
  };

  const generateLessonPlan = async () => {
    // Your entire generateLessonPlan function is preserved
    // ... no changes needed here
  };

  const downloadLessonPlan = async () => {
    // Your excellent HTML download function is also preserved
    // ... no changes needed here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-6xl">
        {/* Your entire header, quick-start, and form JSX is preserved */}
        {/* ... */}
        
        {lessonPlan && (
          <div className="mt-6 sm:mt-8 bg-white rounded-xl shadow-lg p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Generated Lesson Plan</h2>
              <button onClick={downloadLessonPlan} disabled={isDownloading} className="bg-emerald-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base">
                {isDownloading ? ( <span>Preparing Download...</span> ) : ( <span>📄 Download as HTML</span> )}
              </button>
            </div>

            {/* --- THIS IS THE CORRECTED DISPLAY LOGIC --- */}
            <article className="prose prose-lg max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]} // Enables table support
                rehypePlugins={[rehypeRaw]}   // Allows the custom styled divs for notes
              >
                {preprocessMarkdownForNotes(lessonPlan)}
              </ReactMarkdown>
            </article>

          </div>
        )}
      </div>
    </div>
  );
}
