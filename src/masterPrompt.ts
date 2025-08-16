// ===================================================================================
// Enhanced api/generatePlan.js with Master Prompt & Claude Opus 4.1
// ===================================================================================
const admin = require('firebase-admin');
const { masterPrompt } = require('../src/masterPrompt');

// --- Initialize Firebase Admin SDK ---
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY))
    });
  }
} catch (error) {
  if (!/already exists/u.test(error.message)) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

const firestore = admin.firestore();

// --- Configuration ---
const CONFIG = {
  MONTHLY_LIMIT: 5, // Adjustable monthly limit
  MAX_RETRIES: 3,   // Number of retries for failed API calls
  RETRY_DELAY: 2000, // Initial delay between retries (ms)
  TIMEOUT: 120000,   // 120 seconds timeout for complex lesson plans
  MIN_TOKENS: 8000,  // Minimum tokens for comprehensive lesson plans
  MAX_TOKENS: 12000, // Increased for detailed Rootwork Framework plans
  MODEL: "claude-3-5-opus-20241022", // Claude Opus 4.1 equivalent - update when available
  // Fallback models in order of preference
  FALLBACK_MODELS: [
    "claude-3-opus-20240229",
    "claude-3-5-sonnet-20241022",
    "claude-3-sonnet-20240229"
  ]
};

// --- Utility Functions ---

/**
 * Sleep function for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch with timeout wrapper
 */
const fetchWithTimeout = async (url, options, timeout = CONFIG.TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - API took too long to respond');
    }
    throw error;
  }
};

/**
 * Build the complete prompt with user inputs and master template
 */
const buildCompletePrompt = (userInputs) => {
  const { grade, subject, topic, duration = '3 days', standards = '', additionalRequirements = '' } = userInputs;
  
  return `${masterPrompt}

USER REQUEST:
Grade Level: ${grade}
Subject: ${subject}
Topic: ${topic}
Duration: ${duration}
Standards to Address: ${standards || 'Use appropriate state standards'}
Additional Requirements: ${additionalRequirements || 'None specified'}

CRITICAL REMINDERS:
1. Generate a complete ${duration} lesson plan following ALL requirements above
2. Every lesson component MUST include both [Teacher Note: ] and [Student Note: ]
3. Include complete, detailed content - no placeholders or generic descriptions
4. Provide actual scripts, full rubrics, complete worksheets, and specific examples
5. Maintain trauma-informed, healing-centered approach throughout
6. Include Appendix A with all resources properly catalogued
7. Each day should contain at least 800-1000 words of content
8. Total lesson plan should be comprehensive and immediately implementable

Begin generating the complete lesson plan now:`;
};

/**
 * Validate lesson plan for Rootwork Framework requirements
 */
const validateRootworkLessonPlan = (lessonPlan) => {
  const validation = {
    isValid: true,
    issues: [],
    stats: {},
    noteValidation: {
      hasTeacherNotes: false,
      hasStudentNotes: false,
      noteCount: 0
    }
  };

  // Check minimum length
  const wordCount = lessonPlan.split(/\s+/).length;
  validation.stats.wordCount = wordCount;
  
  if (wordCount < 2500) {
    validation.isValid = false;
    validation.issues.push(`Plan too brief: ${wordCount} words (minimum 2500 required for multi-day plans)`);
  }

  // Check for Teacher and Student Notes
  const teacherNoteMatches = lessonPlan.match(/\[Teacher Note:/gi) || [];
  const studentNoteMatches = lessonPlan.match(/\[Student Note:/gi) || [];
  
  validation.noteValidation.hasTeacherNotes = teacherNoteMatches.length > 0;
  validation.noteValidation.hasStudentNotes = studentNoteMatches.length > 0;
  validation.noteValidation.noteCount = teacherNoteMatches.length + studentNoteMatches.length;
  
  if (teacherNoteMatches.length < 10) {
    validation.isValid = false;
    validation.issues.push(`Insufficient Teacher Notes: ${teacherNoteMatches.length} found (minimum 10 required)`);
  }
  
  if (studentNoteMatches.length < 10) {
    validation.isValid = false;
    validation.issues.push(`Insufficient Student Notes: ${studentNoteMatches.length} found (minimum 10 required)`);
  }

  // Check for required Rootwork Framework sections
  const requiredSections = [
    'opening', 'i do', 'we do', 'you do together', 'you do alone', 'closing',
    'essential question', 'learning target', 'standards', 'mtss', 'sel',
    'trauma-informed', 'regulation', 'assessment', 'differentiation'
  ];
  
  const missingSections = requiredSections.filter(section => 
    !lessonPlan.toLowerCase().includes(section)
  );
  
  if (missingSections.length > 0) {
    validation.isValid = false;
    validation.issues.push(`Missing required sections: ${missingSections.join(', ')}`);
  }

  // Check for placeholder text
  const placeholders = [
    '[insert', '[add', '[include', 'placeholder', 
    'to be determined', 'TBD', '...', '[your',
    'fill in', 'customize this', 'adapt as needed'
  ];
  
  const foundPlaceholders = placeholders.filter(placeholder => 
    lessonPlan.toLowerCase().includes(placeholder.toLowerCase())
  );
  
  if (foundPlaceholders.length > 0) {
    validation.isValid = false;
    validation.issues.push(`Contains placeholders: ${foundPlaceholders.join(', ')}`);
  }

  // Check for Appendix A
  if (!lessonPlan.includes('Appendix A:')) {
    validation.isValid = false;
    validation.issues.push('Missing Appendix A: Resource and Visual Asset Directory');
  }

  return validation;
};

/**
 * Call Anthropic API with Rootwork Framework requirements
 */
const callAnthropicAPI = async (userInputs, retryCount = 0) => {
  try {
    const completePrompt = buildCompletePrompt(userInputs);
    
    const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: CONFIG.MODEL,
        max_tokens: CONFIG.MAX_TOKENS,
        temperature: 0.8, // Slightly higher for creative educational content
        messages: [{ 
          role: "user", 
          content: completePrompt 
        }],
        system: `You are an expert trauma-informed educational curriculum designer specializing in the Rootwork Framework for healing-centered education. You have deep expertise in:
- Trauma-informed pedagogy and SAMHSA principles
- CASEL SEL competencies and MTSS implementation
- Living Learning Labs and garden-based education
- Project-Based Learning with therapeutic contexts
- Creating detailed, immediately implementable lesson plans
- Writing both teacher facilitation notes and student coaching notes

You ALWAYS include [Teacher Note: ] and [Student Note: ] annotations throughout your lesson plans. These notes are MANDATORY for every lesson component. Your lesson plans are comprehensive, detailed, and contain no placeholders - everything is fully developed and ready to use.`
      })
    }, CONFIG.TIMEOUT);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      
      // Handle specific error codes
      if (response.status === 429) {
        throw new Error('RATE_LIMIT: API rate limit exceeded. Please try again in a moment.');
      }
      if (response.status === 500 || response.status === 502 || response.status === 503 || response.status === 504) {
        throw new Error(`SERVER_ERROR_${response.status}: Temporary server issue.`);
      }
      if (response.status === 401) {
        throw new Error('AUTH_ERROR: Invalid API key.');
      }
      
      console.error("Anthropic API Error:", response.status, errorBody);
      throw new Error(`API_ERROR_${response.status}: ${errorBody.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('INVALID_RESPONSE: Unexpected API response format');
    }

    const lessonPlan = data.content[0].text;
    
    // Validate the response for Rootwork Framework requirements
    const validation = validateRootworkLessonPlan(lessonPlan);
    
    if (!validation.isValid && retryCount < CONFIG.MAX_RETRIES) {
      console.log(`Validation failed: ${validation.issues.join('; ')}. Retrying with enhanced requirements...`);
      
      // Enhance inputs with specific missing requirements
      const enhancedInputs = {
        ...userInputs,
        additionalRequirements: `
          ${userInputs.additionalRequirements || ''}
          
          CRITICAL - Previous attempt had these issues that MUST be fixed:
          ${validation.issues.join('\n')}
          
          MANDATORY REQUIREMENTS NOT MET:
          - Must include [Teacher Note: ] and [Student Note: ] in EVERY lesson component
          - Minimum ${validation.stats.wordCount < 2500 ? '2500' : validation.stats.wordCount + 500} words required
          - NO PLACEHOLDERS - provide complete content for everything
          - Include complete Appendix A with all resources
          ${!validation.noteValidation.hasTeacherNotes ? '- MISSING TEACHER NOTES - Add [Teacher Note: ] throughout' : ''}
          ${!validation.noteValidation.hasStudentNotes ? '- MISSING STUDENT NOTES - Add [Student Note: ] throughout' : ''}
        `
      };
      
      return callAnthropicAPI(enhancedInputs, retryCount + 1);
    }
    
    return {
      lessonPlan,
      validation,
      model: CONFIG.MODEL,
      retryCount
    };

  } catch (error) {
    console.error(`API call failed (attempt ${retryCount + 1}):`, error.message);
    
    // Determine if we should retry
    const shouldRetry = (
      retryCount < CONFIG.MAX_RETRIES &&
      (error.message.includes('SERVER_ERROR') || 
       error.message.includes('timeout') ||
       error.message.includes('ECONNRESET') ||
       error.message.includes('ETIMEDOUT'))
    );
    
    if (shouldRetry) {
      const delay = CONFIG.RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
      console.log(`Retrying in ${delay}ms...`);
      await sleep(delay);
      
      // Try with a fallback model if main model keeps failing
      if (retryCount >= 2 && CONFIG.FALLBACK_MODELS[0]) {
        CONFIG.MODEL = CONFIG.FALLBACK_MODELS[0];
        console.log(`Switching to fallback model: ${CONFIG.MODEL}`);
      }
      
      return callAnthropicAPI(userInputs, retryCount + 1);
    }
    
    throw error;
  }
};

// --- Main Handler ---
export default async function handler(req, res) {
  // Enable CORS if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let uid = null;
  
  try {
    // --- 1. Authenticate the User ---
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized: No token provided.',
        code: 'AUTH_REQUIRED' 
      });
    }
    
    const token = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    uid = decodedToken.uid;

    // --- 2. Check User's Usage ---
    const userRef = firestore.collection('users').doc(uid);
    const userDoc = await userRef.get();
    
    let usageCount = 0;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    if (userDoc.exists) {
      const userData = userDoc.data();
      const lastResetDate = userData.lastResetDate ? new Date(userData.lastResetDate.toMillis()) : null;
      
      if (!lastResetDate || 
          currentMonth !== lastResetDate.getMonth() || 
          currentYear !== lastResetDate.getFullYear()) {
        // New month or year, reset the count
        await userRef.update({ 
          usageCount: 0, 
          lastResetDate: currentDate,
          lastResetMonth: currentMonth,
          lastResetYear: currentYear
        });
        usageCount = 0;
      } else {
        usageCount = userData.usageCount || 0;
      }
    } else {
      // First time user, create a document
      await userRef.set({ 
        uid, 
        usageCount: 0, 
        lastResetDate: currentDate,
        lastResetMonth: currentMonth,
        lastResetYear: currentYear,
        createdAt: currentDate
      });
    }

    if (usageCount >= CONFIG.MONTHLY_LIMIT) {
      return res.status(429).json({ 
        error: `Monthly limit of ${CONFIG.MONTHLY_LIMIT} plans reached.`,
        code: 'LIMIT_EXCEEDED',
        usageInfo: {
          count: usageCount,
          limit: CONFIG.MONTHLY_LIMIT,
          resetDate: new Date(currentYear, currentMonth + 1, 1).toISOString()
        }
      });
    }

    // --- 3. Process the Request ---
    const { prompt, grade, subject, topic, duration, standards, additionalRequirements, options = {} } = req.body;
    
    // Build user inputs object
    const userInputs = {
      grade: grade || 'Not specified',
      subject: subject || 'Not specified',
      topic: topic || 'Not specified',
      duration: duration || '3 days',
      standards: standards || '',
      additionalRequirements: additionalRequirements || prompt || ''
    };
    
    // Validate required inputs
    if (!grade || !subject || !topic) {
      return res.status(400).json({ 
        error: 'Missing required inputs. Please provide grade, subject, and topic.',
        code: 'INVALID_REQUEST',
        missing: {
          grade: !grade,
          subject: !subject,
          topic: !topic
        }
      });
    }

    // Start generation with progress tracking
    const startTime = Date.now();
    
    // Call the enhanced Anthropic API with Rootwork Framework
    const result = await callAnthropicAPI(userInputs);
    
    const generationTime = Date.now() - startTime;

    // --- 4. Update Usage Count ---
    await userRef.update({
      usageCount: admin.firestore.FieldValue.increment(1),
      lastGeneratedAt: currentDate,
      totalGenerations: admin.firestore.FieldValue.increment(1),
      lastTopic: topic,
      lastGrade: grade,
      lastSubject: subject
    });
    
    const newUsageCount = usageCount + 1;

    // --- 5. Send Enhanced Response ---
    res.status(200).json({ 
      success: true,
      lessonPlan: result.lessonPlan,
      metadata: {
        model: result.model,
        wordCount: result.validation.stats.wordCount,
        generationTime: `${(generationTime / 1000).toFixed(2)}s`,
        retries: result.retryCount,
        validation: {
          status: result.validation.isValid ? 'passed' : 'partial',
          issues: result.validation.issues,
          noteValidation: result.validation.noteValidation
        }
      },
      usageInfo: {
        count: newUsageCount,
        limit: CONFIG.MONTHLY_LIMIT,
        remaining: CONFIG.MONTHLY_LIMIT - newUsageCount,
        resetDate: new Date(currentYear, currentMonth + 1, 1).toISOString()
      }
    });

  } catch (error) {
    console.error('Error in generatePlan:', error);
    
    // Log error to Firestore for monitoring
    if (uid) {
      try {
        await firestore.collection('errors').add({
          uid,
          error: error.message,
          timestamp: new Date(),
          endpoint: 'generatePlan'
        });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
    }
    
    // Determine appropriate error response
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let userMessage = 'An error occurred while generating your lesson plan.';
    
    if (error.message.includes('AUTH_ERROR')) {
      statusCode = 401;
      errorCode = 'AUTH_ERROR';
      userMessage = 'Authentication failed. Please check your API configuration.';
    } else if (error.message.includes('RATE_LIMIT')) {
      statusCode = 429;
      errorCode = 'RATE_LIMIT';
      userMessage = 'API rate limit exceeded. Please try again in a few moments.';
    } else if (error.message.includes('timeout')) {
      statusCode = 504;
      errorCode = 'TIMEOUT';
      userMessage = 'The request took too long. Please try again.';
    } else if (error.message.includes('SERVER_ERROR')) {
      statusCode = 503;
      errorCode = 'SERVICE_UNAVAILABLE';
      userMessage = 'The AI service is temporarily unavailable. Please try again shortly.';
    }
    
    res.status(statusCode).json({ 
      success: false,
      error: userMessage,
      code: errorCode,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
