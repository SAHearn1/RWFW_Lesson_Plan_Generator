import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Health check (GET) — lets you open /api/generateAssets in a browser
export async function GET() {
  return NextResponse.json({ ok: true, message: 'generateAssets is alive. Use POST.' }, { status: 200 });
}

// Optional: handle preflight if a proxy/tool ever triggers it
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ImageSpec = { fileName: string; prompt: string; alt: string };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const lessonPlan: string = (body?.lessonPlan as string | undefined)?.slice(0, 120000) || '';

    if (!lessonPlan) {
      return NextResponse.json({ error: 'Missing lessonPlan' }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not set' }, { status: 500 });
    }

    // 1) Extract up to 3 image specs (fileName, prompt, alt) from the plan as JSON
    const extractSys = 'You extract image asset specs from a lesson plan. Return JSON only.';
    const extractUser = `
Read the lesson plan Markdown below and produce up to 3 images most critical for instruction.
For each image return: fileName, prompt (natural language, detailed), alt (concise, accessible).
Return EXACT JSON with this shape:
{
  "images": [
    { "fileName": "RootedInMe_10ELA_RitualGuidebookCover.png", "prompt": "...", "alt": "..." }
  ]
}
Lesson Plan:
${lessonPlan}
`.trim();

    const extract = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: extractSys },
        { role: 'user', content: extractUser },
      ],
    });

    // Parse JSON payload
    const content = extract.choices[0]?.message?.content || '{}';
    let parsed: { images?: ImageSpec[] } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { images: [] };
    }

    const images = (parsed.images || []).slice(0, 3);
    if (images.length === 0) {
      return NextResponse.json({ images: [], message: 'No image candidates found.' }, { status: 200 });
    }

    // 2) Generate each image with OpenAI Images API (DALL·E / gpt-image-1)
    const out: { fileName: string; alt: string; b64: string }[] = [];
    for (const img of images) {
      const gen = await openai.images.generate({
        model: 'gpt-image-1',
        prompt: img.prompt,
        size: '1024x1024',
        // background: 'transparent', // uncomment if you want transparent PNGs
      });

      const b64 = gen.data?.[0]?.b64_json;
      if (b64) {
        out.push({
          fileName: img.fileName || 'rwf-asset.png',
          alt: img.alt || '',
          b64,
        });
      }
    }

    return NextResponse.json({ images: out }, { status: 200 });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('generateAssets error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
