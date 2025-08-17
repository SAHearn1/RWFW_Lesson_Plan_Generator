'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export default function HomePage() {
  // --- CHANGE #1: Add state to manage the view ---
  const [tab, setTab] = useState('generator'); // 'generator' or 'results'

  // All of your other state variables are preserved
  const [unitTitle, setUnitTitle] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  // ... and so on for all your other state variables

  // ... (Your statusMessages and simulateProgress functions are preserved)

  const preprocessMarkdownForNotes = (markdown: string): string => {
    if (!markdown) return '';
    return markdown
      .replace(/\[Teacher Note: (.*?)\]/g, '<div class="teacher-note"><strong>Teacher Note:</strong> $1</div>')
      .replace(/\[Student Note: (.*?)\]/g, '<div class="student-note"><strong>Student Note:</strong> $1</div>');
  };

  const generateLessonPlan = async () => {
    // ... (Your entire robust form validation is preserved)
    if (!unitTitle.trim()) {
      setGenerationStatus("❌ Please enter a unit title.");
      setTimeout(() => setGenerationStatus(''), 5000);
      return;
    }
    // ...

    setIsLoading(true);
    setLessonPlan('');
    setGenerationStatus("Analyzing your standards and objectives...");
    setProgress(0);
    
    // ... (Your progress simulation and try/catch block are preserved)
    try {
      const response = await fetch('/api/generatePlan', { /* ... your fetch options ... */ });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Server responded with an error");
      }
      
      clearInterval(progressInterval);
      
      setProgress(100);
      setGenerationStatus("✅ Complete! Your lesson plan is ready.");
      setLessonPlan(data.lessonPlan);
      
      // --- CHANGE #2: Switch to the results view on success ---
      setTab('results');

    } catch (error: any) {
      // ... (Your excellent error handling is preserved)
    } finally {
      setIsLoading(false);
      // ... (Your finally block is preserved)
    }
  };

  const downloadLessonPlan = async () => {
    // ... (Your excellent HTML download function is preserved)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-6xl">
        {/* Your header and quick-start guide JSX are preserved */}
        {/* ... */}
        
        {/* --- CHANGE #3: Conditional rendering based on the 'tab' state --- */}
        {tab === 'generator' && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
            {/* All of your form and status display JSX goes here */}
            {/* ... */}
          </div>
        )}

        {tab === 'results' && lessonPlan && (
          <div className="mt-6 sm:mt-8 bg-white rounded-xl shadow-lg p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Generated Lesson Plan</h2>
              <div className="flex items-center gap-4">
                {/* --- CHANGE #4: The "New Plan" button is back! --- */}
                <button 
                  onClick={() => setTab('generator')} 
                  className="bg-gray-200 text-gray-800 px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-gray-300"
                >
                  ← New Plan
                </button>
                <button onClick={downloadLessonPlan} disabled={isDownloading} className="bg-emerald-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50">
                  {isDownloading ? 'Preparing...' : '📄 Download as HTML'}
                </button>
              </div>
            </div>
            <article className="prose prose-lg max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
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
