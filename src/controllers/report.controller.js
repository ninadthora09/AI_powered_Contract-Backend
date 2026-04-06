import Contract from "../models/Contract.model.js";

export const getContractReport = async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findOne({
      _id: id,
      user: req.user._id, // 🔐 ownership enforcement
    });

    if (!contract) {
      return res.status(403).json({
        message: "You are not authorized to access this report",
      });
    }

    // Rule-based fallback summary
    const fallbackSummary =
      contract.riskScore > 70
        ? "This contract has high legal and financial risks."
        : contract.riskScore > 40
          ? "This contract contains moderate risk clauses."
          : "This contract appears relatively safe.";

    res.status(200).json({
      contractId: contract._id,
      riskScore: contract.riskScore,
      summary: contract.aiSummary || fallbackSummary,
      flags: contract.flags || [],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch report" });
  }
};
