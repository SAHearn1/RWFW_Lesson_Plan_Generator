// File: src/app/api/export/docx/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createDocx } from '@/lib/document-builder';

export async function POST(req: NextRequest) {
  try {
    const { markdown, title } = await req.json();
    if (!markdown) {
      return new NextResponse('Markdown content is required', { status: 400 });
    }

    // Use the robust document builder to generate the DOCX buffer
    const buffer = await createDocx(markdown, title || 'Lesson Plan');

    // Return the generated buffer as a file download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${title || 'lesson-plan'}.docx"`,
      },
    });
  } catch (error) {
    console.error('DOCX Generation Error:', error);
    return new NextResponse('Failed to generate DOCX', { status: 500 });
  }
}
