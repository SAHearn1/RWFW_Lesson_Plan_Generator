import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const system = `
You are an expert K–12 curriculum designer (trauma-informed, healing-centered, culturally responsive, PBL/STEAM, MTSS, CASEL).
Return a polished, classroom-ready lesson plan in Markdown only—no preface or chit-chat.
Follow the Root Work Framework tone and structure.
`.trim();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const prompt = (body?.prompt as string | undefined)?.trim();

    if (!prompt) {
      return NextResponse.json({ error: 'Missing "prompt" in body' }, { status: 400 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // Make sure this is set in Vercel → Settings → Environment Variables
    });

    // Use Chat Completions (stable across SDK versions)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // great cost/quality balance; switch to 'gpt-4o' for maximum quality
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 6000,
    });

    const lessonPlan = completion.choices?.[0]?.message?.content ?? '';

    // Basic usage stub (replace with your real metering if needed)
    const usageInfo = { count: 1, limit: 5 };

    return NextResponse.json({ lessonPlan, usageInfo }, { status: 200 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Server error';
    // Avoid console.log to keep ESLint quiet in builds; logging is fine locally.
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
