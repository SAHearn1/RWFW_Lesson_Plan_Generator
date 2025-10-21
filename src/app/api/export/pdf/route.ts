// File: src/app/api/export/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Wrap plain text to a given width using a pdf-lib font
function wrapText(text: string, maxWidth: number, font: any, size: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const w of words) {
    const candidate = current ? current + ' ' + w : w;
    const width = font.widthOfTextAtSize(candidate, size);
    if (width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      // Hard-wrap extra long single words
      if (font.widthOfTextAtSize(w, size) > maxWidth) {
        let chunk = '';
        for (const ch of w) {
          const tryChunk = chunk + ch;
          if (font.widthOfTextAtSize(tryChunk, size) > maxWidth) {
            if (chunk) lines.push(chunk);
            chunk = ch;
          } else {
            chunk = tryChunk;
          }
        }
        current = chunk;
      } else {
        current = w;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

function sanitizeFilename(name: string, ext = 'pdf') {
  const base = (name || 'lesson-plan').replace(/[^a-zA-Z0-9-_]+/g, '_');
  return `${base}.${ext}`;
}

const streamFromBytes = (bytes: Uint8Array) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });

// Minimal Markdown-ish → PDF renderer (headings, bullets, numbered lists, paragraphs)
async function buildPdfFromMarkdown(markdown: string, docTitle = 'Lesson Plan'): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(docTitle);

  let page = pdfDoc.addPage([612, 792]); // US Letter
  const { width, height } = page.getSize();
  const margin = 54; // 0.75"
  const maxWidth = width - margin * 2;

  const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  let y = height - margin;

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');

  const drawLine = (txt: string, font: any, size: number, color = rgb(0, 0, 0)) => {
    const wrapped = wrapText(txt, maxWidth, font, size);
    for (const w of wrapped) {
      if (y < margin + size + 6) {
        page = pdfDoc.addPage([612, 792]);
        y = height - margin;
      }
      page.drawText(w, { x: margin, y, size, font, color });
      y -= size + 6;
    }
    y -= 2; // extra spacing after block
  };

  for (let raw of lines) {
    let line = raw;

    // Skip empty lines with a small spacer
    if (!line.trim()) {
      y -= 6;
      if (y < margin + 12) {
        page = pdfDoc.addPage([612, 792]);
        y = height - margin;
      }
      continue;
    }

    // Headings & lists
    if (line.startsWith('# ')) {
      drawLine(line.slice(2), fontBold, 20);
      continue;
    }
    if (line.startsWith('## ')) {
      drawLine(line.slice(3), fontBold, 16);
      continue;
    }
    if (line.startsWith('### ')) {
      drawLine(line.slice(4), fontBold, 14);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      drawLine('• ' + line.replace(/^\s*[-*]\s+/, ''), fontRegular, 12);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      drawLine(line, fontRegular, 12); // keep numbering text as-is
      continue;
    }

    // Default paragraph
    drawLine(line, fontRegular, 12);
  }

  return await pdfDoc.save();
}

export async function POST(req: NextRequest) {
  // Accept either { markdown, title } OR { content, filename }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new NextResponse('Invalid JSON body', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const markdown: string =
    typeof body?.content === 'string'
      ? body.content
      : typeof body?.markdown === 'string'
      ? body.markdown
      : '';

  if (!markdown.trim()) {
    return new NextResponse('Markdown content is required', { status: 400 });
  }

  const title: string =
    typeof body?.title === 'string'
      ? body.title
      : typeof body?.filename === 'string'
      ? body.filename.replace(/\.pdf$/i, '')
      : 'Lesson Plan';

  const filename = sanitizeFilename(title, 'pdf');

  try {
    // Try your existing robust builder first (if present)
    try {
      const mod = await import('@/lib/document-builder').catch(() => null as any);
      if (mod?.createPdf) {
        const pdfBytes: Uint8Array = await mod.createPdf(markdown, title);
        return new NextResponse(streamFromBytes(pdfBytes), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-store',
          },
        });
      }
    } catch (_) {
      // Ignore builder import errors and fall back to local renderer
    }

    // Fallback: local renderer with pdf-lib
    const pdfBytes = await buildPdfFromMarkdown(markdown, title);
    return new NextResponse(streamFromBytes(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return new NextResponse('Failed to generate PDF', { status: 500 });
  }
}
