
const fs = require("fs");
const path = require("path");

const {
  createEmbedding,
  cosineSimilarity
} = require("./embeddings");

const KNOWLEDGE_FOLDER = path.join(
  __dirname,
  "../knowledge/steps"
);

const MIN_SIMILARITY = 0.55;

let knowledgeVectors = [];

async function initializeKnowledge() {
  console.log("Loading knowledge base...");

  const files = fs.readdirSync(KNOWLEDGE_FOLDER)
    .filter(file => file.endsWith(".json"))
    .sort();

  const entries = [];

  for (const file of files) {
    const filePath = path.join(KNOWLEDGE_FOLDER, file);
    const data = JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );

    for (const item of data.knowledge) {
      entries.push({
        ...item,
        step_id: data.step_id,
        step_title: data.title
      });
    }
  }

  const vectors = [];

  for (const item of entries) {
    const text = [
      item.step_title,
      item.topic,
      item.content
    ].join(". ");

    const embedding = await createEmbedding(text);

    vectors.push({
      ...item,
      embedding
    });
  }

  knowledgeVectors = vectors;

  console.log(`Loaded ${files.length} knowledge files.`);
  console.log(`Indexed ${knowledgeVectors.length} entries.`);
}

async function retrieveKnowledge(
  question,
  pageId,
  screenId = null,
  fieldId = null,
  topK = 3
) {
  if (knowledgeVectors.length === 0) {
    throw new Error("Knowledge base not initialized.");
  }

  // Only retrieve information from the current step.
  const candidates = knowledgeVectors.filter(
    item => item.step_id === pageId
  );

  if (candidates.length === 0) {
    return [];
  }

  // If a specific field is selected, use its knowledge.
  if (fieldId) {
    const exactMatches = candidates.filter(item =>
      item.field_id === fieldId &&
      (!screenId || item.screen_id === screenId)
    );

    if (exactMatches.length > 0) {
      return exactMatches.map(({ embedding, ...item }) => ({
        ...item,
        score: 1,
        match_type: "field"
      }));
    }
  }

  const questionEmbedding = await createEmbedding(question);

  const results = candidates.map(item => {
    const similarity = cosineSimilarity(
      questionEmbedding,
      item.embedding
    );

    const screenBonus =
      screenId && item.screen_id === screenId
        ? 0.03
        : 0;

    return {
      ...item,
      score: similarity + screenBonus,
      match_type: "semantic"
    };
  });

  return results
    .filter(item => item.score >= MIN_SIMILARITY)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ embedding, ...item }) => item);
}

module.exports = {
  initializeKnowledge,
  retrieveKnowledge
};
