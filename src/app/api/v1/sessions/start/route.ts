// File: src/app/api/v1/sessions/start/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const StartSessionSchema = z.object({
  lesson_id: z.string().min(1, 'Lesson ID is required'),
  student_id: z.string().optional(),
  class_id: z.string().optional(),
});

async function verifyFirebaseToken(authHeader: string | null): Promise<{ uid: string; email?: string } | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  if (token.length > 20) {
    return { uid: `firebase_user_${Date.now()}`, email: 'user@example.com' };
  }
  return null;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  
  const user = await verifyFirebaseToken(authHeader);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized. Valid Firebase token required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = StartSessionSchema.parse(body);

    // TODO: Fetch lesson from database
    // const lesson = await prisma.lessonPlan.findUnique({ where: { id: validated.lesson_id } });

    // Mock lesson data for now
    const session_id = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const unity_manifest = {
      session_id,
      lesson_id: validated.lesson_id,
      scene_sequence: [
        {
          scene_id: "breathing_grove_v3",
          unity_scene_name: "BreathingGrove",
          duration_seconds: 600,
          npc_guides: [{ character: "elder_anya" }],
          completion_criteria: {
            type: "time_based",
            minimum_seconds: 300
          }
        },
        {
          scene_id: "ecosystem_forest",
          unity_scene_name: "EcosystemForest",
          duration_seconds: 1200,
          npc_guides: [{ character: "guide_oak" }],
          completion_criteria: {
            type: "interaction_based",
            required_interactions: 5
          }
        }
      ],
      wellness_checkpoints: [
        {
          trigger_at_phase: 1,
          check_in_type: "PRE",
          prompt: "How are you feeling as we begin?"
        },
        {
          trigger_at_phase: 3,
          check_in_type: "MID",
          prompt: "Check in with your energy. How are you doing?"
        },
        {
          trigger_at_phase: 6,
          check_in_type: "POST",
          prompt: "Reflect on your experience. How do you feel now?"
        }
      ],
      total_phases: 6,
      estimated_duration_minutes: 90
    };

    // TODO: Create session in database
    // await prisma.session.create({
    //   data: {
    //     id: session_id,
    //     lesson_id: validated.lesson_id,
    //     student_id: validated.student_id,
    //     class_id: validated.class_id,
    //     user_id: user.uid,
    //     started_at: new Date(),
    //     status: 'active'
    //   }
    // });

    return NextResponse.json({
      session_id,
      unity_manifest,
      started_at: new Date().toISOString(),
      status: 'active'
    }, { status: 200 });

  } catch (error) {
    console.error('[SESSION_START_ERROR]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to start session.' }, { status: 500 });
  }
}