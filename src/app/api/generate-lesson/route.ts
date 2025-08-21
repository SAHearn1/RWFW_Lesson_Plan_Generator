// src/app/api/generate-lesson/route.ts - FIXED DEBUG VERSION

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function okJson(data: unknown, init: ResponseInit = {}) {
  return NextResponse.json(data, { ...init, headers: { 'Cache-Control': 'no-store' } });
}

function buildSimpleDebugPrompt(data: any): string {
  const numberOfDays = parseInt(data.numberOfDays || '3');
  console.log('Building prompt for', numberOfDays, 'days');
  
  return `Create a ${numberOfDays}-day lesson plan for Grade ${data.gradeLevel} ${data.subject} on "${data.topic}".

CRITICAL REQUIREMENT: You must generate ALL ${numberOfDays} days. Generate Day 1, Day 2, Day 3, etc. up to Day ${numberOfDays}.

DAY 1: Introduction
- Learning Target: [target for day 1]
- Activity: [activity for day 1] 
- Assessment: [assessment for day 1]

DAY 2: Development  
- Learning Target: [target for day 2]
- Activity: [activity for day 2]
- Assessment: [assessment for day 2]

DAY 3: Application
- Learning Target: [target for day 3] 
- Activity: [activity for day 3]
- Assessment: [assessment for day 3]

${numberOfDays > 3 ? `
DAY 4: Extension
- Learning Target: [target for day 4]
- Activity: [activity for day 4]
- Assessment: [assessment for day 4]
` : ''}

${numberOfDays > 4 ? `
DAY 5: Synthesis
- Learning Target: [target for day 5]
- Activity: [activity for day 5]
- Assessment: [assessment for day 5]
` : ''}

REMEMBER: Generate all ${numberOfDays} days completely. Do not stop early. Include DAY 1 through DAY ${numberOfDays}.`;
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== LESSON PLAN API CALL START ===');
    console.log('Request URL:', request.url);
    
    // Parse request body ONCE
    let requestData;
    try {
      requestData = await request.json();
      console.log('Request data received:', JSON.stringify(requestData, null, 2));
    } catch (parseError) {
      console.log('JSON parse error:', parseError);
      return okJson({ error: 'Invalid JSON in request' }, { status: 400 });
    }

    const subject = requestData.subject?.trim() || 'English Language Arts';
    const gradeLevel = requestData.gradeLevel?.trim() || '9';
    const topic = requestData.topic?.trim() || 'Core Concept';
    const duration = requestData.duration?.trim() || '60 minutes';
    const numberOfDays = requestData.numberOfDays?.trim() || '3';

    const data = { subject, gradeLevel, topic, duration, numberOfDays };
    console.log('Final lesson data:', data);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.log('ERROR: No API key');
      return okJson({ error: 'No API key configured' }, { status: 500 });
    }

    console.log('API key present:', !!apiKey);
    console.log('API key length:', apiKey.length);

    const prompt = buildSimpleDebugPrompt(data);
    console.log('Prompt length:', prompt.length);
    console.log('Prompt preview:', prompt.substring(0, 300) + '...');

    console.log('Making Anthropic API call...');
    
    const anthropicRequest = {
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 10000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    };
    
    console.log('Anthropic request config:', JSON.stringify(anthropicRequest, null, 2));

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(anthropicRequest)
    });

    console.log('Anthropic response status:', resp.status);
    console.log('Anthropic response ok:', resp.ok);

    if (!resp.ok) {
      const errorText = await resp.text();
      console.log('Anthropic error response:', errorText);
      return okJson({ 
        error: `Anthropic API error: ${resp.status}`,
        details: errorText 
      }, { status: 500 });
    }

    const payload = await resp.json();
    console.log('Anthropic payload received');
    console.log('Payload keys:', Object.keys(payload));
    
    if (payload.content && Array.isArray(payload.content)) {
      console.log('Content array length:', payload.content.length);
      console.log('First content item type:', payload.content[0]?.type);
    }

    let lessonContent = '';
    if (Array.isArray(payload?.content)) {
      const firstText = payload.content.find((c: any) => c?.type === 'text');
      if (firstText?.text) {
        lessonContent = String(firstText.text);
      }
    }

    console.log('Generated content length:', lessonContent.length);
    
    // Count days
    const dayMatches = lessonContent.match(/DAY\s+\d+/gi) || [];
    console.log('Days found:', dayMatches.length);
    console.log('Day matches:', dayMatches);

    // Show content preview
    console.log('Content preview (first 300 chars):', lessonContent.substring(0, 300));
    if (lessonContent.length > 600) {
      console.log('Content preview (last 300 chars):', lessonContent.substring(lessonContent.length - 300));
    }

    // Check if content contains expected days
    const expectedDays = parseInt(numberOfDays);
    let containsAllDays = true;
    for (let i = 1; i <= expectedDays; i++) {
      const dayFound = lessonContent.includes(`DAY ${i}`);
      console.log(`Contains DAY ${i}:`, dayFound);
      if (!dayFound) containsAllDays = false;
    }
    
    console.log('Contains all expected days:', containsAllDays);
    console.log('=== LESSON PLAN API CALL END ===');

    return okJson({
      lessonPlan: lessonContent,
      htmlVersion: `<html><body><h1>DEBUG OUTPUT</h1><p>Days found: ${dayMatches.length}/${numberOfDays}</p><pre>${lessonContent}</pre></body></html>`,
      plainText: lessonContent,
      success: true,
      debug: {
        daysRequested: numberOfDays,
        daysFound: dayMatches.length,
        contentLength: lessonContent.length,
        containsAllDays,
        dayMatches
      }
    });

  } catch (err) {
    console.error('=== CRITICAL ERROR ===');
    console.error('Error name:', (err as Error).name);
    console.error('Error message:', (err as Error).message);
    console.error('Error stack:', (err as Error).stack);
    console.log('=== END ERROR ===');
    
    return okJson({
      error: (err as Error).message || 'Unknown error',
      errorType: (err as Error).name,
      success: false
    }, { status: 500 });
  }
}
