// src/app/api/export/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type RGB,
  type Color,
  type PDFFont,
} from 'pdf-lib';

export const runtime = 'nodejs';

// -------- Types (what the route accepts) ----------
type RGBInput = RGB | { r: number; g: number; b: number } | [number, number, number];

interface BrandOptions {
  org?: string;              // e.g., "Root Work Framework"
  primary?: RGBInput;        // preferred brand color
  secondary?: RGBInput;      // optional accent
}

interface ExportPdfPayload {
  markdown?: string;         // lesson plan markdown
  plainText?: string;        // if you already stripped it
  title?: string;            // doc title for header
  subtitle?: string;         // optional subheading line
  brand?: BrandOptions;      // branding options
}

// -------- Helpers ----------
const DEFAULT_TEXT_COLOR = rgb(0.12, 0.12, 0.12);
const DEFAULT_BRAND = rgb(0.07, 0.5, 0.37); // muted emerald
const LIGHT_GRAY = rgb(0.92, 0.94, 0.97);

function toColor(input?: RGBInput, fallback: Color = DEFAULT_TEXT_COLOR): Color {
  if (!input) return fallback;
  if (Array.isArray(input)) {
    const [r, g, b] = input;
    return rgb(r, g, b);
  }
  if ('type' in (input as any)) {
    // Already an RGB from pdf-lib
    return input as RGB;
  }
  const { r, g, b } = input as { r: number; g: number; b: number };
  return rgb(r, g, b);
}

/** very lightweight markdown->plain text (keeps list bullets and basic breaks) */
function markdownToPlain(md: string): string {
  return md
    // headings -> keep text
    .replace(/^#{1,6}\s*/gm, '')
    // bold/italic/code markers
    .replace(/(\*\*|\*|__|_|`|~~)/g, '')
    // links [text](url) -> text (url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    // images ![alt](src) -> alt (src)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1 ($2)')
    // list items
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\d+\.\s+/gm, (m) => m) // keep numbering as-is
    // collapse extra spaces
    .replace(/[ \t]+/g, ' ')
    // normalize newlines
    .replace(/\r\n/g, '\n')
    .trim();
}

function drawHeaderFooter(opts: {
  page: any;
  width: number;
  height: number;
  marginX: number;
  marginY: number;
  title: string;
  subtitle?: string;
  headerFont: PDFFont;
  captionFont: PDFFont;
  pageNumber: number;
  brandPrimary: Color;
}) {
  const {
    page,
    width,
    height,
    marginX,
    marginY,
    title,
    subtitle,
    headerFont,
    captionFont,
    pageNumber,
    brandPrimary,
  } = opts;

  // Top brand band
  const bandHeight = 34;
  page.drawRectangle({
    x: 0,
    y: height - bandHeight,
    width,
    height: bandHeight,
    color: brandPrimary,
  });

  // Title
  const titleSize = 12;
  page.drawText(title, {
    x: marginX,
    y: height - bandHeight + (bandHeight - titleSize) / 2,
    size: titleSize,
    font: headerFont,
    color: rgb(1, 1, 1),
  });

  // Subtitle (optional)
  if (subtitle) {
    const subSize = 9;
    const subY = height - bandHeight - 12;
    page.drawText(subtitle, {
      x: marginX,
      y: subY,
      size: subSize,
      font: captionFont,
      color: rgb(0.25, 0.25, 0.25),
    });
  }

  // Footer line
  page.drawLine({
    start: { x: marginX, y: marginY - 6 },
    end: { x: width - marginX, y: marginY - 6 },
    thickness: 0.5,
    color: rgb(0.8, 0.85, 0.9),
  });

  // Page number
  const pnSize = 9;
  const pnText = `Page ${pageNumber}`;
  const textWidth = captionFont.widthOfTextAtSize(pnText, pnSize);
  page.drawText(pnText, {
    x: width - marginX - textWidth,
    y: marginY - 18,
    size: pnSize,
    font: captionFont,
    color: rgb(0.4, 0.45, 0.5),
  });
}

function wrapTextByWidth(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  const spaceWidth = font.widthOfTextAtSize(' ', size);

  for (const word of words) {
    const w = font.widthOfTextAtSize(word, size);
    if (!current) {
      current = word;
      continue;
    }
    const currentWidth = font.widthOfTextAtSize(current, size);
    if (currentWidth + spaceWidth + w <= maxWidth) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawParagraph(opts: {
  page: any;
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  lineHeight: number;
  font: PDFFont;
  size: number;
  color?: Color;
}) {
  const { page, text, x, y, maxWidth, lineHeight, font, size, color } = opts;
  let cursorY = y;
  const lines = text.split('\n').flatMap((ln) => wrapTextByWidth(ln, font, size, maxWidth));
  for (const ln of lines) {
    if (cursorY - lineHeight < 60) break; // stop before the footer
    page.drawText(ln, {
      x,
      y: cursorY,
      size,
      font,
      color: color ?? DEFAULT_TEXT_COLOR,
    });
    cursorY -= lineHeight;
  }
  return cursorY;
}

// -------- Route ----------
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ExportPdfPayload | null;
    const contentRaw =
      (body?.plainText && typeof body.plainText === 'string' ? body.plainText : '') ||
      (body?.markdown && typeof body.markdown === 'string' ? markdownToPlain(body.markdown) : '');

    const title =
      typeof body?.title === 'string' && body.title.trim()
        ? body!.title.trim()
        : 'Root Work Framework — Lesson Plan';

    const subtitle =
      typeof body?.subtitle === 'string' && body.subtitle.trim()
        ? body!.subtitle.trim()
        : undefined;

    const brandPrimary = toColor(body?.brand?.primary, DEFAULT_BRAND);
    const brandOrg =
      (body?.brand?.org && typeof body.brand.org === 'string'
        ? body.brand.org.trim()
        : 'Root Work Framework') || 'Root Work Framework';

    // Build PDF
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([612, 792]); // Letter size points
    const width = page.getWidth();
    const height = page.getHeight();

    const marginX = 56;
    const marginY = 56;

    // Fonts
    const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    // Header & footer (page 1)
    drawHeaderFooter({
      page,
      width,
      height,
      marginX,
      marginY,
      title,
      subtitle,
      headerFont: fontBold,
      captionFont: fontRegular,
      pageNumber: 1,
      brandPrimary,
    });

    // Watermark-ish org label in the header band (right side)
    const orgSize = 9;
    const orgText = brandOrg;
    const orgWidth = fontRegular.widthOfTextAtSize(orgText, orgSize);
    page.drawText(orgText, {
      x: width - marginX - orgWidth,
      y: height - 24,
      size: orgSize,
      font: fontRegular,
      color: rgb(1, 1, 1),
    });

    // Body background box for readability
    page.drawRectangle({
      x: marginX - 8,
      y: marginY + 8,
      width: width - (marginX - 8) * 2,
      height: height - (marginY + 8) - (marginY + 30),
      color: LIGHT_GRAY,
      opacity: 0.3,
      borderOpacity: 0,
    });

    // Body text
    const startY = height - 100;
    const maxWidth = width - marginX * 2;
    let cursorY = startY;

    // Optional document heading inside body area (bigger)
    const bodyHeading = title;
    const bodyHeadingSize = 14;
    const headingLines = wrapTextByWidth(bodyHeading, fontBold, bodyHeadingSize, maxWidth);
    for (const ln of headingLines) {
      page.drawText(ln, {
        x: marginX,
        y: cursorY,
        size: bodyHeadingSize,
        font: fontBold,
        color: brandPrimary,
      });
      cursorY -= 20;
    }
    if (subtitle) {
      cursorY -= 4;
      const subSize = 11;
      page.drawText(subtitle, {
        x: marginX,
        y: cursorY,
        size: subSize,
        font: fontRegular,
        color: rgb(0.25, 0.25, 0.25),
      });
      cursorY -= 18;
    }

    // Content
    const textSize = 11;
    const lineHeight = 15;
    const paragraphs = contentRaw ? contentRaw.split(/\n{2,}/) : ['(no content)'];

    for (const para of paragraphs) {
      // Add new page if needed
      if (cursorY - lineHeight * 3 < marginY + 24) {
        const p = pdf.addPage([612, 792]);
        drawHeaderFooter({
          page: p,
          width,
          height,
          marginX,
          marginY,
          title,
          subtitle,
          headerFont: fontBold,
          captionFont: fontRegular,
          pageNumber: pdf.getPageCount(),
          brandPrimary,
        });
        // new page body box
        p.drawRectangle({
          x: marginX - 8,
          y: marginY + 8,
          width: width - (marginX - 8) * 2,
          height: height - (marginY + 8) - (marginY + 30),
          color: LIGHT_GRAY,
          opacity: 0.3,
          borderOpacity: 0,
        });
        // reset cursor on new page
        (cursorY as number) = height - 100;
        (page as any) = p;
      }

      cursorY = drawParagraph({
        page,
        text: para,
        x: marginX,
        y: cursorY,
        maxWidth,
        lineHeight,
        font: fontRegular,
        size: textSize,
        color: DEFAULT_TEXT_COLOR,
      }) - 10; // gap between paragraphs
    }

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="rwf-lesson-plan.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'PDF export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
