export const analyzeRisk = (text) => {
  let riskScore = 0;
  const flags = [];

  const lowerText = text.toLowerCase();

  // 🔴 Payment delay risk
  if (
    lowerText.includes("payment may be delayed") ||
    lowerText.includes("net 90") ||
    lowerText.includes("no penalty for late payment")
  ) {
    riskScore += 40;
    flags.push({
      type: "PAYMENT_DELAY",
      risk: "HIGH",
      clause: "Payment delay clause detected",
      plainEnglish:
        "The client can delay paying you without facing any penalty.",
      suggestion:
        "Payment must be completed within 30 days of invoice date.",
    });
  }

  // 🟡 Termination risk
  if (
    lowerText.includes("terminate at any time") ||
    lowerText.includes("without notice")
  ) {
    riskScore += 25;
    flags.push({
      type: "TERMINATION",
      risk: "MEDIUM",
      clause: "Unilateral termination clause detected",
      plainEnglish:
        "The client can cancel the contract suddenly without warning.",
      suggestion:
        "Either party must provide at least 15 days notice before termination.",
    });
  }

  // 🟢 Cap score
  if (riskScore > 100) riskScore = 100;

  return {
    riskScore,
    flags,
  };
};
