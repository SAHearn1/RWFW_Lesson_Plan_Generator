// File: src/lib/document-builder.ts

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  ShadingType,
  convertInchesToTwip,
} from 'docx';
import { PDFDocument, rgb, StandardFonts, cmyk } from 'pdf-lib';

// --- Define Brand Colors (for both PDF and DOCX) ---
const brandColors = {
  evergreen: { hex: '082A19', rgb: { r: 8 / 255, g: 42 / 255, b: 25 / 255 } },
  leaf: { hex: '3B523A', rgb: { r: 59 / 255, g: 82 / 255, b: 58 / 255 } },
  charcoal: { hex: '2B2B2B', rgb: { r: 43 / 255, g: 43 / 255, b: 43 / 255 } },
  goldLeaf: { hex: 'D4C862', rgb: { r: 212 / 255, g: 200 / 255, b: 98 / 255 } },
  white: { hex: 'FFFFFF', rgb: { r: 1, g: 1, b: 1 } },
};

// --- Shared Markdown Parser ---
const parseMarkdown = (markdown: string) => {
  const lines = markdown.split('\n');
  const structuredContent: { type: string; text: string; level?: number }[] = [];
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) structuredContent.push({ type: 'heading', text: trimmed.substring(2), level: 1 });
    else if (trimmed.startsWith('## ')) structuredContent.push({ type: 'heading', text: trimmed.substring(3), level: 2 });
    else if (trimmed.startsWith('### ')) structuredContent.push({ type: 'heading', text: trimmed.substring(4), level: 3 });
    else if (trimmed !== '') structuredContent.push({ type: 'paragraph', text: trimmed });
  });
  return structuredContent;
};

// --- PDF Generation Logic (Branded) ---
export const createPdf = async (markdown: string, title: string) => {
  const content = parseMarkdown(markdown);
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const margin = 50;
  let y = height - margin;

  // Header Band
  page.drawRectangle({
    x: 0, y: height - 35, width, height: 35, color: brandColors.evergreen.rgb,
  });
  page.drawText(title, { x: margin, y: height - 25, font: boldFont, size: 14, color: brandColors.white.rgb });

  y -= 50;

  for (const item of content) {
    if (y < margin + 20) {
      page = pdfDoc.addPage();
      y = height - margin;
    }
    if (item.type === 'heading') {
      const size = item.level === 1 ? 18 : item.level === 2 ? 16 : 14;
      const color = item.level === 1 ? brandColors.evergreen.rgb : brandColors.leaf.rgb;
      y -= 10;
      page.drawText(item.text, { x: margin, y, font: boldFont, size, color });
      y -= size * 1.5;
    } else if (item.type === 'paragraph') {
      const size = 11;
      const lineHeight = 14;
      const lines = item.text.split('\n');
      for (const line of lines) {
        page.drawText(line, { x: margin, y, font, size, color: brandColors.charcoal.rgb, lineHeight });
        y -= lineHeight;
        if (y < margin + 20) {
            page = pdfDoc.addPage();
            y = height - margin;
        }
      }
      y -= 8; // Paragraph spacing
    }
  }

  return await pdfDoc.save();
};

// --- DOCX Generation Logic (Branded) ---
export const createDocx = async (markdown: string, title: string) => {
    const content = parseMarkdown(markdown);

    const paragraphs: Paragraph[] = [
        new Paragraph({ 
            text: title, 
            heading: HeadingLevel.TITLE, 
            alignment: AlignmentType.CENTER,
        }),
    ];

    content.forEach(item => {
        if (item.type === 'heading') {
            const level = item.level === 1 ? HeadingLevel.HEADING_1 : item.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
            paragraphs.push(new Paragraph({ 
                children: [new TextRun({ text: item.text, color: brandColors.evergreen.hex, bold: true })],
                heading: level,
            }));
        } else if (item.type === 'paragraph') {
            const children: TextRun[] = [];
            if (item.text.includes('[Teacher Note:')) {
                children.push(new TextRun({ text: item.text, color: brandColors.leaf.hex, italics: true }));
            } else if (item.text.includes('[Student Note:')) {
                children.push(new TextRun({ text: item.text, color: "4F7DA5", bold: true }));
            } else {
                children.push(new TextRun({ text: item.text, color: brandColors.charcoal.hex }));
            }
            paragraphs.push(new Paragraph({ children }));
        }
    });

    const doc = new Document({
        styles: {
            paragraphStyles: [
                { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", run: { size: 32, bold: true, color: brandColors.evergreen.hex, font: "Merriweather" } },
                { id: "Title", name: "Title", basedOn: "Normal", next: "Normal", run: { size: 48, bold: true, color: brandColors.evergreen.hex, font: "Merriweather" } },
            ]
        },
        sections: [{ children: paragraphs }],
    });

    return await Packer.toBuffer(doc);
};
