// src/app/api/export/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFFont,
} from 'pdf-lib';

export const runtime = 'nodejs';

// Basic types for the request body
type ExportMeta = {
  title?: string;
  gradeLevel?: string;
  subjects?: string[]; // e.g., ["ELA","Science"]
};

type ExportRequest = {
  markdown: string;
  meta?: ExportMeta;
};

// --- Markdown -> simple block model (headings, bullets, paragraphs) ---
type BlockType = 'h1' | 'h2' | 'h3' | 'bullet' | 'paragraph' | 'blank';

type Block = {
  type: BlockType;
  text: string;
};

// Minimal parser: recognizes #/##/### headings, bullets (-/*), and paragraphs.
function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];

  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.trim() === '') {
      blocks.push({ type: 'blank', text: '' });
      continue;
    }

    if (/^###\s+/.test(line)) {
      blocks.push({ type: 'h3', text: line.replace(/^###\s+/, '').trim() });
      continue;
    }
    if (/^##\s+/.test(line)) {
      blocks.push({ type: 'h2', text: line.replace(/^##\s+/, '').trim() });
      continue;
    }
    if (/^#\s+/.test(line)) {
      blocks.push({ type: 'h1', text: line.replace(/^#\s+/, '').trim() });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      blocks.push({ type: 'bullet', text: line.replace(/^[-*]\s+/, '').trim() });
      continue;
    }

    blocks.push({ type: 'paragraph', text: line.trim() });
  }

  return blocks;
}

// Strip some common markdown inline markers for clean text rendering
function stripInlineMd(text: string): string {
  return text
    // bold/italic/code markers
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    // links: [label](url) -> label (url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
}

// Word-wrap for pdf-lib using font metrics
function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(test, fontSize);
    if (width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      // very long single word fallback
      if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
        let chunk = '';
        for (const ch of word) {
          const tryChunk = chunk + ch;
          if (font.widthOfTextAtSize(tryChunk, fontSize) > maxWidth) {
            if (chunk) lines.push(chunk);
            chunk = ch;
          } else {
            chunk = tryChunk;
          }
        }
        if (chunk) {
          current = chunk;
        } else {
          current = '';
        }
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ExportRequest | null;
    const markdown = body?.markdown ?? '';
    const meta = body?.meta ?? {};

    if (!markdown || typeof markdown !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "markdown" in body' },
        { status: 400 }
      );
    }

    // Parse markdown into simple blocks
    const blocks = parseMarkdown(markdown).map((b) => ({
      ...b,
      text: stripInlineMd(b.text),
    }));

    // Create PDF
    const pdf = await PDFDocument.create();
    const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    // Page & layout
    const pageWidth = 612; // Letter 8.5in * 72
    const pageHeight = 792; // Letter 11in * 72
    const margin = 56; // 0.78in
    const contentWidth = pageWidth - margin * 2;

    // Brand/meta
    const title =
      meta.title?.trim() ||
      'Root Work Framework Lesson Plan';
    const subtitleParts: string[] = [];
    if (meta.gradeLevel) subtitleParts.push(meta.gradeLevel);
    if (meta.subjects && meta.subjects.length > 0)
      subtitleParts.push(meta.subjects.join(', '));
    const subtitle = subtitleParts.join(' • ');

    // Typography
    const sizeBody = 11;
    const sizeH1 = 18;
    const sizeH2 = 15;
    const sizeH3 = 13;
    const sizeBrand = 9;
    const lineGap = 4; // extra gap between lines

    // Draw helpers
    let page = pdf.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const newPage = () => {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
      drawHeader();
      y -= 14;
    };

    const drawHeader = () => {
      // Brand line
      const brand = 'Root Work Framework • S.T.E.A.M. Powered, Trauma Informed, Project Based';
      page.drawText(brand, {
        x: margin,
        y: y,
        size: sizeBrand,
        font: fontRegular,
        color: rgb(0.12, 0.35, 0.28), // deep green
      });
      // Title on right
      const titleWidth = fontBold.widthOfTextAtSize(title, sizeBrand);
      page.drawText(title, {
        x: pageWidth - margin - titleWidth,
        y: y,
        size: sizeBrand,
        font: fontBold,
        color: rgb(0.12, 0.12, 0.12),
      });
    };

    const drawFooter = (pageIndex: number, total: number) => {
      const footer = `Page ${pageIndex + 1} of ${total}`;
      const footerWidth = fontRegular.widthOfTextAtSize(footer, 9);
      page.drawText(footer, {
        x: (pageWidth - footerWidth) / 2,
        y: margin / 2,
        size: 9,
        font: fontRegular,
        color: rgb(0.4, 0.4, 0.4),
      });
    };

    const space = (px: number) => {
      y -= px;
      if (y < margin + 40) {
        // leave room for footer
        drawFooter(pdf.getPageCount() - 1, 0); // temporary, fixed later
        newPage();
      }
    };

    const writeWrapped = (
      text: string,
      options: { font: PDFFont; size: number; color?: { r: number; g: number; b: number }; indent?: number }
    ) => {
      const indent = options.indent ?? 0;
      const maxWidth = contentWidth - indent;
      const lines = wrapText(text, options.font, options.size, maxWidth);
      for (const line of lines) {
        const lineHeight = options.size + lineGap;
        if (y - lineHeight < margin + 40) {
          drawFooter(pdf.getPageCount() - 1, 0);
          newPage();
        }
        page.drawText(line, {
          x: margin + indent,
          y: y - options.size,
          size: options.size,
          font: options.font,
          color: options.color ?? rgb(0.12, 0.12, 0.12),
        });
        y -= lineHeight;
      }
    };

    // First page header
    drawHeader();
    y -= 18;

    // Title
    writeWrapped(title, { font: fontBold, size: 20 });
    if (subtitle) {
      space(2);
      writeWrapped(subtitle, { font: fontRegular, size: 12, color: rgb(0.25, 0.25, 0.25) });
    }
    space(10);

    // Body
    for (const block of blocks) {
      // pagination safety margin before headings
      if (['h1', 'h2', 'h3'].includes(block.type) && y < margin + 80) {
        drawFooter(pdf.getPageCount() - 1, 0);
        newPage();
      }

      switch (block.type) {
        case 'h1':
          writeWrapped(block.text, { font: fontBold, size: sizeH1 });
          space(6);
          break;
        case 'h2':
          writeWrapped(block.text, { font: fontBold, size: sizeH2 });
          space(4);
          break;
        case 'h3':
          writeWrapped(block.text, { font: fontBold, size: sizeH3 });
          space(2);
          break;
        case 'bullet': {
          const bullet = '• ';
          const bulletWidth = fontRegular.widthOfTextAtSize(bullet, sizeBody);
          // draw bullet
          if (y - (sizeBody + lineGap) < margin + 40) {
            drawFooter(pdf.getPageCount() - 1, 0);
            newPage();
          }
          page.drawText(bullet, {
            x: margin,
            y: y - sizeBody,
            size: sizeBody,
            font: fontRegular,
            color: rgb(0.12, 0.12, 0.12),
          });
          // draw wrapped bullet text with indent
          writeWrapped(block.text, {
            font: fontRegular,
            size: sizeBody,
            indent: bulletWidth + 6,
          });
          break;
        }
        case 'paragraph':
          writeWrapped(block.text, { font: fontRegular, size: sizeBody });
          break;
        case 'blank':
          space(8);
          break;
        default:
          writeWrapped(block.text, { font: fontRegular, size: sizeBody });
      }
    }

    // Add footer page numbers now that total count is final
    const total = pdf.getPageCount();
    for (let i = 0; i < total; i++) {
      const p = pdf.getPage(i);
      // temporarily set page ref to draw footer with correct page object
      page = p;
      drawFooter(i, total);
    }

    const bytes = await pdf.save();
    const base64 = Buffer.from(bytes).toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64}`;

    return NextResponse.json(
      {
        url: dataUrl,
        filename:
          (meta.title ? meta.title.replace(/\s+/g, '_') : 'Rootwork_Lesson') + '.pdf',
      },
      { status: 200 }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
