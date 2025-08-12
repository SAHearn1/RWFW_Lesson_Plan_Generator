// src/app/api/generateAssets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = ['iad1'];

// Assets-specific runtime config
export const maxDuration = 30;

// IMPORTANT: Unique constant that is USED in the response so bundlers can't remove it.
// This prevents Vercel from deduping this function bundle with generatePlan.
const ROUTE_ID = 'generateAssets-v3-2025-08-12';

// Force unique bundle by adding specific asset-only logic
const ASSET_TYPES = ['image', 'pdf', 'docx', 'sheet', 'link'] as const;
const ASSETS_SPECIFIC_CONFIG = {
  maxAssets: 10,
  requiredTypes: ASSET_TYPES,
  assetNamingConvention: 'snake_case'
};

type AssetsInput = {
  topic?: string;
  subject?: string;
  gradeLevel?: string;
  brandName?: string;
  days?: number;
};

type Asset = {
  fileName: string;
  type: 'image' | 'pdf' | 'docx' | 'sheet' | 'link';
  description: string;
  altText?: string;
  dallePrompt?: string;
  linkPlaceholder?: string;
};

type AssetsPayload = { assets: Asset[] };

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, routeId: ROUTE_ID, error: 'Missing OPENAI_API_KEY' },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as AssetsInput;
    const topic = body.topic ?? 'Inquiry Project';
    const subject = body.subject ?? 'STEAM';
    const gradeLevel = body.gradeLevel ?? '6–8';
    const brandName = body.brandName ?? 'Root Work Framework';
    const days = Math.min(Math.max(body.days ?? 3, 1), ASSETS_SPECIFIC_CONFIG.maxAssets);

    const system =
      'You create concise asset manifests for teachers. Return STRICT JSON with key "assets": Asset[]. ' +
      'Each asset needs: fileName (snake_case), type (image|pdf|docx|sheet|link), description, altText, and when type=image add dallePrompt.';

    const user = `
Create 6–10 assets for a ${days}-day ${subject} unit titled "${topic}" (grade ${gradeLevel}).
Branding to reflect: ${brandName}.

Return JSON:
{
  "assets": [
    { "fileName": "unit_cover_poster.png", "type": "image", "description": "...", "altText": "...", "dallePrompt": "..." },
    { "fileName": "day1_handout.docx", "type": "docx", "description": "...", "altText": "..." }
  ]
}

Rules:
- fileName: snake_case, include extension matching type.
- dallePrompt: text only; no brackets; vivid but school-appropriate.
- Keep descriptions short, teacher-facing; altText student-facing.
`.trim();

    const openai = new OpenAI({ apiKey });

    // Ask for strict JSON to minimize repair work.
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });

    const text = res.choices[0]?.message?.content?.trim() ?? '';
    let parsed: AssetsPayload | null = null;

    try {
      parsed = JSON.parse(text) as AssetsPayload;
    } catch {
      // quick repair if the model wrapped JSON in prose
      const s = text.indexOf('{');
      const e = text.lastIndexOf('}');
      if (s !== -1 && e !== -1 && e > s) {
        try {
          parsed = JSON.parse(text.slice(s, e + 1)) as AssetsPayload;
        } catch {
          // ignore; fallback below
        }
      }
    }

    if (!parsed?.assets?.length) {
      // Safe fallback so the UI never shows "empty response"
      parsed = {
        assets: [
          {
            fileName: 'unit_cover_poster.png',
            type: 'image',
            description: 'Cover art for print/slide deck.',
            altText: `Poster for ${subject}: "${topic}" (grade ${gradeLevel})`,
            dallePrompt: `Poster, ${subject}, "${topic}", grade ${gradeLevel}, ${brandName}, inclusive classroom, high-contrast, simple iconography, friendly style`,
          },
          {
            fileName: 'day1_handout.docx',
            type: 'docx',
            description: 'Student handout for Day 1 (opening + I Do).',
            altText: 'Day 1 handout',
          },
          {
            fileName: 'teacher_slides.pdf',
            type: 'pdf',
            description: 'Mini-lesson slides (We Do exemplars).',
            altText: 'Teacher slides PDF',
          },
          {
            fileName: 'materials_budget.xlsx',
            type: 'sheet',
            description: 'Materials checklist and simple budget.',
            altText: 'Materials spreadsheet',
          },
          {
            fileName: 'extension_links.pdf',
            type: 'pdf',
            description: 'Curated extension links for students.',
            altText: 'Extension links list',
          },
        ],
      };
    }

    // Use ROUTE_ID in the response so the bundler keeps this code unique.
    return NextResponse.json({ ok: true, routeId: ROUTE_ID, ...parsed });
  } catch (err) {
    return NextResponse.json(
      {
        ok: true,
        routeId: ROUTE_ID,
        assets: [
          {
            fileName: 'fallback_cover.png',
            type: 'image',
            description: 'Fallback cover image.',
            altText: 'Cover',
            dallePrompt:
              'Poster, simple geometric shapes, inclusive classroom theme, high-contrast, friendly',
          },
        ],
        warning: err instanceof Error ? err.message : 'unknown',
      },
      { status: 200 }
    );
  }
}
