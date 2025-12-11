// File: src/app/api/assets/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

import { env } from '@/lib/env';

// Vercel-specific configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Allow up to 5 minutes for generating multiple assets

const getOpenAIClient = () => {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assetPrompts } = body; // Expect an array of strings

    // --- 1. Validate the input ---
    if (
      !assetPrompts ||
      !Array.isArray(assetPrompts) ||
      assetPrompts.length === 0
    ) {
      return NextResponse.json(
        { error: 'An array of asset prompts is required.' },
        { status: 400 },
      );
    }
    const openai = getOpenAIClient();

    if (!openai) {
      console.error('CRITICAL: OPENAI_API_KEY is not configured.');
      return NextResponse.json(
        { error: 'Application not configured for asset generation.' },
        { status: 500 },
      );
    }

    // --- (Future) Authenticate the user and check for premium status ---
    // Here, you would add logic to verify the user has a premium subscription
    // before allowing them to use this resource-intensive feature.

    // --- 2. Generate an image for each prompt ---
    const generationPromises = assetPrompts.map((prompt) => {
      return openai.images.generate({
        model: 'dall-e-3', // The highest quality model
        prompt: `Instructional diagram for a lesson plan, clear and simple, educational style. Content: ${prompt}`, // We add context to the prompt for better results
        n: 1, // Generate one image per prompt
        size: '1024x1024', // Standard high-quality size
        quality: 'standard',
      });
    });

    // Wait for all image generations to complete
    const results = await Promise.all(generationPromises);

    // Extract the image URLs from the results, ensuring each response is complete
    const imageUrls: string[] = [];

    for (let index = 0; index < results.length; index += 1) {
      const result = results[index];
      const url = result.data?.[0]?.url;

      if (!url) {
        console.error('[ASSET_API_ERROR] Incomplete response payload from OpenAI', {
          resultIndex: index,
          hasData: Boolean(result.data),
          dataLength: result.data?.length ?? 0,
        });

        return NextResponse.json(
          { error: 'Failed to generate all visual assets.' },
          { status: 502 },
        );
      }

      imageUrls.push(url);
    }

    // --- 3. Send the successful response back to the frontend ---
    return NextResponse.json({ imageUrls });
  } catch (error: any) {
    console.error('[ASSET_API_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to generate visual assets.' },
      { status: 500 },
    );
  }
}
