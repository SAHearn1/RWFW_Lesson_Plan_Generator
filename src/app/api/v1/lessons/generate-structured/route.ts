// File: src/app/api/v1/lessons/generate-structured/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Vercel configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Request validation schema
const GenerateStructuredLessonSchema = z.object({
  grade_band: z.string().min(1, 'Grade band is required'),
  subjects: z.array(z.string()).min(1, 'At least one subject is required'),
  standards: z.array(z.string()).optional().default([]),
  rwf_theme: z.string().optional(),
  duration_days: z.number().optional().default(1),
  unit_title: z.string().optional(),
  additional_focus: z.string().optional(),
});

// Firebase token verification (placeholder)
async function verifyFirebaseToken(authHeader: string | null): Promise<{ uid: string; email?: string } | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  if (token.length > 20) {
    return { uid: `firebase_user_${Date.now()}`, email: 'user@example.com' };
  }
  return null;
}

// Build structured prompt for RWF lesson generation
function buildStructuredPrompt(request: any): string {
  const { grade_band, subjects, standards, rwf_theme, duration_days, unit_title, additional_focus } = request;

  let prompt = `Generate a comprehensive RWF lesson plan as valid JSON:

Grade Band: ${grade_band}
Subjects: ${subjects.join(', ')}
Standards: ${standards.join(', ') || 'Relevant standards'}
RWF Theme: ${rwf_theme || 'General'}
Duration: ${duration_days} day(s) (90-minute blocks)
${unit_title ? `Unit Title: ${unit_title}` : ''}
${additional_focus ? `Additional Focus: ${additional_focus}` : ''}

Return ONLY valid JSON with this structure:
{
  "metadata": {
    "title": "Compelling lesson title",
    "grade_band": "${grade_band}",
    "subjects": ${JSON.stringify(subjects)},
    "standards": [{"framework": "NGSS", "code": "5-LS2-1"}],
    "rwf_theme": "${rwf_theme || 'Interdependence'}",
    "duration_minutes": 90
  },
  "phases": [
    {
      "phase_number": 1,
      "phase_name": "Grounding & Arrival",
      "activities": [
        {
          "activity_id": "act_1_1",
          "type": "wellness_ritual",
          "title": "Root & Rise Breathing",
          "description": "Detailed activity description",
          "teacher_notes": "Trauma-informed facilitation strategies",
          "student_notes": "Empowering second-person guidance",
          "duration_minutes": 10,
          "delivery_modes": {
            "vr": {
              "scene_id": "breathing_grove_v3",
              "npc_guide": "elder_anya",
              "duration_seconds": 600
            },
            "classroom": {
              "materials": ["mat", "timer"],
              "setup": "Circle formation"
            }
          }
        }
      ]
    }
  ],
  "scene_sequence": [
    {
      "scene_id": "breathing_grove_v3",
      "unity_scene_name": "BreathingGrove",
      "duration_seconds": 600,
      "npc_guides": [{"character": "elder_anya"}],
      "completion_criteria": {
        "type": "time_based",
        "minimum_seconds": 300
      }
    }
  ],
  "wellness_checkpoints": [
    {
      "trigger_at_phase": 1,
      "check_in_type": "PRE",
      "prompt": "How are you feeling?"
    }
  ],
  "objectives": ["Clear measurable objective 1", "objective 2"],
  "materials": ["material 1", "material 2"],
  "assessment": {
    "formative": ["assessment 1"],
    "summative": ["assessment 2"]
  }
}`;

  return prompt;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  
  const user = await verifyFirebaseToken(authHeader);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized. Valid Firebase token required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = GenerateStructuredLessonSchema.parse(body);

    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return NextResponse.json({ error: 'Anthropic API key not configured.' }, { status: 500 });
    }

    const prompt = buildStructuredPrompt(validated);

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      }),
    });

    if (!anthropicResponse.ok) {
      console.error('[ANTHROPIC_ERROR]', await anthropicResponse.text());
      return NextResponse.json({ error: 'Failed to generate lesson plan.' }, { status: anthropicResponse.status });
    }

    const anthropicData: any = await anthropicResponse.json();
    const rawText = anthropicData.content?.[0]?.text || '';

    let lessonData: any;
    try {
      lessonData = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ error: 'Failed to parse lesson plan response.' }, { status: 500 });
    }

    const lesson_id = `lesson_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Extract VR scenes for Unity manifest
    const vrScenes: string[] = [];
    lessonData.phases?.forEach((phase: any) => {
      phase.activities?.forEach((activity: any) => {
        if (activity.delivery_modes?.vr?.scene_id) {
          vrScenes.push(activity.delivery_modes.vr.scene_id);
        }
      });
    });

    const response = {
      lesson_id,
      metadata: lessonData.metadata || {},
      phases: lessonData.phases || [],
      scene_sequence: lessonData.scene_sequence || [],
      wellness_checkpoints: lessonData.wellness_checkpoints || [],
      objectives: lessonData.objectives || [],
      materials: lessonData.materials || [],
      assessment: lessonData.assessment || { formative: [], summative: [] },
      unity_manifest: {
        phases: lessonData.phases?.length || 0,
        total_activities: lessonData.phases?.reduce((sum: number, phase: any) => 
          sum + (phase.activities?.length || 0), 0) || 0,
        vr_scenes: [...new Set(vrScenes)],
        scene_sequence: lessonData.scene_sequence || []
      },
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('[API_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}