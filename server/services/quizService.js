import mongoose from "mongoose";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import AssessmentAttempt from "../models/AssessmentAttempt.js";
import ConceptMastery from "../models/ConceptMastery.js";
import AiLog from "../models/AiLog.js";
import { retrieveRelevantContext } from "./ragService.js";
import llmService from "./llmService.js";
import config from "../config/env.js";
import logger from "../utils/logger.js";

/**
 * ADAPTIVE QUIZ GENERATION ENGINE
 */
export async function generateAdaptiveQuiz({
  userId,
  projectId,
  conceptIds = [],
  targetDifficulty = "medium",
  questionCount = 5,
}) {
  const startTime = Date.now();
  const userObjId = new mongoose.Types.ObjectId(userId);
  const projectObjId = new mongoose.Types.ObjectId(projectId);

  // 1. Assemble Multi-Signal Adaptive Context
  const conceptRecords = await ConceptMastery.find({
    userId: userObjId,
    projectId: projectObjId,
  }).lean();
  const weakConcepts = conceptRecords.filter((c) => c.masteryScore < 60).map((c) => c.conceptId);
  const recentMistakes = conceptRecords.flatMap((c) =>
    (c.recentMistakes || []).map((m) => m.questionText),
  );

  // Fetch recent quiz attempts for performance signal
  const recentQuizAttempts = await QuizAttempt.find({ userId: userObjId, projectId: projectObjId })
    .sort({ completedAt: -1 })
    .limit(5)
    .lean();

  // Fetch recent open-ended assessments for assessment signal
  const recentAssessments = await AssessmentAttempt.find({
    userId: userObjId,
    projectId: projectObjId,
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  // Fetch question history from existing quizzes to prevent repetitive questions
  const previousQuizzes = await Quiz.find({ userId: userObjId, projectId: projectObjId }).lean();
  const questionHistory = previousQuizzes.flatMap((q) =>
    (q.questions || []).map((item) => item.questionText),
  );

  const targetConceptsList =
    conceptIds && conceptIds.length > 0
      ? conceptIds
      : weakConcepts.length > 0
        ? weakConcepts
        : conceptRecords.map((c) => c.conceptId);

  const adaptiveContext = {
    targetConcepts: targetConceptsList,
    targetDifficulty,
    weakConcepts,
    recentMistakesCount: recentMistakes.length,
    recentMistakesSample: recentMistakes.slice(0, 5),
    questionHistoryCount: questionHistory.length,
    questionHistorySample: questionHistory.slice(0, 20), // Suppression list
    recentQuizAvgScore:
      recentQuizAttempts.length > 0
        ? recentQuizAttempts.reduce((acc, a) => acc + a.score, 0) / recentQuizAttempts.length
        : null,
    recentAssessmentAvgScore:
      recentAssessments.length > 0
        ? recentAssessments.reduce((acc, a) => acc + (a.evaluation?.overallScore || 0), 0) /
          recentAssessments.length
        : null,
  };

  // 2. Perform Phase 5 RAG Retrieval using target concepts / project context
  const formattedQuery =
    targetConceptsList.map((c) => c.replace(/[-_]/g, " ")).join(" ") + " study material concepts";
  const ragResult = await retrieveRelevantContext({
    userId,
    projectId,
    query: formattedQuery,
    topK: Math.max(6, questionCount * 2),
    minScore: 0.2,
  });

  if (ragResult.unsupported || !ragResult.chunks || ragResult.chunks.length === 0) {
    const latencyMs = Date.now() - startTime;
    await AiLog.create({
      userId,
      projectId,
      requestType: "quiz",
      model: config.tutorModel,
      latencyMs,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      grounded: false,
      status: "unsupported",
    });

    const error = new Error(
      "Insufficient study material evidence to generate a quiz for this project.",
    );
    error.statusCode = 400;
    throw error;
  }

  // 3. Structured LLM Generation
  let llmResponse;
  try {
    llmResponse = await llmService.generateStructuredQuiz({
      adaptiveContext,
      contextChunks: ragResult.chunks,
      questionCount,
      difficulty: targetDifficulty,
    });
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    await AiLog.create({
      userId,
      projectId,
      requestType: "quiz",
      model: config.tutorModel,
      latencyMs,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      grounded: false,
      status: "failed",
      error: { type: err.type || "LLMQuizError", message: err.message },
    });
    throw err;
  }

  const { quizData, usage } = llmResponse;
  const rawQuestions = quizData.questions || [];

  // 4. Backend Schema & Concept ID Security Validation
  const validatedQuestions = [];
  const validConceptSet = new Set(targetConceptsList.length > 0 ? targetConceptsList : ["general"]);

  for (let i = 0; i < rawQuestions.length; i++) {
    const q = rawQuestions[i];
    const type = q.type === "true-false" ? "true-false" : "multiple-choice";
    const options = Array.isArray(q.options) ? q.options : [];

    // Option count validation (4 for MCQ, 2 for T/F)
    if (type === "multiple-choice" && options.length !== 4) {
      options.length = 4;
      while (options.length < 4) options.push(`Option ${options.length + 1}`);
    } else if (type === "true-false" && options.length !== 2) {
      options.splice(0, options.length, "True", "False");
    }

    // Correct Answer Index bounds check
    let correctIdx = parseInt(q.correctAnswerIndex, 10);
    if (isNaN(correctIdx) || correctIdx < 0 || correctIdx >= options.length) {
      correctIdx = 0;
    }

    // Concept ID Security: Validate against project concepts or assign primary target concept
    let conceptId = q.conceptId ? String(q.conceptId).trim().toLowerCase() : "";
    if (!conceptId || (!validConceptSet.has(conceptId) && targetConceptsList.length > 0)) {
      conceptId = targetConceptsList[0] || "general";
    }

    // Citation Validation: Construct from actual Phase 5 RAG chunks
    const chunkIdx =
      typeof q.chunkIndex === "number" && q.chunkIndex < ragResult.citations.length
        ? q.chunkIndex
        : i % ragResult.citations.length;
    const citation = ragResult.citations[chunkIdx] || ragResult.citations[0] || null;

    validatedQuestions.push({
      questionId: `q_${Date.now()}_${i + 1}`,
      type,
      conceptId,
      questionText: q.questionText || `Question ${i + 1}`,
      options,
      correctAnswerIndex: correctIdx,
      explanation: q.explanation || "Derived strictly from uploaded study materials.",
      citation,
    });
  }

  // 5. Persist Quiz Document
  const quizTitle = quizData.title || `Adaptive Quiz: ${targetConceptsList.join(", ")}`;
  const quiz = await Quiz.create({
    userId,
    projectId,
    title: quizTitle,
    conceptIds: targetConceptsList,
    difficulty: targetDifficulty,
    questions: validatedQuestions,
    questionCount: validatedQuestions.length,
  });

  // 6. Log AiLog Telemetry
  const latencyMs = Date.now() - startTime;
  await AiLog.create({
    userId,
    projectId,
    requestType: "quiz",
    model: config.tutorModel,
    latencyMs,
    promptTokens: usage.promptTokens || 0,
    completionTokens: usage.completionTokens || 0,
    totalTokens: usage.totalTokens || 0,
    grounded: true,
    status: "success",
  });

  return quiz;
}

export default {
  generateAdaptiveQuiz,
};
