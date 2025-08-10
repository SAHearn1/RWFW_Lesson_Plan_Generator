import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const prompt = typeof body?.prompt === 'string' ? body.prompt : '';

    if (!prompt) {
      return NextResponse.json({ error: 'Missing "prompt" in body' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Don’t throw at build-time; return a clear server error at runtime.
      return NextResponse.json(
        { error: 'Server misconfiguration: OPENAI_API_KEY is not set.' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    // Ask the model to return fully formatted Markdown for the lesson plan.
    const system = `
You are an expert curriculum designer specializing in trauma-informed, healing-centered, and culturally responsive education. 
Return a professional, production-ready lesson plan in clean Markdown only (no chit-chat), using clear headings, bold text, and lists.
    `.trim();

    const res = await openai.responses.create({
      model: 'gpt-4.1-mini',
      input: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_output_tokens: 2000
    });

    // Prefer the SDK convenience; fall back defensively if needed
    const text =
      (res as any).output_text ??
      (res as any).content?.map((c: any) => c?.text || '').join('').trim() ??
      '';

    const lessonPlan = (text || '# Lesson Plan\n\n(No content returned.)').trim();

    // TODO: replace with your real usage tracking
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
