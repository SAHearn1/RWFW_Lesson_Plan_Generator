// src/app/api/generateAssets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const preferredRegion = ['pdx1']; // different from generatePlan to avoid dedupe
const UNIQUE_SALT = 'generateAssets-route-v1';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type AssetItem = {
  name: string;           // e.g., "RootedInMe_10ELA_RitualGuidebook.pdf"
  description: string;    // what it is / where used
  prompt?: string;        // natural language image prompt
  altText?: string;       // accessibility
  type?: 'image' | 'pdf' | 'docx' | 'png' | 'jpg';
};

type GenerateAssetsRequest = {
  planTitle?: string;
  appendixA?: AssetItem[];          // optional seed list from the plan
  allowImageGen?: boolean;          // gated by org verification
  brand?: { org?: string };
};

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'Missing OPENAI_API_KEY' },
        { status: 500 }
      );
    }

    const body = (await req.json()) as GenerateAssetsRequest;
    const planTitle = body.planTitle ?? 'Root Work Framework — Lesson';
    const org = body.brand?.org ?? 'Root Work Framework';

    // If image generation is not allowed (or org not verified), return structured TODOs instead of failing.
    const canGenerateImages = !!body.allowImageGen && !!process.env.OPENAI_API_KEY;

    // Create/augment an assets list using text-only guidance (safe for all org states)
    const system = `You create a concise asset checklist for a lesson plan, including filenames following the convention:
{LessonCode}_{GradeLevel}{SubjectAbbreviation}_{DescriptiveTitle}.{ext}
Each item includes: name, type, description, altText, and an image prompt if type is "image".
UNIQUE_SALT=${UNIQUE_SALT}`;

    const user = `Plan Title: ${planTitle}
Org: ${org}
Return a compact JSON array "assets" with 5–10 items. If an item requires an image, include a strong, accessible prompt and altText.`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '{"assets":[]}';
    let parsed: { assets: AssetItem[] } = { assets: [] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Fallback to empty list if model response is malformed
    }

    // If we can't call image models, mark each image with a note to generate later.
    if (!canGenerateImages) {
      const annotated = (parsed.assets ?? []).map((a) =>
        a.type === 'image'
          ? {
              ...a,
              note:
                'Image not auto-generated (org not verified for image models). Use the prompt to generate later in the Visuals tab.',
            }
          : a
      );
      return NextResponse.json({ ok: true, assets: annotated, generated: false }, { status: 200 });
    }

    // (Optional) If you later enable image gen, you can loop prompts here and call images.generate
    // Keeping out actual calls to avoid 403s until org is verified.

    return NextResponse.json({ ok: true, assets: parsed.assets ?? [], generated: false }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

