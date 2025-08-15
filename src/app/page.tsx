'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

type Tab = 'generator' | 'results';

export default function HomePage() {
  // UI state
  const [tab, setTab] = useState<Tab>('generator');

  // Form state
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [duration, setDuration] = useState('3');
  const [unitTitle, setUnitTitle] = useState('');
  const [standards, setStandards] = useState('');
  const [focus, setFocus] = useState('');

  // Gen state
  const [isLoading, setIsLoading] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState('');
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(0);

  // Helpers
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions).map((o) => o.value);
    setSubjects(values);
  };

  const handleDownloadPDF = async () => {
    if (!lessonPlan) return;
    
    const payload = {
      gradeLevel,
      subjects,
      duration: parseInt(duration, 10),
      days: parseInt(duration, 10),
      unitTitle: unitTitle || 'Rooted in Me: Exploring Culture, Identity, and Expression',
      standards: standards || 'Please align with relevant standards (CCSS/NGSS/etc.)',
      focus: focus || 'None specified'
    };

    try {
      setIsLoading(true);
      setGenerationStatus('Preparing your download...');
      
      // Create HTML content for PDF
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${unitTitle || 'Rootwork Lesson Plan'}</title>
    <style>
        body { 
            font-family: 'Times New Roman', serif; 
            margin: 1in; 
            line-height: 1.6; 
            font-size: 12pt;
        }
        h1 { 
            color: #2c5f2d; 
            border-bottom: 2px solid #2c5f2d; 
            page-break-before: avoid;
        }
        h2 { 
            color: #4a7c59; 
            margin-top: 1.5em; 
            page-break-after: avoid;
        }
        h3 { 
            color: #5a8a6a; 
            margin-top: 1.2em;
            page-break-after: avoid;
        }
        .header-info {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
        }
        .teacher-note { 
            background-color: #e8f5e8; 
            padding: 8px 12px; 
            margin: 8px 0; 
            border-left: 4px solid #2c5f2d; 
            font-style: italic;
            page-break-inside: avoid;
        }
        .student-note { 
            background-color: #e3f2fd; 
            padding: 8px 12px; 
            margin: 8px 0; 
            border-left: 4px solid #1976d2; 
            font-weight: bold;
            page-break-inside: avoid;
        }
        .day-section {
            page-break-before: auto;
            margin-bottom: 30px;
        }
        .lesson-component {
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        pre {
            white-space: pre-wrap;
            font-family: inherit;
            background-color: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
        }
        @media print {
            body { margin: 0.5in; font-size: 11pt; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header-info">
        <h1>🌱 ${unitTitle || 'Rootwork Lesson Plan'}</h1>
        <p><strong>Rootwork Framework: Trauma-Informed STEAM Lesson Plan</strong></p>
        <p><strong>Grade Level:</strong> ${gradeLevel}</p>
        <p><strong>Subject(s):</strong> ${subjects.join(', ')}</p>
        <p><strong>Duration:</strong> ${duration} days (${parseInt(duration) * 90} minutes total)</p>
        ${standards ? `<p><strong>Standards:</strong> ${standards}</p>` : ''}
        ${focus ? `<p><strong>Focus:</strong> ${focus}</p>` : ''}
    </div>
    
    <div class="lesson-content">
        ${lessonPlan.split('\n').map(line => {
          // Convert markdown-style formatting to HTML
          let htmlLine = line
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\[Teacher Note: (.*?)\]/g, '<div class="teacher-note"><strong>Teacher Note:</strong> $1</div>')
            .replace(/\[Student Note: (.*?)\]/g, '<div class="student-note"><strong>Student Note:</strong> $1</div>');
          
          // Handle paragraphs
          if (htmlLine.trim() && !htmlLine.includes('<h') && !htmlLine.includes('<div')) {
            htmlLine = `<p>${htmlLine}</p>`;
          }
          
          return htmlLine;
        }).join('')}
    </div>
</body>
</html>`;

      // Create and download the file
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(unitTitle || 'rootwork-lesson-plan').replace(/[^a-zA-Z0-9]/g, '_')}_RootworkFramework.html`;
      a.click();
      URL.revokeObjectURL(url);
      
      alert('✅ Lesson plan downloaded as HTML! You can open this file and print to PDF from your browser.');
    } catch (err: any) {
      setError(`Download failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      setGenerationStatus('');
    }
  };

  const handleGeneratePlan: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    setError(null);

    // basic validations
    if (!gradeLevel) return setError('Please select a grade level.');
    if (subjects.length === 0) return setError('Please select at least one subject.');

    // Build the correct payload format that matches your API expectations
    const payload = {
      gradeLevel,
      subjects,
      duration: parseInt(duration, 10), // Convert to number
      days: parseInt(duration, 10), // Also send as days for compatibility
      unitTitle: unitTitle || 'Rooted in Me: Exploring Culture, Identity, and Expression',
      standards: standards || 'Please align with relevant standards (CCSS/NGSS/etc.)',
      focus: focus || 'None specified'
    };

    try {
      setIsLoading(true);
      setGenerationStatus('Initializing lesson plan generation...');
      setEstimatedTimeRemaining(parseInt(duration, 10) * 60); // Estimate 60 seconds per day

      // Progress simulation with encouraging messages
      const progressMessages = [
        'Analyzing your standards and objectives...',
        'Integrating trauma-informed pedagogical approaches...',
        'Crafting interdisciplinary connections...',
        'Designing engaging student activities...',
        'Creating teacher implementation guidance...',
        'Developing assessment strategies...',
        'Generating resource materials and handouts...',
        'Finalizing your comprehensive lesson plan...'
      ];

      let currentMessage = 0;
      const progressInterval = setInterval(() => {
        if (currentMessage < progressMessages.length - 1) {
          setGenerationStatus(progressMessages[currentMessage]);
          currentMessage++;
        }
        setEstimatedTimeRemaining(prev => Math.max(0, prev - 15));
      }, 15000); // Update every 15 seconds

      const res = await fetch('/api/generatePlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), // Send the structured data, not a text prompt
      });

      clearInterval(progressInterval);

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as { 
        ok?: boolean;
        plan?: any; 
        markdown?: string;
        lessonPlan?: any; 
        error?: string 
      };

      // Handle the new API response format
      let markdown = '';
      if (data?.plan?.markdown) {
        markdown = data.plan.markdown;
      } else if (data?.markdown) {
        markdown = data.markdown;
      } else if (data?.lessonPlan) {
        // Handle if lessonPlan is a string
        markdown = typeof data.lessonPlan === 'string' ? data.lessonPlan : JSON.stringify(data.lessonPlan, null, 2);
      } else {
        throw new Error(data?.error || 'Empty response from generator');
      }

      setLessonPlan(markdown);
      setTab('results');
      setGenerationStatus('');
    } catch (err: any) {
      setError(err?.message || 'Failed to generate lesson plan.');
    } finally {
      setIsLoading(false);
      setGenerationStatus('');
      setEstimatedTimeRemaining(0);
    }
  };

  const heading = (
    <header className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 via-emerald-600 to-purple-700" />
      <div className="relative container mx-auto px-6 py-14 text-white">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm ring-1 ring-white/20 backdrop-blur">
            <span>🌱</span>
            <span className="font-medium">Root Work Framework</span>
          </div>
          <h1 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight">
            Healing-Centered Lesson Design
          </h1>
          <p className="mt-3 text-white/90 max-w-3xl mx-auto">
            S.T.E.A.M. Powered, Trauma Informed, Project Based lesson planning for real classrooms.
          </p>
        </div>
      </div>
    </header>
  );

  // --- UI ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-purple-50">
      {heading}

      <main className="container mx-auto px-6 pt-8 pb-16">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6 md:p-8">
          {tab === 'generator' && (
            <form onSubmit={handleGeneratePlan}>
              {isLoading && (
                <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mr-3"></div>
                    <div className="text-emerald-800 font-semibold text-lg">
                      Generating Your Comprehensive Lesson Plan
                    </div>
                  </div>
                  
                  <div className="text-center mb-4">
                    <div className="text-emerald-700 text-base mb-2">
                      {generationStatus || 'Preparing your lesson plan...'}
                    </div>
                    <div className="text-emerald-600 text-sm">
                      {estimatedTimeRemaining > 0 ? (
                        `Estimated time remaining: ${Math.ceil(estimatedTimeRemaining / 60)} minute${Math.ceil(estimatedTimeRemaining / 60) !== 1 ? 's' : ''}`
                      ) : (
                        'Almost ready...'
                      )}
                    </div>
                  </div>

                  <div className="bg-emerald-100 rounded-full h-2 mb-4">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ 
                        width: estimatedTimeRemaining > 0 ? 
                          `${Math.max(10, 100 - (estimatedTimeRemaining / (parseInt(duration, 10) * 60)) * 100)}%` : 
                          '95%' 
                      }}
                    ></div>
                  </div>

                  <div className="text-center">
                    <div className="text-emerald-600 text-sm font-medium mb-2">
                      🌱 Creating trauma-informed, interdisciplinary content just for you
                    </div>
                    <div className="text-emerald-500 text-xs">
                      This comprehensive lesson plan will include detailed implementation guidance,
                      resource materials, and assessment tools ready for your classroom.
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
                  {error}
                </div>
              )}

              <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
                <h3 className="text-lg font-bold mb-1">🌱 Root Work Framework</h3>
                <p>Trauma-informed, culturally responsive, GRR-aligned planning—beautiful and practical.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div>
                  <label className="block mb-2 font-semibold text-slate-700">Grade Level *</label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Grade</option>
                    {['Kindergarten', ...Array.from({ length: 12 }, (_, i) => `${i + 1}${[1, 2, 3].includes(i + 1) ? (i + 1 === 1 ? 'st' : i + 1 === 2 ? 'nd' : 'rd') : 'th'} Grade`)].map(
                      (g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-slate-700">Duration *</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  >
                    {[1, 2, 3, 4, 5].map((d) => (
                      <option key={d} value={String(d)}>
                        {d} Day{d > 1 ? 's' : ''} ({d * 90} min total)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-2 font-semibold text-slate-700">Unit Title</label>
                  <input
                    type="text"
                    value={unitTitle}
                    onChange={(e) => setUnitTitle(e.target.value)}
                    placeholder="e.g., Community Storytelling"
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block mb-2 font-semibold text-slate-700">Subject Area(s) *</label>
                <select
                  multiple
                  size={8}
                  value={subjects}
                  onChange={handleSubjectChange}
                  className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                  style={{ minHeight: '180px' }}
                >
                  {[
                    'English Language Arts',
                    'Mathematics',
                    'Science',
                    'Social Studies',
                    'Art',
                    'Music',
                    'Physical Education',
                    'Special Education',
                    'STEAM',
                    'Agriculture',
                    'Career and Technical Education',
                  ].map((s) => (
                    <option key={s} value={s} className="p-2 hover:bg-emerald-50">
                      {s}
                    </option>
                  ))}
                </select>
                <div className="text-sm text-slate-500 mt-2">
                  <strong>Hold Ctrl (PC) or Cmd (Mac)</strong> while clicking to select multiple subjects.
                  <br />
                  <strong>Selected:</strong> {subjects.length > 0 ? subjects.join(', ') : 'None'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block mb-2 font-semibold text-slate-700">Standards Alignment</label>
                  <textarea
                    rows={3}
                    value={standards}
                    onChange={(e) => setStandards(e.target.value)}
                    placeholder="Enter relevant state standards or learning objectives…"
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-semibold text-slate-700">Additional Focus Areas</label>
                  <textarea
                    rows={3}
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    placeholder="Special accommodations, therapeutic goals, etc."
                    className="w-full p-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-lg font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating Lesson Plan...
                  </span>
                ) : (
                  'Generate Comprehensive Lesson Plan'
                )}
              </button>
            </form>
          )}

          {tab === 'results' && (
            <div>
              {error && (
                <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">{error}</div>
              )}

              {/* Simple top actions - ONLY New Plan and Download */}
              <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between mb-6">
                <div className="flex gap-3">
                  <button
                    className="px-6 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 font-semibold transition"
                    onClick={() => setTab('generator')}
                  >
                    New Plan
                  </button>
                  <button
                    className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={handleDownloadPDF}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Preparing Download...
                      </span>
                    ) : (
                      'Download PDF/DOC'
                    )}
                  </button>
                </div>
              </div>

              {/* Enhanced lesson plan display with better styling */}
              <div className="lesson-plan-container bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                <div 
                  className="prose prose-lg max-w-none 
                    prose-headings:text-emerald-800 
                    prose-h1:text-2xl prose-h1:font-bold prose-h1:border-b prose-h1:border-emerald-200 prose-h1:pb-2
                    prose-h2:text-xl prose-h2:font-semibold prose-h2:text-emerald-700 prose-h2:mt-8 prose-h2:mb-4
                    prose-h3:text-lg prose-h3:font-medium prose-h3:text-emerald-600 prose-h3:mt-6 prose-h3:mb-3
                    prose-p:leading-relaxed prose-p:mb-4
                    prose-ul:ml-6 prose-ol:ml-6
                    prose-li:mb-2
                    prose-strong:text-gray-900
                    prose-em:text-gray-700"
                  style={{
                    /* Custom styles for Teacher and Student Notes */
                  }}
                >
                  <ReactMarkdown 
                    components={{
                      // Custom renderer for better formatting
                      p: ({ children }) => {
                        const text = children?.toString() || '';
                        
                        // Handle Teacher Notes
                        if (text.includes('[Teacher Note:')) {
                          return (
                            <div className="teacher-note bg-emerald-50 border-l-4 border-emerald-500 p-4 my-4 rounded-r-lg">
                              <div className="font-semibold text-emerald-800 text-sm mb-1">👩‍🏫 Teacher Note:</div>
                              <div className="text-emerald-700 italic">{text.replace(/\[Teacher Note:\s*/, '').replace(/\]$/, '')}</div>
                            </div>
                          );
                        }
                        
                        // Handle Student Notes
                        if (text.includes('[Student Note:')) {
                          return (
                            <div className="student-note bg-blue-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg">
                              <div className="font-semibold text-blue-800 text-sm mb-1">🎓 Student Note:</div>
                              <div className="text-blue-700 font-medium">{text.replace(/\[Student Note:\s*/, '').replace(/\]$/, '')}</div>
                            </div>
                          );
                        }

                        // Handle simple table formatting (for rubrics)
                        if (text.includes('|') && text.includes('---')) {
                          const lines = text.split('\n');
                          const tableLines = lines.filter(line => line.includes('|'));
                          
                          if (tableLines.length > 1) {
                            const headerRow = tableLines[0];
                            const dataRows = tableLines.slice(2); // Skip header and separator
                            
                            return (
                              <div className="overflow-x-auto my-6">
                                <table className="min-w-full border-collapse border border-gray-300 bg-white">
                                  <thead className="bg-emerald-100">
                                    <tr>
                                      {headerRow.split('|').map((cell, idx) => (
                                        <th key={idx} className="border border-gray-300 px-4 py-2 text-left font-semibold text-emerald-800">
                                          {cell.trim()}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {dataRows.map((row, rowIdx) => (
                                      <tr key={rowIdx}>
                                        {row.split('|').map((cell, cellIdx) => (
                                          <td key={cellIdx} className="border border-gray-300 px-4 py-2 text-sm">
                                            {cell.trim()}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            );
                          }
                        }

                        // Handle Day Headers (look for "DAY 1:", "DAY 2:", etc.)
                        if (text.match(/^DAY\s+\d+:/i)) {
                          return (
                            <div className="day-header bg-gradient-to-r from-emerald-100 to-blue-100 border-2 border-emerald-300 rounded-lg p-6 my-8 shadow-md">
                              <h1 className="text-3xl font-bold text-emerald-800 mb-2 border-b-2 border-emerald-400 pb-2">
                                🌱 {text}
                              </h1>
                            </div>
                          );
                        }
                        
                        return <p className="mb-4 leading-relaxed">{children}</p>;
                      },
                      
                      h1: ({ children }) => {
                        const text = children?.toString() || '';
                        // If it's a day header, use special styling
                        if (text.match(/^DAY\s+\d+:/i)) {
                          return (
                            <div className="day-header bg-gradient-to-r from-emerald-100 to-blue-100 border-2 border-emerald-300 rounded-lg p-6 my-8 shadow-md">
                              <h1 className="text-3xl font-bold text-emerald-800 mb-2">
                                🌱 {children}
                              </h1>
                            </div>
                          );
                        }
                        return (
                          <h1 className="text-3xl font-bold text-emerald-800 border-b-2 border-emerald-200 pb-3 mb-6 mt-8 first:mt-0">
                            {children}
                          </h1>
                        );
                      },
                      
                      h2: ({ children }) => {
                        const text = children?.toString() || '';
                        // Special styling for main lesson components
                        if (text.includes('Opening') || text.includes('Work Session') || text.includes('Closing') || text.includes('I Do')) {
                          return (
                            <h2 className="text-2xl font-semibold text-emerald-700 mt-8 mb-4 p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-500">
                              📚 {children}
                            </h2>
                          );
                        }
                        return (
                          <h2 className="text-2xl font-semibold text-emerald-700 mt-8 mb-4 first:mt-0">
                            {children}
                          </h2>
                        );
                      },
                      
                      h3: ({ children }) => (
                        <h3 className="text-xl font-medium text-emerald-600 mt-6 mb-3 pl-4 border-l-2 border-emerald-300">
                          🔹 {children}
                        </h3>
                      ),
                      
                      ul: ({ children }) => (
                        <ul className="ml-6 mb-4 space-y-2 list-disc">{children}</ul>
                      ),
                      
                      ol: ({ children }) => (
                        <ol className="ml-6 mb-4 space-y-2 list-decimal">{children}</ol>
                      ),
                      
                      li: ({ children }) => (
                        <li className="leading-relaxed pl-2">{children}</li>
                      ),

                      // Handle strong text with special formatting for key terms
                      strong: ({ children }) => {
                        const text = children?.toString() || '';
                        if (text.includes('Materials:') || text.includes('MTSS:') || text.includes('Assessment:')) {
                          return (
                            <div className="implementation-detail bg-gray-50 border border-gray-200 rounded p-3 my-3">
                              <strong className="text-gray-800 font-semibold block mb-1">{children}</strong>
                            </div>
                          );
                        }
                        return <strong className="font-semibold text-gray-900">{children}</strong>;
                      },
                    }}
                  >
                    {lessonPlan}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
