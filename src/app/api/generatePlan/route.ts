// File: api/generatePlan.js

const admin = require('firebase-admin');

// --- Initialize Firebase Admin SDK ---
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
    });
  }
} catch (error) {
  console.error('Firebase admin initialization error', error.stack);
}

const firestore = admin.firestore();
const MONTHLY_LIMIT = 5; 

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // --- 1. Authenticate the User ---
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided.' });
    }
    const token = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // --- 2. Check User's Usage ---
    const userRef = firestore.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    let usageCount = 0;
    const currentMonth = new Date().getMonth();

    if (userDoc.exists) {
      const userData = userDoc.data();
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
      return res.status(429).json({ error: `Monthly limit of ${MONTHLY_LIMIT} plans reached.` });
    }

    // --- 3. Call the Anthropic API (Updated Section) ---
    const { systemPrompt, userPrompt } = req.body;
    if (!systemPrompt || !userPrompt) {
      return res.status(400).json({ error: 'System and user prompts are required.' });
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            model: "claude-3-sonnet-20240229",
            max_tokens: 4096,
            system: systemPrompt, // Your master prompt
            messages: [{ role: "user", content: userPrompt }] // The user's specific request
        })
    });

    if (!anthropicResponse.ok) {
        const errorBody = await anthropicResponse.json();
        console.error("Anthropic API Error:", errorBody);
        throw new Error('Failed to get a response from the AI model.');
    }

    const anthropicData = await anthropicResponse.json();
    const lessonPlan = anthropicData.content[0].text;

    // --- 4. Update Usage Count ---
    await userRef.update({
      usageCount: admin.firestore.FieldValue.increment(1)
    });
    
    const newUsageCount = usageCount + 1;

    // --- 5. Send Response to Frontend ---
    res.status(200).json({ 
        lessonPlan, // Send the generated plan back
        usageInfo: {
            count: newUsageCount,
            limit: MONTHLY_LIMIT
        }
    });

  } catch (error) {
    console.error('Error in generatePlan function:', error);
    // Be more specific about auth errors
    if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: 'Unauthorized: Token has expired.' });
    }
    res.status(500).json({ error: error.message || 'An internal server error occurred.' });
  }
}
