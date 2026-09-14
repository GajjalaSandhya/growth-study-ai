import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { evaluateOpenAnswerEndpoint } from "../controllers/assessmentController.js";

const router = express.Router();

router.use(protect);

router.post("/evaluate-open", evaluateOpenAnswerEndpoint);

export default router;
