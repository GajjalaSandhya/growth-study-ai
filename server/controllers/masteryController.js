import mongoose from "mongoose";
import Project from "../models/Project.js";
import masteryService from "../services/masteryService.js";

/**
 * GET /api/projects/:projectId/mastery
 * Fetch concept-level mastery and derived project mastery for authenticated user & project
 */
export async function getProjectMastery(req, res, next) {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: "Invalid project ID format" });
    }

    // Verify Project Ownership
    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found or access denied" });
    }

    const masteryData = await masteryService.getConceptMastery({
      userId: req.user._id,
      projectId,
    });

    return res.status(200).json({
      success: true,
      data: masteryData,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getProjectMastery,
};
