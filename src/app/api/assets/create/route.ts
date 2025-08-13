// src/app/api/assets/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = ['iad1'];
export const maxDuration = 45;

const ROUTE_ID = 'assets-create-v1-anthropic-2025-08-13';

// Assets creation specific configuration
const ASSETS_CREATE_CONFIG = {
  maxAssets: 10,
  supportedTypes: ['image', 'pdf', 'docx', 'sheet', 'link'] as const,
  namingConvention: 'snake_case',
  generator: 'assets-create-v1',
  basePath: '/api/assets/create'
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

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Assets creation specific validation function
function validateAssetCreationStructure(assets: any[]): boolean {
  return assets?.every(asset => asset?.fileName && asset?.type && asset?.description);
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { ok: false, routeId: ROUTE_ID, error: 'Missing ANTHROPIC_API_KEY' },
        { status: 500 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as AssetsInput;
    const topic = body.topic ?? 'Inquiry Project';
    const subject = body.subject ?? 'STEAM';
    const gradeLevel = body.gradeLevel ?? '6–8';
    const brandName = body.brandName ?? 'Root Work Framework';
    const days = Math.min(Math.max(body.days ?? 3, 1), ASSETS_CREATE_CONFIG.maxAssets);

    const prompt = `Create a list of 6-8 educational assets for a ${days}-day ${subject} unit titled "${topic}" for grade ${gradeLevel}.

The assets should reflect the ${brandName} approach and include a variety of types: images, PDFs, documents, spreadsheets, and links.

**Requirements:**
- fileName: Use snake_case naming with appropriate file extensions
- type: Must be one of: "image", "pdf", "docx", "sheet", "link"
- description: Brief, teacher-facing description of the asset's purpose
- altText: Student-friendly description for accessibility
- For images: Include a "dallePrompt" field with a description for AI image generation (school-appropriate, vivid but educational)

**Output Format:**
Return ONLY a valid JSON object with this exact structure:

{
  "assets": [
    {
      "fileName": "unit_cover_poster.png",
      "type": "image",
      "description": "Cover poster for unit display and presentations",
      "altText": "Colorful poster showing ${topic} theme",
      "dallePrompt": "Educational poster about ${topic}, grade ${gradeLevel}, colorful, inclusive classroom, modern design, student-friendly"
    },
    {
      "fileName": "day1_handout.docx",
      "type": "docx", 
      "description": "Student handout for Day 1 activities",
      "altText": "Day 1 student worksheet"
    }
  ]
}

Create diverse, practical assets that teachers can actually use. Include at least one image, one document, one PDF, and consider including links to relevant resources.

Respond with ONLY the JSON object, no additional text.`;

    let parsed: AssetsPayload | null = null;

    try {
      const response = await client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        temperature: 0.4,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });
      
      const text = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '';
      parsed = JSON.parse(text) as AssetsPayload;
    } catch (error) {
      // If Claude fails or returns invalid JSON, we'll use the fallback below
      parsed = null;
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

    // Validate asset creation structure
    if (!validateAssetCreationStructure(parsed.assets)) {
      parsed = { assets: [] };
    }

    return NextResponse.json({ 
      ok: true, 
      routeId: ROUTE_ID, 
      generator: ASSETS_CREATE_CONFIG.generator,
      basePath: ASSETS_CREATE_CONFIG.basePath,
      ...parsed 
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: true,
        routeId: ROUTE_ID,
        generator: ASSETS_CREATE_CONFIG.generator,
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
