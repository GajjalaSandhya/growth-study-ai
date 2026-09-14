import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getGlobalGrowthEndpoint } from "../controllers/analyticsController.js";

const router = express.Router();

router.use(protect);

router.get("/growth", getGlobalGrowthEndpoint);

export default router;
