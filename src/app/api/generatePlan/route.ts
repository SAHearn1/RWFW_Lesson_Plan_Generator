// File: src/app/api/generatePlan/route.ts

import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// --- Firebase Configuration ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const firestore = admin.firestore();
const MONTHLY_LIMIT = 5;

// --- API Route Handler for POST requests ---
export async function POST(req: Request) {
  try {
    // 1. Authenticate the User
    const authorization = req.headers.get('Authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided.' }, { status: 401 });
    }
    const token = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // 2. Check User's Usage
    const userRef = firestore.collection('users').doc(uid);
    const userDoc = await userRef.get();
    let usageCount = 0;
    const currentMonth = new Date().getMonth();

    if (userDoc.exists) {
        const userData = userDoc.data()!;
        const lastResetMonth = userData.lastResetDate ? new Date(userData.lastResetDate.toMillis()).getMonth() : -1;
        if (currentMonth !== lastResetMonth) {
            await userRef.update({ usageCount: 0, lastResetDate: new Date() });
            usageCount = 0;
        } else {
            usageCount = userData.usageCount || 0;
        }
    } else {
        await userRef.set({ uid, usageCount: 0, lastResetDate: new Date() });
    }

    if (usageCount >= MONTHLY_LIMIT) {
        return NextResponse.json({ error: `Monthly limit of ${MONTHLY_LIMIT} plans reached.` }, { status: 429 });
    }

    // 3. Get Prompts and Call Anthropic API
    const { systemPrompt, userPrompt } = await req.json();
    if (!systemPrompt || !userPrompt) {
        return NextResponse.json({ error: 'System and user prompts are required.' }, { status: 400 });
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY!,
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
        console.error("Anthropic API Error:", errorBody);
        return NextResponse.json({ error: 'Failed to get a response from the AI model.' }, { status: 502 });
    }

    const anthropicData = await anthropicResponse.json();
    const lessonPlan = anthropicData.content[0].text;

    // 4. Update Usage Count
    await userRef.update({ usageCount: admin.firestore.FieldValue.increment(1) });
    const newUsageCount = usageCount + 1;

    // 5. Send Response to Frontend
    return NextResponse.json({
        lessonPlan,
        usageInfo: {
            count: newUsageCount,
            limit: MONTHLY_LIMIT
        }
    });

  } catch (error: any) {
    console.error('Error in generatePlan POST handler:', error);
    if (error.code === 'auth/id-token-expired') {
        return NextResponse.json({ error: 'Unauthorized: Token has expired.' }, { status: 401 });
    }
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
