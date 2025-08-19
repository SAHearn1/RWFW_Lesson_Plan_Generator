// src/app/page.tsx

'use client';

import { useState } from 'react';

interface FormData {
  unitTitle: string;
  gradeLevel: string;
  numberOfDays: string;
  minutes: string;
  standards?: string;
  focusArea?: string;
}

export default function LessonPlanGenerator() {
  const [formData, setFormData] = useState<FormData>({
    unitTitle: '',
    gradeLevel: '',
    numberOfDays: '',
    minutes: '',
    standards: '',
    focusArea: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [lessonPlan, setLessonPlan] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate required fields
      const missingFields = [];
      if (!formData.unitTitle?.trim()) missingFields.push('Unit Title');
      if (!formData.gradeLevel?.trim()) missingFields.push('Grade Level');
      if (!formData.numberOfDays?.trim()) missingFields.push('Number of Days');
      if (!formData.minutes?.trim()) missingFields.push('Minutes per Day');

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      console.log('Submitting payload:', formData);

      const response = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('Response data:', errorData);
        throw new Error(errorData.error || 'Failed to generate lesson plan');
      }

      const data = await response.json();
      setLessonPlan(data.lessonPlan);
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Professional Lesson Plan Generator
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Unit Title - New Field */}
            <div>
              <label htmlFor="unitTitle" className="block text-sm font-medium text-gray-700 mb-2">
                Unit Title *
              </label>
              <input
                type="text"
                id="unitTitle"
                name="unitTitle"
                value={formData.unitTitle}
                onChange={handleInputChange}
                placeholder="e.g., Civil Rights Movement, Ecosystems, Algebraic Expressions"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter the main topic or theme for this unit of study
              </p>
            </div>

            {/* Grade Level */}
            <div>
              <label htmlFor="gradeLevel" className="block text-sm font-medium text-gray-700 mb-2">
                Grade Level *
              </label>
              <select
                id="gradeLevel"
                name="gradeLevel"
                value={formData.gradeLevel}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                required
              >
                <option value="">Select Grade Level</option>
                <option value="K">Kindergarten</option>
                <option value="1st">1st Grade</option>
                <option value="2nd">2nd Grade</option>
                <option value="3rd">3rd Grade</option>
                <option value="4th">4th Grade</option>
                <option value="5th">5th Grade</option>
                <option value="6th">6th Grade</option>
                <option value="7th">7th Grade</option>
                <option value="8th">8th Grade</option>
                <option value="9th">9th Grade</option>
                <option value="10th">10th Grade</option>
                <option value="11th">11th Grade</option>
                <option value="12th">12th Grade</option>
                <option value="Mixed">Mixed Ages</option>
              </select>
            </div>

            {/* Number of Days and Minutes per Day */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="numberOfDays" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Days *
                </label>
                <input
                  type="number"
                  id="numberOfDays"
                  name="numberOfDays"
                  value={formData.numberOfDays}
                  onChange={handleInputChange}
                  min="1"
                  max="30"
                  placeholder="5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="minutes" className="block text-sm font-medium text-gray-700 mb-2">
                  Minutes per Day *
                </label>
                <input
                  type="number"
                  id="minutes"
                  name="minutes"
                  value={formData.minutes}
                  onChange={handleInputChange}
                  min="15"
                  max="180"
                  placeholder="50"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            {/* Standards */}
            <div>
              <label htmlFor="standards" className="block text-sm font-medium text-gray-700 mb-2">
                Academic Standards (Optional)
              </label>
              <textarea
                id="standards"
                name="standards"
                value={formData.standards}
                onChange={handleInputChange}
                rows={3}
                placeholder="e.g., CCSS.ELA-LITERACY.RST.9-10.7, NGSS 5-ESS2-1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
              />
            </div>

            {/* Focus Area */}
            <div>
              <label htmlFor="focusArea" className="block text-sm font-medium text-gray-700 mb-2">
                Special Focus Area (Optional)
              </label>
              <input
                type="text"
                id="focusArea"
                name="focusArea"
                value={formData.focusArea}
                onChange={handleInputChange}
                placeholder="e.g., ELL support, special education accommodations, project-based learning"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating Lesson Plan...
                </>
              ) : (
                'Generate Lesson Plan'
              )}
            </button>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">Error:</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Lesson Plan Display */}
          {lessonPlan && (
            <div className="mt-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Generated Lesson Plan</h2>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                  {lessonPlan}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
