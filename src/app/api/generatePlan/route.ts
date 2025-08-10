import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Create the client once per lambda
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Parse body safely
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

    // System prompt to enforce professional, branded, Markdown output
    const systemPrompt = `
You are the Root Work Framework (RWF) curriculum designer.
Produce a professional, classroom-ready lesson plan that is:
- Trauma-informed, healing-centered, and culturally responsive
- Organized for a ${'90-minute'} block, repeated for the requested number of days
- Aligned to academic + SEL standards (state/CCSS/NGSS + CASEL)
- Clearly scaffolded with "Opening Ritual", "I Do", "We Do", "You Do Together", "You Do Alone", "Closing Circle"
- Strengths-based assessments and MTSS Tier 1/2/3 supports
- Uses inclusive, humanizing language
- **Output must be clean GitHub-flavored Markdown** only (no extra chatter)
- Use RWF branding cues in headings (e.g., "Root Work Framework • Day 1")
`.trim();

    // Generate with an efficient model (good quality + cost)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    });

    const lessonPlan =
      completion.choices?.[0]?.message?.content?.trim() ?? '';

    if (!lessonPlan) {
      throw new Error('No content returned from the model.');
    }

    // You can replace this with your real usage tracking later
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
