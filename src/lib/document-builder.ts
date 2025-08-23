// File: src/lib/document-builder.ts (Corrected)

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// --- Define Brand Colors (Corrected for pdf-lib) ---
const brandColors = {
  evergreen: { hex: '082A19', pdf: rgb(8 / 255, 42 / 255, 25 / 255) },
  leaf: { hex: '3B523A', pdf: rgb(59 / 255, 82 / 255, 58 / 255) },
  charcoal: { hex: '2B2B2B', pdf: rgb(43 / 255, 43 / 255, 43 / 255) },
  white: { hex: 'FFFFFF', pdf: rgb(1, 1, 1) },
  deepCanopy: { hex: '001C10' },
};

// --- PDF Generation Logic (Corrected) ---
export const createPdf = async (markdown: string, title: string) => {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const margin = 50;
  let y = height - 40;

  const drawHeader = (currentPage: any, pageNum: number) => {
    currentPage.drawRectangle({
      x: 0, y: height - 35, width, height: 35, color: brandColors.evergreen.pdf, // Use .pdf property
    });
    currentPage.drawText(`${title} | Page ${pageNum}`, { x: margin, y: height - 25, font: boldFont, size: 12, color: brandColors.white.pdf }); // Use .pdf property
  };

  drawHeader(page, 1);
  y -= 30;

  const lines = markdown.split('\n');

  for (const line of lines) {
    if (y < margin) {
      page = pdfDoc.addPage();
      drawHeader(page, pdfDoc.getPageCount());
      y = height - 70;
    }

    let currentFont = font;
    let fontSize = 11;
    let color = brandColors.charcoal.pdf; // Use .pdf property
    let text = line.trim();

    if (line.startsWith('# ')) {
      currentFont = boldFont; fontSize = 18; color = brandColors.evergreen.pdf; text = line.substring(2); y -= 10; // Use .pdf property
    } else if (line.startsWith('## ')) {
      currentFont = boldFont; fontSize = 16; color = brandColors.evergreen.pdf; text = line.substring(3); y -= 8; // Use .pdf property
    } else if (line.startsWith('### ')) {
      currentFont = boldFont; fontSize = 14; color = brandColors.leaf.pdf; text = line.substring(4); y -= 6; // Use .pdf property
    } else if (line.startsWith('#### ')) {
      currentFont = boldFont; fontSize = 12; color = brandColors.leaf.pdf; text = line.substring(5); y -= 4; // Use .pdf property
    }

    // Simple word wrapping
    const words = text.split(' ');
    let currentLine = '';
    for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        if (font.widthOfTextAtSize(testLine, fontSize) > width - margin * 2) {
            page.drawText(currentLine, { x: margin, y, font: currentFont, size: fontSize, color });
            y -= (fontSize * 1.2);
            currentLine = word;
            if (y < margin) {
                page = pdfDoc.addPage();
                drawHeader(page, pdfDoc.getPageCount());
                y = height - 70;
            }
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) {
        page.drawText(currentLine, { x: margin, y, font: currentFont, size: fontSize, color });
        y -= (fontSize * 1.2);
    }
  }

  return await pdfDoc.save();
};


// --- DOCX Generation Logic (Unchanged) ---
export const createDocx = async (markdown: string, title: string) => {
    const lines = markdown.split('\n');
    const paragraphs: Paragraph[] = [];

    lines.forEach(line => {
        if (line.startsWith('# ')) {
            paragraphs.push(new Paragraph({ text: line.substring(2), heading: HeadingLevel.HEADING_1 }));
        } else if (line.startsWith('## ')) {
            paragraphs.push(new Paragraph({ text: line.substring(3), heading: HeadingLevel.HEADING_2 }));
        } else if (line.startsWith('### ')) {
            paragraphs.push(new Paragraph({ text: line.substring(4), heading: HeadingLevel.HEADING_3 }));
        } else if (line.trim() === '') {
            paragraphs.push(new Paragraph({ text: '' }));
        } else {
            const children: TextRun[] = [];
            if (line.includes('[Teacher Note:')) {
                children.push(new TextRun({ text: line, color: brandColors.leaf.hex, italics: true }));
            } else if (line.includes('[Student Note:')) {
                children.push(new TextRun({ text: line, color: "4F7DA5", bold: true }));
            } else {
                children.push(new TextRun({ text: line, color: brandColors.charcoal.hex }));
            }
            paragraphs.push(new Paragraph({ children }));
        }
    });

    const doc = new Document({
        styles: {
            paragraphStyles: [
                { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", run: { size: 32, bold: true, color: brandColors.evergreen.hex, font: "Merriweather" } },
                { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", run: { size: 28, bold: true, color: brandColors.leaf.hex, font: "Merriweather" } },
                { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", run: { size: 24, bold: true, color: brandColors.charcoal.hex, font: "Inter" } },
            ]
        },
        sections: [{
            headers: {
                default: new Paragraph({
                    children: [new TextRun({ text: title, color: brandColors.evergreen.hex })],
                    alignment: AlignmentType.CENTER,
                    border: { bottom: { color: "auto", space: 1, style: BorderStyle.SINGLE, size: 6 } }
                })
            },
            children: paragraphs
        }],
    });

    return await Packer.toBuffer(doc);
};
