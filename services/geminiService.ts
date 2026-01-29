
import { GoogleGenAI, Type } from "@google/genai";
import { StructuredContent, ProgressCallback } from "../types";
import { PDFDocument } from "pdf-lib";

const CHUNK_SIZE = 5; 

/**
 * Parses a string like "1, 3-5, 10" into a sorted array of 0-indexed page numbers.
 */
function parsePageSelection(selection: string, totalPages: number): number[] {
  if (!selection || !selection.trim()) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const pages = new Set<number>();
  const parts = selection.split(',');

  for (const part of parts) {
    const range = part.trim().split('-');
    if (range.length === 1) {
      const p = parseInt(range[0], 10);
      if (!isNaN(p) && p > 0 && p <= totalPages) {
        pages.add(p - 1);
      }
    } else if (range.length === 2) {
      const start = parseInt(range[0], 10);
      const end = parseInt(range[1], 10);
      if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
        for (let i = start; i <= Math.min(end, totalPages); i++) {
          pages.add(i - 1);
        }
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

/**
 * Safely converts Uint8Array to base64 string without hitting call stack limits.
 */
function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts a specific range of page indices from a PDF to a base64 string
 */
const getChunkBase64 = async (pdfDoc: PDFDocument, indices: number[]): Promise<string> => {
  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(pdfDoc, indices);
  copiedPages.forEach(page => newDoc.addPage(page));
  const pdfBytes = await newDoc.save();
  return encodeBase64(new Uint8Array(pdfBytes));
};

export const extractPdfStructure = async (
  file: File, 
  pageSelection: string = "", 
  onProgress?: ProgressCallback
): Promise<StructuredContent> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const totalPages = pdfDoc.getPageCount();
  
  const targetPageIndices = parsePageSelection(pageSelection, totalPages);
  
  if (targetPageIndices.length === 0) {
    throw new Error("No valid pages selected for conversion.");
  }

  const allSections: StructuredContent['sections'] = [];
  const totalChunks = Math.ceil(targetPageIndices.length / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const chunkIndices = targetPageIndices.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    
    if (onProgress) {
      const percent = Math.round((i / totalChunks) * 100);
      const displayIndices = chunkIndices.map(idx => idx + 1);
      const rangeStr = displayIndices.length > 1 
        ? `${displayIndices[0]}-${displayIndices[displayIndices.length - 1]}`
        : `${displayIndices[0]}`;
        
      onProgress(percent, `Processing pages ${rangeStr} (Batch ${i + 1}/${totalChunks})...`);
    }

    try {
      const base64Data = await getChunkBase64(pdfDoc, chunkIndices);

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64Data,
              },
            },
            {
              text: `Act as a professional document conversion specialist. Analyze this document segment and extract ALL text content while preserving the original layout structure and visual fidelity.
                    
                    Requirements:
                    1. Maintain headings, lists, and paragraphs exactly as they appear.
                    2. IDENTIFY THE FONT: For each section, identify the dominant font family (e.g., Arial, Times New Roman, Calibri, Georgia) and the font size in points (e.g., 10, 12, 14.5).
                    3. Do not summarize; extract the full content.
                    4. Output ONLY strictly valid JSON matching the schema.`,
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "One of 'heading', 'paragraph', 'list'" },
                    level: { type: Type.NUMBER, description: "Heading level (1-3)" },
                    text: { type: Type.STRING },
                    items: { type: Type.ARRAY, items: { type: Type.STRING } },
                    fontFamily: { type: Type.STRING, description: "The closest standard font family name" },
                    fontSize: { type: Type.NUMBER, description: "The font size in points" }
                  },
                  required: ["type"]
                }
              }
            },
            required: ["sections"]
          }
        }
      });

      const text = response.text;
      if (text) {
        try {
          const data = JSON.parse(text);
          if (data.sections && Array.isArray(data.sections)) {
            allSections.push(...data.sections);
          }
        } catch (e) {
          console.error(`Error parsing chunk ${i}:`, e);
        }
      }
    } catch (chunkError) {
      console.error(`Error processing chunk ${i}:`, chunkError);
    }
  }

  if (onProgress) onProgress(100, "Finalizing document structure...");

  return { sections: allSections };
};
