import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getChatHistory, askTutor, clearChatHistory } from "../controllers/tutorController.js";

const router = express.Router({ mergeParams: true });

router.use(protect);

router.get("/history", getChatHistory);
router.post("/ask", askTutor);
router.delete("/history", clearChatHistory);

export default router;
