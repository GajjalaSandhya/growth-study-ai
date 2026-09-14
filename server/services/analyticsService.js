import mongoose from "mongoose";
import Project from "../models/Project.js";
import Material from "../models/Material.js";
import ConceptMastery from "../models/ConceptMastery.js";
import QuizAttempt from "../models/QuizAttempt.js";
import AssessmentAttempt from "../models/AssessmentAttempt.js";
import ActivityLog from "../models/ActivityLog.js";
import MasterySnapshot from "../models/MasterySnapshot.js";
import ChatMessage from "../models/ChatMessage.js";

/**
 * PROJECT & GLOBAL GROWTH ANALYTICS ENGINE
 */

/**
 * Calculate active study streak (consecutive calendar days with activity)
 */

export function calculateStudyStreak(activityDates) {
  if (!activityDates || activityDates.length === 0) return 0;

  // Extract unique sorted YYYY-MM-DD dates in descending order
  const uniqueDates = Array.from(
    new Set(activityDates.map((d) => new Date(d).toISOString().split("T")[0])),
  ).sort((a, b) => (a < b ? 1 : -1));

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // If no activity today or yesterday, streak is broken (0)
  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 1;
  let currentDate = new Date(uniqueDates[0]);

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i]);
    const diffDays = Math.round((currentDate - prevDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak += 1;
      currentDate = prevDate;
    } else if (diffDays > 1) {
      break;
    }
  }

  return streak;
}

/**
 * Get Project-Level Learning-Loop Analytics
 */
export async function getProjectAnalytics({ userId, projectId }) {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const projectObjId = new mongoose.Types.ObjectId(projectId);

  // 1. Concept Mastery Distribution & Current Derived Project Mastery
  const concepts = await ConceptMastery.find({ userId: userObjId, projectId: projectObjId }).lean();
  let currentScore = 0;
  const distribution = { beginner: 0, intermediate: 0, advanced: 0 };

  if (concepts.length > 0) {
    const totalScore = concepts.reduce((acc, c) => acc + (c.masteryScore || 0), 0);
    currentScore = parseFloat((totalScore / concepts.length).toFixed(2));

    concepts.forEach((c) => {
      const s = c.masteryScore || 0;
      if (s < 60) distribution.beginner++;
      else if (s < 80) distribution.intermediate++;
      else distribution.advanced++;
    });
  }

  // 2. Historical Mastery Growth & Trend (Previous vs Current)
  const snapshots = await MasterySnapshot.find({ userId: userObjId, projectId: projectObjId })
    .sort({ date: -1 })
    .lean();

  let previousScore = null;
  let delta = null;
  let trend = "stable";

  if (snapshots.length > 0) {
    const boundaryDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const boundarySnapshot = snapshots.find((s) => s.date <= boundaryDate);

    if (boundarySnapshot) {
      previousScore = boundarySnapshot.masteryScore;
    } else {
      const oldestSnapshot = snapshots[snapshots.length - 1];
      const oldestDate = new Date(oldestSnapshot.date);
      const daysOld = (new Date() - oldestDate) / (1000 * 60 * 60 * 24);
      if (daysOld < 7) {
        previousScore = oldestSnapshot.masteryScore;
      }
    }

    if (previousScore !== null) {
      delta = parseFloat((currentScore - previousScore).toFixed(2));
      trend = delta > 0 ? "improving" : delta < 0 ? "declining" : "stable";
    }
  }

  // 3. Quiz Performance Metrics
  const quizAttempts = await QuizAttempt.find({
    userId: userObjId,
    projectId: projectObjId,
  }).lean();
  const totalQuizAttempts = quizAttempts.length;
  const passedAttempts = quizAttempts.filter((a) => a.passed).length;
  const passRate =
    totalQuizAttempts > 0 ? parseFloat(((passedAttempts / totalQuizAttempts) * 100).toFixed(1)) : 0;
  const avgQuizScore =
    totalQuizAttempts > 0
      ? parseFloat(
          (quizAttempts.reduce((acc, a) => acc + a.score, 0) / totalQuizAttempts).toFixed(1),
        )
      : 0;

  // 4. Open-Ended Assessment Metrics & 6D Evaluation Averages
  const assessments = await AssessmentAttempt.find({
    userId: userObjId,
    projectId: projectObjId,
  }).lean();
  const totalAssessments = assessments.length;
  let avgAssessmentScore = 0;
  const averages6D = { understanding: 0, accuracy: 0, completeness: 0, clarity: 0, reasoning: 0 };

  if (totalAssessments > 0) {
    avgAssessmentScore = parseFloat(
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

  // 5. Tutor Activity Metrics
  const tutorMessages = await ChatMessage.find({
    userId: userObjId,
    projectId: projectObjId,
    role: "user",
  }).lean();
  const totalQuestionsAsked = tutorMessages.length;
  const groundedAnswers = await ChatMessage.find({
    userId: userObjId,
    projectId: projectObjId,
    role: "assistant",
    grounded: true,
  }).lean();
  const groundedRatio =
    tutorMessages.length > 0
      ? parseFloat((groundedAnswers.length / tutorMessages.length).toFixed(2))
      : 1.0;

  // 6. Materials Stats
  const materials = await Material.find({ userId: userObjId, projectId: projectObjId }).lean();
  const totalMaterials = materials.length;
  const totalPages = materials.reduce((acc, m) => acc + (m.pages || 0), 0);

  // 7. Study Time Calculation (Only Meaningful Duration Activities)
  const activities = await ActivityLog.find({ userId: userObjId, projectId: projectObjId }).lean();
  let quizSeconds = 0;
  let assessmentSeconds = 0;
  let tutorSeconds = 0;

  activities.forEach((act) => {
    const duration = act.durationSeconds || 0;
    if (act.activityType === "quiz_attempt") quizSeconds += duration;
    else if (act.activityType === "open_assessment") assessmentSeconds += duration;
    else if (act.activityType === "tutor_interaction") tutorSeconds += duration;
  });

  const totalStudySeconds = quizSeconds + assessmentSeconds + tutorSeconds;
  const totalStudyMinutes = Math.round(totalStudySeconds / 60);

  // 8. Chronological Activity Stream (Top 10 Recent Activities)
  const recentActivities = await ActivityLog.find({ userId: userObjId, projectId: projectObjId })
    .sort({ timestamp: -1 })
    .limit(10)
    .lean();

  return {
    projectId,
    mastery: {
      currentScore,
      previousScore,
      delta,
      trend,
    },
    conceptDistribution: distribution,
    quizPerformance: {
      totalAttempts: totalQuizAttempts,
      passedAttempts,
      passRate,
      averageScore: avgQuizScore,
    },
    assessmentPerformance: {
      totalAssessments,
      averageScore: avgAssessmentScore,
      averages6D,
    },
    tutorActivity: {
      totalQuestionsAsked,
      groundedRatio,
    },
    materials: {
      totalMaterials,
      totalPages,
    },
    studyTime: {
      totalMinutes: totalStudyMinutes,
      byActivity: {
        quizMinutes: Math.round(quizSeconds / 60),
        assessmentMinutes: Math.round(assessmentSeconds / 60),
        tutorMinutes: Math.round(tutorSeconds / 60),
      },
    },
    recentActivity: recentActivities.map((a) => ({
      activityType: a.activityType,
      conceptId: a.conceptId,
      durationSeconds: a.durationSeconds,
      timestamp: a.timestamp,
    })),
  };
}

/**
 * Get Global Growth & Study Streak Analytics across all projects
 */
export async function getGlobalGrowthAnalytics({ userId }) {
  const userObjId = new mongoose.Types.ObjectId(userId);

  // 1. Fetch all user concepts across projects
  const concepts = await ConceptMastery.find({ userId: userObjId }).lean();
  let currentMastery = 0;
  if (concepts.length > 0) {
    const totalScore = concepts.reduce((acc, c) => acc + (c.masteryScore || 0), 0);
    currentMastery = parseFloat((totalScore / concepts.length).toFixed(2));
  }

  // 2. Fetch historical snapshots for global growth delta
  const snapshots = await MasterySnapshot.find({ userId: userObjId }).sort({ date: -1 }).lean();
  let previousMastery = null;
  let delta = null;
  let deltaPercentage = null;
  let trend = "stable";

  if (snapshots.length > 0) {
    const boundaryDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const boundarySnapshot = snapshots.find((s) => s.date <= boundaryDate);

    if (boundarySnapshot) {
      previousMastery = boundarySnapshot.masteryScore;
    } else {
      const oldestSnapshot = snapshots[snapshots.length - 1];
      const oldestDate = new Date(oldestSnapshot.date);
      const daysOld = (new Date() - oldestDate) / (1000 * 60 * 60 * 24);
      if (daysOld < 7) {
        previousMastery = oldestSnapshot.masteryScore;
      }
    }

    if (previousMastery !== null) {
      delta = parseFloat((currentMastery - previousMastery).toFixed(2));
      deltaPercentage =
        previousMastery > 0 ? parseFloat(((delta / previousMastery) * 100).toFixed(2)) : 0;
      trend = delta > 0 ? "improving" : delta < 0 ? "declining" : "stable";
    }
  }

  // 3. Active Study Streak Calculation from real ActivityLogs
  const allActivities = await ActivityLog.find({ userId: userObjId })
    .sort({ timestamp: -1 })
    .lean();
  const activityDates = allActivities.map((a) => a.timestamp);
  const streakDays = calculateStudyStreak(activityDates);

  // 4. Study Duration Calculation
  const totalStudySeconds = allActivities.reduce((acc, a) => acc + (a.durationSeconds || 0), 0);
  const totalStudyMinutes = Math.round(totalStudySeconds / 60);

  // 5. Global Quiz Performance
  const allQuizzes = await QuizAttempt.find({ userId: userObjId }).lean();
  const totalQuizzesTaken = allQuizzes.length;
  const passedQuizzes = allQuizzes.filter((q) => q.passed).length;
  const globalPassRate =
    totalQuizzesTaken > 0 ? parseFloat(((passedQuizzes / totalQuizzesTaken) * 100).toFixed(1)) : 0;
  const globalAverageScore =
    totalQuizzesTaken > 0
      ? parseFloat((allQuizzes.reduce((acc, q) => acc + q.score, 0) / totalQuizzesTaken).toFixed(1))
      : 0;

  // 6. Total Active Projects
  const userProjects = await Project.find({ userId: userObjId }).lean();

  return {
    userId,
    growth: {
      currentMastery,
      previousMastery,
      deltaPercentage,
      trend,
    },
    streakDays,
    totalStudyMinutes,
    totalQuizzesTaken,
    globalPassRate,
    globalAverageScore,
    totalActiveProjects: userProjects.length,
  };
}

export default {
  calculateStudyStreak,
  getProjectAnalytics,
  getGlobalGrowthAnalytics,
};
