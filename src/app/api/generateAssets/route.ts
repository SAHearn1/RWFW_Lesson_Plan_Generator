import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = ['cle1']; // different than generatePlan

const ROUTE_ID = 'generateAssets-v3-2025-08-11'; // uniqueness guard

type LessonPlan = {
  title: string;
  topic?: string;
  gradeLevel?: string;
  subject?: string;
  days?: Array<{
    day: number;
    title: string;
    flow: {
      opening: { text: string };
      iDo: { text: string };
      weDo: { text: string };
      youDoTogether: { text: string };
      youDoAlone: { text: string };
      closing: { text: string };
    };
  }>;
};

type GenerateAssetsRequest = {
  plan: LessonPlan;
  count?: number; // how many images to attempt
};

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateAssetsRequest;
    const plan = body?.plan;
    const count = Math.min(Math.max(body?.count ?? 4, 1), 8);

    if (!plan || !plan.title) {
      return NextResponse.json({ ok: false, routeId: ROUTE_ID, error: 'Missing plan' }, { status: 400 });
    }

    // Build 4–8 prompts tailored to the plan (LLM light call).
    const sys =
      'You create DALLE/gpt-image prompts for instructional assets (neutral backgrounds, clear labeling, accessible contrast). Return JSON array of {name, prompt, altText}. No prose.';
    const user = `Lesson: "${plan.title}" (Subject: ${plan.subject ?? 'N/A'}, Grade: ${plan.gradeLevel ?? 'N/A'}). Topic: ${plan.topic ?? 'N/A'}.
Create ${count} diverse visual prompts: lab setup diagrams, anchor charts, checklists, icons, and scene illustrations that fit classroom use and the Root Work Framework brand (warm, garden/nature motifs, calm colors).`;

    let promptsJSON = '[]';
    try {
      const r = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        temperature: 0.5,
        max_tokens: 900,
        response_format: { type: 'json_array' },
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: user },
        ],
      });
      promptsJSON = r.choices[0]?.message?.content ?? '[]';
    } catch {
      // if model fails, still return placeholders
      promptsJSON = '[]';
    }

    let prompts: Array<{ name: string; prompt: string; altText?: string }> = [];
    try {
      prompts = JSON.parse(promptsJSON);
    } catch {
      prompts = [];
    }

    // If org is not verified for gpt-image-1, we still return the prompts so the UI can render and let the user re-try later.
    const results: Array<{
      name: string;
      prompt: string;
      altText?: string;
      imageBase64?: string; // only if generation succeeded
      error?: string;
    }> = [];

    for (const item of prompts.slice(0, count)) {
      try {
        // Attempt image generation (may 403 if org unverified)
        const gen = await client.images.generate({
          model: 'gpt-image-1',
          prompt: item.prompt,
          size: '1024x1024',
          n: 1,
        });
        const b64 = gen.data?.[0]?.b64_json;
        if (b64) {
          results.push({ name: item.name, prompt: item.prompt, altText: item.altText, imageBase64: b64 });
        } else {
          results.push({ name: item.name, prompt: item.prompt, altText: item.altText, error: 'no_image_returned' });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'image_error';
        // Handle 403 org verification gracefully
        const blocked = /must be verified|403/i.test(msg) ? 'org_verification_required' : msg;
        results.push({ name: item.name, prompt: item.prompt, altText: item.altText, error: blocked });
      }
    }

    // Always return usable JSON (even if images failed)
    return NextResponse.json({
      ok: true,
      routeId: ROUTE_ID,
      planTitle: plan.title,
      countRequested: count,
      assets: results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, routeId: ROUTE_ID, error: msg }, { status: 500 });
  }
}
