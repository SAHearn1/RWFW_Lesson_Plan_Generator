// src/lib/renderers.ts
import type { LessonPlan } from './lessonSchema';

const esc = (s: string) => s.replace(/</g,'&lt;').replace(/>/g,'&gt;');

export function renderTeacherMarkdown(lp: LessonPlan): string {
  const { meta, days, appendixA } = lp;
  const header = `# ${meta.unitTitle}\n\n**Grade:** ${meta.gradeLevel}  \n**Subjects:** ${meta.subjects.join(', ')}  \n**Duration:** ${meta.durationDays} day(s), ${meta.blockMinutes} min each  \n**Tagline:** ${meta.branding.tagline}\n\n---\n`;
  const body = days.map(d => {
    const steps = d.steps.map(s => (
`### ${s.label} (${s.minutes} min)
${s.description}

**[Teacher Note:]** ${s.teacherNote}  
**[Student Note:]** ${s.studentNote}
`).trim()).join('\n\n');
    return (
`## Day ${d.dayNumber}: ${d.title}

**Essential Question:** ${d.essentialQuestion}  
**Learning Target:** ${d.learningTarget}  
**Standards:** ${d.standards.join('; ') || '—'}

${steps}

**MTSS Supports**  
- Tier 1: ${d.mtss.tier1.join('; ') || '—'}  
- Tier 2: ${d.mtss.tier2.join('; ') || '—'}  
- Tier 3: ${d.mtss.tier3.join('; ') || '—'}

**Assessment:**  
- Formative: ${d.assessment.formative.join('; ') || '—'}  
- Summative: ${d.assessment.summative.join('; ') || '—'}

**SEL Competencies:** ${d.selCompetencies.join('; ') || '—'}  
**Regulation Rituals:** ${d.regulationRituals.join('; ') || '—'}  
**Student-Facing Aids:** ${d.studentFacing.join('; ') || '—'}  
**Facilitator Guidance:** ${d.facilitatorGuidance.join('; ') || '—'}  
**Multimedia:** ${d.multimedia.join('; ') || '—'}  
**Reflection:** ${d.reflection.join('; ') || '—'}  
**Extension/Enrichment:** ${d.extension.join('; ') || '—'}

---
`).trim();
  }).join('\n\n');

  const appendix = (
`## Appendix A: Resource & Visual Asset Directory

${appendixA.length ? appendixA.map(a =>
`- **${a.fileName}** (${a.type})  
  - Purpose: ${a.description}  
  - Use in lesson: ${a.useInLesson || '—'}  
  - Alt text: ${a.altText || '—'}  
  - Figure: ${a.figure || '—'}  
  - Generation prompt: ${a.generationPrompt ? '`' + a.generationPrompt + '`' : '—'}`).join('\n')
  : '_No assets listed._'}
`).trim();

  return [header, body, appendix].join('\n\n');
}

export function renderStudentMarkdown(lp: LessonPlan): string {
  const { meta, days } = lp;
  const header = `# ${meta.unitTitle} — Student Guide\n\n**What you’ll do:** ${meta.tagline ?? meta.branding.tagline}\n\n---\n`;
  const body = days.map(d => {
    const steps = d.steps.map(s => (
`### ${s.label} (${s.minutes} min)
${s.studentNote}

> What we’ll focus on:  
${s.description}
`).trim()).join('\n\n');
    return (
`## Day ${d.dayNumber}: ${d.title}

**Essential Question:** ${d.essentialQuestion}  
**Learning Target:** ${d.learningTarget}

${steps}

**Choices for Expression:** ${d.choices.join('; ') || '—'}  
**Reflection:** ${d.reflection.join('; ') || '—'}

---
`).trim();
  }).join('\n\n');
  return [header, body].join('\n\n');
}

export function renderTeacherHTML(lp: LessonPlan): string {
  const md = renderTeacherMarkdown(lp);
  // Keep it simple: wrap in branded HTML shell (Markdown is rendered client-side)
  const { branding } = lp.meta;
  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(lp.meta.unitTitle)} — Teacher Edition</title>
<style>
  body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Inter;line-height:1.55;color:#0f172a;margin:2rem;}
  header{border-left:6px solid ${branding.palette.brand};padding-left:1rem;margin-bottom:1rem}
  .tag{display:inline-block;background:${branding.palette.brand}10;color:${branding.palette.brand};padding:.25rem .5rem;border-radius:.5rem;font-weight:600;font-size:.8rem}
  h1,h2,h3{color:#0b1020}
  .hr{height:1px;background:#e2e8f0;margin:1.5rem 0}
</style>
</head>
<body>
<header>
  <div class="tag">Root Work Framework</div>
  <h1>${esc(lp.meta.unitTitle)} — Teacher Edition</h1>
  <p>${esc(branding.tagline)}</p>
</header>
<main id="md">${esc(md)}</main>
</body>
</html>`;
}
