import mongoose from "mongoose";
import User from "../models/User.js";
import Space from "../models/Space.js";
import Project from "../models/Project.js";
import Material from "../models/Material.js";
import MaterialChunk from "../models/MaterialChunk.js";
import ConceptMastery from "../models/ConceptMastery.js";
import MasterySnapshot from "../models/MasterySnapshot.js";
import ChatMessage from "../models/ChatMessage.js";
import Quiz from "../models/Quiz.js";
import QuizAttempt from "../models/QuizAttempt.js";
import AssessmentAttempt from "../models/AssessmentAttempt.js";
import ActivityLog from "../models/ActivityLog.js";
import AiLog from "../models/AiLog.js";
import config from "../config/env.js";
import { calculateStudyStreak } from "./analyticsService.js";
import recommendationEngine from "./recommendationEngine.js";

/**
 * ADMIN SERVICE — PHASE 9
 */

/**
 * 1. System Health Diagnostics
 */
export async function getSystemHealth() {
  const uptimeSeconds = Math.floor(process.uptime());
  const mem = process.memoryUsage();

  const memUsage = {
    rss: `${(mem.rss / (1024 * 1024)).toFixed(1)} MB`,
    heapTotal: `${(mem.heapTotal / (1024 * 1024)).toFixed(1)} MB`,
    heapUsed: `${(mem.heapUsed / (1024 * 1024)).toFixed(1)} MB`,
  };

  const dbStateMap = {
    0: "DISCONNECTED",
    1: "CONNECTED",
    2: "CONNECTING",
    3: "DISCONNECTING",
  };

  const dbStatus = dbStateMap[mongoose.connection.readyState] || "UNKNOWN";

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentAiFailures24h = await AiLog.countDocuments({
    status: "failed",
    timestamp: { $gte: oneDayAgo },
  });

  return {
    server: {
      status: "UP",
      uptimeSeconds,
      memoryUsage: memUsage,
      nodeVersion: process.version,
      environment: config.nodeEnv,
    },
    database: {
      status: dbStatus,
      name: mongoose.connection.name || "studymate_ai",
    },
    vectorSearch: {
      engine: "MongoDB Atlas $vectorSearch / Local Fallback",
      status: "READY",
    },
    llmService: {
      status: "READY",
      model: config.tutorModel,
      mode: config.openaiApiKey ? "OpenAI Live" : "Development Offline Fallback",
    },
    recentAiFailures24h,
  };
}

/**
 * 2. Platform Overview Stats (Real DB Calculations)
 */
export async function getPlatformStats() {
  const totalUsers = await User.countDocuments({});
  const totalStudents = await User.countDocuments({ role: "student" });
  const totalAdmins = await User.countDocuments({ role: "admin" });
  const totalSpaces = await Space.countDocuments({});
  const totalProjects = await Project.countDocuments({});
  const totalMaterials = await Material.countDocuments({});
  const totalQuizzes = await Quiz.countDocuments({});
  const totalAssessments = await AssessmentAttempt.countDocuments({});
  const totalTutorMessages = await ChatMessage.countDocuments({ role: "user" });

  // Active Users (7d / 30d)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  const active7dUsers = await ActivityLog.distinct("userId", { timestamp: { $gte: sevenDaysAgo } });
  const active30dUsers = await ActivityLog.distinct("userId", {
    timestamp: { $gte: thirtyDaysAgo },
  });

  // Study Time Calculation
  const allActivities = await ActivityLog.find({}).lean();
  let quizSec = 0;
  let assessmentSec = 0;
  let tutorSec = 0;

  allActivities.forEach((act) => {
    const dur = act.durationSeconds || 0;
    if (act.activityType === "quiz_attempt") quizSec += dur;
    else if (act.activityType === "open_assessment") assessmentSec += dur;
    else if (act.activityType === "tutor_interaction") tutorSec += dur;
  });

  const totalPlatformStudyMinutes = Math.round((quizSec + assessmentSec + tutorSec) / 60);

  // Platform Concept Mastery
  const allConcepts = await ConceptMastery.find({}).lean();
  let platformAverage = 0;
  const distribution = { beginner: 0, intermediate: 0, advanced: 0 };

  if (allConcepts.length > 0) {
    const sumScore = allConcepts.reduce((acc, c) => acc + (c.masteryScore || 0), 0);
    platformAverage = parseFloat((sumScore / allConcepts.length).toFixed(1));

    allConcepts.forEach((c) => {
      const s = c.masteryScore || 0;
      if (s < 60) distribution.beginner++;
      else if (s < 80) distribution.intermediate++;
      else distribution.advanced++;
    });
  }

  // Quiz Performance
  const allQuizAttempts = await QuizAttempt.find({}).lean();
  const totalQuizAttempts = allQuizAttempts.length;
  const passedQuizAttempts = allQuizAttempts.filter((q) => q.passed).length;
  const globalPassRate =
    totalQuizAttempts > 0
      ? parseFloat(((passedQuizAttempts / totalQuizAttempts) * 100).toFixed(1))
      : 0;
  const globalAverageScore =
    totalQuizAttempts > 0
      ? parseFloat(
          (allQuizAttempts.reduce((acc, q) => acc + q.score, 0) / totalQuizAttempts).toFixed(1),
        )
      : 0;

  // Assessment Performance
  const allAssessments = await AssessmentAttempt.find({}).lean();
  const totalAssessmentAttempts = allAssessments.length;
  let platformAverageScore = 0;
  const averages6D = { understanding: 0, accuracy: 0, completeness: 0, clarity: 0, reasoning: 0 };

  if (totalAssessmentAttempts > 0) {
    platformAverageScore = parseFloat(
      (
        allAssessments.reduce((acc, a) => acc + (a.evaluation?.overallScore || 0), 0) /
        totalAssessmentAttempts
      ).toFixed(1),
    );
    averages6D.understanding = parseFloat(
      (
        allAssessments.reduce((acc, a) => acc + (a.evaluation?.understanding || 0), 0) /
        totalAssessmentAttempts
      ).toFixed(1),
    );
    averages6D.accuracy = parseFloat(
      (
        allAssessments.reduce((acc, a) => acc + (a.evaluation?.accuracy || 0), 0) /
        totalAssessmentAttempts
      ).toFixed(1),
    );
    averages6D.completeness = parseFloat(
      (
        allAssessments.reduce((acc, a) => acc + (a.evaluation?.completeness || 0), 0) /
        totalAssessmentAttempts
      ).toFixed(1),
    );
    averages6D.clarity = parseFloat(
      (
        allAssessments.reduce((acc, a) => acc + (a.evaluation?.clarity || 0), 0) /
        totalAssessmentAttempts
      ).toFixed(1),
    );
    averages6D.reasoning = parseFloat(
      (
        allAssessments.reduce((acc, a) => acc + (a.evaluation?.reasoning || 0), 0) /
        totalAssessmentAttempts
      ).toFixed(1),
    );
  }

  // AI Usage Summary
  const allAiLogs = await AiLog.find({}).lean();
  const totalAiRequests = allAiLogs.length;
  const totalTokens = allAiLogs.reduce((acc, log) => acc + (log.totalTokens || 0), 0);
  const avgLatencyMs =
    totalAiRequests > 0
      ? Math.round(allAiLogs.reduce((acc, log) => acc + (log.latencyMs || 0), 0) / totalAiRequests)
      : 0;

  const statusCounts = {
    success: allAiLogs.filter((l) => l.status === "success").length,
    unsupported: allAiLogs.filter((l) => l.status === "unsupported").length,
    failed: allAiLogs.filter((l) => l.status === "failed").length,
  };

  return {
    entityCounts: {
      totalUsers,
      totalStudents,
      totalAdmins,
      totalSpaces,
      totalProjects,
      totalMaterials,
      totalQuizzes,
      totalAssessments: totalAssessmentAttempts,
      totalTutorMessages,
    },
    activeUsers: {
      active7Days: active7dUsers.length,
      active30Days: active30dUsers.length,
    },
    studyTime: {
      totalPlatformStudyMinutes,
      quizMinutes: Math.round(quizSec / 60),
      assessmentMinutes: Math.round(assessmentSec / 60),
      tutorMinutes: Math.round(tutorSec / 60),
    },
    masterySummary: {
      platformAverage,
      distribution,
    },
    quizPerformance: {
      totalAttempts: totalQuizAttempts,
      globalPassRate,
      globalAverageScore,
    },
    assessmentPerformance: {
      totalAssessments: totalAssessmentAttempts,
      platformAverageScore,
      averages6D,
    },
    aiUsageSummary: {
      totalRequests: totalAiRequests,
      totalTokens,
      avgLatencyMs,
      statusCounts,
    },
    systemHealthSummary: {
      status: "UP",
    },
  };
}

/**
 * 3. User List with Pagination & Filtering
 */
export async function getUsersList({ page = 1, limit = 10, role, search }) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

  const query = {};
  if (role && ["student", "admin"].includes(role)) {
    query.role = role;
  }

  if (search && typeof search === "string" && search.trim()) {
    const cleanSearch = search.trim();
    query.$or = [{ name: new RegExp(cleanSearch, "i") }, { email: new RegExp(cleanSearch, "i") }];
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select("-password")
    .sort({ createdAt: -1 })
    .skip((p - 1) * l)
    .limit(l)
    .lean();

  return {
    pagination: {
      total,
      page: p,
      limit: l,
      pages: Math.ceil(total / l) || 1,
    },
    users: users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatarInitials: u.avatarInitials,
      joinedAt: u.joinedAt || u.createdAt,
    })),
  };
}

/**
 * 4. Full Aggregated Student Learning Journey
 */
export async function getUserJourney({ userId }) {
  const userObjId = new mongoose.Types.ObjectId(userId);

  const userDoc = await User.findById(userObjId).select("-password").lean();
  if (!userDoc) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  // Fetch actual aggregated collections/data
  const spaces = await Space.find({ userId: userObjId }).sort({ createdAt: -1 }).lean();
  const projects = await Project.find({ userId: userObjId }).sort({ createdAt: -1 }).lean();
  const materials = await Material.find({ userId: userObjId })
    .select("-filePath")
    .sort({ createdAt: -1 })
    .lean();
  const conceptMastery = await ConceptMastery.find({ userId: userObjId })
    .sort({ masteryScore: 1 })
    .lean();
  const growthSnapshots = await MasterySnapshot.find({ userId: userObjId })
    .sort({ date: -1 })
    .lean();
  const quizAttempts = await QuizAttempt.find({ userId: userObjId })
    .sort({ completedAt: -1 })
    .lean();
  const assessmentAttempts = await AssessmentAttempt.find({ userId: userObjId })
    .sort({ createdAt: -1 })
    .lean();
  const tutorMessages = await ChatMessage.find({ userId: userObjId }).sort({ createdAt: 1 }).lean();
  const recentActivity = await ActivityLog.find({ userId: userObjId })
    .sort({ timestamp: -1 })
    .limit(15)
    .lean();

  // Active Recommendations across user projects
  const activeRecommendations = [];
  for (const proj of projects) {
    const recs = await recommendationEngine.getPersonalizedRecommendations({
      userId: userObjId.toString(),
      projectId: proj._id.toString(),
    });
    recs.forEach((r) => activeRecommendations.push({ ...r, projectId: proj._id }));
  }

  // Calculate Tutor Grounded Ratio
  const userQuestions = tutorMessages.filter((m) => m.role === "user").length;
  const groundedAnswers = tutorMessages.filter((m) => m.role === "assistant" && m.grounded).length;
  const groundedRatio =
    userQuestions > 0 ? parseFloat((groundedAnswers / userQuestions).toFixed(2)) : 1.0;

  // Study Stats Calculation
  const activityDates = recentActivity.map((a) => a.timestamp);
  const streakDays = calculateStudyStreak(activityDates);
  const totalStudySeconds = recentActivity.reduce((acc, a) => acc + (a.durationSeconds || 0), 0);
  const totalStudyMinutes = Math.round(totalStudySeconds / 60);

  return {
    user: {
      id: userDoc._id,
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
      avatarInitials: userDoc.avatarInitials,
      joinedAt: userDoc.joinedAt || userDoc.createdAt,
    },
    spaces: spaces.map((s) => ({
      id: s._id,
      name: s.name,
      description: s.description,
      projectCount: s.projectCount,
    })),
    projects: projects.map((p) => ({
      id: p._id,
      spaceId: p.spaceId,
      name: p.name,
      subject: p.subject,
      status: p.status,
    })),
    materials: materials.map((m) => ({
      id: m._id,
      projectId: m.projectId,
      name: m.name,
      sizeMb: m.sizeMb,
      status: m.status,
    })),
    conceptMastery: conceptMastery.map((c) => ({
      conceptId: c.conceptId,
      conceptName: c.conceptName,
      masteryScore: c.masteryScore,
    })),
    growthSnapshots: growthSnapshots.map((s) => ({
      conceptId: s.conceptId,
      masteryScore: s.masteryScore,
      date: s.date,
    })),
    quizAttempts: quizAttempts.map((q) => ({
      id: q._id,
      projectId: q.projectId,
      score: q.score,
      passed: q.passed,
      completedAt: q.completedAt,
    })),
    assessmentAttempts: assessmentAttempts.map((a) => ({
      id: a._id,
      projectId: a.projectId,
      conceptId: a.conceptId,
      overallScore: a.evaluation?.overallScore,
      createdAt: a.createdAt,
    })),
    tutorActivity: {
      totalQuestionsAsked: userQuestions,
      groundedRatio,
    },
    recentActivity: recentActivity.map((a) => ({
      activityType: a.activityType,
      conceptId: a.conceptId,
      durationSeconds: a.durationSeconds,
      timestamp: a.timestamp,
    })),
    activeRecommendations,
    studyStats: {
      streakDays,
      totalStudyMinutes,
    },
  };
}

/**
 * 5. Update User Role
 */
export async function updateUserRole({ userId, role, currentAdminId }) {
  if (!["student", "admin"].includes(role)) {
    const err = new Error("Invalid role specified. Must be 'student' or 'admin'");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  // Prevent self-demotion
  if (user._id.toString() === currentAdminId.toString() && role !== "admin") {
    const err = new Error("Administrators cannot demote their own account");
    err.statusCode = 400;
    throw err;
  }

  // Prevent demoting primary administrator
  if (user.email === config.primaryAdminEmail && role !== "admin") {
    const err = new Error("Cannot demote the protected primary administrator");
    err.statusCode = 403;
    throw err;
  }

  user.role = role;
  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

/**
 * 6. Delete User with Cascade Cleanup (13 Collections)
 */
export async function deleteUserCascade({ userId, currentAdminId }) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  // Prevent self-deletion
  if (user._id.toString() === currentAdminId.toString()) {
    const err = new Error("Administrators cannot delete their own account");
    err.statusCode = 400;
    throw err;
  }

  // Prevent deleting primary administrator
  if (user.email === config.primaryAdminEmail) {
    const err = new Error("Cannot delete the protected primary administrator");
    err.statusCode = 403;
    throw err;
  }

  const targetId = user._id;

  // Execute cascade deletion across all 13 collections
  await User.deleteOne({ _id: targetId });
  await Space.deleteMany({ userId: targetId });
  await Project.deleteMany({ userId: targetId });
  await Material.deleteMany({ userId: targetId });
  await MaterialChunk.deleteMany({ userId: targetId });
  await ConceptMastery.deleteMany({ userId: targetId });
  await MasterySnapshot.deleteMany({ userId: targetId });
  await ChatMessage.deleteMany({ userId: targetId });
  await Quiz.deleteMany({ userId: targetId });
  await QuizAttempt.deleteMany({ userId: targetId });
  await AssessmentAttempt.deleteMany({ userId: targetId });
  await ActivityLog.deleteMany({ userId: targetId });
  await AiLog.deleteMany({ userId: targetId });

  return {
    success: true,
    message: "User and all associated data deleted successfully",
  };
}

/**
 * 7. AI Telemetry Query
 */
export async function getAiTelemetry({
  requestType,
  status,
  startDate,
  endDate,
  page = 1,
  limit = 10,
}) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

  const query = {};
  if (requestType && ["tutor", "quiz", "assessment"].includes(requestType)) {
    query.requestType = requestType;
  }

  if (status && ["success", "unsupported", "failed"].includes(status)) {
    query.status = status;
  }

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  const total = await AiLog.countDocuments(query);
  const logs = await AiLog.find(query)
    .sort({ timestamp: -1 })
    .skip((p - 1) * l)
    .limit(l)
    .lean();

  const allFiltered = await AiLog.find(query).lean();
  const totalRequests = allFiltered.length;
  const promptTokens = allFiltered.reduce((acc, log) => acc + (log.promptTokens || 0), 0);
  const completionTokens = allFiltered.reduce((acc, log) => acc + (log.completionTokens || 0), 0);
  const totalTokens = allFiltered.reduce((acc, log) => acc + (log.totalTokens || 0), 0);
  const avgLatencyMs =
    totalRequests > 0
      ? Math.round(allFiltered.reduce((acc, log) => acc + (log.latencyMs || 0), 0) / totalRequests)
      : 0;

  return {
    summary: {
      totalRequests,
      successRequests: allFiltered.filter((l) => l.status === "success").length,
      unsupportedRequests: allFiltered.filter((l) => l.status === "unsupported").length,
      failedRequests: allFiltered.filter((l) => l.status === "failed").length,
      avgLatencyMs,
      tokens: {
        promptTokens,
        completionTokens,
        totalTokens,
      },
    },
    pagination: {
      total,
      page: p,
      limit: l,
      pages: Math.ceil(total / l) || 1,
    },
    logs: logs.map((log) => ({
      id: log._id,
      userId: log.userId,
      projectId: log.projectId,
      requestType: log.requestType,
      model: log.model,
      latencyMs: log.latencyMs,
      promptTokens: log.promptTokens,
      completionTokens: log.completionTokens,
      totalTokens: log.totalTokens,
      grounded: log.grounded,
      status: log.status,
      error: log.error,
      timestamp: log.timestamp,
    })),
  };
}

/**
 * 8. AI Evaluation Metrics (Refusal formula strictly tutor-scoped)
 */
export async function getAiEvaluationMetrics() {
  const totalTutorRequests = await AiLog.countDocuments({ requestType: "tutor" });
  const unsupportedTutorRequests = await AiLog.countDocuments({
    requestType: "tutor",
    status: "unsupported",
  });
  const groundedTutorRequests = await AiLog.countDocuments({
    requestType: "tutor",
    grounded: true,
  });

  const tutorRefusalRate =
    totalTutorRequests > 0
      ? parseFloat((unsupportedTutorRequests / totalTutorRequests).toFixed(4))
      : 0;
  const tutorGroundednessRatio =
    totalTutorRequests > 0
      ? parseFloat((groundedTutorRequests / totalTutorRequests).toFixed(4))
      : 1.0;

  // 6D Assessment Averages
  const assessments = await AssessmentAttempt.find({}).lean();
  const totalAssessments = assessments.length;
  const averages6D = {
    overall: 0,
    understanding: 0,
    accuracy: 0,
    completeness: 0,
    clarity: 0,
    reasoning: 0,
  };

  if (totalAssessments > 0) {
    averages6D.overall = parseFloat(
      (
        assessments.reduce((acc, a) => acc + (a.evaluation?.overallScore || 0), 0) /
        totalAssessments
      ).toFixed(1),
    );
    averages6D.understanding = parseFloat(
      (
        assessments.reduce((acc, a) => acc + (a.evaluation?.understanding || 0), 0) /
        totalAssessments
      ).toFixed(1),
    );
    averages6D.accuracy = parseFloat(
      (
        assessments.reduce((acc, a) => acc + (a.evaluation?.accuracy || 0), 0) / totalAssessments
      ).toFixed(1),
    );
    averages6D.completeness = parseFloat(
      (
        assessments.reduce((acc, a) => acc + (a.evaluation?.completeness || 0), 0) /
        totalAssessments
      ).toFixed(1),
    );
    averages6D.clarity = parseFloat(
      (
        assessments.reduce((acc, a) => acc + (a.evaluation?.clarity || 0), 0) / totalAssessments
      ).toFixed(1),
    );
    averages6D.reasoning = parseFloat(
      (
        assessments.reduce((acc, a) => acc + (a.evaluation?.reasoning || 0), 0) / totalAssessments
      ).toFixed(1),
    );
  }

  // Error Breakdown
  const failedLogs = await AiLog.find({ status: "failed" }).lean();
  const errorTypeMap = {};
  failedLogs.forEach((l) => {
    const errType = l.error?.type || "UnknownError";
    errorTypeMap[errType] = (errorTypeMap[errType] || 0) + 1;
  });

  return {
    tutorMetrics: {
      totalTutorRequests,
      unsupportedTutorRequests,
      groundedTutorRequests,
      tutorRefusalRate,
      tutorGroundednessRatio,
    },
    assessment6DMetrics: {
      totalAssessments,
      averages: averages6D,
    },
    errorBreakdown: errorTypeMap,
  };
}

export default {
  getSystemHealth,
  getPlatformStats,
  getUsersList,
  getUserJourney,
  updateUserRole,
  deleteUserCascade,
  getAiTelemetry,
  getAiEvaluationMetrics,
};
