import { legalKnowledgeBase } from "./legalKnowledge.js";

export const retrieveLegalContext = (contractText) => {
  const matchedReferences = [];
  const contextChunks = [];

  const lowerText = contractText.toLowerCase();

  for (const item of legalKnowledgeBase) {
    for (const keyword of item.keywords) {
      if (lowerText.includes(keyword)) {
        matchedReferences.push({
          topic: item.topic,
          content: item.content.trim(),
        });

        contextChunks.push(
          `Topic: ${item.topic}\n${item.content.trim()}`
        );
        break;
      }
    }
  }

  return {
    contextText: contextChunks.slice(0, 3).join("\n\n"),
    references: matchedReferences,
  };
};
