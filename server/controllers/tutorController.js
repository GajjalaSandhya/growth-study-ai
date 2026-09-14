import mongoose from "mongoose";
import Project from "../models/Project.js";
import ChatMessage from "../models/ChatMessage.js";
import AiLog from "../models/AiLog.js";
import { retrieveRelevantContext } from "../services/ragService.js";
import llmService from "../services/llmService.js";
import config from "../config/env.js";
import { logActivity } from "../services/activityService.js";

/**
 * GET /api/projects/:projectId/tutor/history
 * Fetch tutor chat history for an authenticated user and project
 */
export async function getChatHistory(req, res, next) {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, error: "Invalid projectId format" });
    }

    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const messages = await ChatMessage.find({
      userId: req.user._id,
      projectId,
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: { messages },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/projects/:projectId/tutor/ask
 * Ask Grounded AI Tutor a question
 */
export async function askTutor(req, res, next) {
  const startTime = Date.now();
  const { projectId } = req.params;
  const { question } = req.body;

  try {
    // 1. Validate Project ID format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, error: "Invalid projectId format" });
    }

    // 2. Validate Question Input
    if (question === undefined || question === null || typeof question !== "string") {
      return res.status(400).json({ success: false, error: "Question must be a string" });
    }

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return res.status(400).json({ success: false, error: "Question cannot be empty" });
    }

    if (trimmedQuestion.length > 1000) {
      return res.status(400).json({
        success: false,
        error: "Question exceeds maximum length of 1000 characters",
      });
    }

    // 3. Verify Project Ownership
    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    // 4. Retrieve bounded previous history for conversational continuity
    const historyLimit = config.tutorHistoryLimit || 10;
    const historyRecords = await ChatMessage.find({
      userId: req.user._id,
      projectId,
    })
      .sort({ createdAt: -1 })
      .limit(historyLimit);

    const recentHistory = historyRecords.reverse();

    // 5. Save user message to ChatMessage collection
    await ChatMessage.create({
      userId: req.user._id,
      projectId,
      role: "user",
      content: trimmedQuestion,
    });

    // Automatically log tutor_interaction activity (60 seconds estimated study duration)
    await logActivity({
      userId: req.user._id,
      projectId,
      activityType: "tutor_interaction",
      conceptId: "general",
      durationSeconds: 60,
      metadata: { questionSnippet: trimmedQuestion.slice(0, 80) },
    });

    // 6. Perform Phase 5 RAG Retrieval
    const ragResult = await retrieveRelevantContext({
      userId: req.user._id,
      projectId,
      query: trimmedQuestion,
    });

    // 7. Handle Unsupported Query (NO LLM CALL)
    if (ragResult.unsupported) {
      const refusalContent =
        "I could not find sufficient evidence in your uploaded study materials to answer this question accurately.";
      const suggestions = [
        "Upload PDF study materials for this subject",
        "Try asking about key terms present in your documents",
      ];

      const assistantMsg = await ChatMessage.create({
        userId: req.user._id,
        projectId,
        role: "assistant",
        content: refusalContent,
        grounded: false,
        unsupported: true,
        citations: [],
        suggestions,
      });

      const latencyMs = Date.now() - startTime;
      await AiLog.create({
        userId: req.user._id,
        projectId,
        requestType: "tutor",
        model: config.tutorModel,
        latencyMs,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        grounded: false,
        status: "unsupported",
      });

      return res.status(200).json({
        success: true,
        data: { message: assistantMsg },
      });
    }

    // 8. Handle Supported Query (Invoke LLM)
    try {
      const llmRes = await llmService.generateGroundedTutorResponse({
        query: trimmedQuestion,
        contextChunks: ragResult.chunks,
        recentHistory,
      });

      const latencyMs = Date.now() - startTime;

      // Backend-Controlled Citations: construct directly from actual Phase 5 RAG chunks
      const citations = ragResult.citations || [];

      const assistantMsg = await ChatMessage.create({
        userId: req.user._id,
        projectId,
        role: "assistant",
        content: llmRes.content,
        grounded: true,
        unsupported: false,
        citations,
        suggestions: llmRes.suggestions,
      });

      await AiLog.create({
        userId: req.user._id,
        projectId,
        requestType: "tutor",
        model: config.tutorModel,
        latencyMs,
        promptTokens: llmRes.usage?.promptTokens || 0,
        completionTokens: llmRes.usage?.completionTokens || 0,
        totalTokens: llmRes.usage?.totalTokens || 0,
        grounded: true,
        status: "success",
      });

      return res.status(200).json({
        success: true,
        data: { message: assistantMsg },
      });
    } catch (llmError) {
      const latencyMs = Date.now() - startTime;

      const safeErrorType = llmError.type || llmError.name || "LLMExecutionError";
      const safeErrorMessage = llmError.message
        ? llmError.message.slice(0, 250)
        : "Tutor request execution failed";

      await AiLog.create({
        userId: req.user._id,
        projectId,
        requestType: "tutor",
        model: config.tutorModel,
        latencyMs,
        promptTokens: llmError.usage?.promptTokens || 0,
        completionTokens: llmError.usage?.completionTokens || 0,
        totalTokens: llmError.usage?.totalTokens || 0,
        grounded: false,
        status: "failed",
        error: {
          type: safeErrorType,
          message: safeErrorMessage,
        },
      });

      throw llmError;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/projects/:projectId/tutor/history
 * Clear tutor chat history for an authenticated user and project
 */
export async function clearChatHistory(req, res, next) {
  try {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, error: "Invalid projectId format" });
    }

    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const deleteResult = await ChatMessage.deleteMany({
      userId: req.user._id,
      projectId,
    });

    return res.status(200).json({
      success: true,
      message: "Chat history cleared successfully",
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getChatHistory,
  askTutor,
  clearChatHistory,
};
