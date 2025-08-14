// File: src/app/api/generatePlan/route.ts

import { NextResponse } from 'next/server';
// import admin from 'firebase-admin'; // Temporarily disabled

/* // --- Temporarily disable all Firebase Admin setup ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const firestore = admin.firestore();
const MONTHLY_LIMIT = 5;
*/

export async function POST(req: Request) {
  try {
    /* // --- Temporarily disable all authentication and usage checks ---
    const authorization = req.headers.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided.' }, { status: 401 });
    }
    const token = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    // ... (usage check logic removed for brevity) ...
    */

    // --- Core Logic (Still Active) ---
    const { systemPrompt, userPrompt } = await req.json();
    if (!systemPrompt || !userPrompt) {
        return NextResponse.json({ error: 'System and user prompts are required.' }, { status: 400 });
    }

    // Ensure the ANTHROPIC_API_KEY is also set as an environment variable in Vercel
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
        throw new Error('ANTHROPIC_API_KEY is not set in Vercel environment variables.');
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

    if (!anthropicResponse.ok) {
        const errorBody = await anthropicResponse.json();
        return NextResponse.json({ error: 'Failed to get a response from the AI model.', details: errorBody }, { status: 502 });
    }

    const anthropicData = await anthropicResponse.json();
    const lessonPlan = anthropicData.content[0].text;

    /* // --- Temporarily disable usage count update ---
    await userRef.update({ usageCount: admin.firestore.FieldValue.increment(1) });
    */

    // --- Send Response to Frontend ---
    return NextResponse.json({
        lessonPlan,
        // Mock usage info since it's disabled
        usageInfo: { count: 1, limit: 5 }
    });

  } catch (error: any) {
    console.error('Error in generatePlan POST handler:', error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
