import mongoose from "mongoose";
import Project from "../models/Project.js";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import quizService from "../services/quizService.js";
import masteryService from "../services/masteryService.js";
import { logActivity } from "../services/activityService.js";

/**
 * Answer Key Stripper Helper
 * Removes correctAnswerIndex and explanation from student-facing quiz objects before submission.
 */
function stripAnswerKey(quizDoc) {
  const obj = quizDoc.toObject ? quizDoc.toObject() : { ...quizDoc };
  if (Array.isArray(obj.questions)) {
    obj.questions = obj.questions.map((q, idx) => ({
      questionIndex: idx,
      questionId: q.questionId,
      type: q.type,
      conceptId: q.conceptId,
      questionText: q.questionText,
      options: q.options,
      citation: q.citation,
    }));
  }
  return obj;
}

/**
 * POST /api/projects/:projectId/quizzes/generate
 * Generate Adaptive Quiz for authenticated user & project
 */
export async function generateQuiz(req, res, next) {
  try {
    const { projectId } = req.params;
    const { conceptIds, difficulty, questionCount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: "Invalid project ID format" });
    }

    // 1. Verify Project Ownership
    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found or access denied" });
    }

    // 2. Validate difficulty and questionCount
    const validDifficulty = ["easy", "medium", "hard"].includes(difficulty) ? difficulty : "medium";
    const validQuestionCount = Math.min(20, Math.max(1, parseInt(questionCount, 10) || 5));

    // 3. Generate Adaptive Quiz
    const quiz = await quizService.generateAdaptiveQuiz({
      userId: req.user._id,
      projectId,
      conceptIds: Array.isArray(conceptIds) ? conceptIds : [],
      targetDifficulty: validDifficulty,
      questionCount: validQuestionCount,
    });

    // 4. Return Quiz with Answer Key Stripped
    return res.status(201).json({
      success: true,
      message: "Adaptive quiz generated successfully",
      quiz: stripAnswerKey(quiz),
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
}

/**
 * GET /api/projects/:projectId/quizzes
 * Get all quizzes for project (Answer Keys Stripped)
 */
export async function getQuizzes(req, res, next) {
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

    const quizzes = await Quiz.find({ userId: req.user._id, projectId }).sort({ createdAt: -1 });

    const safeQuizzes = quizzes.map(stripAnswerKey);

    return res.status(200).json({
      success: true,
      count: safeQuizzes.length,
      quizzes: safeQuizzes,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/projects/:projectId/quizzes/:quizId
 * Get single quiz by ID (Answer Key Strictly Stripped)
 */
export async function getQuizById(req, res, next) {
  try {
    const { projectId, quizId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ success: false, message: "Invalid project or quiz ID format" });
    }

    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found or access denied" });
    }

    const quiz = await Quiz.findOne({ _id: quizId, userId: req.user._id, projectId });
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found or access denied" });
    }

    return res.status(200).json({
      success: true,
      quiz: stripAnswerKey(quiz),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/projects/:projectId/quizzes/:quizId/attempts
 * Submit Quiz Attempt & Evaluate Server-Side
 */
export async function submitQuizAttempt(req, res, next) {
  try {
    const { projectId, quizId } = req.params;
    const { answers, timeSpentSeconds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ success: false, message: "Invalid project or quiz ID format" });
    }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Answers array is required and cannot be empty" });
    }

    // 1. Verify Project & Quiz Ownership
    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found or access denied" });
    }

    const quiz = await Quiz.findOne({ _id: quizId, userId: req.user._id, projectId });
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found or access denied" });
    }

    // 2. SERVER-SIDE EVALUATION against internal stored answer key
    const evaluatedAnswers = [];
    let correctCount = 0;

    quiz.questions.forEach((q, idx) => {
      const studentAns = answers.find((a) => a.questionIndex === idx);
      const selectedOptIdx = studentAns ? parseInt(studentAns.selectedOptionIndex, 10) : -1;
      const isCorrect = selectedOptIdx === q.correctAnswerIndex;

      if (isCorrect) correctCount += 1;

      evaluatedAnswers.push({
        questionIndex: idx,
        selectedOptionIndex: selectedOptIdx,
        isCorrect,
        conceptId: q.conceptId,
      });
    });

    const totalQuestions = quiz.questions.length;
    const score = parseFloat(((correctCount / totalQuestions) * 100).toFixed(2));
    const passed = score >= 70;

    // 3. Save QuizAttempt Document
    const quizAttempt = await QuizAttempt.create({
      userId: req.user._id,
      projectId,
      quizId,
      answers: evaluatedAnswers,
      score,
      correctCount,
      totalQuestions,
      passed,
      timeSpentSeconds: parseInt(timeSpentSeconds, 10) || 0,
    });

    // 4. Update Concept-Level Mastery Engine
    const updatedMastery = await masteryService.updateMasteryFromQuiz({
      userId: req.user._id,
      projectId,
      quizAttempt,
      questions: quiz.questions,
    });

    // Automatically log quiz_attempt activity with real timeSpentSeconds
    await logActivity({
      userId: req.user._id,
      projectId,
      activityType: "quiz_attempt",
      conceptId: quiz.questions[0]?.conceptId || "general",
      durationSeconds: quizAttempt.timeSpentSeconds || 60,
      metadata: { quizId: quiz._id, score: quizAttempt.score, passed: quizAttempt.passed },
    });

    // 5. Build Feedback Payload including correct answers and explanations after submission
    const feedbackAnswers = quiz.questions.map((q, idx) => {
      const evalItem = evaluatedAnswers.find((a) => a.questionIndex === idx);
      return {
        questionIndex: idx,
        questionText: q.questionText,
        options: q.options,
        selectedOptionIndex: evalItem ? evalItem.selectedOptionIndex : -1,
        correctAnswerIndex: q.correctAnswerIndex,
        isCorrect: evalItem ? evalItem.isCorrect : false,
        explanation: q.explanation,
        citation: q.citation,
        conceptId: q.conceptId,
      };
    });

    return res.status(200).json({
      success: true,
      message: "Quiz attempt evaluated successfully",
      attempt: {
        id: quizAttempt._id,
        score: quizAttempt.score,
        correctCount: quizAttempt.correctCount,
        totalQuestions: quizAttempt.totalQuestions,
        passed: quizAttempt.passed,
        timeSpentSeconds: quizAttempt.timeSpentSeconds,
        completedAt: quizAttempt.completedAt,
        answers: feedbackAnswers,
        updatedMastery,
      },
    });
  } catch (error) {
    next(error);
  }
}

export default {
  generateQuiz,
  getQuizzes,
  getQuizById,
  submitQuizAttempt,
};
