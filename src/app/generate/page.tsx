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
                  className="px-4 py-2 bg-[#3B523A] hover:bg-[#001C10] text-whi
