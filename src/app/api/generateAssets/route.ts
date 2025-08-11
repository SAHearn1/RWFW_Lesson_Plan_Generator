import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

type AppendixItem = {
  fileName: string;
  type?: string;
  description?: string;
  altText?: string;
  figure?: string;
  link?: string;
};

type Payload = {
  unitTitle: string;
  gradeLevel: string;
  subject: string;
  appendixA?: AppendixItem[];
};

function defaultPrompts(item: AppendixItem, unitTitle: string, grade: string, subject: string) {
  // A reasonable, general DALL·E prompt for instructional visuals
  const base = `Design a clean, classroom-friendly visual for the "${unitTitle}" unit (${grade}, ${subject}). Use a calming, high-contrast palette and clear labels. Include accessible design and large text.`;
  const desc = item.description || 'Instructional asset for the lesson.';
  const alt = item.altText || 'Instructional classroom visual.';

  return {
    prompt: `${base} Asset intent: ${desc}.`,
    altText: alt,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as Payload | null;
    if (!body || !body.unitTitle || !body.gradeLevel || !body.subject) {
      return NextResponse.json({ error: 'Missing required fields: unitTitle, gradeLevel, subject' }, { status: 400 });
    }

    const items = (body.appendixA ?? []).filter((a) => a?.fileName);

    // If image generation is allowed, try to call OpenAI Images; otherwise return prompts-only
    const enableImages = process.env.OPENAI_IMAGE_ENABLED === '1';
    const results: Array<
      AppendixItem & {
        image?: { dataUrl?: string; mime?: string };
        generation?: { prompt: string; model: string; status: 'CREATED' | 'PROMPT_ONLY' | 'FAILED'; error?: string };
      }
    > = [];

    if (!enableImages) {
      for (const it of items) {
        const { prompt, altText } = defaultPrompts(it, body.unitTitle, body.gradeLevel, body.subject);
        results.push({
          ...it,
          altText,
          generation: { prompt, model: 'gpt-image-1', status: 'PROMPT_ONLY' },
        });
      }
      return NextResponse.json({ assets: results, note: 'Prompts only (image generation disabled).' }, { status: 200 });
    }

    // Try to generate images (may fail if org not verified)
    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not set.' }, { status: 500 });
    }
    const openai = new OpenAI({ apiKey });

    for (const it of items) {
      const { prompt, altText } = defaultPrompts(it, body.unitTitle, body.gradeLevel, body.subject);
      try {
        const img = await openai.images.generate({
          model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
          prompt,
          size: '1024x1024',
          // You can add style parameters here if needed
        });
        const b64 = img.data?.[0]?.b64_json;
        if (!b64) throw new Error('No image returned');
        results.push({
          ...it,
          altText,
          image: { dataUrl: `data:image/png;base64,${b64}`, mime: 'image/png' },
          generation: { prompt, model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1', status: 'CREATED' },
        });
      } catch (e: any) {
        results.push({
          ...it,
          altText,
          generation: {
            prompt,
            model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
            status: 'FAILED',
            error: e?.message || 'Image generation failed (likely org not verified)',
          },
        });
      }
    }

    return NextResponse.json({ assets: results }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Asset generation failed' }, { status: 500 });
  }
}
