import mongoose from "mongoose";
import MaterialChunk from "../models/MaterialChunk.js";
import logger from "../utils/logger.js";

/**
 * Cosine Similarity Helper (Used only for local fallback vector search)
 */
function computeCosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const len = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Primary Vector Search Service using MongoDB Atlas $vectorSearch
 * Index Configuration Name: material_chunks_vector_index
 * Pre-filters strictly on userId and projectId
 */
export const executeVectorSearch = async ({ userId, projectId, queryEmbedding, topK = 4 }) => {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const projectObjId = new mongoose.Types.ObjectId(projectId);

  // 1. Primary Strategy: MongoDB Atlas $vectorSearch Aggregation Pipeline
  try {
    const atlasPipeline = [
      {
        $vectorSearch: {
          index: "material_chunks_vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: Math.max(20, topK * 10),
          limit: topK,
          filter: {
            userId: userObjId,
            projectId: projectObjId,
          },
        },
      },
      {
        $project: {
          _id: 1,
          materialId: 1,
          projectId: 1,
          userId: 1,
          chunkIndex: 1,
          pageNumber: 1,
          documentName: 1,
          text: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ];

    const results = await MaterialChunk.aggregate(atlasPipeline);

    if (results && results.length > 0) {
      logger.info(`[VectorSearchService] Atlas $vectorSearch returned ${results.length} results.`);
      return results;
    }
  } catch (atlasError) {
    logger.info(
      `[VectorSearchService] Atlas $vectorSearch stage unavailable (${atlasError.message}). Executing local fallback search.`,
    );
  }

  // 2. Fallback Strategy: Local MongoDB query with in-memory cosine similarity (Offline / Local Dev)
  const chunks = await MaterialChunk.find({
    userId: userObjId,
    projectId: projectObjId,
  }).lean();

  if (!chunks || chunks.length === 0) {
    return [];
  }

  const scoredChunks = chunks.map((chunk) => {
    const rawScore = computeCosineSimilarity(queryEmbedding, chunk.embedding || []);
    // Scale raw cosine [-1, 1] to Atlas score scale [0, 1] for unified thresholding
    const score = (1 + rawScore) / 2;
    return {
      _id: chunk._id,
      materialId: chunk.materialId,
      projectId: chunk.projectId,
      userId: chunk.userId,
      chunkIndex: chunk.chunkIndex,
      pageNumber: chunk.pageNumber,
      documentName: chunk.documentName,
      text: chunk.text,
      score,
    };
  });

  // Sort by score descending and take topK
  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, topK);
};

export default executeVectorSearch;
