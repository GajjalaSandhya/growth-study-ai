import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getHealthEndpoint,
  getPlatformStatsEndpoint,
  getUsersEndpoint,
  getUserJourneyEndpoint,
  updateUserRoleEndpoint,
  deleteUserEndpoint,
  getAiLogsEndpoint,
  getAiEvaluationEndpoint,
} from "../controllers/adminController.js";

const router = express.Router();

// All admin routes require JWT authentication AND administrator role
router.use(protect);
router.use(adminOnly);

router.get("/health", getHealthEndpoint);
router.get("/stats", getPlatformStatsEndpoint);

router.get("/users", getUsersEndpoint);
router.get("/users/:userId/journey", getUserJourneyEndpoint);
router.put("/users/:userId/role", updateUserRoleEndpoint);
router.delete("/users/:userId", deleteUserEndpoint);

router.get("/ai-logs", getAiLogsEndpoint);
router.get("/ai-evaluation", getAiEvaluationEndpoint);

export default router;
