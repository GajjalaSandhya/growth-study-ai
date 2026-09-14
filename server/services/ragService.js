import Project from "../models/Project.js";
import { generateEmbedding } from "./embeddingService.js";
import { executeVectorSearch } from "./vectorSearchService.js";
import config from "../config/env.js";

const STOP_WORDS = new Set([
  "what", "is", "are", "was", "were", "be", "been", "being",
  "the", "a", "an", "of", "in", "on", "at", "by", "for", "with",
  "about", "against", "between", "into", "through", "during", "before", "after",
  "above", "below", "to", "from", "up", "down", "off", "over", "under", "again",
  "further", "then", "once", "here", "there", "when", "where", "why", "how", "all",
  "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor",
  "not", "only", "own", "same", "so", "than", "too", "very", "can", "will", "just",
  "should", "now", "tell", "explain", "give", "list", "does", "do", "did", "who", "whom",
  "which", "whose", "could", "would", "might", "have", "has", "had", "define", "describe"
]);

/**
 * Extract key non-stopwords content terms from query
 */
function extractQueryTerms(query) {
  if (!query) return [];
  return [
    ...new Set(
      query
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 2 && !STOP_WORDS.has(w))
    ),
  ];
}

/**
 * Check if a single candidate chunk has sufficient content term evidence for the query.
 * Prevents accepting chunks with scattered or single incidental word matches across unrelated pages.
 */
function isChunkRelevant(chunk, queryTerms) {
  if (!chunk) return false;
  const chunkText = `${chunk.documentName || chunk.document || ""} ${chunk.text || ""}`.toLowerCase();
  const chunkScore = chunk.score || 0;

  if (!queryTerms || queryTerms.length === 0) {
    return chunkScore >= 0.68;
  }

  const matchingTerms = queryTerms.filter((term) => {
    if (chunkText.includes(term)) return true;
    if (term.endsWith("s") && term.length > 3 && chunkText.includes(term.slice(0, -1))) return true;
    if (chunkText.includes(`${term}s`)) return true;
    return false;
  });

  // Single term query (e.g. "Overfitting"): Content term MUST be in this chunk (or score >= 0.72)
  if (queryTerms.length === 1) {
    return matchingTerms.length === 1 || chunkScore >= 0.72;
  }

  // Two term query (e.g. "Capital France", "Machine Learning"): BOTH terms MUST be in this single chunk (or 1 term with score >= 0.75)
  if (queryTerms.length === 2) {
    if (matchingTerms.length === 2) return chunkScore >= 0.58;
    if (matchingTerms.length === 1 && chunkScore >= 0.75) return true;
    return false;
  }

  // Three term query (e.g. "President United States", "Binary Search Tree"): ALL 3 terms MUST be in this single chunk (or >= 2 terms with score >= 0.75)
  if (queryTerms.length === 3) {
    if (matchingTerms.length === 3) return chunkScore >= 0.58;
    if (matchingTerms.length >= 2 && chunkScore >= 0.75) return true;
    return false;
  }

  // Multi-term query (4+ terms): At least 75% of content terms MUST be present in this single chunk (or >= 50% with score >= 0.75)
  if (queryTerms.length >= 4) {
    const ratio = matchingTerms.length / queryTerms.length;
    if (ratio >= 0.75) return chunkScore >= 0.58;
    if (ratio >= 0.50 && chunkScore >= 0.75) return true;
    return false;
  }

  return false;
}

/**
 * RAG Context Retrieval & Citation Service
 * Verifies project ownership, executes vector search, filters by strict per-chunk relevance, and formats citations.
 */
export const retrieveRelevantContext = async ({
  userId,
  projectId,
  query,
  topK = config.ragTopK || 4,
  minScore = config.ragMinScore || 0.6,
}) => {
  // 1. Verify Project exists and belongs to userId (Strict Multi-Tenant Isolation)
  const project = await Project.findOne({
    _id: projectId,
    userId,
  });

  if (!project) {
    const error = new Error("Project not found or access denied");
    error.statusCode = 404;
    throw error;
  }

  if (!query || query.trim() === "") {
    return {
      grounded: false,
      unsupported: true,
      topScore: 0,
      count: 0,
      chunks: [],
      citations: [],
    };
  }

  // 2. Generate Query Vector Embedding
  const queryEmbedding = await generateEmbedding(query);

  // 3. Execute MongoDB Atlas Vector Search (pre-filtered by userId & projectId)
  const candidateChunks = await executeVectorSearch({
    userId,
    projectId,
    queryEmbedding,
    topK,
  });

  if (!candidateChunks || candidateChunks.length === 0) {
    return {
      grounded: false,
      unsupported: true,
      topScore: 0,
      count: 0,
      chunks: [],
      citations: [],
    };
  }

  const maxScore = candidateChunks[0]?.score || 0;
  const queryTerms = extractQueryTerms(query);

  // 4. Evidence Protection: Filter candidates by minScore and per-chunk relevance
  const minThreshold = Math.max(minScore, 0.58);
  const matchedChunks = candidateChunks.filter((chunk) => {
    if (chunk.score < minThreshold) return false;
    return isChunkRelevant(chunk, queryTerms);
  });

  if (matchedChunks.length === 0) {
    return {
      grounded: false,
      unsupported: true,
      topScore: parseFloat(maxScore.toFixed(4)),
      count: 0,
      chunks: [],
      citations: [],
    };
  }

  // 5. Format Citation Objects safely (guarantee non-undefined document name)
  const citations = matchedChunks.map((chunk) => {
    const rawDocName = chunk.documentName || chunk.document;
    const safeDocName =
      rawDocName && rawDocName !== "undefined" && String(rawDocName).trim() !== ""
        ? String(rawDocName).trim()
        : "Study Material";

    return {
      id: chunk._id ? chunk._id.toString() : `cit_${Math.random()}`,
      materialId: chunk.materialId,
      document: safeDocName,
      page: chunk.pageNumber || chunk.page || 1,
      excerpt: chunk.text ? chunk.text.substring(0, 200) : "",
      score: parseFloat(chunk.score.toFixed(4)),
    };
  });

  return {
    grounded: true,
    unsupported: false,
    topScore: parseFloat(maxScore.toFixed(4)),
    count: matchedChunks.length,
    chunks: matchedChunks,
    citations,
  };
};

export default retrieveRelevantContext;


