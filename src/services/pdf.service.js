import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

export const extractTextFromPDF = async (fileBuffer) => {
  try {
    const data = await pdf(fileBuffer);
    return data.text;
  } catch (error) {
    console.error("PDF PARSE ERROR:", error);
    throw new Error("PDF parsing failed");
  }
};