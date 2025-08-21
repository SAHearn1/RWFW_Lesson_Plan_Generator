// ===================================================================================
// DEBUG VERSION - api/generatePlan.js 
// This version will log everything to help us understand what's happening
// ===================================================================================
const admin = require('firebase-admin');

// --- Initialize Firebase Admin SDK ---
try {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
  });
} catch (error) {
  if (!/already exists/u.test(error.message)) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

const firestore = admin.firestore();
const MONTHLY_LIMIT = 5;

export default async function handler(req, res) {
  console.log('=== LESSON PLAN GENERATION DEBUG START ===');
  console.log('Request method:', req.method);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('Raw request body:', JSON.stringify(req.body, null, 2));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // --- 1. Authenticate the User ---
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('ERROR: No authorization token provided');
      return res.status(401).json({ error: 'Unauthorized: No token provided.' });
    }
    const token = authorization.split('Bearer ')[1];
    console.log('Token received (length):', token.length);
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    console.log('User authenticated, UID:', uid);

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

    console.log('Usage count:', usageCount, 'Limit:', MONTHLY_LIMIT);

    if (usageCount >= MONTHLY_LIMIT) {
      return res.status(429).json({ error: `Monthly limit of ${MONTHLY_LIMIT} plans reached.` });
    }

    // --- 3. Parse lesson data from request ---
    console.log('Parsing lesson data from request body...');
    
    // Check if this is the old format (just a prompt) or new format (structured data)
    if (req.body.prompt && typeof req.body.prompt === 'string') {
      console.log('OLD FORMAT DETECTED: Raw prompt in request');
      console.log('Prompt length:', req.body.prompt.length);
      console.log('Prompt preview:', req.body.prompt.substring(0, 200) + '...');
      
      // For now, let's still handle the old format but with higher token limit
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
              'x-api-key': process.env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
          },
          body: JSON.stringify({
              model: "claude-3-5-sonnet-20240620",
              max_tokens: 25000, // Much higher than original 4096
              temperature: 0.3,
              messages: [{ role: "user", content: req.body.prompt }]
          })
      });

      console.log('Anthropic API response status:', anthropicResponse.status);

      if (!anthropicResponse.ok) {
          const errorBody = await anthropicResponse.json();
          console.error("Anthropic API Error:", errorBody);
          throw new Error('Failed to get a response from the AI model.');
      }

      const anthropicData = await anthropicResponse.json();
      console.log('Anthropic response keys:', Object.keys(anthropicData));
      console.log('Content type:', Array.isArray(anthropicData?.content) ? 'array' : typeof anthropicData?.content);
      
      let lessonPlan = '';
      if (Array.isArray(anthropicData?.content)) {
        const firstText = anthropicData.content.find(c => c?.type === 'text');
        if (firstText?.text) lessonPlan = String(firstText.text);
      } else if (typeof anthropicData?.content === 'string') {
        lessonPlan = anthropicData.content;
      }

      console.log('Generated lesson plan length:', lessonPlan.length);
      
      // Count days in generated content
      const dayMatches = lessonPlan.match(/DAY\s+\d+/gi) || [];
      console.log('Days found in generated content:', dayMatches.length);
      console.log('Day matches:', dayMatches);
      
      // Show first 500 characters of generated content
      console.log('Generated content preview:', lessonPlan.substring(0, 500) + '...');

      // --- Update Usage Count ---
      await userRef.update({
        usageCount: admin.firestore.FieldValue.increment(1)
      });
      
      const newUsageCount = usageCount + 1;

      console.log('Sending response with lesson plan length:', lessonPlan.length);
      console.log('=== LESSON PLAN GENERATION DEBUG END ===');

      // --- Send Response to Frontend ---
      res.status(200).json({ 
          lessonPlan,
          usageInfo: {
              count: newUsageCount,
              limit: MONTHLY_LIMIT
          },
          debug: {
              daysFound: dayMatches.length,
              contentLength: lessonPlan.length,
              format: 'old_prompt_format'
          }
      });
      
    } else {
      console.log('NEW FORMAT DETECTED: Structured lesson data');
      
      const { 
        subject = 'English Language Arts',
        gradeLevel = '9', 
        topic = 'Using Text Based Evidence To Support A Claim',
        duration = '60 minutes',
        numberOfDays = '3',
        location = 'Savannah, Georgia'
      } = req.body;

      console.log('Parsed lesson data:', { subject, gradeLevel, topic, duration, numberOfDays, location });

      // Build enhanced prompt (simplified for debugging)
      const prompt = `Create a complete ${numberOfDays}-day lesson plan for Grade ${gradeLevel} ${subject} on "${topic}".

CRITICAL: Generate ALL ${numberOfDays} days. Do not stop until Day ${numberOfDays} is complete.

Generate Day 1, Day 2, Day 3, etc. up to Day ${numberOfDays}.

Each day should include:
- Daily Essential Question
- Learning Target  
- Materials Needed
- Activities (5 Rs structure)
- Assessment

Make sure to include Day 1, Day 2, Day 3, Day 4, Day 5 if numberOfDays is 5.
Make sure to include Day 1, Day 2, Day 3 if numberOfDays is 3.

REMEMBER: Generate ALL ${numberOfDays} days completely.`;

      console.log('Built prompt length:', prompt.length);
      console.log('Built prompt preview:', prompt.substring(0, 300) + '...');

      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
              'x-api-key': process.env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json'
          },
          body: JSON.stringify({
              model: "claude-3-5-sonnet-20240620",
              max_tokens: 25000,
              temperature: 0.3,
              messages: [{ role: "user", content: prompt }]
          })
      });

      console.log('Anthropic API response status:', anthropicResponse.status);

      if (!anthropicResponse.ok) {
          const errorBody = await anthropicResponse.json();
          console.error("Anthropic API Error:", errorBody);
          throw new Error('Failed to get a response from the AI model.');
      }

      const anthropicData = await anthropicResponse.json();
      let lessonPlan = '';
      
      if (Array.isArray(anthropicData?.content)) {
        const firstText = anthropicData.content.find(c => c?.type === 'text');
        if (firstText?.text) lessonPlan = String(firstText.text);
      }

      console.log('Generated lesson plan length:', lessonPlan.length);
      
      const dayMatches = lessonPlan.match(/DAY\s+\d+/gi) || [];
      console.log('Days found in generated content:', dayMatches.length);
      console.log('Day matches:', dayMatches);
      
      console.log('Generated content preview:', lessonPlan.substring(0, 500) + '...');

      // --- Update Usage Count ---
      await userRef.update({
        usageCount: admin.firestore.FieldValue.increment(1)
      });
      
      const newUsageCount = usageCount + 1;

      console.log('=== LESSON PLAN GENERATION DEBUG END ===');

      res.status(200).json({ 
          lessonPlan,
          usageInfo: {
              count: newUsageCount,
              limit: MONTHLY_LIMIT
          },
          debug: {
              daysRequested: numberOfDays,
              daysFound: dayMatches.length,
              contentLength: lessonPlan.length,
              format: 'structured_data'
          }
      });
    }

  } catch (error) {
    console.error('=== ERROR IN LESSON PLAN GENERATION ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.log('=== END ERROR DEBUG ===');
    
    res.status(500).json({ 
      error: error.message || 'An internal server error occurred.',
      debug: {
        errorType: error.constructor.name,
        timestamp: new Date().toISOString()
      }
    });
  }
}
