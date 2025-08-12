// src/app/api/generateAssets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Keep region different from generatePlan to avoid any function dedupe edge cases
export const preferredRegion = ['cle1'];

const ROUTE_ID = 'generateAssets-v4-2025-08-12';

type LessonPlan = {
  title: string;
  topic?: string;
  gradeLevel?: string;
  subject?: string;
  days?: Array<{
    day: number;
    title: string;
    flow?: {
      opening?: { text?: string };
      iDo?: { text?: string };
      weDo?: { text?: string };
      youDoTogether?: { text?: string };
      youDoAlone?: { text?: string };
      closing?: { text?: string };
    };
  }>;
};

type GenerateAssetsRequest = {
  plan: LessonPlan;
  count?: number;
};

type PromptItem = {
  name: string;
  prompt: string;
  altText?: string;
  usage?: string;
};

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, routeId: ROUTE_ID, error: 'Missing OPENAI_API_KEY' },
        { status: 500 },
      );
    }

    const body = (await req.json()) as GenerateAssetsRequest;
    const plan = body?.plan;
    const count = Math.min(Math.max(body?.count ?? 4, 1), 8);

    if (!plan || !plan.title) {
      return NextResponse.json(
        { ok: false, routeId: ROUTE_ID, error: 'Missing plan.title' },
        { status: 400 },
      );
    }

    // Ask the model for a JSON OBJECT with `.items` array
    const sys =
      'You create concise DALLE/gpt-image prompts for instructional classroom visuals. ' +
      'Return STRICT JSON OBJECT with shape: {"items":[{ "name":string, "prompt":string, "altText":string, "usage":string }]} — no prose.';
    const user =
      `Lesson: "${plan.title}" (Subject: ${plan.subject ?? 'N/A'}, Grade: ${plan.gradeLevel ?? 'N/A'}). ` +
      `Topic: ${plan.topic ?? 'N/A'}. Create ${count} diverse, school-appropriate visual prompts: anchor charts, process diagrams, checklists, icons, scene illustrations. ` +
      'Use calm, readable design, high-contrast labels, and garden/nature motifs (Root Work Framework). ' +
      'Prompts must be descriptive enough to generate directly.';

    let items: PromptItem[] = [];
    try {
      const r = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.5,
        max_tokens: 1000,
        // Valid options: "text" | "json_object" | "json_schema"
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
      });

      const content = r.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(content) as { items?: PromptItem[] };
      items = Array.isArray(parsed.items) ? parsed.items.slice(0, count) : [];
    } catch {
      // Fallback prompts if the LLM call fails
      items = [
        {
          name: 'RWFW_Checklist.png',
          prompt:
            'Clean, high-contrast classroom checklist with large headings and checkboxes, garden leaf accents, neutral background, readable typography.',
          altText: 'High-contrast classroom checklist with leaf accents',
          usage: 'Posted near classroom door for routines',
        },
        {
          name: 'RWFW_GRR_AnchorChart.png',
          prompt:
            'Anchor chart explaining Gradual Release of Responsibility with five columns (Opening, I Do, We Do, You Do Together, You Do Alone), minimal icons, soft green accents, accessible layout.',
          altText: 'GRR anchor chart with five columns',
          usage: 'Displayed during mini-lesson',
        },
      ].slice(0, count);
    }

    // Try generating images; handle org verification 403 gracefully
    const results: Array<{
      name: string;
      prompt: string;
      altText?: string;
      usage?: string;
      imageBase64?: string;
      error?: string;
    }> = [];

    for (const item of items) {
      try {
        const gen = await client.images.generate({
          model: 'gpt-image-1',
          prompt: item.prompt,
          size: '1024x1024',
          n: 1,
        });
        const b64 = gen.data?.[0]?.b64_json;
        if (b64) {
          results.push({
            name: item.name,
            prompt: item.prompt,
            altText: item.altText,
            usage: item.usage,
            imageBase64: b64,
          });
        } else {
          results.push({
            name: item.name,
            prompt: item.prompt,
            altText: item.altText,
            usage: item.usage,
            error: 'no_image_returned',
          });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'image_error';
        const friendly =
          /must be verified|403/i.test(msg) ? 'org_verification_required' : msg;
        results.push({
          name: item.name,
          prompt: item.prompt,
          altText: item.altText,
          usage: item.usage,
          error: friendly,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      routeId: ROUTE_ID,
      planTitle: plan.title,
      countRequested: count,
      assets: results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { ok: false, routeId: ROUTE_ID, error: msg },
      { status: 500 },
    );
  }
}
