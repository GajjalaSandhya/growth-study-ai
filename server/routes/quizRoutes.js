import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  generateQuiz,
  getQuizzes,
  getQuizById,
  submitQuizAttempt,
} from "../controllers/quizController.js";
import { evaluateOpenAnswerEndpoint } from "../controllers/assessmentController.js";

const router = express.Router({ mergeParams: true });

router.use(protect);

router.post("/generate", generateQuiz);
router.get("/", getQuizzes);
router.get("/:quizId", getQuizById);
router.post("/:quizId/attempts", submitQuizAttempt);
router.post("/evaluate-open", evaluateOpenAnswerEndpoint);

export default router;
