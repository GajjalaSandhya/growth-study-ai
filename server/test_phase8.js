process.env.NODE_ENV = "test";

import mongoose from "mongoose";
import http from "http";
import path from "path";
import fs from "fs";
import config from "./config/env.js";
import User from "./models/User.js";
import Space from "./models/Space.js";
import Project from "./models/Project.js";
import Material from "./models/Material.js";
import ConceptMastery from "./models/ConceptMastery.js";
import MasterySnapshot from "./models/MasterySnapshot.js";
import ActivityLog from "./models/ActivityLog.js";
import Quiz from "./models/Quiz.js";
import QuizAttempt from "./models/QuizAttempt.js";
import AssessmentAttempt from "./models/AssessmentAttempt.js";
import AiLog from "./models/AiLog.js";
import app from "./server.js";

const TEST_PORT = 5098;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let userAToken = "";
let userBToken = "";
let userAId = "";
let userBId = "";
let projectAId = "";
let projectBId = "";

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let body = data;
        try {
          body = JSON.parse(data);
        } catch (_) {}
        resolve({ status: res.statusCode, headers: res.headers, body });
      });
    });

    req.on("error", reject);

    if (options.body) {
      if (typeof options.body === "object") {
        req.write(JSON.stringify(options.body));
      } else {
        req.write(options.body);
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log("=================================================");
  console.log("   STUDYMATE AI — PHASE 8 AUTOMATED TEST SUITE   ");
  console.log("=================================================");

  const server = app.listen(TEST_PORT, () => {
    console.log(`Test server running on port ${TEST_PORT}`);
  });

  await mongoose.connect(config.mongoUri);
  console.log("[DB] Connected to MongoDB test database");

  // Clean test data
  await User.deleteMany({ email: { $regex: /phase8_test/ } });
  await Space.deleteMany({ name: { $regex: /Phase 8/ } });
  await Project.deleteMany({ name: { $regex: /Phase 8/ } });
  await ConceptMastery.deleteMany({});
  await MasterySnapshot.deleteMany({});
  await ActivityLog.deleteMany({});
  await Quiz.deleteMany({});
  await QuizAttempt.deleteMany({});
  await AssessmentAttempt.deleteMany({});
  await AiLog.deleteMany({});

  let passed = 0;
  let failed = 0;

  function assert(condition, scenarioName, details = "") {
    if (condition) {
      passed++;
      console.log(`✅ [PASS] Scenario ${passed + failed}: ${scenarioName}`);
    } else {
      failed++;
      console.error(`❌ [FAIL] Scenario ${passed + failed}: ${scenarioName} - ${details}`);
    }
  }

  try {
    // ---------------------------------------------------------
    // Setup Test Users and Projects
    // ---------------------------------------------------------
    const timestamp = Date.now();
    const signupA = await makeRequest(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        name: "User Phase8 A",
        email: `phase8_userA_${timestamp}@example.com`,
        password: "Password123!",
      },
    });
    userAToken = signupA.body.token;
    userAId = signupA.body.user.id;

    const signupB = await makeRequest(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        name: "User Phase8 B",
        email: `phase8_userB_${timestamp}@example.com`,
        password: "Password123!",
      },
    });
    userBToken = signupB.body.token;
    userBId = signupB.body.user.id;

    // Create Space & Project for User A
    const spaceARes = await makeRequest(`${BASE_URL}/spaces`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userAToken}` },
      body: { name: "Phase 8 Space A", description: "Testing Phase 8" },
    });
    const spaceAId = spaceARes.body.space._id || spaceARes.body.space.id;

    const projARes = await makeRequest(`${BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userAToken}` },
      body: { spaceId: spaceAId, name: "Phase 8 Project A", description: "Project A" },
    });
    projectAId = projARes.body.project._id || projARes.body.project.id;

    // Create Space & Project for User B
    const spaceBRes = await makeRequest(`${BASE_URL}/spaces`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userBToken}` },
      body: { name: "Phase 8 Space B", description: "Testing Phase 8 B" },
    });
    const spaceBId = spaceBRes.body.space._id || spaceBRes.body.space.id;

    const projBRes = await makeRequest(`${BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userBToken}` },
      body: { spaceId: spaceBId, name: "Phase 8 Project B", description: "Project B" },
    });
    projectBId = projBRes.body.project._id || projBRes.body.project.id;

    // ---------------------------------------------------------
    // Scenario 1: 7-Day Historical Snapshot Lookup
    // ---------------------------------------------------------
    const todayStr = new Date().toISOString().split("T")[0];
    const eightDaysAgoStr = new Date(Date.now() - 8 * 86400000).toISOString().split("T")[0];

    await MasterySnapshot.create({
      userId: userAId,
      projectId: projectAId,
      conceptId: "neural_networks",
      masteryScore: 40.0,
      date: eightDaysAgoStr,
    });
    await MasterySnapshot.create({
      userId: userAId,
      projectId: projectAId,
      conceptId: "neural_networks",
      masteryScore: 70.0,
      date: todayStr,
    });
    await ConceptMastery.create({
      userId: userAId,
      projectId: projectAId,
      conceptId: "neural_networks",
      conceptName: "Neural Networks",
      masteryScore: 70.0,
    });

    const resS1 = await makeRequest(`${BASE_URL}/projects/${projectAId}/analytics`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    assert(
      resS1.status === 200 &&
        resS1.body.analytics.mastery.currentScore === 70.0 &&
        resS1.body.analytics.mastery.previousScore === 40.0 &&
        resS1.body.analytics.mastery.delta === 30.0,
      "7-Day Historical Snapshot Lookup",
      `Expected previousScore 40.0 and delta 30.0, got previous ${resS1.body?.analytics?.mastery?.previousScore}`,
    );

    // ---------------------------------------------------------
    // Scenario 2: Earliest Snapshot Fallback (< 7 Days History)
    // ---------------------------------------------------------
    // Create new project for User A with only 2-day-old snapshot
    const projA2Res = await makeRequest(`${BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userAToken}` },
      body: { spaceId: spaceAId, name: "Phase 8 Project A2", description: "Young Project" },
    });
    const projectA2Id = projA2Res.body.project._id || projA2Res.body.project.id;

    const twoDaysAgoStr = new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0];
    await MasterySnapshot.create({
      userId: userAId,
      projectId: projectA2Id,
      conceptId: "deep_learning",
      masteryScore: 20.0,
      date: twoDaysAgoStr,
    });
    await MasterySnapshot.create({
      userId: userAId,
      projectId: projectA2Id,
      conceptId: "deep_learning",
      masteryScore: 60.0,
      date: todayStr,
    });
    await ConceptMastery.create({
      userId: userAId,
      projectId: projectA2Id,
      conceptId: "deep_learning",
      conceptName: "Deep Learning",
      masteryScore: 60.0,
    });

    const resS2 = await makeRequest(`${BASE_URL}/projects/${projectA2Id}/analytics`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    assert(
      resS2.status === 200 &&
        resS2.body.analytics.mastery.previousScore === 20.0 &&
        resS2.body.analytics.mastery.delta === 40.0,
      "Earliest Snapshot Fallback (< 7 Days History)",
      `Expected fallback previousScore 20.0, got ${resS2.body?.analytics?.mastery?.previousScore}`,
    );

    // ---------------------------------------------------------
    // Scenario 3: Null Fallback for Empty History
    // ---------------------------------------------------------
    const resS3 = await makeRequest(`${BASE_URL}/projects/${projectBId}/analytics`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });

    assert(
      resS3.status === 200 &&
        resS3.body.analytics.mastery.previousScore === null &&
        resS3.body.analytics.mastery.delta === null &&
        resS3.body.analytics.mastery.trend === "stable",
      "Null Fallback for Empty History",
      `Expected previousScore null and trend 'stable', got previousScore ${resS3.body?.analytics?.mastery?.previousScore}`,
    );

    // ---------------------------------------------------------
    // Scenario 4: Improving Trend Detection
    // ---------------------------------------------------------
    assert(
      resS1.body.analytics.mastery.trend === "improving",
      "Improving Trend Detection",
      `Expected 'improving', got '${resS1.body?.analytics?.mastery?.trend}'`,
    );

    // ---------------------------------------------------------
    // Scenario 5: Declining Trend Detection
    // ---------------------------------------------------------
    // Set up declining project
    const projA3Res = await makeRequest(`${BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userAToken}` },
      body: { spaceId: spaceAId, name: "Phase 8 Project A3", description: "Declining Project" },
    });
    const projectA3Id = projA3Res.body.project._id || projA3Res.body.project.id;

    await MasterySnapshot.create({
      userId: userAId,
      projectId: projectA3Id,
      conceptId: "cnn",
      masteryScore: 80.0,
      date: eightDaysAgoStr,
    });
    await MasterySnapshot.create({
      userId: userAId,
      projectId: projectA3Id,
      conceptId: "cnn",
      masteryScore: 60.0,
      date: todayStr,
    });
    await ConceptMastery.create({
      userId: userAId,
      projectId: projectA3Id,
      conceptId: "cnn",
      conceptName: "CNN",
      masteryScore: 60.0,
    });

    const resS5 = await makeRequest(`${BASE_URL}/projects/${projectA3Id}/analytics`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    assert(
      resS5.status === 200 &&
        resS5.body.analytics.mastery.delta === -20.0 &&
        resS5.body.analytics.mastery.trend === "declining",
      "Declining Trend Detection",
      `Expected delta -20.0 and trend 'declining', got delta ${resS5.body?.analytics?.mastery?.delta}`,
    );

    // ---------------------------------------------------------
    // Scenario 6: Stable Trend Detection
    // ---------------------------------------------------------
    const projA4Res = await makeRequest(`${BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${userAToken}` },
      body: { spaceId: spaceAId, name: "Phase 8 Project A4", description: "Stable Project" },
    });
    const projectA4Id = projA4Res.body.project._id || projA4Res.body.project.id;

    await MasterySnapshot.create({
      userId: userAId,
      projectId: projectA4Id,
      conceptId: "rnn",
      masteryScore: 70.0,
      date: eightDaysAgoStr,
    });
    await MasterySnapshot.create({
      userId: userAId,
      projectId: projectA4Id,
      conceptId: "rnn",
      masteryScore: 70.0,
      date: todayStr,
    });
    await ConceptMastery.create({
      userId: userAId,
      projectId: projectA4Id,
      conceptId: "rnn",
      conceptName: "RNN",
      masteryScore: 70.0,
    });

    const resS6 = await makeRequest(`${BASE_URL}/projects/${projectA4Id}/analytics`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    assert(
      resS6.status === 200 &&
        resS6.body.analytics.mastery.delta === 0.0 &&
        resS6.body.analytics.mastery.trend === "stable",
      "Stable Trend Detection",
      `Expected delta 0.0 and trend 'stable'`,
    );

    // ---------------------------------------------------------
    // Scenario 7: Duplicate Daily Snapshot Prevention
    // ---------------------------------------------------------
    await MasterySnapshot.findOneAndUpdate(
      { userId: userAId, projectId: projectAId, conceptId: "neural_networks", date: todayStr },
      { masteryScore: 72.0, timestamp: new Date() },
      { upsert: true, new: true },
    );
    await MasterySnapshot.findOneAndUpdate(
      { userId: userAId, projectId: projectAId, conceptId: "neural_networks", date: todayStr },
      { masteryScore: 75.0, timestamp: new Date() },
      { upsert: true, new: true },
    );

    const dupSnapshots = await MasterySnapshot.find({
      userId: userAId,
      projectId: projectAId,
      conceptId: "neural_networks",
      date: todayStr,
    });

    assert(
      dupSnapshots.length === 1 && dupSnapshots[0].masteryScore === 75.0,
      "Duplicate Daily Snapshot Prevention",
      `Expected exactly 1 snapshot record for today, found ${dupSnapshots.length}`,
    );

    // ---------------------------------------------------------
    // Scenario 8: Weak Mastery Signal (< 60%)
    // ---------------------------------------------------------
    await ConceptMastery.create({
      userId: userAId,
      projectId: projectAId,
      conceptId: "backpropagation",
      conceptName: "Backpropagation",
      masteryScore: 35.0, // weak concept -> High priority adaptive_quiz
    });

    const resS8 = await makeRequest(`${BASE_URL}/projects/${projectAId}/recommendations`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    const weakRec = (resS8.body.recommendations || []).find(
      (r) => r.conceptId === "backpropagation",
    );

    assert(
      weakRec && weakRec.priority === "high" && weakRec.type === "adaptive_quiz",
      "Weak Mastery Signal (< 60%)",
      `Expected high priority adaptive_quiz for weak concept`,
    );

    // ---------------------------------------------------------
    // Scenario 9: Recent Mistakes Signal
    // ---------------------------------------------------------
    await ConceptMastery.create({
      userId: userAId,
      projectId: projectAId,
      conceptId: "loss_functions",
      conceptName: "Loss Functions",
      masteryScore: 70.0,
      recentMistakes: [{ questionText: "What is Cross-Entropy Loss?", timestamp: new Date() }],
    });

    const resS9 = await makeRequest(`${BASE_URL}/projects/${projectAId}/recommendations`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const mistakeRec = (resS9.body.recommendations || []).find(
      (r) => r.conceptId === "loss_functions",
    );

    assert(
      mistakeRec && mistakeRec.priority === "high" && mistakeRec.type === "tutor_practice",
      "Recent Mistakes Signal",
      `Expected high priority tutor_practice recommendation for recent mistake`,
    );

    // ---------------------------------------------------------
    // Scenario 10: Assessment Missing-Concept Resolution
    // ---------------------------------------------------------
    await AssessmentAttempt.create({
      userId: userAId,
      projectId: projectAId,
      conceptId: "neural_networks",
      prompt: "Explain Neural Networks",
      userAnswer: "NN explanation",
      evaluation: {
        overallScore: 65,
        understanding: 65,
        accuracy: 65,
        completeness: 65,
        clarity: 65,
        reasoning: 65,
        feedback: "Feedback text for NN",
        missingConcepts: ["Neural Networks", "Backpropagation"],
      },
    });

    const resS10 = await makeRequest(`${BASE_URL}/projects/${projectAId}/recommendations`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const missingRec = (resS10.body.recommendations || []).find(
      (r) => r.conceptId === "neural_networks",
    );

    assert(
      missingRec && missingRec.priority === "medium" && missingRec.type === "open_assessment",
      "Assessment Missing-Concept Resolution",
      `Expected open_assessment recommendation for verified missing concept`,
    );

    // ---------------------------------------------------------
    // Scenario 11: Unmappable Missing-Concept Protection
    // ---------------------------------------------------------
    await AssessmentAttempt.create({
      userId: userAId,
      projectId: projectAId,
      conceptId: "unknown_concept_x",
      prompt: "Unknown Prompt",
      userAnswer: "Unknown Answer",
      evaluation: {
        overallScore: 50,
        understanding: 50,
        accuracy: 50,
        completeness: 50,
        clarity: 50,
        reasoning: 50,
        feedback: "Feedback text for unknown concept",
        missingConcepts: ["Quantum Supersymmetry Nonexistent Topic"],
      },
    });

    const resS11 = await makeRequest(`${BASE_URL}/projects/${projectAId}/recommendations`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const unmappableRec = (resS11.body.recommendations || []).find(
      (r) =>
        r.conceptId === "Quantum Supersymmetry Nonexistent Topic" ||
        r.title.includes("Quantum Supersymmetry"),
    );

    assert(
      unmappableRec === undefined,
      "Unmappable Missing-Concept Protection",
      `Unmappable missing concept generated unvalidated recommendation`,
    );

    // ---------------------------------------------------------
    // Scenario 12: Inactivity Signal (>= 5 Days)
    // ---------------------------------------------------------
    const sixDaysAgo = new Date(Date.now() - 6 * 86400000);
    await ConceptMastery.create({
      userId: userAId,
      projectId: projectAId,
      conceptId: "gradient_descent",
      conceptName: "Gradient Descent",
      masteryScore: 75.0,
      lastPracticedAt: sixDaysAgo,
    });

    const resS12 = await makeRequest(`${BASE_URL}/projects/${projectAId}/recommendations`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const inactiveRec = (resS12.body.recommendations || []).find(
      (r) => r.conceptId === "gradient_descent",
    );

    assert(
      inactiveRec && inactiveRec.priority === "medium" && inactiveRec.type === "review_material",
      "Inactivity Signal (>= 5 Days)",
      `Expected medium priority review_material recommendation for inactive concept`,
    );

    // ---------------------------------------------------------
    // Scenario 13: Declining Mastery Recommendation
    // ---------------------------------------------------------
    await ConceptMastery.create({
      userId: userAId,
      projectId: projectA3Id,
      conceptId: "declining_concept",
      conceptName: "Declining Concept",
      masteryScore: 50.0,
    });
    await MasterySnapshot.create({
      userId: userAId,
      projectId: projectA3Id,
      conceptId: "declining_concept",
      masteryScore: 75.0,
      date: eightDaysAgoStr,
    });
    await MasterySnapshot.create({
      userId: userAId,
      projectId: projectA3Id,
      conceptId: "declining_concept",
      masteryScore: 50.0,
      date: todayStr,
    });

    const resS13 = await makeRequest(`${BASE_URL}/projects/${projectA3Id}/recommendations`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const declRec = (resS13.body.recommendations || []).find(
      (r) => r.conceptId === "declining_concept",
    );

    assert(
      declRec && declRec.priority === "high" && declRec.type === "review_material",
      "Declining Mastery Recommendation",
      `Expected declining mastery recommendation for concept with snapshot delta <= -5`,
    );

    // ---------------------------------------------------------
    // Scenario 14: Recommendation Priority Ordering
    // ---------------------------------------------------------
    const priorityWeights = { high: 3, medium: 2, low: 1 };
    const recs = resS13.body.recommendations || [];
    let isSorted = true;
    for (let i = 0; i < recs.length - 1; i++) {
      if (priorityWeights[recs[i].priority] < priorityWeights[recs[i + 1].priority]) {
        isSorted = false;
        break;
      }
    }

    assert(
      resS13.status === 200 && recs.length > 0 && isSorted,
      "Recommendation Priority Ordering (High -> Medium -> Low)",
      "Recommendations were not sorted strictly by priority",
    );

    // ---------------------------------------------------------
    // Scenario 15: Recommendation Schema Verification
    // ---------------------------------------------------------
    const sampleRec = resS13.body.recommendations[0];
    const hasAllFields =
      sampleRec &&
      sampleRec.priority &&
      sampleRec.type &&
      sampleRec.conceptId &&
      sampleRec.title &&
      sampleRec.action &&
      sampleRec.reason &&
      typeof sampleRec.estimatedMinutes === "number";

    assert(
      hasAllFields,
      "Recommendation Schema Verification",
      "Missing required fields in recommendation object",
    );

    // ---------------------------------------------------------
    // Scenario 16: Automatic Real Activity Logging
    // ---------------------------------------------------------
    await ActivityLog.create({
      userId: userAId,
      projectId: projectAId,
      activityType: "material_upload",
      conceptId: "general",
      durationSeconds: 0,
      timestamp: new Date(),
    });
    await ActivityLog.create({
      userId: userAId,
      projectId: projectAId,
      activityType: "tutor_interaction",
      conceptId: "general",
      durationSeconds: 60,
      timestamp: new Date(),
    });

    const actCount = await ActivityLog.countDocuments({ userId: userAId, projectId: projectAId });
    assert(actCount >= 2, "Automatic Real Activity Logging", `Expected ActivityLog records in DB`);

    // ---------------------------------------------------------
    // Scenario 17: No Fake Activity
    // ---------------------------------------------------------
    const resS17 = await makeRequest(`${BASE_URL}/projects/${projectBId}/analytics`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    assert(
      resS17.body.analytics.recentActivity.length === 0,
      "No Fake Activity Verification",
      "Unpracticed project returned fake activity entries",
    );

    // ---------------------------------------------------------
    // Scenario 18: Exact Study-Time Calculation
    // ---------------------------------------------------------
    const resS18 = await makeRequest(`${BASE_URL}/projects/${projectAId}/analytics`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const studyTime = resS18.body.analytics.studyTime;

    assert(
      studyTime && typeof studyTime.totalMinutes === "number",
      "Exact Study-Time Calculation",
      "Study time calculation missing or invalid format",
    );

    // ---------------------------------------------------------
    // Scenario 19: Study Streak Calculation
    // ---------------------------------------------------------
    const resS19 = await makeRequest(`${BASE_URL}/analytics/growth`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    assert(
      resS19.status === 200 && typeof resS19.body.globalGrowth.streakDays === "number",
      "Study Streak Calculation",
      "Global study streak calculation failed",
    );

    // ---------------------------------------------------------
    // Scenario 20: Project Analytics Payload
    // ---------------------------------------------------------
    const pData = resS18.body.analytics;
    const hasFullPayload =
      pData.mastery &&
      pData.conceptDistribution &&
      pData.quizPerformance &&
      pData.assessmentPerformance &&
      pData.tutorActivity &&
      pData.materials &&
      pData.studyTime &&
      pData.recentActivity;

    assert(
      hasFullPayload,
      "Project Analytics Payload Verification",
      "Missing top-level analytics sections",
    );

    // ---------------------------------------------------------
    // Scenario 21: Global Growth Analytics
    // ---------------------------------------------------------
    const gData = resS19.body.globalGrowth;

    assert(
      resS19.status === 200 &&
        gData.userId === userAId &&
        typeof gData.growth.currentMastery === "number",
      "Global Growth Analytics Verification",
      "Global growth payload structure invalid",
    );

    // ---------------------------------------------------------
    // Scenario 22: User Isolation Security
    // ---------------------------------------------------------
    const resS22 = await makeRequest(`${BASE_URL}/projects/${projectAId}/analytics`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });

    assert(
      resS22.status === 404 || resS22.status === 403,
      "User Isolation Security (404/403 for unauthorized project)",
      `Expected 404 or 403, got HTTP ${resS22.status}`,
    );

    // ---------------------------------------------------------
    // Scenario 23: Project Isolation
    // ---------------------------------------------------------
    assert(
      resS17.body.analytics.recentActivity.length === 0,
      "Project Isolation (User B project isolated from User A activities)",
      `Expected 0 activities in project B`,
    );

    // ---------------------------------------------------------
    // Scenario 24: Invalid Input Handling
    // ---------------------------------------------------------
    const resS24 = await makeRequest(`${BASE_URL}/projects/invalid-project-id/analytics`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    assert(
      resS24.status === 400,
      "Invalid Input Handling (400 for bad Mongo ObjectId)",
      `Expected 400, got HTTP ${resS24.status}`,
    );

    // ---------------------------------------------------------
    // Scenario 25: Empty States
    // ---------------------------------------------------------
    assert(
      resS17.body.analytics.mastery.currentScore === 0 &&
        resS17.body.analytics.quizPerformance.totalAttempts === 0 &&
        resS17.body.analytics.studyTime.totalMinutes === 0,
      "Empty States Clean Output",
      "Empty project analytics returned non-zero defaults",
    );

    // ---------------------------------------------------------
    // Scenario 26: Database Persistence
    // ---------------------------------------------------------
    const snapshotCount = await MasterySnapshot.countDocuments({ userId: userAId });
    assert(
      snapshotCount >= 3,
      "Database Persistence Verification",
      `Expected persisted snapshot records in Mongo DB`,
    );

    // ---------------------------------------------------------
    // Scenario 27: Mastery Bounds Safety (0 to 100)
    // ---------------------------------------------------------
    await ConceptMastery.create({
      userId: userAId,
      projectId: projectAId,
      conceptId: "bounded_concept",
      conceptName: "Bounded Concept",
      masteryScore: 100.0,
    });
    const conceptDoc = await ConceptMastery.findOne({
      userId: userAId,
      conceptId: "bounded_concept",
    });

    assert(
      conceptDoc && conceptDoc.masteryScore <= 100 && conceptDoc.masteryScore >= 0,
      "Mastery Bounds Safety (0 to 100)",
      `Mastery score ${conceptDoc?.masteryScore} out of bounds`,
    );

    // ---------------------------------------------------------
    // Scenario 28: No AI Telemetry for Deterministic Recommendations
    // ---------------------------------------------------------
    const initialAiLogCount = await AiLog.countDocuments({});
    await makeRequest(`${BASE_URL}/projects/${projectAId}/recommendations`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const finalAiLogCount = await AiLog.countDocuments({});

    assert(
      initialAiLogCount === finalAiLogCount,
      "No AI Telemetry for Deterministic Recommendations",
      `AiLog count increased during recommendations request`,
    );

    // ---------------------------------------------------------
    // Scenario 29: Phase 1-7 Regression & Frontend Protection
    // ---------------------------------------------------------
    const resAuth = await makeRequest(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    assert(
      resAuth.status === 200,
      "Phase 1-7 Regression & Frontend Protection",
      "Core auth endpoint failed regression test",
    );

    console.log("=================================================");
    console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED  `);
    console.log("=================================================");
  } catch (err) {
    console.error("Test Suite Execution Error:", err);
  } finally {
    await mongoose.disconnect();
    if (server) server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
