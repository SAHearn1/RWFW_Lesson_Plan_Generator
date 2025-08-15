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
    if (!unitTitle || !gradeLevel || subjects.length === 0 || !days) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setGenerationStatus("Analyzing your standards and objectives...");
    setProgress(0);
    
    // Estimate duration based on number of days (roughly 60 seconds per day)
    const estimatedDuration = Math.max(parseInt(days) * 60000, 120000); // Minimum 2 minutes
    const progressInterval = simulateProgress(estimatedDuration);

    try {
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
      });

      if (!response.ok) {
        throw new Error('Failed to generate lesson plan');
      }

      const data = await response.json();
      
      clearInterval(progressInterval);
      setProgress(100);
      setGenerationStatus("Complete! Your lesson plan is ready.");
      
      setTimeout(() => {
        setLessonPlan(data.lessonPlan);
      }, 500);

    } catch (error) {
      console.error('Error generating lesson plan:', error);
      clearInterval(progressInterval);
      setGenerationStatus("There was an error generating your lesson plan. Please try again.");
      alert('Failed to generate lesson plan. Please try again.');
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
      alert('Failed to download lesson plan. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🌱 Rootwork Curriculum Framework
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Generate trauma-informed, culturally responsive lesson plans that integrate social justice, environmental awareness, and interdisciplinary learning.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg">
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
          
          <div className="space-y-6">
            <div>
              <label htmlFor="unitTitle" className="block text-sm font-medium text-gray-700 mb-2">
                Unit Title
              </label>
              <input
                type="text"
                id="unitTitle"
                value={unitTitle}
                onChange={(e) => setUnitTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., 'Building Communities' or 'Environmental Science Connections'"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                💡 <strong>Tip:</strong> Use academic language for best results. Collaborative teams can describe interdisciplinary connections naturally.
              </p>
            </div>

            <div>
              <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700 mb-2">
                Grade Level
              </label>
              <select
                id="gradeLevel"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
              <label htmlFor="subjects" className="block text-sm font-medium text-gray-700 mb-2">
                Subjects <span className="text-emerald-600 font-medium">(Select Multiple for Interdisciplinary Units)</span>
              </label>
              <select
                id="subjects"
                multiple
                value={subjects}
                onChange={(e) => setSubjects(Array.from(e.target.selectedOptions, option => option.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 h-32"
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
              <p className="mt-1 text-xs text-gray-500">
                🤝 <strong>Collaborative Planning:</strong> Hold Ctrl (PC) or Cmd (Mac) and click to select multiple subjects. 
                Popular combinations: ELA + Social Studies, Science + Math, STEAM Bundle (Science + Art + Math)
                {subjects.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                    {subjects.length} subject{subjects.length !== 1 ? 's' : ''} selected
                  </span>
                )}
              </p>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g., 'Project-based learning with community connections' or 'STEAM integration focusing on environmental justice' or 'Trauma-informed approach with social-emotional learning'"
              />
              <p className="mt-1 text-xs text-gray-500">
                🎯 <strong>Examples:</strong> PBL, STEAM integration, Local history connections, Social justice themes, Trauma-informed practices, Special education accommodations, etc.
              </p>
            </div>

            <div>
              <label htmlFor="days" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Days
              </label>
              <select
                id="days"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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

            <button
              onClick={generateLessonPlan}
              disabled={isLoading}
              className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating Your Lesson Plan...</span>
                </>
              ) : (
                <>
                  <span>🌱 Generate Rootwork Lesson Plan</span>
                </>
              )}
            </button>

            {isLoading && (
              <div className="mt-6 p-6 bg-emerald-50 rounded-lg border border-emerald-200">
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
              </div>
            )}
          </div>
        </div>

        {lessonPlan && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Generated Lesson Plan</h2>
              <button
                onClick={downloadLessonPlan}
                disabled={isDownloading}
                className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: lessonPlan.replace(/\n/g, '<br>') }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
