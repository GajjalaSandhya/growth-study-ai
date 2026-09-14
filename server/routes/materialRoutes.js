import express from "express";
import { deleteMaterial, retryMaterial } from "../controllers/materialController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.delete("/:id", deleteMaterial);
router.post("/:id/retry", retryMaterial);

export default router;
