import crypto from "crypto";
import config from "../config/env.js";
import logger from "../utils/logger.js";

/**
 * Local Deterministic Feature Vectorizer (Fallback ONLY when OPENAI_API_KEY is not set)
 * Generates an L2-normalized 1536-dimensional float vector based on text n-gram hashes.
 */
function generateLocalFallbackVector(text, dimension = 1536) {
  const vector = new Array(dimension).fill(0);
  const normalizedText = text.toLowerCase().trim();

  if (!normalizedText) return vector;

  // Generate word & character 3-gram feature hashes
  const words = normalizedText.split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const hash = crypto.createHash("sha256").update(word).digest();

    for (let j = 0; j < 4; j++) {
      const idx = hash.readUInt16BE(j * 2) % dimension;
      const sign = hash[j * 2 + 8] % 2 === 0 ? 1 : -1;
      vector[idx] += sign * (1 / (1 + i * 0.05));
    }

    // 3-grams
    if (word.length >= 3) {
      for (let k = 0; k <= word.length - 3; k++) {
        const trigram = word.substring(k, k + 3);
        const triHash = crypto.createHash("md5").update(trigram).digest();
        const idx = triHash.readUInt16BE(0) % dimension;
        vector[idx] += 0.5;
      }
    }
  }

  // L2 Normalization
  let sumSq = 0;
  for (let i = 0; i < dimension; i++) {
    sumSq += vector[i] * vector[i];
  }
  const norm = Math.sqrt(sumSq) || 1;
  for (let i = 0; i < dimension; i++) {
    vector[i] = parseFloat((vector[i] / norm).toFixed(6));
  }

  return vector;
}

/**
 * Primary Embedding Service
 * Calls OpenAI text-embedding-3-small (1536-dim) when OPENAI_API_KEY is configured.
 */
export const generateEmbedding = async (text) => {
  const cleanText = text ? text.trim() : "";
  const targetDimension = config.embeddingDimension || 1536;

  // Case 1: OPENAI_API_KEY is provided -> Call real OpenAI Embeddings API
  if (config.openaiApiKey && config.openaiApiKey.trim() !== "") {
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.openaiApiKey.trim()}`,
        },
        body: JSON.stringify({
          model: config.embeddingModel || "text-embedding-3-small",
          input: cleanText || " ",
          dimensions: targetDimension,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI Embedding API error (HTTP ${response.status}): ${errorBody}`);
      }

      const payload = await response.json();

      if (!payload.data || !payload.data[0] || !payload.data[0].embedding) {
        throw new Error("Invalid response format from OpenAI Embedding API");
      }

      const embedding = payload.data[0].embedding;
      if (embedding.length !== targetDimension) {
        logger.warn(
          `[EmbeddingService] Returned embedding dimension (${embedding.length}) differs from target (${targetDimension}).`,
        );
      }

      return embedding;
    } catch (apiError) {
      // DO NOT silently fall back to local embeddings on real provider error
      logger.error(`[EmbeddingService] Provider API failure: ${apiError.message}`);
      throw new Error(`Embedding Generation Failed: ${apiError.message}`);
    }
  }

  // Case 2: OPENAI_API_KEY missing in dev/offline mode -> Local Fallback Vectorizer
  logger.info(
    `[EmbeddingService] OPENAI_API_KEY not configured. Using local fallback vectorizer (${targetDimension}-dim).`,
  );
  return generateLocalFallbackVector(cleanText, targetDimension);
};

export default generateEmbedding;
