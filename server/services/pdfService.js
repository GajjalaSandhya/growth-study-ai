import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

/**
 * Page-aware PDF Text Extractor
 * Reads a PDF file from disk and returns total page count and page-segmented text.
 */
export const extractPdfText = async (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`PDF file does not exist on disk: ${filePath}`);
  }

  const dataBuffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: dataBuffer });
  await parser.load();

  const textResult = await parser.getText();
  const totalPages = textResult.total || (textResult.pages ? textResult.pages.length : 1);

  const pages = [];
  if (textResult.pages && Array.isArray(textResult.pages)) {
    for (const pageObj of textResult.pages) {
      const cleanText = pageObj.text ? pageObj.text.replace(/\s+/g, " ").trim() : "";
      pages.push({
        pageNumber: pageObj.num || pages.length + 1,
        text: cleanText,
      });
    }
  } else if (textResult.text) {
    pages.push({
      pageNumber: 1,
      text: textResult.text.replace(/\s+/g, " ").trim(),
    });
  }

  // Sort pages by pageNumber
  pages.sort((a, b) => a.pageNumber - b.pageNumber);

  const totalTextLength = pages.reduce((sum, p) => sum + (p.text ? p.text.length : 0), 0);

  return {
    totalPages,
    pages,
    totalTextLength,
  };
};

export default extractPdfText;
