import Contract from "../models/Contract.model.js";
import { extractTextFromPDF } from "../services/pdf.service.js";
import { analyzeRisk } from "../services/risk.service.js";
import { explainRiskWithAI } from "../services/ai.service.js";
import { detectAdditionalRisksWithAI } from "../services/ai.service.js";

export const analyzeContract = async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    /* =====================================
   1️⃣ Extract text from PDF (SAFE + CACHED)
===================================== */
    let text = contract.extractedText;

    if (!text || text.trim().length === 0) {
      try {
        text = await extractTextFromPDF(contract.fileData);
      } catch (err) {
        console.error("PDF EXTRACTION FAILED:", err.message);
        return res.status(500).json({
          message: "Failed to extract text from PDF",
        });
      }
    }

    // 2️⃣ Rule-based risk analysis
    const { riskScore, flags } = analyzeRisk(text);

    // 3️⃣ AI-detected additional risks
    const aiDetectedFlags = await detectAdditionalRisksWithAI({
      extractedText: text,
    });
    console.log("AI DETECTED FLAGS:", aiDetectedFlags);

    // Merge + deduplicate
    const combinedFlags = [...flags, ...aiDetectedFlags];

    // 3️⃣ AI explanation layer (Bytez)
    const aiResult = await explainRiskWithAI({ flags: combinedFlags });

    // 4️⃣ Save everything
    // 4️⃣ Save everything (SAFE – NO VERSION ERROR)
    const updatedContract = await Contract.findByIdAndUpdate(
      contract._id,
      {
        extractedText: text,
        riskScore,
        flags: combinedFlags,
        aiSummary: aiResult.aiSummary,
        status: "analyzed",
        analyzedAt: new Date(),
      },
      { new: true },
    );

    if (
      updatedContract?.status === "analyzed" &&
      updatedContract.aiSummary &&
      updatedContract.flags?.length > 0
    ) {
      return res.status(200).json({
        contractId: updatedContract._id,
        riskScore: updatedContract.riskScore,
        flags: updatedContract.flags,
        aiSummary: updatedContract.aiSummary,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Analysis failed" });
  }
};
