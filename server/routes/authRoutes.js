import express from "express";
import { registerUser, loginUser, getCurrentUser } from "../controllers/authController.js";
import { validateRegister, validateLogin } from "../middleware/validationMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post("/register", validateRegister, registerUser);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post("/login", validateLogin, loginUser);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user details
 * @access  Private (Protected by JWT)
 */
router.get("/me", protect, getCurrentUser);

export default router;
