
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { StructuredContent } from '../types';

/**
 * Generates a valid .docx Blob from structured content.
 * Uses Packer.toBlob which is the most reliable method for browser environments.
 */
export const generateDocx = async (content: StructuredContent): Promise<Blob> => {
  // Defensive check for content structure
  const sections = content?.sections || [];
  const processedSections = sections.length > 0 
    ? sections 
    : [{ type: 'paragraph' as const, text: 'No content extracted.' }];

  const doc = new Document({
    creator: "SmartPDF AI",
    title: "Converted Document",
    description: "PDF to Word conversion via Gemini AI",
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: processedSections.flatMap((section) => {
          try {
            const font = section.fontFamily || "Calibri";
            // docx uses half-points for size. If Gemini says 12pt, we need 24 half-points.
            const size = section.fontSize ? section.fontSize * 2 : 24;

            // Handle Headings
            if (section.type === 'heading') {
              let headingLevel = HeadingLevel.HEADING_1;
              if (section.level === 2) headingLevel = HeadingLevel.HEADING_2;
              if (section.level === 3) headingLevel = HeadingLevel.HEADING_3;
              
              return [new Paragraph({
                heading: headingLevel,
                spacing: { before: 240, after: 120 },
                children: [new TextRun({ 
                  text: section.text || '', 
                  bold: true,
                  font: font,
                  size: size
                })],
              })];
            }

            // Handle Lists
            if (section.type === 'list' && Array.isArray(section.items)) {
              return section.items.map(item => new Paragraph({
                children: [
                  new TextRun({
                    text: item || '',
                    font: font,
                    size: size
                  })
                ],
                bullet: { level: 0 },
                spacing: { after: 120 },
              }));
            }

            // Handle Paragraphs (Default)
            return [new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 200, line: 360 }, 
              children: [
                new TextRun({
                  text: section.text || '',
                  size: size,
                  font: font,
                }),
              ],
            })];
          } catch (e) {
            console.warn("Skipping invalid section during docx generation:", section, e);
            return [];
          }
        }),
      },
    ],
  });

  try {
    const blob = await Packer.toBlob(doc);
    return new Blob([blob], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
  } catch (error) {
    console.error("Docx Packaging Error:", error);
    throw new Error("Failed to package the Word document structure.");
  }
};
