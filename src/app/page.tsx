'use client';

import { useState } from 'react';

export default function HomePage() {
  const [unitTitle, setUnitTitle] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [standards, setStandards] = useState('');
  const [focus, setFocus] = useState('');
  const [days, setDays] = useState('');
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
    "Building resource materials...",
    "Finalizing implementation guidance...",
    "Almost ready - polishing your lesson plan..."
  ];

  const simulateProgress = (duration: number) => {
    const interval = 15000; // Update every 15 seconds
    const steps = Math.floor(duration / interval);
    let currentStep = 0;

    const progressInterval = setInterval(() => {
      if (currentStep < steps) {
        const progressPercent = ((currentStep + 1) / steps) * 100;
        setProgress(Math.min(progressPercent, 95)); // Never quite reach 100% until complete
        
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

  const generateLessonPlan = async () => {
    // Enhanced form validation with helpful messages
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
    setGenerationStatus("Analyzing your standards and objectives...");
    setProgress(0);
    
    // Estimate duration based on number of days (roughly 60 seconds per day)
    const estimatedDuration = Math.max(parseInt(days) * 60000, 120000); // Minimum 2 minutes
    const progressInterval = simulateProgress(estimatedDuration);

    try {
      // Set up timeout for long-running requests
      const timeoutDuration = Math.max(parseInt(days) * 90000, 180000); // 90 seconds per day, minimum 3 minutes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
      
      const response = await fetch('/api/generate-lesson-plan', {
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

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      // Quality Assurance Check - Validate lesson plan completeness
      const dayCount = (data.lessonPlan.match(/DAY \d+:/gi) || []).length;
      const expectedDays = parseInt(days);
      
      clearInterval(progressInterval);
      
      if (dayCount < expectedDays) {
        setProgress(90);
        setGenerationStatus(`⚠️ Generated ${dayCount} of ${expectedDays} days. Would you like to regenerate for complete content?`);
        
        // Show the partial content but with a warning
        setTimeout(() => {
          setLessonPlan(data.lessonPlan + `\n\n<div style="background: #fef3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;"><strong>⚠️ Quality Notice:</strong> This lesson plan contains ${dayCount} of ${expectedDays} requested days. Consider regenerating with a simpler topic or fewer days for complete content.</div>`);
        }, 1000);
      } else {
        setProgress(100);
        setGenerationStatus("✅ Complete! Your lesson plan is ready.");
        
        setTimeout(() => {
          setLessonPlan(data.lessonPlan);
        }, 500);
      }

    } catch (error) {
      console.error('Error generating lesson plan:', error);
      clearInterval(progressInterval);
      
      // Enhanced error handling with teacher-friendly messages
      let userFriendlyMessage = '';
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      
      if (error instanceof Error && error.name === 'AbortError') {
        userFriendlyMessage = "⏱️ Generation timeout - this is taking longer than expected. Try reducing to 2-3 days or simplifying your topic. Complex interdisciplinary units may need multiple shorter generations.";
      } else if (errorMessage.includes('safety') || errorMessage.includes('policy') || errorMessage.includes('content filter')) {
        userFriendlyMessage = "🔍 Please try rephrasing your unit title using academic language. Avoid words like 'fight,' 'battle,' 'tactics,' or 'conflict.' Try terms like 'analyze,' 'explore,' 'understand,' or 'investigate' instead.";
      } else if (errorMessage.includes('timeout') || errorMessage.includes('took too long')) {
        userFriendlyMessage = "⏱️ Generation is taking longer than expected. Try reducing to 2-3 days or simplifying the topic. Your content will be worth the wait!";
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        userFriendlyMessage = "🌐 Network connection issue detected. Please check your internet connection and try again.";
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
        userFriendlyMessage = "🚦 High demand detected! Please wait 30 seconds and try again. Consider starting with a shorter lesson plan.";
      } else if (errorMessage.includes('server') || errorMessage.includes('500')) {
        userFriendlyMessage = "🖥️ Our servers are experiencing high demand. Please try again in a few moments with a simpler topic or fewer days.";
      } else {
        userFriendlyMessage = "❓ Something went wrong generating your lesson plan. Try simplifying your unit title or reducing the number of days, then try again.";
      }
      
      setGenerationStatus(`${userFriendlyMessage}`);
      
      // Keep error message visible longer for user to read
      setTimeout(() => {
        setGenerationStatus('');
      }, 8000);
      
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setGenerationStatus('');
        setProgress(0);
      }, 3000);
    }
  };

  const downloadLessonPlan = async () => {
    if (!lessonPlan) return;

    setIsDownloading(true);
    try {
      const response = await fetch('/api/download-lesson-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: lessonPlan,
          unitTitle,
          gradeLevel,
          subjects,
          days,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate download');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${unitTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${gradeLevel}_${days}Day_RootworkFramework.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading lesson plan:', error);
      
      // Enhanced download error handling
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      let downloadErrorMessage = '';
      
      if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        downloadErrorMessage = "Network issue detected. Please check your connection and try downloading again.";
      } else if (errorMessage.includes('timeout')) {
        downloadErrorMessage = "Download is taking longer than expected. Please try again - your lesson plan is ready!";
      } else if (errorMessage.includes('server') || errorMessage.includes('500')) {
        downloadErrorMessage = "Server busy. Please wait a moment and try downloading again.";
      } else {
        downloadErrorMessage = "Download failed. Please try again or copy the content manually.";
      }
      
      alert(`📄 Download Error: ${downloadErrorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-6xl">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2 sm:mb-4">
            🌱 Rootwork Curriculum Framework
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Generate trauma-informed, culturally responsive lesson plans that integrate social justice, environmental awareness, and interdisciplinary learning.
          </p>
          
          {/* Pilot Support Contact */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-blue-800">
              <strong>🚀 Monday Pilot Support:</strong> Questions during your session? 
              <button 
                onClick={() => setShowQuickStart(!showQuickStart)}
                className="ml-2 text-blue-600 underline hover:text-blue-800"
              >
                Quick Start Guide
              </button>
              {" | "}
              <a href="mailto:support@rootwork.edu" className="text-blue-600 underline hover:text-blue-800">
                Contact Support
              </a>
            </p>
          </div>
        </div>

        {/* Quick Start Guide */}
        {showQuickStart && (
          <div className="mb-6 bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-800">📋 Quick Start Guide</h2>
              <button 
                onClick={() => setShowQuickStart(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-emerald-700 mb-2">✅ Perfect Unit Title Examples:</h3>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>• "Building Communities Through Literature"</li>
                  <li>• "Environmental Science Connections"</li>
                  <li>• "Understanding Historical Perspectives"</li>
                  <li>• "Mathematical Patterns in Nature"</li>
                </ul>
                
                <h3 className="font-semibold text-emerald-700 mb-2">🤝 Collaborative Planning Tips:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Select multiple subjects for interdisciplinary units</li>
                  <li>• Leave standards blank for AI suggestions</li>
                  <li>• Use natural language in all fields</li>
                  <li>• Start with 2-3 days for complex topics</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-emerald-700 mb-2">⏱️ What to Expect:</h3>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>• Generation: 2-3 minutes (longer for more days)</li>
                  <li>• Progress updates every 15 seconds</li>
                  <li>• Comprehensive implementation guidance</li>
                  <li>• Ready-to-use resource materials</li>
                </ul>
                
                <h3 className="font-semibold text-emerald-700 mb-2">📱 Need Help?</h3>
                <p className="text-sm text-gray-600">
                  Generation taking too long? Try fewer days or simpler topics. 
                  <strong className="text-emerald-700"> Contact support</strong> for immediate assistance during your pilot session.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg">
            <div className="flex items-start">
              <div className="ml-0">
                <h3 className="text-sm font-medium text-emerald-800">🧠 Smart AI Assistant</h3>
                <p className="mt-1 text-sm text-emerald-700">
                  Our AI understands natural language and collaborative planning! Feel free to use descriptive phrases, 
                  leave fields blank for smart suggestions, or specify exact requirements. Perfect for team planning sessions.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="unitTitle" className="block text-sm font-medium text-gray-700 mb-2">
                Unit Title
              </label>
              <input
                type="text"
                id="unitTitle"
                value={unitTitle}
                onChange={(e) => setUnitTitle(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
                placeholder="e.g., 'Building Communities' or 'Environmental Science Connections'"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                💡 <strong>Tip:</strong> Use academic language for best results. Collaborative teams can describe interdisciplinary connections naturally.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Level
                </label>
                <select
                  id="gradeLevel"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
                  required
                >
                  <option value="">Select Grade Level</option>
                  <option value="K">Kindergarten</option>
                  <option value="1">1st Grade</option>
                  <option value="2">2nd Grade</option>
                  <option value="3">3rd Grade</option>
                  <option value="4">4th Grade</option>
                  <option value="5">5th Grade</option>
                  <option value="6">6th Grade</option>
                  <option value="7">7th Grade</option>
                  <option value="8">8th Grade</option>
                  <option value="9">9th Grade</option>
                  <option value="10">10th Grade</option>
                  <option value="11">11th Grade</option>
                  <option value="12">12th Grade</option>
                </select>
              </div>

              <div>
                <label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Days
                </label>
                <select
                  id="days"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
                  required
                >
                  <option value="">Select Number of Days</option>
                  <option value="1">1 Day</option>
                  <option value="2">2 Days</option>
                  <option value="3">3 Days</option>
                  <option value="4">4 Days</option>
                  <option value="5">5 Days</option>
                  <option value="6">6 Days</option>
                  <option value="7">7 Days</option>
                  <option value="8">8 Days</option>
                  <option value="9">9 Days</option>
                  <option value="10">10 Days</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="subjects" className="block text-sm font-medium text-gray-700 mb-2">
                Subjects <span className="text-emerald-600 font-medium">(Select Multiple for Interdisciplinary Units)</span>
              </label>
              
              {/* Quick Selection Buttons */}
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSubjects(['English Language Arts', 'Social Studies'])}
                  className="px-3 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors"
                >
                  📚 ELA + Social Studies
                </button>
                <button
                  type="button"
                  onClick={() => setSubjects(['Science', 'Mathematics'])}
                  className="px-3 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors"
                >
                  🔬 Science + Math
                </button>
                <button
                  type="button"
                  onClick={() => setSubjects(['Science', 'Art', 'Mathematics'])}
                  className="px-3 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors"
                >
                  🎨 STEAM Bundle
                </button>
                <button
                  type="button"
                  onClick={() => setSubjects([])}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                >
                  Clear All
                </button>
              </div>
              
              <select
                id="subjects"
                multiple
                value={subjects}
                onChange={(e) => setSubjects(Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 h-32 text-sm sm:text-base"
                required
              >
                <option value="English Language Arts">English Language Arts</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="Social Studies">Social Studies</option>
                <option value="Art">Art</option>
                <option value="Music">Music</option>
                <option value="Physical Education">Physical Education</option>
                <option value="Health">Health</option>
                <option value="World Languages">World Languages</option>
                <option value="Career and Technical Education">Career and Technical Education</option>
                <option value="Special Education">Special Education</option>
              </select>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <p className="text-xs text-gray-500">
                  🤝 <strong>Hold Ctrl (PC) or Cmd (Mac)</strong> and click to select multiple subjects.
                </p>
                {subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {subjects.map((subject, index) => (
                      <span key={index} className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                        {subject}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="standards" className="block text-sm font-medium text-gray-700 mb-2">
                Standards & Learning Objectives
              </label>
              <textarea
                id="standards"
                value={standards}
                onChange={(e) => setStandards(e.target.value)}
                rows={3}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
                placeholder="e.g., 'CCSS.ELA-LITERACY.RST.11-12.7, NGSS.HS-LS2-7' or 'Relevant Georgia ELA and Social Studies standards' or leave blank for AI to suggest appropriate standards"
              />
              <p className="mt-1 text-xs text-gray-500">
                🧠 <strong>Smart AI:</strong> You can specify exact standards, describe general areas ("Common Core ELA for grade 8"), or leave blank for AI recommendations. Perfect for collaborative planning across subjects!
              </p>
            </div>

            <div>
              <label htmlFor="focus" className="block text-sm font-medium text-gray-700 mb-2">
                Learning Focus & Approach
              </label>
              <textarea
                id="focus"
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                rows={3}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm sm:text-base"
                placeholder="e.g., 'Project-based learning with community connections' or 'STEAM integration focusing on environmental justice' or 'Trauma-informed approach with social-emotional learning'"
              />
              <p className="mt-1 text-xs text-gray-500">
                🎯 <strong>Examples:</strong> PBL, STEAM integration, Local history connections, Social justice themes, Trauma-informed practices, Special education accommodations, etc.
              </p>
            </div>

            <button
              onClick={generateLessonPlan}
              disabled={isLoading}
              className="w-full bg-emerald-600 text-white py-3 px-4 sm:px-6 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                  <span>Creating Your Lesson Plan...</span>
                </>
              ) : (
                <>
                  <span>🌱 Generate Rootwork Lesson Plan</span>
                </>
              )}
            </button>

            {(isLoading || generationStatus) && (
              <div className={`mt-6 p-6 rounded-lg border ${
                generationStatus.includes('❌') || generationStatus.includes('⚠️') || generationStatus.includes('⏱️') 
                  ? 'bg-amber-50 border-amber-200' 
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                {isLoading ? (
                  <>
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                      <h3 className="text-lg font-medium text-emerald-800">
                        Creating trauma-informed, interdisciplinary content just for you
                      </h3>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-emerald-700 mb-2">
                        <span>{generationStatus}</span>
                        <span>{Math.round(progress)}% complete</span>
                      </div>
                      <div className="w-full bg-emerald-200 rounded-full h-2">
                        <div 
                          className="bg-emerald-600 h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-emerald-600">
                      This comprehensive lesson plan will include detailed implementation guidance, resource materials, 
                      and assessment tools ready for your classroom.
                    </p>
                  </>
                ) : (
                  <div className={`${
                    generationStatus.includes('❌') || generationStatus.includes('⚠️') || generationStatus.includes('⏱️')
                      ? 'text-amber-800' 
                      : 'text-emerald-800'
                  }`}>
                    <p className="font-medium">{generationStatus}</p>
                    {(generationStatus.includes('❌') || generationStatus.includes('⚠️') || generationStatus.includes('⏱️')) && (
                      <p className="text-sm mt-2 text-amber-600">
                        💡 <strong>Tip:</strong> For complex interdisciplinary units, try generating shorter segments (1-3 days) 
                        and combining them, or simplify the topic focus.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {lessonPlan && (
          <div className="mt-6 sm:mt-8 bg-white rounded-xl shadow-lg p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Generated Lesson Plan</h2>
              <button
                onClick={downloadLessonPlan}
                disabled={isDownloading}
                className="bg-emerald-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                {isDownloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Preparing Download...</span>
                  </>
                ) : (
                  <>
                    <span>📄 Download as HTML</span>
                  </>
                )}
              </button>
            </div>
            <div 
              className="prose prose-sm sm:prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: lessonPlan.replace(/\n/g, '<br>') }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
