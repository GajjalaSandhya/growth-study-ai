import mongoose from "mongoose";
import adminService from "../services/adminService.js";

/**
 * GET /api/admin/health
 * System Health Diagnostics (Protected by protect + adminOnly)
 */
export async function getHealthEndpoint(req, res, next) {
  try {
    const health = await adminService.getSystemHealth();
    return res.status(200).json({
      success: true,
      health,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/stats
 * Real Database Platform Overview Stats
 */
export async function getPlatformStatsEndpoint(req, res, next) {
  try {
    const stats = await adminService.getPlatformStats();
    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/users
 * Paginated User List with Search & Filtering
 */
export async function getUsersEndpoint(req, res, next) {
  try {
    const { page, limit, role, search } = req.query;
    const data = await adminService.getUsersList({ page, limit, role, search });
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/users/:userId/journey
 * Aggregated Student Learning Journey Inspection
 */
export async function getUserJourneyEndpoint(req, res, next) {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    const journey = await adminService.getUserJourney({ userId });
    return res.status(200).json({
      success: true,
      journey,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

/**
 * PUT /api/admin/users/:userId/role
 * Update User Role (with self & primary admin protection)
 */
export async function updateUserRoleEndpoint(req, res, next) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    if (!role || !["student", "admin"].includes(role)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid role specified. Must be 'student' or 'admin'" });
    }

    const updatedUser = await adminService.updateUserRole({
      userId,
      role,
      currentAdminId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

/**
 * DELETE /api/admin/users/:userId
 * Delete User with Cascade Cleanup (13 collections)
 */
export async function deleteUserEndpoint(req, res, next) {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    const result = await adminService.deleteUserCascade({
      userId,
      currentAdminId: req.user._id,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

/**
 * GET /api/admin/ai-logs
 * AI Usage & Telemetry Analytics
 */
export async function getAiLogsEndpoint(req, res, next) {
  try {
    const { requestType, status, startDate, endDate, page, limit } = req.query;
    const data = await adminService.getAiTelemetry({
      requestType,
      status,
      startDate,
      endDate,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/ai-evaluation
 * AI Evaluation Dashboard
 */
export async function getAiEvaluationEndpoint(req, res, next) {
  try {
    const metrics = await adminService.getAiEvaluationMetrics();
    return res.status(200).json({
      success: true,
      metrics,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getHealthEndpoint,
  getPlatformStatsEndpoint,
  getUsersEndpoint,
  getUserJourneyEndpoint,
  updateUserRoleEndpoint,
  deleteUserEndpoint,
  getAiLogsEndpoint,
  getAiEvaluationEndpoint,
};
