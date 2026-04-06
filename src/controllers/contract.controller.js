import Contract from "../models/Contract.model.js";
import { extractTextFromPDF } from "../services/pdf.service.js";
import { analyzeRisk } from "../services/risk.service.js";
import {
  explainRiskWithAI,
  detectAdditionalRisksWithAI,
} from "../services/ai.service.js";

/* =====================================
   AI Risk Scoring Helpers
===================================== */
const SEVERITY_SCORE = {
  HIGH: 30,
  MEDIUM: 20,
  LOW: 10,
};

const calculateAIRiskScore = (aiFlags = []) => {
  let score = 0;

  for (const risk of aiFlags) {
    score += SEVERITY_SCORE[risk.risk] || 0;

    // RAG confidence bonus
    if (risk.basedOn && risk.basedOn !== "General contract risk standards") {
      score += 5;
    }
  }

  return score;
};

const getRiskLevelFromScore = (score) => {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
};

/* =========================
   1️⃣ Upload Contract
========================= */
export const uploadContract = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const contract = await Contract.create({
      user: req.user._id, // 🔑 link owner
      fileName: req.file.originalname,
      filePath: req.file.path,
      status: "uploaded",
    });

    res.status(201).json({
      contractId: contract._id,
      fileName: contract.fileName,
      status: contract.status,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res.status(500).json({ message: "File upload failed" });
  }
};

/* =========================
   2️⃣ Analyze Contract (AI + RAG)
========================= */
export const analyzeContract = async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findOne({
      _id: id,
      user: req.user._id, // 🔐 ownership check
    });

    if (!contract) {
      return res.status(403).json({
        message: "You are not authorized to access this contract",
      });
    }

    /* =====================================
       ✅ Return cached result if analyzed
    ===================================== */
    if (
      contract.status === "analyzed" &&
      contract.aiSummary &&
      contract.flags?.length
    ) {
      return res.status(200).json({
        contractId: contract._id,
        riskScore: contract.riskScore,
        riskLevel: contract.riskLevel, // 🔥 add this
        flags: contract.flags,
        aiSummary: contract.aiSummary,
      });
    }

    /* =====================================
       1️⃣ Extract text (cached)
    ===================================== */
    let text = contract.extractedText;
    if (!text) {
      text = await extractTextFromPDF(contract.filePath);
    }

    /* =====================================
       2️⃣ Rule-based analysis
    ===================================== */
    const { riskScore: ruleRiskScore, flags: ruleFlags } = analyzeRisk(text);

    /* =====================================
       3️⃣ AI-detected risks (RAG grounded)
    ===================================== */
    const aiDetectedFlags = await detectAdditionalRisksWithAI({
      extractedText: text,
    });

    /* =====================================
       4️⃣ Combine risks
    ===================================== */
    const combinedFlags = [...ruleFlags, ...aiDetectedFlags];

    /* =====================================
       5️⃣ Final risk score
    ===================================== */
    const aiRiskScore = calculateAIRiskScore(aiDetectedFlags);
    const finalRiskScore = Math.min(100, ruleRiskScore + aiRiskScore);

    /* =====================================
       6️⃣ AI explanation
    ===================================== */
    const aiResult = await explainRiskWithAI({
      flags: combinedFlags,
    });

    /* =====================================
       7️⃣ Save results
    ===================================== */

    contract.extractedText = text;
    contract.riskScore = finalRiskScore;
    contract.riskLevel = getRiskLevelFromScore(finalRiskScore);
    contract.flags = combinedFlags;
    contract.aiSummary = aiResult.aiSummary;
    contract.status = "analyzed";
    await contract.save();

    /* =====================================
       8️⃣ Respond
    ===================================== */
    res.status(200).json({
      contractId: contract._id,
      riskScore: finalRiskScore,
      riskLevel: contract.riskLevel, // 🔥 add this
      flags: combinedFlags,
      aiSummary: aiResult.aiSummary,
    });
  } catch (error) {
    console.error("ANALYZE CONTRACT ERROR:", error);

    res.status(500).json({
      message: "Analysis failed",
    });
  }
};

/* =========================
   3️⃣ Get My Contracts
========================= */
export const getMyContracts = async (req, res) => {
  try {
    const contracts = await Contract.find({
      user: req.user._id, // 🔐 only logged-in user's contracts
    })
      .select("-extractedText") // optional: keep response light
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: contracts.length,
      contracts,
    });
  } catch (error) {
    console.error("GET MY CONTRACTS ERROR:", error);
    res.status(500).json({
      message: "Failed to fetch contracts",
    });
  }
};
