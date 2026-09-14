import mongoose from "mongoose";
import Project from "../models/Project.js";
import analyticsService from "../services/analyticsService.js";
import recommendationEngine from "../services/recommendationEngine.js";

/**
 * GET /api/projects/:projectId/analytics
 * Fetch project-level learning-loop analytics
 */
export async function getProjectAnalyticsEndpoint(req, res, next) {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: "Invalid project ID format" });
    }

    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found or access denied" });
    }

    const analytics = await analyticsService.getProjectAnalytics({
      userId: req.user._id,
      projectId,
    });

    return res.status(200).json({
      success: true,
      analytics,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/projects/:projectId/recommendations
 * Fetch personalized deterministic multi-signal recommendations
 */
export async function getRecommendationsEndpoint(req, res, next) {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: "Invalid project ID format" });
    }

    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found or access denied" });
    }

    const recommendations = await recommendationEngine.getPersonalizedRecommendations({
      userId: req.user._id,
      projectId,
    });

    return res.status(200).json({
      success: true,
      recommendations,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/analytics/growth
 * Fetch global growth analytics across all projects
 */
export async function getGlobalGrowthEndpoint(req, res, next) {
  try {
    const globalGrowth = await analyticsService.getGlobalGrowthAnalytics({
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      globalGrowth,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getProjectAnalyticsEndpoint,
  getRecommendationsEndpoint,
  getGlobalGrowthEndpoint,
};
