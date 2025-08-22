// File: src/lib/document-builder.ts

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// --- Shared Markdown Parser ---
// This function converts the markdown string into a structured array.
const parseMarkdown = (markdown: string) => {
  const lines = markdown.split('\n');
  const structuredContent: { type: string; text: string; level?: number }[] = [];

  lines.forEach(line => {
    if (line.startsWith('# ')) {
      structuredContent.push({ type: 'heading', text: line.substring(2), level: 1 });
    } else if (line.startsWith('## ')) {
      structuredContent.push({ type: 'heading', text: line.substring(3), level: 2 });
    } else if (line.startsWith('### ')) {
      structuredContent.push({ type: 'heading', text: line.substring(4), level: 3 });
    } else if (line.trim() !== '') {
      structuredContent.push({ type: 'paragraph', text: line });
    }
  });
  return structuredContent;
};

// --- PDF Generation Logic ---
export const createPdf = async (markdown: string, title: string) => {
  const content = parseMarkdown(markdown);
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const margin = 50;
  let y = height - margin;

  // Title
  page.drawText(title, { x: margin, y, font: boldFont, size: 24 });
  y -= 40;

  content.forEach(item => {
    if (y < margin) { // Add new page if content overflows
      y = height - margin;
      page.addPage();
    }
    if (item.type === 'heading') {
      const size = item.level === 1 ? 18 : item.level === 2 ? 16 : 14;
      page.drawText(item.text, { x: margin, y, font: boldFont, size });
      y -= size * 1.5;
    } else if (item.type === 'paragraph') {
      // Basic text wrapping
      const words = item.text.split(' ');
      let line = '';
      for (const word of words) {
        const testLine = line + word + ' ';
        const textWidth = font.widthOfTextAtSize(testLine, 12);
        if (textWidth > width - 2 * margin) {
          page.drawText(line, { x: margin, y, font, size: 12 });
          y -= 14;
          line = word + ' ';
        } else {
          line = testLine;
        }
      }
      page.drawText(line, { x: margin, y, font, size: 12 });
      y -= 14;
    }
  });

  return await pdfDoc.save();
};

// --- DOCX Generation Logic ---
export const createDocx = async (markdown: string, title: string) => {
    const content = parseMarkdown(markdown);

    const paragraphs: Paragraph[] = [
        new Paragraph({ text: title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
    ];

    content.forEach(item => {
        if (item.type === 'heading') {
            const level = item.level === 1 ? HeadingLevel.HEADING_1 : item.level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3;
            paragraphs.push(new Paragraph({ text: item.text, heading: level }));
        } else if (item.type === 'paragraph') {
            // Handle notes with color
            if (item.text.includes('[Teacher Note:')) {
                paragraphs.push(new Paragraph({ children: [new TextRun({ text: item.text, color: "3B523A" })]}));
            } else if (item.text.includes('[Student Note:')) {
                paragraphs.push(new Paragraph({ children: [new TextRun({ text: item.text, color: "4F7DA5" })]}));
            } else {
                paragraphs.push(new Paragraph(item.text));
            }
        }
    });

    const doc = new Document({
        sections: [{ children: paragraphs }],
    });

    return await Packer.toBuffer(doc);
};
