// src/app/api/generate-lesson/route.ts - DEBUG VERSION to find the actual problem

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type MasterPromptRequest = {
  subject: string;
  gradeLevel: string;
  topic: string;
  duration: string;
  numberOfDays: string;
  learningObjectives?: string;
  specialNeeds?: string;
  availableResources?: string;
  location?: string;
  unitContext?: string;
  lessonType?: string;
  specialInstructions?: string;
};

function okJson(data: unknown, init: ResponseInit = {}) {
  return NextResponse.json(data, { ...init, headers: { 'Cache-Control': 'no-store' } });
}

async function parseLessonRequest(req: NextRequest): Promise<Partial<MasterPromptRequest> | null> {
  console.log('=== PARSING REQUEST ===');
  const ct = req.headers.get('content-type') || '';
  console.log('Content-Type:', ct);

  if (ct.includes('application/json')) {
    try {
      const json = await req.json();
      console.log('Parsed JSON:', JSON.stringify(json, null, 2));
      return json;
    } catch (e) {
      console.log('JSON parse error:', e);
    }
  }

  try {
    const raw = await req.text();
    console.log('Raw text length:', raw.length);
    console.log('Raw text preview:', raw.substring(0, 200));
    if (raw && raw.trim().startsWith('{')) {
      const json = JSON.parse(raw);
      console.log('Parsed from text:', JSON.stringify(json, null, 2));
      return json;
    }
  } catch (e) {
    console.log('Text parse error:', e);
  }

  console.log('Could not parse request');
  return null;
}

function buildSimpleDebugPrompt(data: MasterPromptRequest): string {
  const numberOfDays = parseInt(data.numberOfDays || '3');
  console.log('Building prompt for', numberOfDays, 'days');
  
  return `Create a ${numberOfDays}-day lesson plan for Grade ${data.gradeLevel} ${data.subject} on "${data.topic}".

CRITICAL REQUIREMENT: You must generate ALL ${numberOfDays} days. Generate Day 1, Day 2, Day 3, etc. up to Day ${numberOfDays}.

DAY 1: Introduction
- Learning Target: [target]
- Activity: [activity]
- Assessment: [assessment]

DAY 2: Development  
- Learning Target: [target]
- Activity: [activity]
- Assessment: [assessment]

DAY 3: Application
- Learning Target: [target]
- Activity: [activity]
- Assessment: [assessment]

${numberOfDays > 3 ? `
DAY 4: Extension
- Learning Target: [target]
- Activity: [activity]
- Assessment: [assessment]
` : ''}

${numberOfDays > 4 ? `
DAY 5: Synthesis
- Learning Target: [target]
- Activity: [activity]
- Assessment: [assessment]
` : ''}

REMEMBER: Generate all ${numberOfDays} days completely. Do not stop early.`;
}

export async function POST(request: NextRequest) {
  console.log('=== LESSON PLAN API CALL START ===');
  console.log('Request URL:', request.url);
  console.log('Request method:', request.method);
  
  try {
    const parsed = await parseLessonRequest(request);
    if (!parsed) {
      console.log('ERROR: Could not parse request');
      return okJson({ error: 'Could not parse request' }, { status: 400 });
    }

    const subject = (parsed as any).subject?.trim?.() || 'English Language Arts';
    const gradeLevel = (parsed as any).gradeLevel?.trim?.() || '9';
    const topic = (parsed as any).topic?.trim?.() || 'Core Concept';
    const duration = (parsed as any).duration?.trim?.() || '60 minutes';
    const numberOfDays = (parsed as any).numberOfDays?.trim?.() || '3';

    const data: MasterPromptRequest = {
      subject, gradeLevel, topic, duration, numberOfDays
    };

    console.log('Final lesson data:', data);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.log('ERROR: No API key');
      return okJson({ error: 'No API key configured' }, { status: 500 });
    }

    console.log('API key present:', !!apiKey);

    const prompt = buildSimpleDebugPrompt(data);
    console.log('Prompt length:', prompt.length);
    console.log('Prompt preview:', prompt.substring(0, 300) + '...');

    console.log('Making Anthropic API call...');
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 10000, // Start with moderate amount for debugging
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    console.log('Anthropic response status:', resp.status);
    console.log('Anthropic response headers:', Object.fromEntries(resp.headers.entries()));

    if (!resp.ok) {
      const errorText = await resp.text();
      console.log('Anthropic error response:', errorText);
      return okJson({ error: `Anthropic API error: ${resp.status}` }, { status: 500 });
    }

    const payload = await resp.json();
    console.log('Anthropic payload keys:', Object.keys(payload));
    console.log('Anthropic payload structure:', {
      id: payload.id,
      type: payload.type,
      role: payload.role,
      model: payload.model,
      contentType: Array.isArray(payload.content) ? 'array' : typeof payload.content,
      contentLength: Array.isArray(payload.content) ? payload.content.length : 'not array'
    });

    let lessonContent = '';
    if (Array.isArray(payload?.content)) {
      const firstText = payload.content.find((c: any) => c?.type === 'text');
      if (firstText?.text) {
        lessonContent = String(firstText.text);
      }
    } else if (typeof payload?.content === 'string') {
      lessonContent = payload.content;
    }

    console.log('Generated content length:', lessonContent.length);
    
    // Count days
    const dayMatches = lessonContent.match(/DAY\s+\d+/gi) || [];
    console.log('Days found:', dayMatches.length);
    console.log('Day matches:', dayMatches);

    // Show content preview
    console.log('Content preview (first 500 chars):', lessonContent.substring(0, 500));
    console.log('Content preview (last 500 chars):', lessonContent.substring(Math.max(0, lessonContent.length - 500)));

    // Check if content was truncated
    const endsAbruptly = !lessonContent.trim().endsWith('.') && !lessonContent.includes('DAY ' + numberOfDays);
    console.log('Content appears truncated:', endsAbruptly);
    console.log('Contains final day:', lessonContent.includes('DAY ' + numberOfDays));

    console.log('=== LESSON PLAN API CALL END ===');

    return okJson({
      lessonPlan: lessonContent,
      htmlVersion: `<html><body><pre>${lessonContent}</pre></body></html>`,
      plainText: lessonContent,
      success: true,
      debug: {
        daysRequested: numberOfDays,
        daysFound: dayMatches.length,
        contentLength: lessonContent.length,
        contentTruncated: endsAbruptly,
        containsFinalDay: lessonContent.includes('DAY ' + numberOfDays)
      }
    });

  } catch (err) {
    console.error('=== ERROR ===');
    console.error('Error message:', (err as Error).message);
    console.error('Error stack:', (err as Error).stack);
    
    return okJson({
      error: (err as Error).message || 'Unknown error',
      success: false
    }, { status: 500 });
  }
}
