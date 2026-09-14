import express from "express";
import {
  getSpaces,
  createSpace,
  getSpaceById,
  updateSpace,
  deleteSpace,
} from "../controllers/spaceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route("/").get(getSpaces).post(createSpace);

router.route("/:id").get(getSpaceById).put(updateSpace).delete(deleteSpace);

export default router;
