// File: src/app/generate/page.tsx
'use client';

import { useState } from 'react';
import {
  Calendar, Clock, Users, Target, BookOpen, Download, Copy, Check, FileText,
  ListChecks, Brain, GraduationCap, Layers, Sandwich
} from 'lucide-react';

import type {
  LessonPlan,
  LessonRequest,
  LessonFlowStep,
  FiveRsBlock,
  Dok
} from '@/types/lesson';

/** ---------- Small helpers ---------- */
function sectionTitle(cls = '') {
  return `font-semibold text-[#082A19] mb-2 ${cls}`;
}
function liKey(prefix: string, i: number) {
  return `${prefix}-${i}`;
}

/** ---------- Type-safe normalizers (defensive) ---------- */
function asString(v: unknown, def = ''): string {
  return typeof v === 'string' ? v : def;
}
function asNumber(v: unknown, def = 0): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : def;
}
function asArray<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
function asDok(v: unknown): Dok {
  const n = typeof v === 'number' ? v : Number(v);
  return (n === 1 || n === 2 || n === 3 || n === 4) ? (n as Dok) : 2;
}
function asFiveRsBlock(v: any): FiveRsBlock {
  return {
    label: asString(v?.label),
    minutes: asNumber(v?.minutes, 0),
    purpose: asString(v?.purpose),
  };
}
function asFlowStep(v: any): LessonFlowStep {
  const allowed = new Set(['I Do', 'We Do', 'You Do']);
  const phase = allowed.has(v?.phase) ? v.phase : 'We Do';
  return {
    phase,
    step: asString(v?.step),
    details: asString(v?.details),
    teacherNote: asString(v?.teacherNote),
    studentNote: asString(v?.studentNote),
  };
}

/** Normalize a possibly-messy object from the API into a LessonPlan */
function normalizePlan(raw: any): LessonPlan {
  const iCanTargets = asArray<any>(raw?.iCanTargets).map((t) => ({
    text: asString(t?.text),
    dok: asDok(t?.dok),
  }));

  const fiveRsSchedule = asArray<any>(raw?.fiveRsSchedule).map(asFiveRsBlock);

  const literacy = {
    skills: asArray<string>(raw?.literacySkillsAndResources?.skills).map((s) => asString(s)),
    resources: asArray<string>(raw?.literacySkillsAndResources?.resources).map((r) => asString(r)),
  };

  const bloomsAlignment = asArray<any>(raw?.bloomsAlignment).map((b) => ({
    task: asString(b?.task),
    bloom: ((): 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create' => {
      const v = asString(b?.bloom);
      const allowed = new Set(['Remember','Understand','Apply','Analyze','Evaluate','Create']);
      return (allowed.has(v) ? v : 'Understand') as any;
    })(),
    rationale: asString(b?.rationale),
  }));

  const coTeachingIntegration = {
    model: asString(raw?.coTeachingIntegration?.model),
    roles: asArray<string>(raw?.coTeachingIntegration?.roles).map((r) => asString(r)),
    grouping: asString(raw?.coTeachingIntegration?.grouping),
  };

  const reteachingAndSpiral = {
    sameDayQuickPivot: asString(raw?.reteachingAndSpiral?.sameDayQuickPivot),
    nextDayPlan: asString(raw?.reteachingAndSpiral?.nextDayPlan),
    spiralIdeas: asArray<string>(raw?.reteachingAndSpiral?.spiralIdeas).map((s) => asString(s)),
  };

  const mtssSupports = {
    tier1: asArray<string>(raw?.mtssSupports?.tier1).map((s) => asString(s)),
    tier2: asArray<string>(raw?.mtssSupports?.tier2).map((s) => asString(s)),
    tier3: asArray<string>(raw?.mtssSupports?.tier3).map((s) => asString(s)),
    progressMonitoring: asArray<string>(raw?.mtssSupports?.progressMonitoring).map((s) => asString(s)),
  };

  const therapeuticRootworkContext = {
    rationale: asString(raw?.therapeuticRootworkContext?.rationale),
    regulationCue: asString(raw?.therapeuticRootworkContext?.regulationCue),
    restorativePractice: asString(raw?.therapeuticRootworkContext?.restorativePractice),
    communityAssets: asArray<string>(raw?.therapeuticRootworkContext?.communityAssets).map((a) => asString(a)),
  };

  const lessonFlowGRR = asArray<any>(raw?.lessonFlowGRR).map(asFlowStep);

  const assessmentAndEvidence = {
    formativeChecks: asArray<string>(raw?.assessmentAndEvidence?.formativeChecks).map((f) => asString(f)),
    rubric: asArray<any>(raw?.assessmentAndEvidence?.rubric).map((r) => ({
      criterion: asString(r?.criterion),
      developing: asString(r?.developing),
      proficient: asString(r?.proficient),
      advanced: asString(r?.advanced),
    })),
    exitTicket: asString(raw?.assessmentAndEvidence?.exitTicket),
  };

  // Legacy fields
  const objectives = asArray<string>(raw?.objectives).map((o) => asString(o));
  const timeline = asArray<any>(raw?.timeline).map((t) => ({
    time: asString(t?.time),
    activity: asString(t?.activity),
    description: asString(t?.description),
  }));
  const assessment = asString(raw?.assessment);
  const differentiation = asString(raw?.differentiation);
  const extensions = asString(raw?.extensions);

  return {
    title: asString(raw?.title),
    overview: asString(raw?.overview),
    materials: asArray<string>(raw?.materials).map((m) => asString(m)),

    iCanTargets,
    fiveRsSchedule,
    literacySkillsAndResources: literacy,
    bloomsAlignment,
    coTeachingIntegration,
    reteachingAndSpiral,
    mtssSupports,
    therapeuticRootworkContext,
    lessonFlowGRR,
    assessmentAndEvidence,

    // legacy (optional)
    ...(objectives.length ? { objectives } : {}),
    ...(timeline.length ? { timeline } : {}),
    ...(assessment ? { assessment } : {}),
    ...(differentiation ? { differentiation } : {}),
    ...(extensions ? { extensions } : {}),
  };
}

/** ---------- Component ---------- */
export default function GeneratePage() {
  const [formData, setFormData] = useState({
    subject: '',
    gradeLevel: '',
    topic: '',
    duration: '',
    learningObjectives: '',
    specialNeeds: '',
    availableResources: '',
  });

  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError('');
    setUsedFallback(false);

    // Minimal required validation (keep UX snappy)
    const missing: string[] = [];
    if (!formData.subject?.trim()) missing.push('Subject Area');
    if (!formData.gradeLevel?.trim()) missing.push('Grade Level');
    if (!formData.topic?.trim()) missing.push('Lesson Topic');
    if (!formData.duration?.trim()) missing.push('Duration');
    if (missing.length) {
      setError(`Please fill in: ${missing.join(', ')}`);
      setIsGenerating(false);
      return;
    }

    const payload: LessonRequest = {
      subject: formData.subject.trim(),
      gradeLevel: formData.gradeLevel.trim(),
      topic: formData.topic.trim(),
      duration: formData.duration.trim(),
      learningObjectives: formData.learningObjectives?.trim() || '',
      specialNeeds: formData.specialNeeds?.trim() || '',
      availableResources: formData.availableResources?.trim() || '',
    };

    try {
      const res = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log('Response status:', res.status);
      console.log('Response data:', JSON.stringify(data, null, 2));

      if (!res.ok || !data?.lessonPlan) {
        throw new Error(data?.error || `Unexpected response (${res.status})`);
      }

      // **Key fix**: normalize before rendering to avoid "object as child" error
      const normalized = normalizePlan(data.lessonPlan);
      setLessonPlan(normalized);

      // If backend signaled fallback, surface (we also tolerate either boolean or string flags)
      const fb = Boolean(data?.fallback) || data?.success === false;
      setUsedFallback(fb);
    } catch (err: any) {
      setError(`Failed to generate lesson plan: ${err?.message || 'Unknown error'}`);
      console.error('Form submission error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  /** ---------- Exporters ---------- */
  const formatLessonPlanText = (plan: LessonPlan) => {
    const lines: string[] = [];

    lines.push(`ROOT WORK FRAMEWORK LESSON PLAN: ${plan.title}`);
    lines.push('');
    lines.push('OVERVIEW:');
    lines.push(plan.overview);
    lines.push('');

    lines.push('I CAN TARGETS (with DOK):');
    plan.iCanTargets?.forEach((t, i) => lines.push(`${i + 1}. ${t.text} (DOK ${t.dok})`));
    lines.push('');

    lines.push('5 Rs SCHEDULE:');
    plan.fiveRsSchedule?.forEach((b, i) => lines.push(`${i + 1}. ${b.label} — ${b.minutes} min :: ${b.purpose}`));
    lines.push('');

    lines.push('LITERACY SKILLS:');
    plan.literacySkillsAndResources?.skills?.forEach((s) => lines.push(`• ${s}`));
    lines.push('RESOURCES:');
    plan.literacySkillsAndResources?.resources?.forEach((r) => lines.push(`• ${r}`));
    lines.push('');

    lines.push("BLOOM'S ALIGNMENT:");
    plan.bloomsAlignment?.forEach((b, i) => lines.push(
      `${i + 1}. ${b.task} — ${b.bloom}\n   ${b.rationale}`
    ));
    lines.push('');

    lines.push('CO-TEACHING INTEGRATION:');
    lines.push(`Model: ${plan.coTeachingIntegration?.model}`);
    lines.push(`Grouping: ${plan.coTeachingIntegration?.grouping}`);
    lines.push('Roles:');
    plan.coTeachingIntegration?.roles?.forEach((r) => lines.push(`• ${r}`));
    lines.push('');

    lines.push('RETEACHING & SPIRAL:');
    lines.push(`Same-Day Quick Pivot: ${plan.reteachingAndSpiral?.sameDayQuickPivot}`);
    lines.push(`Next-Day Plan: ${plan.reteachingAndSpiral?.nextDayPlan}`);
    lines.push('Spiral Ideas:');
    plan.reteachingAndSpiral?.spiralIdeas?.forEach((s) => lines.push(`• ${s}`));
    lines.push('');

    lines.push('MTSS SUPPORTS:');
    lines.push('Tier 1:'); plan.mtssSupports?.tier1?.forEach((s) => lines.push(`• ${s}`));
    lines.push('Tier 2:'); plan.mtssSupports?.tier2?.forEach((s) => lines.push(`• ${s}`));
    lines.push('Tier 3:'); plan.mtssSupports?.tier3?.forEach((s) => lines.push(`• ${s}`));
    lines.push('Progress Monitoring:'); plan.mtssSupports?.progressMonitoring?.forEach((s) => lines.push(`• ${s}`));
    lines.push('');

    lines.push('THERAPEUTIC ROOTWORK CONTEXT:');
    lines.push(`Rationale: ${plan.therapeuticRootworkContext?.rationale}`);
    lines.push(`Regulation Cue: ${plan.therapeuticRootworkContext?.regulationCue}`);
    lines.push(`Restorative Practice: ${plan.therapeuticRootworkContext?.restorativePractice}`);
    lines.push('Community Assets:');
    plan.therapeuticRootworkContext?.communityAssets?.forEach((a) => lines.push(`• ${a}`));
    lines.push('');

    lines.push('LESSON FLOW (GRR):');
    plan.lessonFlowGRR?.forEach((s, i) => {
      lines.push(`${i + 1}. ${s.phase} — ${s.step}`);
      lines.push(`   ${s.details}`);
      lines.push(`   ${s.teacherNote}`);
      lines.push(`   ${s.studentNote}`);
    });
    lines.push('');

    lines.push('ASSESSMENT & EVIDENCE:');
    lines.push('Formative Checks:');
    plan.assessmentAndEvidence?.formativeChecks?.forEach((f) => lines.push(`• ${f}`));
    lines.push('Rubric:');
    plan.assessmentAndEvidence?.rubric?.forEach((r) =>
      lines.push(`• ${r.criterion} — Dev: ${r.developing} | Prof: ${r.proficient} | Adv: ${r.advanced}`)
    );
    lines.push(`Exit Ticket: ${plan.assessmentAndEvidence?.exitTicket}`);
    lines.push('');

    // Legacy sections if present
    if (plan.objectives?.length) {
      lines.push('LEGACY: LEARNING OBJECTIVES');
      plan.objectives.forEach((o, i) => lines.push(`${i + 1}. ${o}`));
      lines.push('');
    }
    if (plan.timeline?.length) {
      lines.push('LEGACY: TIMELINE');
      plan.timeline.forEach((t) => lines.push(`${t.time} — ${t.activity}\n   ${t.description}`));
      lines.push('');
    }
    if (plan.assessment) {
      lines.push('LEGACY: ASSESSMENT');
      lines.push(plan.assessment);
      lines.push('');
    }
    if (plan.differentiation) {
      lines.push('LEGACY: DIFFERENTIATION');
      lines.push(plan.differentiation);
      lines.push('');
    }
    if (plan.extensions) {
      lines.push('LEGACY: EXTENSIONS');
      lines.push(plan.extensions);
      lines.push('');
    }

    lines.push('Generated by Root Work Framework — healing-centered, biophilic practice.');
    return lines.join('\n');
  };

  const copyToClipboard = () => {
    if (!lessonPlan) return;
    navigator.clipboard.writeText(formatLessonPlanText(lessonPlan));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const downloadLessonPlan = () => {
    if (!lessonPlan) return;
    const text = formatLessonPlanText(lessonPlan);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lessonPlan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_rwfw_lesson_plan.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsHTML = () => {
    if (!lessonPlan) return;
    const plan = lessonPlan;
    const h = (s: string) => (s || '').replace(/\n/g, '<br/>');

    const html = `
<!doctype html><html><head>
<meta charset="utf-8" />
<title>RWFW — ${plan.title}</title>
<style>
  body { font-family: 'Inter', system-ui, Arial; color:#2B2B2B; max-width:900px; margin:0 auto; padding:40px 24px; }
  h1,h2,h3 { color:#082A19; font-family:'Merriweather', Georgia, serif; }
  h1 { border-bottom:3px solid #D4C862; padding-bottom:10px; }
  .chip { display:inline-block; padding:4px 8px; border:1px solid #3B523A; border-radius:8px; margin:2px 6px 2px 0; }
  .muted { color:#3B523A; }
  .box { border-left:4px solid #D4C862; padding-left:12px; margin:10px 0; }
  ul { margin:0; padding-left:20px; }
  table { width:100%; border-collapse:collapse; }
  th, td { border:1px solid #EEE; padding:8px; text-align:left; }
  th { background:#F6F7E6; }
</style>
</head><body>
  <header>
    <h1>Root Work Framework — Lesson Plan</h1>
    <p class="muted">Healing-centered, biophilic practice</p>
  </header>

  <section>
    <h2>${plan.title}</h2>
    <p>${h(plan.overview)}</p>
  </section>

  <section>
    <h3>I Can Targets (with DOK)</h3>
    <ul>${plan.iCanTargets.map((t) => `<li>${h(t.text)} <span class="chip">DOK ${t.dok}</span></li>`).join('')}</ul>
  </section>

  <section>
    <h3>5 Rs Schedule</h3>
    <ul>${plan.fiveRsSchedule.map((b) => `<li><strong>${h(b.label)}</strong> — ${b.minutes} min<br/><span class="muted">${h(b.purpose)}</span></li>`).join('')}</ul>
  </section>

  <section>
    <h3>Literacy Skills & Resources</h3>
    <p><strong>Skills:</strong></p>
    <ul>${plan.literacySkillsAndResources.skills.map((s) => `<li>${h(s)}</li>`).join('')}</ul>
    <p><strong>Resources:</strong></p>
    <ul>${plan.literacySkillsAndResources.resources.map((r) => `<li>${h(r)}</li>`).join('')}</ul>
  </section>

  <section>
    <h3>Bloom's Alignment</h3>
    <table>
      <thead><tr><th>Task</th><th>Level</th><th>Rationale</th></tr></thead>
      <tbody>
        ${plan.bloomsAlignment.map((b) => `<tr><td>${h(b.task)}</td><td>${b.bloom}</td><td>${h(b.rationale)}</td></tr>`).join('')}
      </tbody>
    </table>
  </section>

  <section>
    <h3>Co-Teaching Integration</h3>
    <p><strong>Model:</strong> ${h(plan.coTeachingIntegration.model)}<br/>
       <strong>Grouping:</strong> ${h(plan.coTeachingIntegration.grouping)}</p>
    <ul>${plan.coTeachingIntegration.roles.map((r) => `<li>${h(r)}</li>`).join('')}</ul>
  </section>

  <section>
    <h3>Reteaching & Spiral Review</h3>
    <div class="box"><strong>Same-Day Quick Pivot:</strong> ${h(plan.reteachingAndSpiral.sameDayQuickPivot)}</div>
    <div class="box"><strong>Next-Day Plan:</strong> ${h(plan.reteachingAndSpiral.nextDayPlan)}</div>
    <p><strong>Spiral Ideas:</strong></p>
    <ul>${plan.reteachingAndSpiral.spiralIdeas.map((s) => `<li>${h(s)}</li>`).join('')}</ul>
  </section>

  <section>
    <h3>MTSS (Tier 1–3) & Monitoring</h3>
    <p><strong>Tier 1:</strong></p><ul>${plan.mtssSupports.tier1.map((s) => `<li>${h(s)}</li>`).join('')}</ul>
    <p><strong>Tier 2:</strong></p><ul>${plan.mtssSupports.tier2.map((s) => `<li>${h(s)}</li>`).join('')}</ul>
    <p><strong>Tier 3:</strong></p><ul>${plan.mtssSupports.tier3.map((s) => `<li>${h(s)}</li>`).join('')}</ul>
    <p><strong>Progress Monitoring:</strong></p><ul>${plan.mtssSupports.progressMonitoring.map((s) => `<li>${h(s)}</li>`).join('')}</ul>
  </section>

  <section>
    <h3>Therapeutic Rootwork Context</h3>
    <div class="box"><strong>Rationale:</strong> ${h(plan.therapeuticRootworkContext.rationale)}</div>
    <div class="box"><strong>Regulation Cue:</strong> ${h(plan.therapeuticRootworkContext.regulationCue)}</div>
    <div class="box"><strong>Restorative Practice:</strong> ${h(plan.therapeuticRootworkContext.restorativePractice)}</div>
    <p><strong>Community Assets:</strong></p>
    <ul>${plan.therapeuticRootworkContext.communityAssets.map((a) => `<li>${h(a)}</li>`).join('')}</ul>
  </section>

  <section>
    <h3>Lesson Flow — GRR</h3>
    ${plan.lessonFlowGRR.map((s) => `
      <div class="box">
        <strong>${s.phase}:</strong> ${h(s.step)}<br/>
        ${h(s.details)}<br/>
        ${h(s.teacherNote)}<br/>
        ${h(s.studentNote)}
      </div>
    `).join('')}
  </section>

  <section>
    <h3>Assessment & Evidence</h3>
    <p><strong>Formative Checks:</strong></p>
    <ul>${plan.assessmentAndEvidence.formativeChecks.map((f) => `<li>${h(f)}</li>`).join('')}</ul>
    <p><strong>Rubric:</strong></p>
    <table>
      <thead><tr><th>Criterion</th><th>Developing</th><th>Proficient</th><th>Advanced</th></tr></thead>
      <tbody>
        ${plan.assessmentAndEvidence.rubric.map((r) => `<tr><td>${h(r.criterion)}</td><td>${h(r.developing)}</td><td>${h(r.proficient)}</td><td>${h(r.advanced)}</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="box"><strong>Exit Ticket:</strong> ${h(plan.assessmentAndEvidence.exitTicket)}</div>
  </section>
</body></html>
    `.trim();

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_rwfw_lesson_plan.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #F2F4CA, #ffffff)' }}>
      {/* Header */}
      <header className="border-b-2 border-[#D4C862] bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#082A19] rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-[#D4C862]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#082A19]" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
                  Root Work Framework
                </h1>
                <p className="text-sm text-[#3B523A]" style={{ fontFamily: 'Inter, sans-serif' }}>Lesson Plan Generator</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {lessonPlan && (
                <>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-[#F2F4CA] hover:bg-[#D4C862] text-[#082A19] rounded-lg transition-colors border border-[#3B523A]"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={downloadLessonPlan}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-[#F2F4CA] hover:bg-[#D4C862] text-[#082A19] rounded-lg transition-colors border border-[#3B523A]"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <Download className="h-4 w-4" />
                    <span>Download TXT</span>
                  </button>
                  <button
                    onClick={downloadAsHTML}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-[#082A19] hover:bg-[#001C10] text-[#D4C862] rounded-lg transition-colors border border-[#D4C862]"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Download HTML</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-[#D4C862]">
            <h2 className="text-2xl font-bold text-[#082A19] mb-2" style={{ fontFamily: 'Merriweather, Georgia, serif' }}>
              Create Your Root Work Lesson Plan
            </h2>
            <p className="text-sm text-[#3B523A] mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
              Fields with <span className="text-red-500">*</span> are required. RWFW plans include I Can + DOK, 5Rs, Literacy & links, Bloom’s, Co-Teaching,
              Reteaching, MTSS T1–T3, Therapeutic context, and GRR steps with Teacher/Student Notes.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#082A19] mb-2">Subject Area <span className="text-red-500">*</span></label>
                  <input
                    type="text" name="subject" value={formData.subject} onChange={handleInputChange}
                    placeholder="e.g., ELA, Science, Math"
                    className="w-full px-3 py-2 border-2 border-[#3B523A] rounded-lg focus:ring-2 focus:ring-[#D4C862] focus:border-[#D4C862]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#082A19] mb-2">Grade Level <span className="text-red-500">*</span></label>
                  <select
                    name="gradeLevel" value={formData.gradeLevel} onChange={handleInputChange}
                    className="w-full px-3 py-2 border-2 border-[#3B523A] rounded-lg focus:ring-2 focus:ring-[#D4C862] focus:border-[#D4C862]" required
                  >
                    <option value="">Select Grade Level</option>
                    <option value="PreK">Pre-K</option><option value="K">Kindergarten</option>
                    {[...Array(12)].map((_, i) => <option key={i+1} value={String(i+1)}>{i+1}th Grade</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#082A19] mb-2">Lesson Topic <span className="text-red-500">*</span></label>
                <input
                  type="text" name="topic" value={formData.topic} onChange={handleInputChange}
                  placeholder="e.g., Beowulf & Savannah; Photosynthesis; Quadratics"
                  className="w-full px-3 py-2 border-2 border-[#3B523A] rounded-lg focus:ring-2 focus:ring-[#D4C862] focus:border-[#D4C862]" required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#082A19] mb-2"><Clock className="inline h-4 w-4 mr-1 text-[#D4C862]" />Duration <span className="text-red-500">*</span></label>
                <select
                  name="duration" value={formData.duration} onChange={handleInputChange}
                  className="w-full px-3 py-2 border-2 border-[#3B523A] rounded-lg focus:ring-2 focus:ring-[#D4C862] focus:border-[#D4C862]" required
                >
                  <option value="">Select Duration</option>
                  {['30 minutes','45 minutes','50 minutes','60 minutes','90 minutes','120 minutes'].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#082A19] mb-2"><Target className="inline h-4 w-4 mr-1 text-[#D4C862]" />Learning Objectives <span className="text-[#3B523A] text-xs">(Optional)</span></label>
                <textarea
                  name="learningObjectives" value={formData.learningObjectives} onChange={handleInputChange}
                  placeholder="If blank, AI will generate I Can targets + DOK."
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-[#3B523A] rounded-lg focus:ring-2 focus:ring-[#D4C862] focus:border-[#D4C862]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#082A19] mb-2"><Users className="inline h-4 w-4 mr-1 text-[#D4C862]" />Special Considerations <span className="text-[#3B523A] text-xs">(Optional)</span></label>
                <textarea
                  name="specialNeeds" value={formData.specialNeeds} onChange={handleInputChange}
                  placeholder="ELL/SPED needs, trauma-informed considerations, etc."
                  rows=
