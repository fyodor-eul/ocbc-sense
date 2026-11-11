
const { Ollama } = require("ollama");

// Inside Docker, Ollama is another container: set OLLAMA_HOST=http://ollama:11434
const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || "http://127.0.0.1:11434"
});

const EMBEDDING_MODEL = "nomic-embed-text";

// Convert text into a numerical embedding vector.
async function createEmbedding(text) {
  const response = await ollama.embed({
    model: EMBEDDING_MODEL,
    input: text
  });

  return response.embeddings[0];
}

// Calculate cosine similarity between two vectors.
function cosineSimilarity(vectorA, vectorB) {
  if (vectorA.length !== vectorB.length) {
    throw new Error("Embedding dimensions do not match.");
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] ** 2;
    magnitudeB += vectorB[i] ** 2;
  }

  const denominator =
    Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);

  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

module.exports = {
  createEmbedding,
  cosineSimilarity
};
