import express from "express";
import { getDBStatus } from "../config/db.js";

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    API Health Check & DB Status
 * @access  Public
 */
router.get("/health", (req, res) => {
  const dbStatus = getDBStatus();
  const healthy = dbStatus.isConnected;
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    service: "StudyMate AI Backend API",
    status: healthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbStatus,
    version: "1.0.0",
  });
});

/**
 * @route   GET /api/status
 * @desc    Quick system status check
 * @access  Public
 */
router.get("/status", (req, res) => {
  res.status(200).json({
    status: "ok",
    environment: process.env.NODE_ENV || "development",
  });
});

export default router;
