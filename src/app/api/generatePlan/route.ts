// FILE PATH: src/app/api/generatePlan/route.ts
// Copy this entire file to: src/app/api/generatePlan/route.ts

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    console.log('[DEBUG] Route started');
    
    // Test 1: Can we parse the request?
    let body;
    try {
      body = await req.json();
      console.log('[DEBUG] Body parsed successfully:', Object.keys(body));
    } catch (e: any) {
      console.error('[DEBUG] Body parse failed:', e);
      return NextResponse.json({ error: 'Body parse failed', details: e.message }, { status: 400 });
    }

    // Test 2: Can we access environment variables?
    try {
      const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
      const keyPreview = process.env.ANTHROPIC_API_KEY?.substring(0, 8) || 'none';
      console.log('[DEBUG] API key exists:', hasApiKey, 'Preview:', keyPreview);
      if (!hasApiKey) {
        return NextResponse.json({ error: 'Missing ANTHROPIC_API_KEY' }, { status: 500 });
      }
    } catch (e: any) {
      console.error('[DEBUG] Env var access failed:', e);
      return NextResponse.json({ error: 'Env access failed', details: e.message }, { status: 500 });
    }

    // Test 3: Can we import Anthropic?
    let Anthropic;
    try {
      const anthropicModule = await import('@anthropic-ai/sdk');
      Anthropic = anthropicModule.default;
      console.log('[DEBUG] Anthropic imported successfully');
    } catch (e: any) {
      console.error('[DEBUG] Anthropic import failed:', e);
      return NextResponse.json({ error: 'Anthropic import failed', details: e.message }, { status: 500 });
    }

    // Test 4: Can we create client?
    let client;
    try {
      client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
      console.log('[DEBUG] Anthropic client created');
    } catch (e: any) {
      console.error('[DEBUG] Client creation failed:', e);
      return NextResponse.json({ error: 'Client creation failed', details: e.message }, { status: 500 });
    }

    // Test 5: Extract and validate input
    let processedInput;
    try {
      processedInput = {
        gradeLevel: body.gradeLevel || 'test',
        subjects: body.subjects || ['test'],
        days: body.days || body.duration || 1,
        unitTitle: body.unitTitle || 'Test Unit'
      };
      console.log('[DEBUG] Input processed:', processedInput);
    } catch (e: any) {
      console.error('[DEBUG] Input processing failed:', e);
      return NextResponse.json({ error: 'Input processing failed', details: e.message }, { status: 500 });
    }

    // Test 6: Simple prompt creation
    let prompt;
    try {
      prompt = `Create a simple ${processedInput.days}-day lesson plan for ${processedInput.gradeLevel} students.

Unit: ${processedInput.unitTitle}
Subject: ${processedInput.subjects.join(', ')}

Include basic structure with opening, instruction, and closing for each day.
Add [Teacher Note: guidance] and [Student Note: encouragement] after each section.
Keep it concise but complete.`;
      
      console.log('[DEBUG] Prompt created, length:', prompt.length);
    } catch (e: any) {
      console.error('[DEBUG] Prompt creation failed:', e);
      return NextResponse.json({ error: 'Prompt creation failed', details: e.message }, { status: 500 });
    }

    // Test 7: Make API call with minimal settings
    try {
      console.log('[DEBUG] Making API call...');
      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 2000,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }]
      });
      
      console.log('[DEBUG] API call successful');
      
      const lessonPlan = response.content?.[0]?.type === 'text' ? response.content[0].text : '';
      console.log('[DEBUG] Response length:', lessonPlan.length);
      
      if (!lessonPlan) {
        throw new Error('Empty response from Claude');
      }
      
      return NextResponse.json({
        ok: true,
        lessonPlan: lessonPlan,
        markdown: lessonPlan,
        plan: {
          markdown: lessonPlan,
          meta: {
            title: processedInput.unitTitle,
            gradeLevel: processedInput.gradeLevel,
            subject: processedInput.subjects.join(', '),
            days: processedInput.days
          }
        },
        debug: {
          message: 'All tests passed!',
          inputReceived: processedInput,
          promptLength: prompt.length,
          responseLength: lessonPlan.length
        }
      });

    } catch (e: any) {
      console.error('[DEBUG] API call failed:', e);
      return NextResponse.json({ 
        error: 'API call failed', 
        details: e.message,
        status: e.status,
        type: e.type,
        errorName: e.name
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[DEBUG] Outer catch - route crashed:', error);
    return NextResponse.json({
      error: 'Route crashed in outer catch',
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    }, { status: 500 });
  }
}
