import express from "express";
import {
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";
import { getProjectMaterials, uploadMaterial } from "../controllers/materialController.js";
import {
  getProjectAnalyticsEndpoint,
  getRecommendationsEndpoint,
} from "../controllers/analyticsController.js";
import ragRoutes from "./ragRoutes.js";
import tutorRoutes from "./tutorRoutes.js";
import quizRoutes from "./quizRoutes.js";
import masteryRoutes from "./masteryRoutes.js";
import { protect } from "../middleware/authMiddleware.js";
import { handleSinglePdfUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route("/").get(getProjects).post(createProject);

router.route("/:id").get(getProjectById).put(updateProject).delete(deleteProject);

// Nested material routes for project scope
router.get("/:projectId/materials", getProjectMaterials);
router.post("/:projectId/materials/upload", handleSinglePdfUpload, uploadMaterial);

// Nested RAG search routes for project scope
router.use("/:projectId/rag", ragRoutes);

// Nested AI Tutor routes for project scope
router.use("/:projectId/tutor", tutorRoutes);

// Nested Adaptive Quiz routes for project scope
router.use("/:projectId/quizzes", quizRoutes);

// Nested Concept Mastery routes for project scope
router.use("/:projectId/mastery", masteryRoutes);

// Nested Project Analytics & Recommendations routes
router.get("/:projectId/analytics", getProjectAnalyticsEndpoint);
router.get("/:projectId/recommendations", getRecommendationsEndpoint);

export default router;
