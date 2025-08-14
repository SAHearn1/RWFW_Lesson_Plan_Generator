// File: src/app/api/generatePlan/route.ts

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { systemPrompt, userPrompt } = await req.json();
    if (!systemPrompt || !userPrompt) {
        return NextResponse.json({ error: 'System and user prompts are required.' }, { status: 400 });
    }

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
        throw new Error('The ANTHROPIC_API_KEY environment variable is not set in Vercel.');
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            model: "claude-3-sonnet-20240229",
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }]
        })
    });

    // **IMPROVED ERROR HANDLING**
    if (!anthropicResponse.ok) {
        const errorText = await anthropicResponse.text();
        console.error("Anthropic API Error:", errorText); // For server-side logs
        return NextResponse.json({ 
            error: `The AI model returned an error (Status: ${anthropicResponse.status}).`, 
            details: errorText 
        }, { status: 502 });
    }

    const anthropicData = await anthropicResponse.json();
    const lessonPlan = anthropicData.content[0].text;

    return NextResponse.json({ lessonPlan });

  } catch (error: any) {
    console.error('Error in generatePlan POST handler:', error);
    return NextResponse.json({ 
        error: 'An internal server error occurred.', 
        details: error.message 
    }, { status: 500 });
  }
}
