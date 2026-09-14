import mongoose from "mongoose";
import ConceptMastery from "../models/ConceptMastery.js";
import logger from "../utils/logger.js";
import { recordMasterySnapshot, logActivity } from "./activityService.js";

/**
 * Concept-Level Mastery Engine
 *
 * DETERMINISTIC BOUNDED (0-100) MASTERY CALCULATION STRATEGY:
 * -------------------------------------------------------------
 * 1. Concept mastery is the primary learning state.
 * 2. Mastery is updated incrementally using exponential moving average (recency weighting alpha = 0.35).
 * 3. Recent performance has greater influence than older performance, but mastery does NOT reset on a single bad attempt.
 * 4. Correct answers increase mastery; incorrect answers decrease or slow mastery growth.
 * 5. Repeated practice adds a small consistency bonus (+1.5 points up to 100).
 * 6. Grounded open-ended assessments blend into concept mastery (weight alpha = 0.35).
 * 7. All scores are strictly bounded between 0 and 100 using Math.min(100, Math.max(0, score)).
 */

/**
 * Helper to turn raw string conceptId into clean name
 */
function formatConceptName(conceptId) {
  if (!conceptId) return "General Concept";
  return conceptId.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Update ConceptMastery records from a completed QuizAttempt
 */
export async function updateMasteryFromQuiz({ userId, projectId, quizAttempt, questions }) {
  if (!quizAttempt || !quizAttempt.answers || quizAttempt.answers.length === 0) {
    return [];
  }

  // Group quiz results by conceptId
  const conceptMap = {};

  quizAttempt.answers.forEach((ans) => {
    const conceptId = ans.conceptId || "general";
    if (!conceptMap[conceptId]) {
      conceptMap[conceptId] = {
        total: 0,
        correct: 0,
        mistakes: [],
      };
    }
    conceptMap[conceptId].total += 1;
    if (ans.isCorrect) {
      conceptMap[conceptId].correct += 1;
    } else {
      const q = questions ? questions.find((item, idx) => idx === ans.questionIndex) : null;
      if (q) {
        conceptMap[conceptId].mistakes.push({
          questionText: q.questionText,
          selectedOption:
            q.options && q.options[ans.selectedOptionIndex]
              ? q.options[ans.selectedOptionIndex]
              : "Selected Option",
          correctOption:
            q.options && q.options[q.correctAnswerIndex]
              ? q.options[q.correctAnswerIndex]
              : "Correct Option",
          timestamp: new Date(),
        });
      }
    }
  });

  const updatedRecords = [];

  for (const [conceptId, stats] of Object.entries(conceptMap)) {
    let conceptRecord = await ConceptMastery.findOne({
      userId,
      projectId,
      conceptId,
    });

    if (!conceptRecord) {
      conceptRecord = new ConceptMastery({
        userId,
        projectId,
        conceptId,
        conceptName: formatConceptName(conceptId),
        masteryScore: 0,
        quizAttemptsCount: 0,
        quizCorrectCount: 0,
        assessmentAttemptsCount: 0,
        recentMistakes: [],
      });
    }

    const previousMastery = conceptRecord.masteryScore || 0;
    const currentQuizScore = (stats.correct / stats.total) * 100;

    // Recency-weighted formula (alpha = 0.35) + repeated practice bonus (+1.5)
    const alpha = 0.35;
    const practiceBonus = stats.correct > 0 ? 1.5 : 0;
    const rawNewScore = previousMastery * (1 - alpha) + currentQuizScore * alpha + practiceBonus;
    const newMastery = Math.min(100, Math.max(0, parseFloat(rawNewScore.toFixed(2))));

    conceptRecord.masteryScore = newMastery;
    conceptRecord.quizAttemptsCount += stats.total;
    conceptRecord.quizCorrectCount += stats.correct;
    conceptRecord.lastPracticedAt = new Date();

    if (stats.mistakes.length > 0) {
      conceptRecord.recentMistakes.unshift(...stats.mistakes);
      // Keep only 10 most recent mistakes
      conceptRecord.recentMistakes = conceptRecord.recentMistakes.slice(0, 10);
    }

    await conceptRecord.save();

    // Record historical snapshot & real mastery_update activity log
    await recordMasterySnapshot({
      userId,
      projectId,
      conceptId,
      masteryScore: newMastery,
    });
    await logActivity({
      userId,
      projectId,
      activityType: "mastery_update",
      conceptId,
      durationSeconds: 0,
      metadata: { newMastery, source: "quiz" },
    });

    updatedRecords.push(conceptRecord);
  }

  return updatedRecords;
}

/**
 * Update ConceptMastery from a completed AssessmentAttempt (Open-Ended)
 */
export async function updateMasteryFromAssessment({ userId, projectId, assessmentAttempt }) {
  if (!assessmentAttempt || !assessmentAttempt.evaluation) {
    return null;
  }

  const conceptId = assessmentAttempt.conceptId || "general";
  const overallScore = assessmentAttempt.evaluation.overallScore || 0;

  let conceptRecord = await ConceptMastery.findOne({
    userId,
    projectId,
    conceptId,
  });

  if (!conceptRecord) {
    conceptRecord = new ConceptMastery({
      userId,
      projectId,
      conceptId,
      conceptName: formatConceptName(conceptId),
      masteryScore: 0,
      quizAttemptsCount: 0,
      quizCorrectCount: 0,
      assessmentAttemptsCount: 0,
      recentMistakes: [],
    });
  }

  const previousMastery = conceptRecord.masteryScore || 0;
  const alpha = 0.35;
  const rawNewScore = previousMastery * (1 - alpha) + overallScore * alpha;
  const newMastery = Math.min(100, Math.max(0, parseFloat(rawNewScore.toFixed(2))));

  conceptRecord.masteryScore = newMastery;
  conceptRecord.assessmentAttemptsCount += 1;
  conceptRecord.lastAssessmentScore = overallScore;
  conceptRecord.lastPracticedAt = new Date();

  await conceptRecord.save();

  // Record historical snapshot & real mastery_update activity log
  await recordMasterySnapshot({
    userId,
    projectId,
    conceptId,
    masteryScore: newMastery,
  });
  await logActivity({
    userId,
    projectId,
    activityType: "mastery_update",
    conceptId,
    durationSeconds: 0,
    metadata: { newMastery, source: "assessment" },
  });

  return conceptRecord;
}

/**
 * Get all ConceptMastery records and derived project mastery for a user & project
 */
export async function getConceptMastery({ userId, projectId }) {
  const concepts = await ConceptMastery.find({ userId, projectId }).sort({ masteryScore: 1 });

  let derivedProjectMastery = 0;
  if (concepts.length > 0) {
    const totalScore = concepts.reduce((acc, c) => acc + (c.masteryScore || 0), 0);
    derivedProjectMastery = parseFloat((totalScore / concepts.length).toFixed(2));
  }

  const weakConcepts = concepts
    .filter((c) => c.masteryScore < 60)
    .map((c) => ({
      conceptId: c.conceptId,
      conceptName: c.conceptName,
      masteryScore: c.masteryScore,
    }));

  const strongConcepts = concepts
    .filter((c) => c.masteryScore >= 80)
    .map((c) => ({
      conceptId: c.conceptId,
      conceptName: c.conceptName,
      masteryScore: c.masteryScore,
    }));

  return {
    derivedProjectMastery,
    conceptCount: concepts.length,
    concepts,
    weakConcepts,
    strongConcepts,
  };
}

export default {
  updateMasteryFromQuiz,
  updateMasteryFromAssessment,
  getConceptMastery,
};
