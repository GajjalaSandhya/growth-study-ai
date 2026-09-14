import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getProjectMastery } from "../controllers/masteryController.js";

const router = express.Router({ mergeParams: true });

router.use(protect);

router.get("/", getProjectMastery);

export default router;
