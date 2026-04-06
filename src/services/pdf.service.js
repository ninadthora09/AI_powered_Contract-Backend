import pdf from "pdf-parse/lib/pdf-parse.js";

export const extractTextFromPDF = async (fileBuffer) => {
  try {
    const data = await pdf(fileBuffer);
    return data.text;
  } catch (error) {
    console.error("PDF PARSE ERROR:", error);
    throw new Error("PDF parsing failed");
  }
};