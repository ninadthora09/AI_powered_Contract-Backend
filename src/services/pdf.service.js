import pdfParse from "pdf-parse";

export const extractTextFromPDF = async (fileBuffer) => {
  try {
    const data = await pdfParse(fileBuffer);
    return data.text;
  } catch (error) {
    throw new Error("PDF parsing failed");
  }
};