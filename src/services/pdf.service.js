import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

export const extractTextFromPDF = async (fileBuffer) => {
  try {
    const data = await pdfParse(fileBuffer); // ✅ correct
    return data.text;
  } catch (error) {
    console.error("PDF PARSE ERROR:", error);
    throw new Error("PDF parsing failed");
  }
};