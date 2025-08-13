// src/app/page.tsx
'use client';

import { useMemo, useState } from 'react';

type FlowStep = {
  minutes: number;
  activity: string;
  teacherNote?: string;
  studentNote?: string;
};

type DayBlock = {
  day: number;
  title: string;
  learningTarget: string;
  essentialQuestion: string;
  standards: string[];
  flow: {
    opening: FlowStep;
    iDo: FlowStep;
    weDo: FlowStep;
    youDoTogether: FlowStep;
    youDoAlone: FlowStep;
    closing: FlowStep;
  };
  mtss?: { tier1?: string[]; tier2?: string[]; tier3?: string[] };
  selCompetencies?: string[];
  regulationRituals?: string[];
  assessment?: { formative?: string[]; summative?: string[] };
  resources?: string[];
};

type LessonPlan = {
  meta?: {
    title?: string;
    subtitle?: string;
    gradeLevel?: string;
    subject?: string;
    days?: number;
    durationMinutes?: number;
    essentialQuestion?: string;
    standards?: string[];
  };
  days?: DayBlock[];
  appendixA?: {
    namingConvention?: string;
    assets?: Array<{
      fileName: string;
      type: 'image' | 'pdf' | 'docx' | 'sheet' | 'link';
      description: string;
      altText?: string;
      howToGenerate?: string;
      linkPlaceholder?: string;
      figure?: string;
    }>;
  };
  markdown?: string; // may exist
};

type GeneratorResponse = {
  ok: boolean;
  routeId: string;
  generator?: string;
  plan?: LessonPlan;
  teacherView?: string; // optional convenience markdown from API
  studentView?: string;
  printView?: string;
  html?: string; // sometimes mislabeled; treat as markdown too
  markdown?: string; // legacy convenience
  warning?: string;
};

type TabKey = 'teacher' | 'student' | 'print' | 'json';

function renderPlanToMarkdown(plan: LessonPlan): string {
  const m = plan.meta || {};
  const title = m.title || 'Lesson Plan';
  const head = `# ${title}
**Grade:** ${m.gradeLevel ?? ''} • **Subject:** ${m.subject ?? ''} • **Block:** ${
    m.durationMinutes ?? ''
  } min • **Days:** ${m.days ?? ''}

`;
  const days = Array.isArray(plan.days) ? plan.days : [];
  const body =
    days
      .map((d) => {
        const f = d.flow;
        const sec = (label: string, s: FlowStep) =>
          s
            ? `**${label} (${s.minutes ?? ''}m):** ${s.activity}
${s.teacherNote ? `- [Teacher] ${s.teacherNote}` : ''}
${s.studentNote ? `- [Student] ${s.studentNote}` : ''}

`
            : '';
        return `## Day ${d.day}: ${d.title}
**Learning Target:** ${d.learningTarget}
**EQ:** ${d.essentialQuestion}

${sec('Opening', f.opening)}${sec('I Do', f.iDo)}${sec('We Do', f.weDo)}${sec('You Do Together', f.youDoTogether)}${sec(
          'You Do Alone',
          f.youDoAlone,
        )}${sec('Closing', f.closing)}
`;
      })
      .join('\n---\n') || '_No day details provided._';

  return head + body;
}

export default function HomePage() {
  // Minimal user inputs (safe defaults)
  const [gradeLevel, setGradeLevel] = useState('10');
  const [subject, setSubject] = useState('ELA');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [topic, setTopic] = useState('Citing Textual Evidence to Support a Claim');
  const [standardsInput, setStandardsInput] = useState('CCSS.ELA-LITERACY.RI.9-10.1');
  const [days, setDays] = useState(3);
  const [brandName, setBrandName] = useState('Root Work Framework');
  const [userPrompt, setUserPrompt] = useState('');

  // Result state
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('teacher');
  const [error, setError] = useState<string | null>(null);

  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [teacherMd, setTeacherMd] = useState('');
  const [studentMd, setStudentMd] = useState('');
  const [printMd, setPrintMd] = useState('');

  const standardsArray = useMemo(
    () =>
      standardsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [standardsInput],
  );

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        gradeLevel,
        subject,
        durationMinutes,
        topic,
        standards: standardsArray,
        days,
        brandName,
        includeAppendix: true,
        includeRubrics: true,
        includeAssetsDirectory: true,
        userPrompt: userPrompt.trim(),
      };

      const res = await fetch('/api/generatePlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as GeneratorResponse;

      if (!res.ok || !data?.ok) {
        throw new Error(data?.warning || (data as any)?.error || `Generator failed (${res.status})`);
      }

      const p = data.plan || {};
      const tView =
        (data.teacherView && data.teacherView.trim()) ||
        (p.markdown && p.markdown.trim()) ||
        (data.markdown && data.markdown.trim()) ||
        (data.html && data.html.trim()) ||
        renderPlanToMarkdown(p);

      const sView =
        (data.studentView && data.studentView.trim()) ||
        '_Student-facing view was not provided. Use the Teacher tab or JSON to craft a short student brief._';

      const prView =
        (data.printView && data.printView.trim()) ||
        tView; // sensible default

      // Guard against truly empty strings
      const hasAny =
        (tView && tView.replace(/\s+/g, '').length > 0) ||
        (Array.isArray(p.days) && p.days.length > 0);

      if (!hasAny) throw new Error('Empty response from generator');

      setPlan(p);
      setTeacherMd(tView);
      setStudentMd(sView);
      setPrintMd(prView);
      setActiveTab('teacher');
    } catch (e: any) {
      setError(e?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  async function downloadPDF() {
    // Posts current views/plan to your /api/export/pdf
    // The route you already have will turn this into a PDF.
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName,
          plan,
          teacherMarkdown: teacherMd,
          studentMarkdown: studentMd,
          printMarkdown: printMd,
          topic,
          subject,
          gradeLevel,
          days,
          durationMinutes,
          standards: standardsArray,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `PDF export failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ReadyToTeach_${subject}_${gradeLevel}_${topic.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || 'PDF export failed');
    } finally {
      setLoading(false);
    }
  }

  function TextPanel({ content }: { content: string }) {
    // Keep it dependency-free: render markdown as pre-wrapped text.
    return (
      <article className="prose max-w-none">
        <pre className="whitespace-pre-wrap leading-relaxed text-slate-800">{content}</pre>
      </article>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/70 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-brand-600" />
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Root Work Framework</h1>
              <p className="text-xs text-slate-500">Ready-to-Teach Lesson Plan Generator</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadPDF}
              disabled={loading || (!teacherMd && !plan)}
              className="inline-flex items-center rounded-xl bg-brand-600 px-4 py-2 text-white font-semibold disabled:opacity-50"
            >
              Ready-to-Teach Pack (PDF)
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-white font-semibold disabled:opacity-50"
            >
              {loading ? 'Generating…' : 'Generate Lesson Plan'}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 grid gap-6 md:grid-cols-[320px,1fr]">
        {/* Left: Inputs */}
        <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-4">
          <h2 className="text-base font-semibold mb-3">Plan Inputs</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block text-slate-600 mb-1">Grade Level</span>
              <input
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="10"
              />
            </label>
            <label className="text-sm">
              <span className="block text-slate-600 mb-1">Subject</span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="ELA"
              />
            </label>
            <label className="text-sm">
              <span className="block text-slate-600 mb-1">Block Minutes</span>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value || '0', 10))}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="90"
              />
            </label>
            <label className="text-sm">
              <span className="block text-slate-600 mb-1">Days</span>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value || '1', 10))}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="3"
              />
            </label>
            <label className="col-span-2 text-sm">
              <span className="block text-slate-600 mb-1">Topic</span>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Citing Textual Evidence to Support a Claim"
              />
            </label>
            <label className="col-span-2 text-sm">
              <span className="block text-slate-600 mb-1">Standards (comma-separated)</span>
              <input
                value={standardsInput}
                onChange={(e) => setStandardsInput(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="CCSS.ELA-LITERACY.RI.9-10.1, CCSS.ELA-LITERACY.W.9-10.1"
              />
            </label>
            <label className="col-span-2 text-sm">
              <span className="block text-slate-600 mb-1">Brand</span>
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Root Work Framework"
              />
            </label>
            <label className="col-span-2 text-sm">
              <span className="block text-slate-600 mb-1">Additional Requirements (optional)</span>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 h-24"
                placeholder="Any special constraints, texts, or school context…"
              />
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-white font-semibold disabled:opacity-50"
            >
              {loading ? 'Generating…' : 'Generate'}
            </button>
            <button
              onClick={downloadPDF}
              disabled={loading || (!teacherMd && !plan)}
              className="inline-flex items-center rounded-xl bg-brand-600 px-4 py-2 text-white font-semibold disabled:opacity-50"
            >
              Ready-to-Teach Pack
            </button>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
              {error}
            </p>
          )}
        </section>

        {/* Right: Tabs + Output */}
        <section className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b bg-slate-50 px-2">
            {(['teacher', 'student', 'print', 'json'] as TabKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === key
                    ? 'bg-white border-x border-t border-slate-200 -mb-px rounded-t-lg'
                    : 'text-slate-600'
                }`}
              >
                {key === 'teacher'
                  ? 'Teacher'
                  : key === 'student'
                  ? 'Student'
                  : key === 'print'
                  ? 'Print'
                  : 'JSON'}
              </button>
            ))}
          </div>

          {/* Panel */}
          <div className="p-4">
            {activeTab === 'teacher' && <TextPanel content={teacherMd || '_No teacher view._'} />}
            {activeTab === 'student' && <TextPanel content={studentMd || '_No student view._'} />}
            {activeTab === 'print' && <TextPanel content={printMd || teacherMd || '_No print view._'} />}
            {activeTab === 'json' && (
              <article className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-xs leading-relaxed">
                  {JSON.stringify(plan ?? {}, null, 2)}
                </pre>
              </article>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
