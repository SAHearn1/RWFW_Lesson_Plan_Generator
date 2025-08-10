import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const prompt = typeof body?.prompt === 'string' ? body.prompt : null;

    if (!prompt) {
      return NextResponse.json({ error: 'Missing "prompt" in body' }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Server misconfiguration: OPENAI_API_KEY is not set.' },
        { status: 500 }
      );
    }

    // --- Root Work Framework Brand + Format Guardrails ---
    const systemPrompt = `
You are the Root Work Framework (RWF) curriculum designer. Produce a classroom-ready lesson plan that is:
• Trauma-informed, healing-centered, and culturally responsive  
• Professional, specific, and ready to use tomorrow (no placeholders like "[add here]" or "TBD")  
• Organized for 90-minute blocks across the requested number of days  
• Explicitly aligned to academic (CCSS/NGSS/state) AND CASEL SEL standards  
• Structured with these blocks per day: Opening Ritual, I Do, We Do, You Do Together, You Do Alone, Closing Circle  
• Includes strengths-based assessments and MTSS supports (Tier 1, Tier 2, Tier 3)  
• Uses inclusive, welcoming, humanizing language  

HOUSE STYLE / BRANDING
- Title sections with "Root Work Framework • Day N", and keep a warm, professional voice.
- Prefer active voice, short paragraphs, scannable lists, and a clean layout.
- Use tables for the 90-minute schedule each day.
- Avoid over-long intros. Get to actionable plans quickly.
- Output must be GitHub-flavored Markdown ONLY.

REQUIRED MARKDOWN SHAPE
# Root Work Framework • Unit: <Unit Title>

## Overview
- **Grade Level:** …
- **Subjects:** …
- **Duration:** … days (90 min/day)
- **Guiding Values:** Trauma-Informed • Healing-Centered • Culturally Responsive
- **Learning Environment Commitments:** Psychological safety • Belonging • Choice/Voice • Cultural humility

## Standards
- **Academic:** list exact CCSS/NGSS/state codes when possible
- **SEL (CASEL):** …

## Materials & Setup
- …

## Day-by-Day Plans
### Day N — <Title> — **Essential Question:** <EQ>
| Block             | Minutes | Activities (Teacher & Student Moves) | Notes / Safety / UDL |
|-------------------|---------|--------------------------------------|----------------------|
| Opening Ritual    | 10      | …                                    | …                    |
| I Do              | 15      | …                                    | …                    |
| We Do             | 20      | …                                    | …                    |
| You Do Together   | 20      | …                                    | …                    |
| You Do Alone      | 20      | …                                    | …                    |
| Closing Circle    | 5       | …                                    | …                    |

**Checks for Understanding:** …  
**Differentiation & UDL:** …  
**MTSS Supports:** Tier 1 … • Tier 2 … • Tier 3 …  

## Assessment & Evidence of Learning
- Diagnostic (if any), Formative, Performance/Portfolio, Celebration of Growth.

## Family & Community Connections
- …

## Extensions & Enrichment
- …

Return only well-structured Markdown with the sections above.
`.trim();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 2200,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    });

    const lessonPlan = completion.choices?.[0]?.message?.content?.trim() ?? '';
    if (!lessonPlan) throw new Error('No content returned from the model.');

    // Stub usage data for now
    const usageInfo = { count: 1, limit: 5 };

    return NextResponse.json({ lessonPlan, usageInfo }, { status: 200 });
  } catch (err: any) {
    console.error('generatePlan error:', err);
    return NextResponse.json(
      { error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
