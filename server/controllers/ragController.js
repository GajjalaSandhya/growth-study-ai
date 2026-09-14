import { retrieveRelevantContext } from "../services/ragService.js";

/**
 * @route   POST /api/projects/:projectId/rag/search
 * @desc    Project-scoped vector search & RAG context retrieval
 * @access  Private
 */
export const searchProjectRagContext = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { query, topK, minScore } = req.body;

    if (!query || typeof query !== "string" || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const result = await retrieveRelevantContext({
      userId: req.user._id,
      projectId,
      query: query.trim(),
      topK,
      minScore,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
