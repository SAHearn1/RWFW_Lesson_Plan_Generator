import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const prompt = body?.prompt as string | undefined;

    if (!prompt) {
      return NextResponse.json({ error: 'Missing "prompt" in body' }, { status: 400 });
    }

    // TODO: Call your model/provider and build a real lesson plan.
    // For now, return a stub so the UI works end-to-end.
    const lessonPlan =
      `# Sample Lesson Plan\n\n` +
      `Prompt (first 100 chars): ${prompt.slice(0, 100)}\n\n` +
      `- Replace this with your real generation logic.`;

    // Fake usage data so the UI can render
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
