// ===================================================================================
// File: api/generatePlan.js - Fixed with proper lesson generation logic
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

function buildEnhancedMasterPrompt(data) {
  const numberOfDays = parseInt(data.numberOfDays || '5');
  const durationMinutes = parseInt(data.duration?.match(/\d+/)?.[0] || '90');
  const cleanTopic = data.topic || 'Core Learning Concept';

  const dayFoci = [
    'Introduction and Foundation Building',
    'Exploration and Investigation',
    'Analysis and Critical Thinking',
    'Application and Creation',
    'Synthesis and Reflection'
  ];

  return `
PROFESSIONAL LESSON PLAN GENERATOR - STRUCTURED OUTPUT

Create a comprehensive ${numberOfDays}-day lesson plan with clear content hierarchy and professional formatting. Use the heading tokens literally as labels for sections so they can be transformed into HTML later.

CRITICAL: You must generate ALL ${numberOfDays} days completely. Do not stop after Day 1. Generate Day 1, Day 2, Day 3, up through Day ${numberOfDays}. Every single day must be included.

LESSON PARAMETERS:
- Subject: ${data.subject}
- Grade Level: ${data.gradeLevel}
- Topic: ${cleanTopic}
- Duration: ${data.duration} per day
- Location: ${data.location || 'Savannah, Georgia'}
- Days: ${numberOfDays}

LEVEL I HEADING: TRAUMA-INFORMED STEAM LESSON PLAN
Grade: ${data.gradeLevel}
Subject: ${data.subject}
Topic: ${cleanTopic}
Duration: ${data.duration} per day over ${numberOfDays} days
Location: ${data.location || 'Savannah, Georgia'}
Unit Title: Evidence-Based Learning with ${cleanTopic}

LEVEL I HEADING: LESSON OVERVIEW
This ${numberOfDays}-day unit develops student understanding of ${cleanTopic} through evidence-based learning, collaborative activities, and real-world connections using the Root Work Framework.

LEVEL I HEADING: UNIT ESSENTIAL QUESTION
How can students effectively apply ${cleanTopic} concepts to analyze information and support their ideas with evidence?

LEVEL I HEADING: UNIT LEARNING TARGETS
- I can identify and explain key concepts related to ${cleanTopic} (DOK 2)
- I can analyze and evaluate examples of ${cleanTopic} in various contexts (DOK 3)
- I can create original work that demonstrates mastery of ${cleanTopic} principles (DOK 4)

${Array.from({ length: numberOfDays }, (_, i) => {
  const dayNumber = i + 1;
  const focus = dayFoci[i] || `Advanced Application ${dayNumber}`;
  return `
LEVEL I HEADING: DAY ${dayNumber}: ${focus}

LEVEL II HEADING: Daily Essential Question
How does ${cleanTopic} connect to ${focus.toLowerCase()} in our learning and community?

LEVEL II HEADING: Daily Learning Target
I can demonstrate understanding of ${cleanTopic} through ${focus.toLowerCase()} activities and discussions (DOK ${dayNumber <= 2 ? 2 : dayNumber <= 4 ? 3 : 4})

LEVEL II HEADING: Standards Alignment
CREATE TABLE:
Standard Type | Standard Code | Description
Primary Standard | ELAGSE${data.gradeLevel}-10.RI.1 | Cite strong textual evidence to support analysis
SEL Integration | CASEL.${dayNumber === 1 ? 'SA' : dayNumber === 2 ? 'SM' : dayNumber === 3 ? 'SOA' : dayNumber === 4 ? 'RS' : 'RDM'} | ${dayNumber === 1 ? 'Self-awareness through reflection' : dayNumber === 2 ? 'Self-management in learning tasks' : dayNumber === 3 ? 'Social awareness in group work' : dayNumber === 4 ? 'Relationship skills in collaboration' : 'Responsible decision-making'}
Cross-Curricular | Multiple subjects | Integrate ${cleanTopic} across STEAM disciplines

LEVEL II HEADING: Materials Needed
- Student journals or notebooks
- Digital presentation materials for Day ${dayNumber}
- Handouts related to ${cleanTopic} for ${focus}
- Collaborative workspace materials
- Assessment materials for Day ${dayNumber}

LEVEL II HEADING: Root Work Framework 5 Rs Structure

LEVEL III HEADING: RELATIONSHIPS (${Math.round(durationMinutes * 0.15)} minutes)
Opening Activity for Day ${dayNumber}:
"${cleanTopic} ${focus}" Connection Circle: Students share how Day ${dayNumber}'s focus on ${focus.toLowerCase()} connects to their experiences with ${cleanTopic}.

Teacher Note: Create a welcoming environment where all voices are valued. Focus on building connections between ${cleanTopic} and ${focus.toLowerCase()}.
Student Note: This is your time to connect with classmates and share your perspective on ${cleanTopic}. Listen actively to others' experiences.

LEVEL III HEADING: ROUTINES (${Math.round(durationMinutes * 0.1)} minutes)
Day ${dayNumber} Agenda:
1. Opening connection circle
2. ${focus} mini-lesson on ${cleanTopic}
3. Collaborative exploration activity
4. Individual reflection and goal setting

Success Criteria for Day ${dayNumber}:
- I can explain key concepts from today's ${focus.toLowerCase()} focus
- I can connect ${cleanTopic} to real-world applications
- I can collaborate effectively with peers

Teacher Note: Post the agenda visually and refer to it throughout Day ${dayNumber}. Establish clear expectations for ${focus.toLowerCase()} activities.
Student Note: Keep track of your learning goals and check your progress throughout Day ${dayNumber}.

LEVEL III HEADING: RELEVANCE (${Math.round(durationMinutes * 0.25)} minutes)
Day ${dayNumber} Connection Activity:
"${cleanTopic} in Savannah" Local Context: Explore how ${cleanTopic} impacts our local Savannah community, specifically relating to ${focus.toLowerCase()}. Students identify current examples and connections.

Real-World Bridge:
Connect Day ${dayNumber}'s focus on ${focus.toLowerCase()} to current events, local issues, or future career applications related to ${cleanTopic}.

Teacher Note: Use local examples and current events to make ${cleanTopic} relevant to students' lives. Help them see connections between ${focus.toLowerCase()} and their community.
Student Note: Think about how ${cleanTopic} appears in your daily life and community. Make personal connections to the material.

LEVEL III HEADING: RIGOR (${Math.round(durationMinutes * 0.35)} minutes)
I Do: Teacher Modeling (${Math.round(durationMinutes * 0.1)} minutes)
Demonstrate ${focus.toLowerCase()} strategies for understanding ${cleanTopic}. Model the thinking process students will use.

Think-Aloud Script for Day ${dayNumber}:
"As I examine this aspect of ${cleanTopic}, I'm using ${focus.toLowerCase()} to understand... Let me show you my thinking process for Day ${dayNumber}..."

Teacher Note: Make your thinking visible for students. Show them how to approach ${cleanTopic} using ${focus.toLowerCase()} strategies.
Student Note: Pay attention to the thinking strategies being modeled. You'll use these same approaches in your own work.

We Do: Guided Practice (${Math.round(durationMinutes * 0.15)} minutes)
Together, work through ${cleanTopic} examples using ${focus.toLowerCase()} approaches. Provide scaffolded support as students practice new skills.

Scaffolding Supports for Day ${dayNumber}:
- Graphic organizers for ${cleanTopic} concepts
- Sentence starters for discussions about ${focus.toLowerCase()}
- Visual aids and reference materials

Teacher Note: Provide just-right support for Day ${dayNumber}. Gradually release responsibility as students show understanding of ${cleanTopic}.
Student Note: Ask questions and seek clarification during guided practice. This is your time to learn with support.

You Do Together: Collaborative Application (${Math.round(durationMinutes * 0.1)} minutes)
In pairs or small groups, students apply ${focus.toLowerCase()} strategies to new ${cleanTopic} scenarios or problems.

Choice Options for Day ${dayNumber}:
- Create a visual representation of ${cleanTopic} connections
- Develop questions for further investigation of ${cleanTopic}
- Design a solution or response related to ${cleanTopic}

Teacher Note: Monitor group work closely on Day ${dayNumber}. Ensure equitable participation and understanding of ${cleanTopic}.
Student Note: Work collaboratively and build on each other's ideas about ${cleanTopic}. Share responsibilities fairly.

LEVEL III HEADING: REFLECTION (${Math.round(durationMinutes * 0.15)} minutes)
Day ${dayNumber} Processing:
Students complete a reflection on their learning about ${cleanTopic} through today's ${focus.toLowerCase()} activities.

Tomorrow's Preview:
${dayNumber < numberOfDays ? `Preview Day ${dayNumber + 1}'s focus and how it builds on today's work with ${focus.toLowerCase()}.` : 'Celebrate the completion of our unit on ' + cleanTopic + ' and discuss next steps.'}

Teacher Note: Use Day ${dayNumber} reflections to inform tomorrow's instruction. Note student progress and areas needing support.
Student Note: Be honest in your reflection about Day ${dayNumber}. Think about what you learned and what questions you still have about ${cleanTopic}.

LEVEL II HEADING: Day ${dayNumber} Implementation Supports
CREATE TABLE:
Support Tier | Target Population | Specific Strategies for Day ${dayNumber}
Tier 1 Universal | All Students | Visual supports for ${cleanTopic}, collaborative learning structures, multiple ways to show understanding
Tier 2 Targeted | Students Needing Additional Support | Pre-teaching key vocabulary, simplified texts, extended time for ${focus.toLowerCase()} activities
Tier 3 Intensive | Students Needing Significant Support | One-on-one support, modified expectations, alternative assessment methods
504 Accommodations | Students with Disabilities | Extended time, assistive technology, preferential seating, modified materials
Gifted Extensions | Advanced Learners | Deeper investigation of ${cleanTopic}, leadership roles, additional complexity
SPED Modifications | Students with IEPs | Individualized goals, modified content, specialized instruction methods

LEVEL II HEADING: Day ${dayNumber} Assessment
CREATE TABLE:
Assessment Type | Method | Purpose
Formative | Exit ticket on ${cleanTopic} understanding from Day ${dayNumber} | Monitor daily progress and adjust instruction
Observation | Teacher observation of ${focus.toLowerCase()} skills during activities | Assess application of learning strategies
Summative | ${dayNumber === numberOfDays ? 'Unit culminating project on ' + cleanTopic : 'Ongoing portfolio development'} | ${dayNumber === numberOfDays ? 'Evaluate overall unit mastery' : 'Track cumulative learning progress'}

LEVEL II HEADING: SEL Integration for Day ${dayNumber}
Focus on ${dayNumber === 1 ? 'self-awareness as students identify their prior knowledge about ' + cleanTopic : dayNumber === 2 ? 'self-management as students practice persistence with ' + focus.toLowerCase() + ' activities' : dayNumber === 3 ? 'social awareness as students consider different perspectives on ' + cleanTopic : dayNumber === 4 ? 'relationship skills through collaborative work on ' + cleanTopic + ' projects' : 'responsible decision-making as students apply learning about ' + cleanTopic + ' to real scenarios'}. Integrate SEL naturally throughout Day ${dayNumber} activities.

LEVEL II HEADING: Trauma-Informed Considerations for Day ${dayNumber}
Be aware that ${cleanTopic} may connect to students' personal experiences. For Day ${dayNumber}'s focus on ${focus.toLowerCase()}, provide choice and voice in activities. Create safe spaces for sharing and ensure all students feel valued and supported.

PAGE BREAK
`.trim();
}).join('\n\n')}

LEVEL I HEADING: COMPREHENSIVE RESOURCE GENERATION

LEVEL II HEADING: 1. Student Workbook
File: RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}_${data.gradeLevel}_StudentWorkbook.pdf

COMPLETE CONTENT:
Student workbook with daily pages, graphic organizers for ${cleanTopic}, reflection prompts, vocabulary sections, assessment rubrics, and reference materials for all ${numberOfDays} days.

LEVEL II HEADING: 2. Teacher Implementation Guide
File: RootedIn${cleanTopic.replace(/[^a-zA-Z]/g, '')}_${data.gradeLevel}_TeacherGuide.pdf

COMPLETE CONTENT:
Comprehensive teacher guide with preparation checklists, differentiation strategies, assessment rubrics, extension activities, intervention support, and implementation tips for all ${numberOfDays} days of ${cleanTopic} instruction.

GENERATION COMPLETE - ALL ${numberOfDays} DAYS INCLUDED
`.trim();
}

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

    // --- 3. Parse the lesson plan request data ---
    const { 
      subject = 'English Language Arts',
      gradeLevel = '9', 
      topic = 'Using Text Based Evidence To Support A Claim',
      duration = '60 minutes',
      numberOfDays = '3',
      location = 'Savannah, Georgia'
    } = req.body;

    const lessonData = {
      subject,
      gradeLevel, 
      topic,
      duration,
      numberOfDays,
      location
    };

    console.log('Generating lesson plan for:', lessonData);

    // --- 4. Build the enhanced prompt ---
    const prompt = buildEnhancedMasterPrompt(lessonData);

    // --- 5. Call the Anthropic API with proper settings ---
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            model: "claude-3-5-sonnet-20240620", // Updated to newer model
            max_tokens: 25000, // MUCH HIGHER for multi-day plans
            temperature: 0.3,
            messages: [{ role: "user", content: prompt }]
        })
    });

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
    } else if (typeof anthropicData?.content === 'string') {
      lessonPlan = anthropicData.content;
    }

    // Clean up any code fences
    lessonPlan = lessonPlan.replace(/```(?:markdown)?\s*|```/gi, '').trim();

    // Check if we got a reasonable amount of content
    if (!lessonPlan || lessonPlan.length < 2000) {
      throw new Error('Generated content too short - likely incomplete generation');
    }

    // Count days to verify complete generation
    const dayMatches = lessonPlan.match(/DAY\s+(\d+):/g) || [];
    console.log(`Generated ${dayMatches.length} days out of ${numberOfDays} requested`);

    // --- 6. Update Usage Count ---
    await userRef.update({
      usageCount: admin.firestore.FieldValue.increment(1)
    });
    
    const newUsageCount = usageCount + 1;

    // --- 7. Send Response to Frontend ---
    res.status(200).json({ 
        lessonPlan,
        usageInfo: {
            count: newUsageCount,
            limit: MONTHLY_LIMIT
        },
        metadata: {
            daysGenerated: dayMatches.length,
            daysRequested: parseInt(numberOfDays),
            contentLength: lessonPlan.length
        }
    });

  } catch (error) {
    console.error('Error in generatePlan function:', error);
    res.status(500).json({ 
      error: error.message || 'An internal server error occurred.',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
