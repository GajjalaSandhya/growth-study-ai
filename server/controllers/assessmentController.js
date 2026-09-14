import mongoose from "mongoose";
import Project from "../models/Project.js";
import assessmentService from "../services/assessmentService.js";
import { logActivity } from "../services/activityService.js";

/**
 * POST /api/quizzes/evaluate-open
 * POST /api/projects/:projectId/quizzes/evaluate-open
 * Evaluate student open-ended answer using Phase 5 RAG evidence
 */
export async function evaluateOpenAnswerEndpoint(req, res, next) {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    const { prompt, answer, conceptId } = req.body;

    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: "Valid projectId is required" });
    }

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return res.status(400).json({ success: false, message: "Prompt text is required" });
    }

    if (!answer || typeof answer !== "string" || answer.trim() === "") {
      return res.status(400).json({ success: false, message: "Answer text is required" });
    }

    if (prompt.length > 2000 || answer.length > 4000) {
      return res
        .status(400)
        .json({ success: false, message: "Prompt or answer text exceeds maximum allowed length" });
    }

    // Verify Project Ownership
    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found or access denied" });
    }

    // Evaluate Assessment
    const result = await assessmentService.evaluateOpenAssessment({
      userId: req.user._id,
      projectId,
      prompt: prompt.trim(),
      answer: answer.trim(),
      conceptId: conceptId ? String(conceptId).trim() : "general",
    });

    if (result.unsupported) {
      return res.status(200).json({
        success: true,
        unsupported: true,
        grounded: false,
        message: result.message,
        evaluation: null,
        citations: [],
      });
    }

    // Automatically log open_assessment real activity (120s study time)
    await logActivity({
      userId: req.user._id,
      projectId,
      activityType: "open_assessment",
      conceptId: result.attempt.conceptId || "general",
      durationSeconds: 120,
      metadata: {
        assessmentId: result.attempt._id,
        overallScore: result.attempt.evaluation?.overallScore,
      },
    });

    return res.status(200).json({
      success: true,
      unsupported: false,
      grounded: true,
      assessment: {
        id: result.attempt._id,
        conceptId: result.attempt.conceptId,
        prompt: result.attempt.prompt,
        userAnswer: result.attempt.userAnswer,
        evaluation: result.attempt.evaluation,
        citations: result.attempt.citations,
        createdAt: result.attempt.createdAt,
      },
      updatedMastery: result.updatedMastery,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  evaluateOpenAnswerEndpoint,
};
