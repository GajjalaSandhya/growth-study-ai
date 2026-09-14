import mongoose from "mongoose";
import ConceptMastery from "../models/ConceptMastery.js";
import QuizAttempt from "../models/QuizAttempt.js";
import AssessmentAttempt from "../models/AssessmentAttempt.js";
import MasterySnapshot from "../models/MasterySnapshot.js";

/**
 * DETERMINISTIC MULTI-SIGNAL RECOMMENDATION ENGINE (100% CODE-BASED, ZERO LLM, ZERO AILOG)
 *
 * Signals Evaluated:
 * 1. Declining Mastery Trend (Historical Snapshot Delta <= -5) -> Trigger "review_material" (Priority: High)
 * 2. Weak Concept Mastery (< 60%) -> Trigger "adaptive_quiz" (Priority: High)
 * 3. Recent Question Mistakes (> 0 mistakes) -> Trigger "tutor_practice" (Priority: High)
 * 4. Assessment Missing Concepts (Mapped deterministically to valid project concepts) -> Trigger "open_assessment" (Priority: Medium)
 * 5. Concept Inactivity (>= 5 days since last practice) -> Trigger "review_material" (Priority: Medium)
 * 6. High Mastery (>= 80%) -> Trigger "open_assessment" challenge (Priority: Low)
 */
export async function getPersonalizedRecommendations({ userId, projectId }) {
  const userObjId = new mongoose.Types.ObjectId(userId);
  const projectObjId = new mongoose.Types.ObjectId(projectId);

  // 1. Fetch valid project-owned concept records strictly for this user & project
  const concepts = await ConceptMastery.find({ userId: userObjId, projectId: projectObjId }).lean();

  // Create lookup maps for deterministic concept validation & string matching
  const validConceptIds = new Set(concepts.map((c) => c.conceptId));
  const conceptNameMap = {};
  concepts.forEach((c) => {
    conceptNameMap[c.conceptId] = c.conceptName || c.conceptId;
    if (c.conceptName) {
      conceptNameMap[c.conceptName.toLowerCase().trim()] = c.conceptId;
    }
  });

  const recentQuizAttempts = await QuizAttempt.find({ userId: userObjId, projectId: projectObjId })
    .sort({ completedAt: -1 })
    .limit(5)
    .lean();
  const recentAssessments = await AssessmentAttempt.find({
    userId: userObjId,
    projectId: projectObjId,
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const snapshots = await MasterySnapshot.find({ userId: userObjId, projectId: projectObjId })
    .sort({ date: -1 })
    .lean();

  const recommendations = [];
  const now = new Date();
  const boundaryDateStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Process each valid concept deterministically
  for (const concept of concepts) {
    const conceptId = concept.conceptId;
    const conceptName = concept.conceptName || conceptId;
    const score = concept.masteryScore || 0;
    const lastPracticed = concept.lastPracticedAt ? new Date(concept.lastPracticedAt) : new Date(0);
    const daysInactive = Math.floor((now - lastPracticed) / (1000 * 60 * 60 * 24));

    // Find historical snapshot for 7-day delta calculation
    const conceptSnapshots = snapshots.filter((s) => s.conceptId === conceptId);
    let olderSnapshot = conceptSnapshots.find((s) => s.date <= boundaryDateStr);
    if (!olderSnapshot && conceptSnapshots.length > 1) {
      const oldest = conceptSnapshots[conceptSnapshots.length - 1];
      const daysOld = (now - new Date(oldest.date)) / (1000 * 60 * 60 * 24);
      if (daysOld < 7) {
        olderSnapshot = oldest;
      }
    }
    const delta = olderSnapshot ? score - olderSnapshot.masteryScore : 0;

    // Signal 1: Declining Mastery Trend (Delta <= -5)
    if (delta <= -5) {
      recommendations.push({
        priority: "high",
        type: "review_material",
        conceptId,
        title: `Reverse Mastery Decline in ${conceptName}`,
        action: `Review study materials covering ${conceptName} to reinforce key definitions.`,
        reason: `Mastery declined by ${Math.abs(delta).toFixed(1)}% since previous practice.`,
        estimatedMinutes: 10,
      });
    }

    // Signal 2: Weak Concept Mastery (< 60%)
    if (score < 60) {
      recommendations.push({
        priority: "high",
        type: "adaptive_quiz",
        conceptId,
        title: `Practice ${conceptName} Concepts`,
        action: `Take an adaptive 5-question quiz focusing on ${conceptName}.`,
        reason: `Current concept mastery is ${score.toFixed(1)}% (below target threshold of 60%).`,
        estimatedMinutes: 8,
      });
    }

    // Signal 3: Recent Mistakes
    if (concept.recentMistakes && concept.recentMistakes.length > 0) {
      const topMistake = concept.recentMistakes[0];
      recommendations.push({
        priority: "high",
        type: "tutor_practice",
        conceptId,
        title: `Review Missed Question in ${conceptName}`,
        action: `Ask the Tutor: "Explain the answer to: '${topMistake.questionText.slice(0, 60)}...'"`,
        reason: `You recently answered this question incorrectly during a quiz attempt.`,
        estimatedMinutes: 5,
      });
    }

    // Signal 4: Concept Inactivity (>= 5 days)
    if (daysInactive >= 5 && score < 80) {
      recommendations.push({
        priority: "medium",
        type: "review_material",
        conceptId,
        title: `Refresh Knowledge on ${conceptName}`,
        action: `Re-read uploaded material sections for ${conceptName}.`,
        reason: `No practice logged for ${daysInactive} days. Periodic review prevents memory decay.`,
        estimatedMinutes: 7,
      });
    }

    // Signal 5: High Mastery (>= 80%) Advanced Practice
    if (score >= 80) {
      recommendations.push({
        priority: "low",
        type: "open_assessment",
        conceptId,
        title: `Take Open-Ended Challenge on ${conceptName}`,
        action: `Write a short analytical summary explaining how ${conceptName} operates.`,
        reason: `Your mastery is ${score.toFixed(1)}%. Challenge yourself with open-ended synthesis.`,
        estimatedMinutes: 12,
      });
    }
  }

  // Signal 6: Assessment Missing Concepts Signal (Strictly mapped to valid project concepts)
  recentAssessments.forEach((assessment) => {
    const missing = assessment.evaluation?.missingConcepts || [];
    missing.forEach((missingTopic) => {
      if (typeof missingTopic === "string" && missingTopic.trim()) {
        const cleanTopic = missingTopic.trim().toLowerCase();
        // Deterministic lookup: check if missingTopic matches a valid project conceptId or conceptName
        let resolvedConceptId = null;
        if (validConceptIds.has(missingTopic.trim())) {
          resolvedConceptId = missingTopic.trim();
        } else if (conceptNameMap[cleanTopic]) {
          resolvedConceptId = conceptNameMap[cleanTopic];
        } else if (assessment.conceptId && validConceptIds.has(assessment.conceptId)) {
          resolvedConceptId = assessment.conceptId;
        }

        // Only generate recommendation if safely mapped to a verified project concept
        if (resolvedConceptId && validConceptIds.has(resolvedConceptId)) {
          const conceptName = conceptNameMap[resolvedConceptId] || resolvedConceptId;
          recommendations.push({
            priority: "medium",
            type: "open_assessment",
            conceptId: resolvedConceptId,
            title: `Address Missing Concept: ${conceptName}`,
            action: `Re-evaluate your response focusing on key aspects of ${missingTopic.trim()}.`,
            reason: `Previous assessment evaluation flagged missing core details in ${conceptName}.`,
            estimatedMinutes: 10,
          });
        }
      }
    });
  });

  // Default recommendation if empty state
  if (recommendations.length === 0) {
    const fallbackConceptId = concepts.length > 0 ? concepts[0].conceptId : "general";
    recommendations.push({
      priority: "medium",
      type: "adaptive_quiz",
      conceptId: fallbackConceptId,
      title: "Take a General Practice Quiz",
      action: "Generate a 5-question adaptive quiz covering your uploaded project materials.",
      reason: "Regular practice strengthens retention across all concepts.",
      estimatedMinutes: 8,
    });
  }

  // Sort strictly by priority (high -> medium -> low)
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  recommendations.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

  // Remove duplicates based on title
  const seenTitles = new Set();
  const uniqueRecommendations = recommendations.filter((r) => {
    if (seenTitles.has(r.title)) return false;
    seenTitles.add(r.title);
    return true;
  });

  return uniqueRecommendations.slice(0, 5);
}

export default {
  getPersonalizedRecommendations,
};
