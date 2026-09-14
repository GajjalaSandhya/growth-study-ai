import mongoose from "mongoose";
import AssessmentAttempt from "../models/AssessmentAttempt.js";
import AiLog from "../models/AiLog.js";
import { retrieveRelevantContext } from "./ragService.js";
import llmService from "./llmService.js";
import masteryService from "./masteryService.js";
import config from "../config/env.js";

/**
 * GROUNDED OPEN-ENDED ASSESSMENT SERVICE
 */
export async function evaluateOpenAssessment({
  userId,
  projectId,
  prompt,
  answer,
  conceptId = "general",
}) {
  const startTime = Date.now();

  // 1. Perform Phase 5 RAG Evidence Retrieval using student prompt + answer
  const ragQuery = `${prompt} ${answer}`;
  const ragResult = await retrieveRelevantContext({
    userId,
    projectId,
    query: ragQuery,
    topK: 4,
  });

  // 2. Evidence Sufficiency Check (LLM Bypass on unsupported context)
  if (ragResult.unsupported || !ragResult.chunks || ragResult.chunks.length === 0) {
    const latencyMs = Date.now() - startTime;
    await AiLog.create({
      userId,
      projectId,
      requestType: "evaluation",
      model: config.tutorModel,
      latencyMs,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      grounded: false,
      status: "unsupported",
    });

    return {
      unsupported: true,
      grounded: false,
      message:
        "I could not find sufficient evidence in your uploaded study materials to evaluate this answer accurately.",
      evaluation: null,
      citations: [],
    };
  }

  // 3. Structured LLM Evaluation
  let llmResponse;
  try {
    llmResponse = await llmService.evaluateOpenAnswer({
      prompt,
      userAnswer: answer,
      contextChunks: ragResult.chunks,
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    await AiLog.create({
      userId,
      projectId,
      requestType: "evaluation",
      model: config.tutorModel,
      latencyMs,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      grounded: false,
      status: "failed",
      error: { type: err.type || "LLMEvaluationError", message: err.message },
    });
    throw err;
  }

  const { evaluation: rawEval, usage } = llmResponse;

  // 4. Backend Structured Output Validation (0-100 score bounds check)
  const clamp = (val, fallback = 75) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return fallback;
    return Math.min(100, Math.max(0, num));
  };

  const validatedEvaluation = {
    overallScore: clamp(rawEval.overallScore, 75),
    understanding: clamp(rawEval.understanding, 75),
    accuracy: clamp(rawEval.accuracy, 75),
    completeness: clamp(rawEval.completeness, 70),
    clarity: clamp(rawEval.clarity, 85),
    reasoning: clamp(rawEval.reasoning, 75),
    missingConcepts: Array.isArray(rawEval.missingConcepts) ? rawEval.missingConcepts : [],
    feedback:
      rawEval.feedback && typeof rawEval.feedback === "string"
        ? rawEval.feedback.trim()
        : "Evaluation completed.",
    improvements: Array.isArray(rawEval.improvements) ? rawEval.improvements : [],
  };

  // 5. Backend Citations Mapping from actual Phase 5 RAG chunks
  const citations = ragResult.citations || [];

  // 6. Save AssessmentAttempt Document
  const assessmentAttempt = await AssessmentAttempt.create({
    userId,
    projectId,
    conceptId: conceptId || "general",
    prompt,
    userAnswer: answer,
    evaluation: validatedEvaluation,
    citations,
  });

  // 7. Update ConceptMastery Engine
  const updatedMastery = await masteryService.updateMasteryFromAssessment({
    userId,
    projectId,
    assessmentAttempt,
  });

  // 8. Log AiLog Telemetry
  const latencyMs = Date.now() - startTime;
  await AiLog.create({
    userId,
    projectId,
    requestType: "evaluation",
    model: config.tutorModel,
    latencyMs,
    promptTokens: usage.promptTokens || 0,
    completionTokens: usage.completionTokens || 0,
    totalTokens: usage.totalTokens || 0,
    grounded: true,
    status: "success",
  });

  return {
    unsupported: false,
    grounded: true,
    attempt: assessmentAttempt,
    updatedMastery,
  };
}

export default {
  evaluateOpenAssessment,
};
