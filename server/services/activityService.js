import ActivityLog from "../models/ActivityLog.js";
import MasterySnapshot from "../models/MasterySnapshot.js";
import logger from "../utils/logger.js";

/**
 * AUTOMATIC REAL ACTIVITY LOGGING & SNAPSHOT SERVICE
 */
export async function logActivity({
  userId,
  projectId,
  activityType,
  conceptId = "general",
  durationSeconds = 0,
  metadata = {},
}) {
  try {
    const activity = await ActivityLog.create({
      userId,
      projectId,
      activityType,
      conceptId: conceptId || "general",
      durationSeconds: Math.max(0, parseInt(durationSeconds, 10) || 0),
      metadata,
      timestamp: new Date(),
    });
    return activity;
  } catch (err) {
    logger.warn(`Failed to log activity: ${err.message}`);
    return null;
  }
}

export async function recordMasterySnapshot({ userId, projectId, conceptId, masteryScore }) {
  try {
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    await MasterySnapshot.findOneAndUpdate(
      { userId, projectId, conceptId, date: todayStr },
      { masteryScore, timestamp: new Date() },
      { upsert: true, new: true },
    );
  } catch (err) {
    logger.warn(`Failed to record mastery snapshot: ${err.message}`);
  }
}

export default {
  logActivity,
  recordMasterySnapshot,
};
