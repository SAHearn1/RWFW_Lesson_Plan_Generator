// src/app/api/createAssets/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = ['iad1'];
export const maxDuration = 30;

// ----- DO NOT REMOVE -----
// Unique fingerprint so Vercel won't dedupe this function with other routes
(globalThis as any).__RWFW_FUNC_FINGERPRINT__ = 'api/createAssets@2025-08-12-v1';

const ROUTE_ID = 'createAssets-v1';

export async function POST(req: NextRequest) {
  // For now, return a minimal manifest. Your UI can call this to list “Appendix A” assets.
  // When you wire up image/doc generation, expand this response.
  const body = (await req.json().catch(() => ({}))) as {
    topic?: string;
    subject?: string;
    gradeLevel?: string;
  };

  const subject = body.subject ?? 'ELA';
  const gradeLevel = body.gradeLevel ?? '10';
  const topic = body.topic ?? 'Citing Textual Evidence to Support a Claim';

  const manifest = {
    namingConvention:
      '{LessonCode}_{GradeLevel}{SubjectAbbreviation}_{DescriptiveTitle}.{filetype}',
    assets: [
      {
        fileName: `Regulation_Rituals_${gradeLevel}${subject}.pdf`,
        type: 'pdf' as const,
        description: 'Quick reference used in Opening and Closing.',
        altText: 'Guidebook cover with leaf motif',
        linkPlaceholder: '[Insert link to Regulation_Rituals.pdf]',
        figure: 'Figure A1',
      },
      {
        fileName: `STEAM_Framework_Diagram.png`,
        type: 'image' as const,
        description: 'Visual for evaluating evidence quality.',
        altText: 'Five-part STEAM diagram',
        linkPlaceholder: '[Insert link to STEAM_Framework_Diagram.png]',
        figure: 'Figure A2',
      },
    ],
    meta: { subject, gradeLevel, topic },
  };

  return NextResponse.json({ ok: true, routeId: ROUTE_ID, manifest });
}

// Optional health check
export async function GET() {
  return NextResponse.json({ ok: true, routeId: ROUTE_ID, status: 'ready' });
}

