import express from "express";
import { searchProjectRagContext } from "../controllers/ragController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true });

// All RAG search routes require authentication
router.use(protect);

/**
 * @route   POST /api/projects/:projectId/rag/search
 * @desc    Execute project-scoped vector search & citation formatting
 * @access  Private
 */
router.post("/search", searchProjectRagContext);

export default router;
