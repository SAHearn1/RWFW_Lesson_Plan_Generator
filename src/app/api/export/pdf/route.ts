// File: src/app/api/export/pdf/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createPdf } from '@/lib/document-builder';

export async function POST(req: NextRequest) {
  try {
    const { markdown, title } = await req.json();
    if (!markdown) {
      return new NextResponse('Markdown content is required', { status: 400 });
    }

    // Use the robust document builder to generate the PDF
    const pdfBytes = await createPdf(markdown, title || 'Lesson Plan');

    // Return the generated PDF as a file download
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title || 'lesson-plan'}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return new NextResponse('Failed to generate PDF', { status: 500 });
  }
}
