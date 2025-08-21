// src/app/generate/page.tsx - RWFW Generator (pedagogy-aware loading, logo, text resources)

'use client';

import { useState } from 'react';
import Link from 'next/link';

interface FormData {
  subjects: string[];
  gradeLevel: string;
  topic: string;
  duration: string;
  numberOfDays: string;
  learningObjectives?: string;
  specialNeeds?: string;
  availableResources?: string;
  location?: string;
  unitContext?: string;
}

const SUBJECTS = [
  'English Language Arts',
  'Mathematics',
  'Science',
  'Social Studies',
  'STEAM (Integrated)',
  'Special Education',
  'Agriculture',
  'Environmental Science',
  'Life Skills',
  'Social-Emotional Learning',
  'Art',
  'Music',
  'Physical Education',
  'Career & Technical Education',
  'World Languages',
  'Other',
];

// Loading stages aligned to RWFW pedagogy
const LOADING_STAGES = [
  { stage: 'relationships', message: 'Centering Relationships — establishing circle and belonging…', duration: 1500 },
  { stage: 'routines', message: 'Structuring Routines — safety, predictability, and flow…', duration: 1400 },
  { stage: 'relevance', message: 'Building Relevance — connecting lived experiences and place…', duration: 1600 },
  { stage: 'rigor', message: 'Designing Rigor — modeling, scaffolding, and productive struggle…', duration: 1800 },
  { stage: 'reflection', message: 'Preparing Reflection — metacognition and forward planning…', duration: 1400 },
  { stage: 'mtss', message: 'Layering MTSS — universal, targeted, and intensive supports…', duration: 1400 },
  { stage: 'assessment', message: 'Shaping Evidence — checks for understanding & rubrics…', duration: 1200 },
];

const RWFW_LOGO_SRC = '/rwfw-logo.svg'; // Put your logo here: /public/rwfw-logo.svg

export default function GeneratePage() {
  const [formData, setFormData] = useState<FormData>({
    subjects: [],
    gradeLevel: '',
    topic: '',
    duration: '',
    numberOfDays: '',
    learningObjectives: '',
    specialNeeds: '',
    availableResources: '',
    location: 'Savannah, Georgia',
    unitContext: '',
  });

  const [lessonPlan, setLessonPlan] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasResponse, setHasResponse] = useState(false); // for 100% sweep timing
  const [error, setError] = useState('');
  const [currentStage, setCurrentStage] = useState(0);
  const [showForm, setShowForm] = useState(true);
  const [copied, setCopied] = useState(false);
  const [resourcesText, setResourcesText] = useState<string>('');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubjectChange = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const simulateLoadingStages = () => {
    let stageIndex = 0;
    const progressStage = () => {
      if (!isGenerating) return;
      if (stageIndex < LOADING_STAGES.length) {
        setCurrentStage(stageIndex);
        setTimeout(() => {
          stageIndex++;
          progressStage();
        }, LOADING_STAGES[stageIndex]?.duration || 1200);
      }
    };
    progressStage();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setHasResponse(false);
    setError('');
    setCurrentStage(0);
    simulateLoadingStages();

    // Validate
    const missing: string[] = [];
    if (!formData.subjects.length) missing.push('Subject Area(s)');
    if (!formData.gradeLevel?.trim()) missing.push('Grade Level');
    if (!formData.topic?.trim()) missing.push('Lesson Topic');
    if (!formData.duration?.trim()) missing.push('Duration');
    if (!formData.numberOfDays?.trim()) missing.push('Number of Days');

    if (missing.length) {
      setError(`Please complete these required fields: ${missing.join(', ')}`);
      setIsGenerating(false);
      return;
    }

    // Enhance user text (optional)
    const learningObjectives = enrichLearningObjectives(
      formData.learningObjectives || '',
      formData.subjects,
      formData.gradeLevel
    );
    const specialNeeds = expandSpecialNeeds(formData.specialNeeds || '');

    try {
      const payload = {
        subject: formData.subjects.join(', '),
        gradeLevel: formData.gradeLevel.trim(),
        topic: formData.topic.trim(),
        duration: formData.duration.trim(),
        numberOfDays: formData.numberOfDays.trim(),
        learningObjectives,
        specialNeeds,
        availableResources: formData.availableResources?.trim() || '',
        location: formData.location || 'Savannah, Georgia',
        unitContext: formData.unitContext || '',
        lessonType: 'comprehensive_multi_day',
        requireTeacherNotes: true,
        requireStudentNotes: true,
        includeTraumaInformed: true,
        includeSTEAM: true,
        includeMTSS: true,
        includeAssessment: true,
        includeResources: true,
        gradualRelease: true,
        specialInstructions:
          `Use Root Work Framework voice. Keep directives out of final copy. 
           When you output tables (Standards Alignment, Implementation Supports, Assessments), 
           use pipe format (Header 1 | Header 2 | Header 3) with at least 2 rows, no extra commentary.`,
      };

      const res = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `Request failed with status ${res.status}`);
      }

      if (!data?.lessonPlan) {
        throw new Error('No lesson plan generated. Please try again.');
      }

      // Show a final sweep to 100% just before rendering
      setHasResponse(true);

      // Save plan and build text-only classroom resources
      setLessonPlan(data.lessonPlan);
      setResourcesText(buildTextResources(String(data.lessonPlan || ''), formData));

      // Brief delay so users see 100% reached
      setTimeout(() => {
        setShowForm(false);
        setIsGenerating(false);
      }, 350);
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err?.message || 'Failed to generate lesson plan. Please try again.');
      setIsGenerating(false);
    }
  };

  // ——— helpers ———

  const enrichLearningObjectives = (text: string, subjects: string[], gradeLevel: string) => {
    if (!text.trim()) return '';
    const shortcuts: Record<string, string> = {
      'georgia standards': 'Georgia Standards of Excellence (GSE)',
      'common core': 'Common Core State Standards (CCSS)',
      ngss: 'Next Generation Science Standards (NGSS)',
      casel: 'CASEL Social-Emotional Learning Standards',
    };
    const lower = text.toLowerCase();
    let out = text.trim();
    Object.entries(shortcuts).forEach(([key, label]) => {
      if (lower.includes(key)) {
        out += `\n\nINTEGRATE: Include specific ${label} aligned to ${subjects.join(
          ' & '
        )} for grade ${gradeLevel}. Provide actual codes and plain-language descriptions.`;
      }
    });
    return out;
  };

  const expandSpecialNeeds = (text: string) => {
    if (!text.trim()) return '';
    const expansions: Record<string, string> = {
      ell: 'English Language Learners',
      sped: 'Special Education',
      iep: 'Individualized Education Program',
      '504': 'Section 504 accommodations',
      adhd: 'Attention Deficit Hyperactivity Disorder',
      asd: 'Autism Spectrum Disorder',
      ptsd: 'Post-Traumatic Stress Disorder',
    };
    let out = text.trim();
    const lower = out.toLowerCase();
    Object.entries(expansions).forEach(([abbr, full]) => {
      if (lower.includes(abbr)) {
        out += `\n\nPROVIDE: Evidence-based accommodations and supports for ${full}.`;
      }
    });
    return out;
  };

  const copyToClipboard = () => {
    if (!lessonPlan) return;
    const text = typeof lessonPlan === 'object' ? JSON.stringify(lessonPlan, null, 2) : String(lessonPlan);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const downloadAsHTML = () => {
    if (!lessonPlan) return;
    const html = createPrintHtml(String(lessonPlan));
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RWFW_${formData.topic.replace(/[^a-z0-9]/gi, '_')}_Grade${formData.gradeLevel}_${
      formData.numberOfDays
    }days.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsRTF = () => {
    if (!lessonPlan) return;
    const rtf = createRtf(String(lessonPlan));
    const blob = new Blob([rtf], { type: 'application/rtf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RWFW_${formData.topic.replace(/[^a-z0-9]/gi, '_')}_Grade${formData.gradeLevel}_${
      formData.numberOfDays
    }days.rtf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadResourcesTxt = () => {
    if (!resourcesText.trim()) return;
    const blob = new Blob([resourcesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RWFW_${formData.topic.replace(/[^a-z0-9]/gi, '_')}_Text_Resources.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build quick, text-only classroom resources from the generated plan
  function buildTextResources(plan: string, data: FormData) {
    const days = Number(data.numberOfDays || '5') || 5;
    const eqs = extractDailySection(plan, /Daily Essential Question/i, days);
    const targets = extractDailySection(plan, /Daily Learning Target/i, days);

    let out = `Root Work Framework — Text Resources\nTopic: ${data.topic}\nGrade: ${data.gradeLevel}\nSubjects: ${data.subjects.join(
      ', '
    )}\nDays: ${data.numberOfDays}\n\n`;

    for (let i = 0; i < days; i++) {
      const eq = (eqs[i] || '').trim();
      const tgt = (targets[i] || '').trim();
      out += `=== DAY ${i + 1} ===\n`;
      out += `Daily Essential Question:\n${eq || '(add your EQ here)'}\n\n`;
      out += `Learning Target:\n${tgt || '(add your target here)'}\n\n`;
      out += `Exit Ticket (2–3 minutes):\n` +
        `• In 2–3 sentences, respond to the EQ: "${eq || 'today’s question'}".\n` +
        `• One thing I understand now is ________.\n` +
        `• One question I still have is ________.\n\n`;
      out += `Quick Check (during We Do):\n` +
        `• Turn & talk prompt aligned to the target: "${tgt || 'today’s skill'}".\n\n`;
      out += `Reflection Prompt (last 5 minutes):\n` +
        `• "What strengthened our community today and how will it help me tomorrow?"\n\n`;
    }
    return out;
  }

  // naive extractor: grabs the first non-empty line after each heading instance
  function extractDailySection(plan: string, heading: RegExp, days: number) {
    const lines = plan.split('\n');
    const results: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      if (heading.test(lines[i])) {
        // pick next non-empty line(s) up to a blank
        let j = i + 1;
        let collected: string[] = [];
        while (j < lines.length && lines[j].trim()) {
          collected.push(lines[j].trim());
          // stop if we hit another heading-like line
          if (/^LEVEL\s+|^Day\s+\d+|^\s*Standards Alignment/i.test(lines[j])) break;
          j++;
        }
        results.push(collected.join(' '));
      }
    }
    // pad to requested length
    while (results.length < days) results.push('');
    return results.slice(0, days);
  }

  // Print HTML wrapper (keeps your existing header style; image path must exist in /public)
  function createPrintHtml(planContent: string) {
    const escaped = planContent.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>RWFW — ${formData.topic}</title>
<style>
  body{font-family:Segoe UI,system-ui,-apple-system,sans-serif;color:#2B2B2B;line-height:1.5;margin:0;padding:24pt;background:#fff;}
  .header{display:flex;align-items:center;gap:12pt;padding:16pt;border:2pt solid #D4C862;border-radius:12pt;background:linear-gradient(135deg,#F2F4CA,#E8ECBF);}
  .header img{width:56px;height:56px;object-fit:contain}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:8pt;margin-top:8pt}
  .meta div{background:#fff;border-left:4pt solid #2E86AB;padding:8pt;border-radius:6pt}
  .content{white-space:pre-wrap;background:#F8F9FA;border-left:4pt solid #D4C862;padding:14pt;border-radius:8pt;margin-top:16pt;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px}
  @media print {.header{page-break-after:avoid}}
</style>
</head><body>
<div class="header">
  <img src="${RWFW_LOGO_SRC}" alt="Root Work Framework Logo">
  <div>
    <div style="font-size:20pt;font-weight:800;color:#082A19">Root Work Framework Lesson Plan</div>
    <div style="color:#3B523A">Professional, trauma-informed learning design</div>
    <div class="meta">
      <div><b>Topic:</b> ${formData.topic}</div>
      <div><b>Grade:</b> ${formData.gradeLevel}</div>
      <div><b>Subjects:</b> ${formData.subjects.join(', ')}</div>
      <div><b>Duration:</b> ${formData.duration} × ${formData.numberOfDays} days</div>
    </div>
  </div>
</div>
<div class="content">${escaped}</div>
</body></html>`;
  }

  function createRtf(planContent: string) {
    const text = planContent.replace(/\{/g, '\\{').replace(/\}/g, '\\}').replace(/\n/g, '\\par\n');
    return `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0\\fswiss Arial;}{\\f1\\froman Times New Roman;}}
{\\colortbl;\\red8\\green42\\blue25;\\red212\\green200\\blue98;}
\\f1\\fs28\\cf1\\b ROOT WORK FRAMEWORK LESSON PLAN\\b0\\par
\\fs20 Topic: ${formData.topic}\\par
Subject(s): ${formData.subjects.join(', ')}\\par
Grade Level: ${formData.gradeLevel}\\par
Duration: ${formData.duration} over ${formData.numberOfDays} days\\par
\\par
\\f0\\fs18 ${text}\\par
}`;
  }

  // ——— UI ———

  // Generating view
  if (isGenerating) {
    const visualProgress = hasResponse
      ? 100
      : Math.min(
          90,
          Math.round(((currentStage + 1) / LOADING_STAGES.length) * 90)
        );
    const stage = LOADING_STAGES[currentStage] || LOADING_STAGES[0];

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F2F4CA] to-[#082A19] flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-2xl w-full mx-6 border-4 border-[#D4C862]">
          <div className="flex items-center justify-center mb-6">
            <img
              src={RWFW_LOGO_SRC}
              alt="Root Work Framework"
              className="w-16 h-16"
            />
          </div>
          <h2
            className="text-3xl font-bold text-center text-[#082A19] mb-2"
            style={{ fontFamily: 'Merriweather, Georgia, serif' }}
          >
            Root Work Framework is crafting your plan…
          </h2>
          <p
            className="text-center text-[#3B523A] mb-8"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {stage.message}
          </p>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="w-full bg-[#F2F4CA] rounded-full h-4 border-2 border-[#3B523A]">
              <div
                className="bg-gradient-to-r from-[#D4C862] to-[#082A19] h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${visualProgress}%` }}
              />
            </div>
            <div
              className="flex justify-between mt-2 text-sm text-[#3B523A]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <span>Progress</span>
              <span>{visualProgress}%</span>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-[#F2F4CA]/50 rounded-xl border border-[#3B523A] p-4">
            <div className="text-sm text-[#2B2B2B] space-y-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              <div><strong>Topic:</strong> {formData.topic}</div>
              <div><strong>Subjects:</strong> {formData.subjects.join(', ')}</div>
              <div><strong>Grade:</strong> {formData.gradeLevel}</div>
              <div><strong>Duration:</strong> {formData.numberOfDays} days × {formData.duration}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Plan view
  if (lessonPlan && !showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F2F4CA] to-white">
        <header className="bg-[#082A19] text-white shadow-xl">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <img src={RWFW_LOGO_SRC} alt="Root Work Framework" className="w-12 h-12" />
                <div>
                  <h1
                    className="text-2xl font-bold"
                    style={{ fontFamily: 'Merriweather, Georgia, serif' }}
                  >
                    {`Root Work Framework: ${formData.topic}`}
                  </h1>
                  <p
                    className="text-[#D4C862] text-sm"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {formData.subjects.join(' + ')} • Grade {formData.gradeLevel} • {formData.numberOfDays} days
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-[#3B523A] hover:bg-[#001C10] text-white rounded-lg transition-colors font-medium"
                >
                  New Lesson
                </button>

                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-[#3B523A] hover:bg-[#001C10] text-white rounded-lg transition-colors font-medium"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>

                <button
                  onClick={downloadAsHTML}
                  className="px-4 py-2 bg-[#D4C862] hover:bg-[#96812A] text-[#082A19] rounded-lg transition-colors font-semibold"
                >
                  Download HTML
                </button>

                <button
                  onClick={downloadAsRTF}
                  className="px-4 py-2 bg-white text-[#082A19] border-2 border-[#D4C862] hover:bg-[#F2F4CA] rounded-lg transition-colors font-medium"
                >
                  Word/RTF
                </button>

                {/* PRO actions (placeholder) */}
                <button
                  disabled
                  title="Premium feature — coming soon"
                  className="px-3 py-2 bg-white/10 border border-white/30 rounded-lg font-medium"
                >
                  Teacher’s Guide (PRO)
                </button>
                <button
                  disabled
                  title="Premium feature — coming soon"
                  className="px-3 py-2 bg-white/10 border border-white/30 rounded-lg font-medium"
                >
                  Student Workbook (PRO)
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
          {/* Plan content */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-[#D4C862]">
            <div className="prose max-w-none">
              <pre
                className="whitespace-pre-wrap text-sm text-[#2B2B2B] leading-relaxed font-sans bg-[#F2F4CA]/20 p-6 rounded-xl border border-[#3B523A]"
                style={{ fontFamily: 'JetBrains Mono, Consolas, monospace' }}
              >
                {typeof lessonPlan === 'object'
                  ? JSON.stringify(lessonPlan, null, 2)
                  : String(lessonPlan)}
              </pre>
            </div>
          </div>

          {/* Text resources */}
          {resourcesText && (
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-[#D4C862]">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-xl font-bold text-[#082A19]"
                  style={{ fontFamily: 'Merriweather, Georgia, serif' }}
                >
                  Classroom Text Resources (Starter Pack)
                </h2>
                <button
                  onClick={downloadResourcesTxt}
                  className="px-4 py-2 bg-[#3B523A] hover:bg-[#001C10] text-white rounded-lg transition-colors font-medium"
                >
                  Download .txt
                </button>
              </div>
              <pre
                className="whitespace-pre-wrap text-sm text-[#2B2B2B] leading-relaxed font-sans bg-[#F2F4CA]/20 p-6 rounded-xl border border-[#3B523A]"
                style={{ fontFamily: 'JetBrains Mono, Consolas, monospace' }}
              >
                {resourcesText}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Form view
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2F4CA] to-white">
      {/* Header */}
      <header className="bg-[#082A19] text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center space-x-4">
              <img src={RWFW_LOGO_SRC} alt="Root Work Framework" className="w-12 h-12" />
              <div>
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Root Work Framework
                </h1>
                <p className="text-[#D4C862] text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Professional Lesson Planning
                </p>
              </div>
            </Link>
            <nav>
              <Link
                href="/"
                className="text-[#D4C862] hover:text-white transition-colors font-medium"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                ← Back to Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-3xl shadow-2xl p-12 border-4 border-[#D4C862]">
          <div className="text-center mb-12">
            <h2
              className="text-4xl font-bold text-[#082A19] mb-4"
              style={{ fontFamily: 'Merriweather, Georgia, serif' }}
            >
              Create Comprehensive Lesson Plan
            </h2>
            <p
              className="text-xl text-[#3B523A] leading-relaxed max-w-3xl mx-auto"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Multi-day, trauma-informed plans with the 5 Rs, MTSS scaffolding, and assessment you can teach tomorrow.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Core Information */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Subjects */}
              <div className="lg:col-span-2">
                <label
                  className="block text-xl font-bold text-[#082A19] mb-4"
                  style={{ fontFamily: 'Merriweather, Georgia, serif' }}
                >
                  Subject Area(s) <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-6 border-3 border-[#3B523A] rounded-2xl bg-[#F2F4CA]/30">
                  {SUBJECTS.map((subject) => (
                    <label
                      key={subject}
                      className="flex items-center space-x-3 text-sm cursor-pointer hover:bg-white/70 p-3 rounded-lg transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.subjects.includes(subject)}
                        onChange={() => handleSubjectChange(subject)}
                        className="w-5 h-5 rounded border-[#3B523A] text-[#D4C862] focus:ring-[#D4C862] focus:ring-2"
                      />
                      <span
                        className="text-[#2B2B2B] font-medium"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        {subject}
                      </span>
                    </label>
                  ))}
                </div>
                <p
                  className="text-[#3B523A] mt-3 text-lg"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <span className="font-bold text-[#082A19]">{formData.subjects.length}</span> selected
                  {formData.subjects.length > 0 && `: ${formData.subjects.join(', ')}`}
                </p>
              </div>

              {/* Grade Level */}
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-4" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Grade Level <span className="text-red-600">*</span>
                </label>
                <select
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 text-lg border-3 border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B]"
                  required
                >
                  <option value="">Choose Grade Level</option>
                  <option value="PreK">Pre-K</option>
                  <option value="K">Kindergarten</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={String(i + 1)}>
                      Grade {i + 1}
                    </option>
                  ))}
                  <option value="Mixed">Mixed Ages</option>
                </select>
              </div>

              {/* Number of Days */}
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-4" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Number of Days <span className="text-red-600">*</span>
                </label>
                <select
                  name="numberOfDays"
                  value={formData.numberOfDays}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 text-lg border-3 border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B]"
                  required
                >
                  <option value="">Select Days</option>
                  {[3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map((days) => (
                    <option key={days} value={String(days)}>
                      {days} {days === 1 ? 'day' : 'days'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-4" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Lesson Topic <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder="e.g., Photosynthesis & Plant Growth, Civil Rights Movement…"
                  className="w-full px-6 py-4 text-lg border-3 border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B]"
                  required
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-4" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Duration per Day <span className="text-red-600">*</span>
                </label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 text-lg border-3 border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B]"
                  required
                >
                  <option value="">Select Duration</option>
                  <option value="45 minutes">45 minutes</option>
                  <option value="50 minutes">50 minutes</option>
                  <option value="60 minutes">60 minutes</option>
                  <option value="75 minutes">75 minutes</option>
                  <option value="90 minutes">90 minutes (Block)</option>
                  <option value="120 minutes">120 minutes (Extended)</option>
                </select>
              </div>
            </div>

            {/* Optional Fields */}
            <div className="space-y-8">
              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-4" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Learning Objectives & Standards <span className="text-[#3B523A] text-lg font-normal ml-3">(optional)</span>
                </label>
                <textarea
                  name="learningObjectives"
                  value={formData.learningObjectives}
                  onChange={handleInputChange}
                  rows={5}
                  placeholder="Shortcuts: “Georgia Standards”, “Common Core”, “NGSS”, “CASEL”…"
                  className="w-full px-6 py-4 text-lg border-3 border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B] resize-vertical"
                />
              </div>

              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-4" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Unit Context <span className="text-[#3B523A] text-lg font-normal ml-3">(optional)</span>
                </label>
                <textarea
                  name="unitContext"
                  value={formData.unitContext}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="What larger unit/theme does this lesson connect to?"
                  className="w-full px-6 py-4 text-lg border-3 border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B] resize-vertical"
                />
              </div>

              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-4" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Special Considerations & Accommodations <span className="text-[#3B523A] text-lg font-normal ml-3">(optional)</span>
                </label>
                <textarea
                  name="specialNeeds"
                  value={formData.specialNeeds}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Shortcuts: ELL, IEP, ADHD, autism, trauma-informed…"
                  className="w-full px-6 py-4 text-lg border-3 border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B] resize-vertical"
                />
              </div>

              <div>
                <label className="block text-xl font-bold text-[#082A19] mb-4" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Available Resources & Materials <span className="text-[#3B523A] text-lg font-normal ml-3">(optional)</span>
                </label>
                <textarea
                  name="availableResources"
                  value={formData.availableResources}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Garden space, devices, lab, community partners, manipulatives…"
                  className="w-full px-6 py-4 text-lg border-3 border-[#3B523A] rounded-xl focus:ring-4 focus:ring-[#D4C862] focus:border-[#D4C862] bg-white text-[#2B2B2B] resize-vertical"
                />
              </div>
            </div>

            {/* Submit */}
            <div className="bg-gradient-to-r from-[#F2F4CA] to-[#D4C862]/40 p-10 rounded-3xl border-4 border-[#D4C862]">
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-[#082A19] hover:bg-[#001C10] disabled:bg-[#3B523A] text-white font-bold py-6 px-10 rounded-2xl transition-all duration-300 flex items-center justify-center text-2xl shadow-2xl hover:shadow-3xl"
                style={{ fontFamily: 'Merriweather, Georgia, serif' }}
              >
                Generate Professional Lesson Plan
              </button>
              <p className="text-[#082A19] mt-4 text-center text-lg font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                Includes: 5 Rs • MTSS supports • Assessments • Teacher & student notes
              </p>
            </div>
          </form>

          {error && (
            <div className="mt-10 p-8 bg-red-50 border-4 border-red-200 rounded-2xl">
              <div className="flex items-start">
                <svg className="w-8 h-8 text-red-500 mr-4 flex-shrink-0 mt-1" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-red-800 font-bold text-xl mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                    Unable to Generate Lesson Plan
                  </p>
                  <p className="text-red-700 text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
