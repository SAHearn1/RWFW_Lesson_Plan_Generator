// Enhanced Frontend Component with PDF/DOCX Download Functionality
import React, { useState } from 'react';
import { Download, FileText, FileDown, Copy } from 'lucide-react';

interface LessonPlanFormData {
  gradeLevel: string;
  subjects: string[];
  unitTitle: string;
  days: number;
  standards: string;
  focus: string;
}

interface GeneratedPlan {
  meta: {
    title: string;
    gradeLevel: string;
    subject: string;
    days: number;
    essentialQuestion: string;
    standards: string[];
  };
  days: Array<{
    day: number;
    title: string;
    flow?: {
      opening?: { activity: string; teacherNote: string; studentNote: string; };
      iDo?: { activity: string; teacherNote: string; studentNote: string; };
      weDo?: { activity: string; teacherNote: string; studentNote: string; };
      youDoTogether?: { activity: string; teacherNote: string; studentNote: string; };
      youDoAlone?: { activity: string; teacherNote: string; studentNote: string; };
      closing?: { activity: string; teacherNote: string; studentNote: string; };
    };
    mtss?: {
      tier1: string[];
      tier2: string[];
      tier3: string[];
    };
    activities?: {
      opening: string;
      instruction: string;
      practice: string;
      independent: string;
      closing: string;
    };
    materials?: string[];
    assessment?: string;
    differentiation?: string;
  }>;
  markdown?: string;
}

export default function LessonPlanGenerator() {
  const [formData, setFormData] = useState<LessonPlanFormData>({
    gradeLevel: '9th Grade',
    subjects: ['English Language Arts'],
    unitTitle: 'Cultural Narratives and Identity Expression',
    days: 3,
    standards: 'CCSS ELA-Literacy Standards',
    focus: 'Trauma-informed cultural identity exploration through STEAM'
  });
  
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);

  // Generate lesson plan
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generatePlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.ok) {
        setGeneratedPlan(result.plan);
        console.log('✅ Generated Rootwork Framework plan with', result.plan.days.length, 'days');
      } else {
        throw new Error(result.error || 'Failed to generate plan');
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate lesson plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Download as PDF - Primary Option for Teachers
  const downloadPDF = async () => {
    if (!generatedPlan) return;
    
    setDownloadLoading('pdf');
    try {
      const response = await fetch('/api/generatePlan?format=pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('PDF generation failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.unitTitle.replace(/[^a-zA-Z0-9]/g, '_')}_RootworkFramework.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ PDF downloaded successfully');
    } catch (error) {
      console.error('PDF download error:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadLoading(null);
    }
  };

  // Download as DOCX - Generate Word document content
  const downloadDOCX = async () => {
    if (!generatedPlan) return;
    
    setDownloadLoading('docx');
    try {
      // Create Word-compatible HTML content
      let docContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${generatedPlan.meta.title}</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 1in; line-height: 1.6; }
        h1 { color: #2c5f2d; border-bottom: 2px solid #2c5f2d; }
        h2 { color: #4a7c59; margin-top: 1.5em; }
        h3 { color: #2c5f2d; }
        .teacher-note { background-color: #e8f5e8; padding: 8px; margin: 8px 0; border-left: 4px solid #2c5f2d; font-style: italic; }
        .student-note { background-color: #e3f2fd; padding: 8px; margin: 8px 0; border-left: 4px solid #1976d2; font-weight: bold; }
        .standards { background-color: #f5f5f5; padding: 10px; margin: 10px 0; }
        .mtss-supports { background-color: #fff3e0; padding: 10px; margin: 10px 0; }
        ul { margin: 8px 0; padding-left: 20px; }
        .page-break { page-break-before: always; }
    </style>
</head>
<body>
    <h1>${generatedPlan.meta.title}</h1>
    <p><strong>Rootwork Framework: Trauma-Informed STEAM Lesson Plan</strong></p>
    <p><strong>Grade Level:</strong> ${generatedPlan.meta.gradeLevel}</p>
    <p><strong>Subject(s):</strong> ${generatedPlan.meta.subject}</p>
    <p><strong>Duration:</strong> ${generatedPlan.meta.days} days (90 minutes each)</p>
    <p><strong>Essential Question:</strong> ${generatedPlan.meta.essentialQuestion}</p>
    
    <div class="standards">
        <h3>Standards Addressed:</h3>
        <ul>
            ${generatedPlan.meta.standards.map(standard => `<li>${standard}</li>`).join('')}
        </ul>
    </div>
`;

      // Add daily lessons with Teacher/Student notes
      generatedPlan.days.forEach((day, index) => {
        if (index > 0) docContent += '<div class="page-break"></div>';
        
        docContent += `
    <h2>Day ${day.day}: ${day.title}</h2>
`;

        // Handle different lesson structures (Rootwork vs fallback)
        if (day.flow) {
          // Rootwork Framework structure with Teacher/Student notes
          Object.entries(day.flow).forEach(([section, content]: [string, any]) => {
            docContent += `
    <h3>${section.charAt(0).toUpperCase() + section.slice(1).replace(/([A-Z])/g, ' $1')}</h3>
    <p>${content.activity}</p>
    ${content.teacherNote ? `<div class="teacher-note">${content.teacherNote}</div>` : ''}
    ${content.studentNote ? `<div class="student-note">${content.studentNote}</div>` : ''}
`;
          });
        } else if (day.activities) {
          // Fallback structure
          Object.entries(day.activities).forEach(([section, activity]: [string, any]) => {
            docContent += `
    <h3>${section.charAt(0).toUpperCase() + section.slice(1)}</h3>
    <p>${activity}</p>
`;
          });
        }

        // Add MTSS supports if present
        if (day.mtss) {
          docContent += `
    <div class="mtss-supports">
        <h3>MTSS Tiered Supports</h3>
        <p><strong>Tier 1 (Universal):</strong> ${day.mtss.tier1.join(', ')}</p>
        <p><strong>Tier 2 (Targeted):</strong> ${day.mtss.tier2.join(', ')}</p>
        <p><strong>Tier 3 (Intensive):</strong> ${day.mtss.tier3.join(', ')}</p>
    </div>
`;
        }

        // Add materials if present
        if (day.materials) {
          docContent += `
    <h3>Required Materials</h3>
    <ul>
        ${day.materials.map(material => `<li>${material}</li>`).join('')}
    </ul>
`;
        }

        // Add assessment if present
        if (day.assessment) {
          docContent += `
    <h3>Assessment</h3>
    <p>${day.assessment}</p>
`;
        }
      });

      docContent += `
</body>
</html>`;

      // Create and download DOCX-compatible file
      const blob = new Blob([docContent], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.unitTitle.replace(/[^a-zA-Z0-9]/g, '_')}_RootworkFramework.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ DOCX downloaded successfully');
    } catch (error) {
      console.error('DOCX download error:', error);
      alert('Failed to download Word document. Please try again.');
    } finally {
      setDownloadLoading(null);
    }
  };

  // Copy for Google Docs - Secondary option
  const copyForGoogleDocs = async () => {
    if (!generatedPlan?.markdown) return;
    
    try {
      await navigator.clipboard.writeText(generatedPlan.markdown);
      alert('✅ Lesson plan copied to clipboard! You can now paste it into Google Docs.');
      console.log('✅ Content copied to clipboard for Google Docs');
    } catch (error) {
      console.error('Clipboard error:', error);
      alert('Failed to copy to clipboard. Please try selecting and copying the text manually.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Form Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Rootwork Framework Lesson Plan Generator</h2>
        <p className="text-gray-600 mb-6">Generate trauma-informed STEAM lesson plans with mandatory Teacher & Student notes</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade Level
            </label>
            <select
              value={formData.gradeLevel}
              onChange={(e) => setFormData({...formData, gradeLevel: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="6th Grade">6th Grade</option>
              <option value="7th Grade">7th Grade</option>
              <option value="8th Grade">8th Grade</option>
              <option value="9th Grade">9th Grade</option>
              <option value="10th Grade">10th Grade</option>
              <option value="11th Grade">11th Grade</option>
              <option value="12th Grade">12th Grade</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Days
            </label>
            <select
              value={formData.days}
              onChange={(e) => setFormData({...formData, days: parseInt(e.target.value)})}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value={1}>1 Day</option>
              <option value={2}>2 Days</option>
              <option value={3}>3 Days</option>
              <option value={4}>4 Days</option>
              <option value={5}>5 Days</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Title
            </label>
            <input
              type="text"
              value={formData.unitTitle}
              onChange={(e) => setFormData({...formData, unitTitle: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter your unit title..."
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Learning Focus
            </label>
            <input
              type="text"
              value={formData.focus}
              onChange={(e) => setFormData({...formData, focus: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g., Cultural identity, trauma-informed STEAM, garden-based learning..."
            />
          </div>
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-6 w-full bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Generating Rootwork Framework Lesson...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Generate Trauma-Informed Lesson Plan
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      {generatedPlan && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">{generatedPlan.meta.title}</h3>
              <p className="text-green-600 font-medium">Rootwork Framework: Trauma-Informed STEAM</p>
              <p className="text-gray-600">{generatedPlan.meta.gradeLevel} • {generatedPlan.meta.subject}</p>
              <p className="text-sm text-gray-500 mt-1">{generatedPlan.meta.days} days • Essential Question: {generatedPlan.meta.essentialQuestion}</p>
            </div>
            
            {/* PRIMARY DOWNLOAD BUTTONS FOR TEACHERS */}
            <div className="flex flex-col gap-2">
              <button
                onClick={downloadPDF}
                disabled={downloadLoading === 'pdf'}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 min-w-[120px]"
              >
                {downloadLoading === 'pdf' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download PDF
              </button>
              
              <button
                onClick={downloadDOCX}
                disabled={downloadLoading === 'docx'}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 min-w-[120px]"
              >
                {downloadLoading === 'docx' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                Download Word
              </button>
              
              <button
                onClick={copyForGoogleDocs}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center gap-2 min-w-[120px]"
              >
                <Copy className="h-4 w-4" />
                Copy Text
              </button>
            </div>
          </div>

          {/* Standards */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-2">Standards Addressed:</h4>
            <div className="flex flex-wrap gap-2">
              {generatedPlan.meta.standards.map((standard, idx) => (
                <span key={idx} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                  {standard}
                </span>
              ))}
            </div>
          </div>

          {/* Daily Lessons Preview */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700">Daily Lessons Preview:</h4>
            {generatedPlan.days.map((day) => (
              <div key={day.day} className="border border-gray-200 rounded-md p-4">
                <h5 className="font-medium text-gray-800 mb-2">Day {day.day}: {day.title}</h5>
                
                {/* Show Teacher/Student notes if present (Rootwork structure) */}
                {day.flow && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Opening Activity:</span>
                      <p className="text-gray-600 mt-1">{day.flow.opening?.activity || 'Garden-based opening ritual'}</p>
                      {day.flow.opening?.teacherNote && (
                        <p className="text-green-700 text-xs mt-1 italic">{day.flow.opening.teacherNote}</p>
                      )}
                      {day.flow.opening?.studentNote && (
                        <p className="text-blue-700 text-xs mt-1 font-medium">{day.flow.opening.studentNote}</p>
                      )}
                    </div>
                    <div>
                      <span className="font-medium">MTSS Supports:</span>
                      {day.mtss && (
                        <p className="text-gray-600 mt-1">Tier 1: {day.mtss.tier1[0] || 'Universal supports'}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Show basic activities if present (fallback structure) */}
                {day.activities && (
                  <div className="text-sm">
                    <span className="font-medium">Opening:</span>
                    <p className="text-gray-600 mt-1">{day.activities.opening}</p>
                  </div>
                )}
                
                <div className="mt-3 text-xs text-gray-500">
                  ✅ Includes mandatory Teacher & Student notes • ✅ Trauma-informed facilitation • ✅ STEAM integration
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-green-50 rounded-md">
            <p className="text-green-800 text-sm">
              <strong>📄 Download your complete lesson plan</strong> with detailed Teacher Notes, Student Notes, 
              MTSS supports, regulation rituals, and Appendix A resource directory.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
