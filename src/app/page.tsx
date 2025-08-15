'use client';

import { useState } from 'react';

export default function HomePage() {
  // All of your state variables are preserved
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

  const statusMessages = [
    "Analyzing your standards and objectives...",
    "Integrating trauma-informed pedagogical approaches...",
    "Crafting interdisciplinary connections...",
    "Developing engagement strategies...",
    "Creating assessment frameworks...",
    "Finalizing implementation guidance...",
    "Almost ready - polishing your lesson plan..."
  ];

  const simulateProgress = (duration: number) => {
    const interval = 15000;
    const steps = Math.floor(duration / interval);
    let currentStep = 0;
    const progressInterval = setInterval(() => {
      if (currentStep < steps) {
        const progressPercent = ((currentStep + 1) / steps) * 100;
        setProgress(Math.min(progressPercent, 95));
        if (currentStep < statusMessages.length) {
          setGenerationStatus(statusMessages[currentStep]);
        }
        currentStep++;
      } else {
        setGenerationStatus("Almost ready - polishing your lesson plan...");
        clearInterval(progressInterval);
      }
    }, interval);
    return progressInterval;
  };

  // --- ADDITION 1: Helper function to convert Markdown to styled HTML ---
  const convertMarkdownToHtml = (markdown: string) => {
    if (!markdown) return '';
    return markdown.split('\n').map(line => {
      let htmlLine = line
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[Teacher Note: (.*?)\]/g, '<div class="teacher-note"><strong>Teacher Note:</strong> $1</div>')
        .replace(/\[Student Note: (.*?)\]/g, '<div class="student-note"><strong>Student Note:</strong> $1</div>');
      
      if (htmlLine.trim() && !htmlLine.startsWith('<h') && !htmlLine.startsWith('<div')) {
        htmlLine = `<p>${htmlLine}</p>`;
      }
      
      return htmlLine;
    }).join('');
  };

  const generateLessonPlan = async () => {
    // Your robust form validation (excellent!)
    if (!unitTitle.trim()) {
      setGenerationStatus("❌ Please enter a unit title. Try something like 'Building Communities' or 'Environmental Science Connections'");
      setTimeout(() => setGenerationStatus(''), 5000);
      return;
    }
    if (!gradeLevel) {
      setGenerationStatus("❌ Please select a grade level for your lesson plan.");
      setTimeout(() => setGenerationStatus(''), 5000);
      return;
    }
    if (subjects.length === 0) {
      setGenerationStatus("❌ Please select at least one subject. For interdisciplinary units, select multiple subjects!");
      setTimeout(() => setGenerationStatus(''), 5000);
      return;
    }
    if (!days) {
      setGenerationStatus("❌ Please select the number of days for your lesson plan.");
      setTimeout(() => setGenerationStatus(''), 5000);
      return;
    }

    setIsLoading(true);
    setLessonPlan('');
    setGenerationStatus("Analyzing your standards and objectives...");
    setProgress(0);
    
    const estimatedDuration = Math.max(parseInt(days) * 60000, 120000);
    const progressInterval = simulateProgress(estimatedDuration);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);
      
      const response = await fetch('/api/generatePlan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unitTitle,
          gradeLevel,
          subjects,
          standards,
          focus,
          days: parseInt(days),
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Server responded with an error");
      }
      
      clearInterval(progressInterval);
      
      setProgress(100);
      setGenerationStatus("✅ Complete! Your lesson plan is ready.");
      setLessonPlan(data.lessonPlan);

    } catch (error: any) {
      console.error('Error generating lesson plan:', error);
      clearInterval(progressInterval);
      
      let userFriendlyMessage = '';
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      
      if (error instanceof Error && error.name === 'AbortError') {
        userFriendlyMessage = "⏱️ Generation timeout - this is taking longer than expected. Try reducing to 2-3 days or simplifying your topic.";
      } else {
        userFriendlyMessage = `❓ An error occurred: ${error.message}`;
      }
      
      setGenerationStatus(userFriendlyMessage);
      
      setTimeout(() => setGenerationStatus(''), 8000);
      
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        if (!generationStatus.includes('❌') && !generationStatus.includes('❓')) {
            setGenerationStatus('');
        }
        setProgress(0);
      }, 5000);
    }
  };

  const downloadLessonPlan = async () => {
    // Your excellent HTML download function - no changes needed
    if (!lessonPlan) return;
    setIsDownloading(true);
    try {
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${unitTitle || 'Rootwork Lesson Plan'}</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 1in; line-height: 1.6; font-size: 12pt; }
        h1 { color: #2c5f2d; border-bottom: 2px solid #2c5f2d; page-break-before: avoid; }
        h2 { color: #4a7c59; margin-top: 1.5em; page-break-after: avoid; }
        h3 { color: #5a8a6a; margin-top: 1.2em; page-break-after: avoid; }
        .header-info { background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        .teacher-note { background-color: #e8f5e8; padding: 8px 12px; margin: 8px 0; border-left: 4px solid #2c5f2d; font-style: italic; page-break-inside: avoid; }
        .student-note { background-color: #e3f2fd; padding: 8px 12px; margin: 8px 0; border-left: 4px solid #1976d2; font-weight: bold; page-break-inside: avoid; }
        @media print { body { margin: 0.5in; font-size: 11pt; } .no-print { display: none; } }
    </style>
</head>
<body>
    <div class="header-info">
        <h1>🌱 ${unitTitle || 'Rootwork Lesson Plan'}</h1>
        <p><strong>Rootwork Framework: Trauma-Informed STEAM Lesson Plan</strong></p>
        <p><strong>Grade Level:</strong> ${gradeLevel}</p>
        <p><strong>Subject(s):</strong> ${subjects.join(', ')}</p>
        <p><strong>Duration:</strong> ${days} days</p>
        ${standards ? `<p><strong>Standards:</strong> ${standards}</p>` : ''}
        ${focus ? `<p><strong>Focus:</strong> ${focus}</p>` : ''}
    </div>
    <div class="lesson-content">${convertMarkdownToHtml(lessonPlan)}</div>
</body>
</html>`;
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(unitTitle || 'rootwork-lesson-plan').replace(/[^a-zA-Z0-9]/g, '_')}_RootworkFramework.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading lesson plan:', error);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-6xl">
        {/* Your header and quick-start guide JSX - no changes needed */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
            🌱 Rootwork Curriculum Framework
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Generate trauma-informed, culturally responsive lesson plans that integrate social justice, environmental awareness, and interdisciplinary learning.
          </p>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-blue-800">
              <strong>🚀 Need Help?</strong> 
              <button onClick={() => setShowQuickStart(!showQuickStart)} className="ml-2 text-blue-600 underline hover:text-blue-800">
                Quick Start Guide
              </button>
              {" | "}
              <a href="mailto:hearn.sa@gmail.com" className="text-blue-600 underline hover:text-blue-800">
                Contact Support
              </a>
            </p>
          </div>
        </div>
        {showQuickStart && (
          <div className="mb-6 bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            {/* ... Quick Start Guide Content ... */}
          </div>
        )}

        {/* Your form and status display JSX - no changes needed */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
            {/* ... Your entire form and status display JSX ... */}
        </div>

        {lessonPlan && (
          <div className="mt-6 sm:mt-8 bg-white rounded-xl shadow-lg p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Generated Lesson Plan</h2>
              <button onClick={downloadLessonPlan} disabled={isDownloading} className="bg-emerald-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base">
                {isDownloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Preparing Download...</span>
                  </>
                ) : (
                  <span>📄 Download as HTML</span>
                )}
              </button>
            </div>
            {/* --- ADDITION 2: Update the display div with prose styling --- */}
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(lessonPlan) }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
