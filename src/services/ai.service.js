import OpenAI from "openai";
import { retrieveLegalContext } from "../rag/retrieveContext.js";

/* =====================================
   Groq Client (LAZY + SAFE INIT)
===================================== */
let groqClient = null;

const getClient = () => {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY not loaded");
    }

    groqClient = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return groqClient;
};

/* =====================================
   Helper: Parse structured risks
===================================== */
const parseRisksFromText = (text, references = []) => {
  const risks = [];
  if (!text) return risks;

  const blocks = text.split(/RISK\s*\d*:/i);

  for (const block of blocks.slice(1)) {
    const typeMatch = block.match(/Type:\s*(.*)/i);
    const severityMatch = block.match(/Severity:\s*(HIGH|MEDIUM|LOW)/i);
    const clauseMatch = block.match(/Clause:\s*(.*)/i);
    const explanationMatch = block.match(/Explanation:\s*(.*)/i);
    const suggestionMatch = block.match(/Suggestion:\s*(.*)/i);

    if (typeMatch && severityMatch) {
      const type = typeMatch[1].trim();

      const matchedRef = references.find((ref) =>
        type.toLowerCase().includes(ref.topic.toLowerCase()),
      );

      risks.push({
        type,
        risk: severityMatch[1].trim(),
        clause: clauseMatch?.[1]?.trim() || "",
        plainEnglish: explanationMatch?.[1]?.trim() || "",
        suggestion: suggestionMatch?.[1]?.trim() || "",
        basedOn: matchedRef
          ? matchedRef.content.split(".")[0] + "."
          : "General contract risk standards",
      });
    }
  }

  return risks;
};

/* =====================================
   1️⃣ AI EXPLAINS EXISTING RISKS
===================================== */
export const explainRiskWithAI = async ({ flags }) => {
  if (!flags || flags.length === 0) {
    return {
      aiSummary:
        "No risky clauses were detected. The contract appears safe based on automated analysis.",
    };
  }

  const prompt = `
You are a legal assistant for small businesses.

Write a clean, plain-English explanation of the risks below.

IMPORTANT RULES:
- DO NOT use markdown
- DO NOT use **, bullets, or headings
- DO NOT use special characters
- Write in short paragraphs
- Use simple numbered sentences (1, 2, 3...)
- Make the text suitable for reading aloud in a podcast

Risks:
${JSON.stringify(flags, null, 2)}
`;

  try {
    const response = await getClient().chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    return {
      aiSummary: response.choices[0].message.content,
    };
  } catch (err) {
    console.error("Groq explain failed:", err.message);
    return {
      aiSummary:
        "This contract contains some risky clauses. Please review them carefully.",
    };
  }
};

/* =====================================
   2️⃣ AI DETECTS ADDITIONAL RISKS (RAG)
===================================== */
export const detectAdditionalRisksWithAI = async ({ extractedText }) => {
  if (!extractedText || extractedText.length < 50) {
    return [];
  }

  // 🔍 RAG: retrieve legal reference notes
  const { contextText, references } = retrieveLegalContext(extractedText);

  const prompt = `
You are a legal risk analysis assistant.

IMPORTANT:
Use the LEGAL REFERENCE below to ground your analysis.
Do NOT invent legal standards.
Only flag risks that clearly violate or deviate from these references.

LEGAL REFERENCE:
${contextText || "No specific legal reference found."}


TASK:
Analyze the contract and IDENTIFY risky clauses.

For EACH risk, use EXACTLY this format:

RISK:
Type: <risk type>
Severity: <HIGH | MEDIUM | LOW>
Clause: <short excerpt or summary of the risky clause>
Explanation: <plain English explanation>
Suggestion: <safer alternative clause>


CONTRACT:
${extractedText.slice(0, 6000)}
`;

  try {
    const response = await getClient().chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const aiText = response.choices[0].message.content;

    // 🔍 Debug (keep during development)
    console.log("RAW AI DETECTION OUTPUT:\n", aiText);

    return parseRisksFromText(aiText, references);
  } catch (err) {
    console.error("Groq detection failed:", err.message);
    return [];
  }
};
