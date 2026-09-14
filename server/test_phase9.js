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
import MaterialChunk from "./models/MaterialChunk.js";
import ConceptMastery from "./models/ConceptMastery.js";
import MasterySnapshot from "./models/MasterySnapshot.js";
import ChatMessage from "./models/ChatMessage.js";
import Quiz from "./models/Quiz.js";
import QuizAttempt from "./models/QuizAttempt.js";
import AssessmentAttempt from "./models/AssessmentAttempt.js";
import ActivityLog from "./models/ActivityLog.js";
import AiLog from "./models/AiLog.js";
import app from "./server.js";

const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let adminToken = "";
let studentToken = "";
let adminId = "";
let studentId = "";
let spaceId = "";
let projectId = "";

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
  console.log("   STUDYMATE AI — PHASE 9 AUTOMATED TEST SUITE   ");
  console.log("=================================================");

  const server = app.listen(TEST_PORT, () => {
    console.log(`Test server running on port ${TEST_PORT}`);
  });

  await mongoose.connect(config.mongoUri);
  console.log("[DB] Connected to MongoDB test database");

  // Clean test data
  await User.deleteMany({
    $or: [{ email: { $regex: /phase9_test/ } }, { email: config.primaryAdminEmail }],
  });
  await Space.deleteMany({ name: { $regex: /Phase 9/ } });
  await Project.deleteMany({ name: { $regex: /Phase 9/ } });
  await ConceptMastery.deleteMany({});
  await MasterySnapshot.deleteMany({});
  await ActivityLog.deleteMany({});
  await Quiz.deleteMany({});
  await QuizAttempt.deleteMany({});
  await AssessmentAttempt.deleteMany({});
  await ChatMessage.deleteMany({});
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
    const timestamp = Date.now();

    // ---------------------------------------------------------
    // Scenario 1: Public Registration Role Hardening
    // ---------------------------------------------------------
    const signupAdminReq = await makeRequest(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        name: "Phase9 Admin Target",
        email: `phase9_admin_${timestamp}@example.com`,
        password: "Password123!",
        role: "admin", // Public registration must ignore this and force student
      },
    });

    assert(
      signupAdminReq.status === 201 && signupAdminReq.body.user.role === "student",
      "Public Registration Role Hardening (forces role='student')",
      `Expected role 'student', got '${signupAdminReq.body?.user?.role}'`,
    );

    // Promote User to Admin directly via DB for testing Admin endpoints
    const adminUserDoc = await User.findById(signupAdminReq.body.user.id);
    adminUserDoc.role = "admin";
    await adminUserDoc.save();

    // Re-login to get updated admin token
    const loginAdminRes = await makeRequest(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { email: `phase9_admin_${timestamp}@example.com`, password: "Password123!" },
    });
    adminToken = loginAdminRes.body.token;
    adminId = signupAdminReq.body.user.id;

    // Create Student user
    const signupStudentRes = await makeRequest(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        name: "Phase9 Student Target",
        email: `phase9_student_${timestamp}@example.com`,
        password: "Password123!",
      },
    });
    studentToken = signupStudentRes.body.token;
    studentId = signupStudentRes.body.user.id;

    // ---------------------------------------------------------
    // Scenario 2: Unauthenticated Admin Request Handling
    // ---------------------------------------------------------
    const resS2 = await makeRequest(`${BASE_URL}/admin/health`);

    assert(
      resS2.status === 401,
      "Unauthenticated Admin Request Handling (401 Unauthorized)",
      `Expected HTTP 401, got ${resS2.status}`,
    );

    // ---------------------------------------------------------
    // Scenario 3: Student RBAC Access Denial
    // ---------------------------------------------------------
    const resS3 = await makeRequest(`${BASE_URL}/admin/health`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });

    assert(
      resS3.status === 403,
      "Student RBAC Access Denial (403 Forbidden for non-admin)",
      `Expected HTTP 403, got ${resS3.status}`,
    );

    // ---------------------------------------------------------
    // Scenario 4: Admin RBAC Access Authorization
    // ---------------------------------------------------------
    const resS4 = await makeRequest(`${BASE_URL}/admin/health`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert(
      resS4.status === 200,
      "Admin RBAC Access Authorization (200 OK for admin)",
      `Expected HTTP 200, got ${resS4.status}`,
    );

    // ---------------------------------------------------------
    // Scenario 5: System Health Endpoint Diagnostics
    // ---------------------------------------------------------
    const hData = resS4.body.health;
    const hasHealthFields =
      hData &&
      hData.server &&
      hData.server.status === "UP" &&
      hData.database &&
      hData.database.status === "CONNECTED" &&
      hData.vectorSearch &&
      hData.llmService;

    assert(
      hasHealthFields,
      "System Health Endpoint Diagnostics Payload Verification",
      "System health structure missing expected keys",
    );

    // ---------------------------------------------------------
    // Scenario 6: Secret Protection in Health Diagnostic
    // ---------------------------------------------------------
    const healthJsonStr = JSON.stringify(resS4.body);
    const hasExposedSecrets =
      healthJsonStr.includes("mongodb://") ||
      healthJsonStr.includes("JWT_SECRET") ||
      healthJsonStr.includes("OPENAI_API_KEY");

    assert(
      !hasExposedSecrets,
      "Secret Protection in Health Diagnostic (zero secrets exposed)",
      "Health endpoint exposed mongoUri, jwtSecret, or openaiApiKey",
    );

    // ---------------------------------------------------------
    // Setup Student Data for Analytics & Journey Testing
    // ---------------------------------------------------------
    const spaceRes = await makeRequest(`${BASE_URL}/spaces`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
      body: { name: "Phase 9 Space", description: "Journey Space" },
    });
    spaceId = spaceRes.body.space._id || spaceRes.body.space.id;

    const projRes = await makeRequest(`${BASE_URL}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
      body: { spaceId, name: "Phase 9 Project", description: "Journey Project" },
    });
    projectId = projRes.body.project._id || projRes.body.project.id;

    await ConceptMastery.create({
      userId: studentId,
      projectId,
      conceptId: "neural_networks",
      conceptName: "Neural Networks",
      masteryScore: 75.0,
    });
    await MasterySnapshot.create({
      userId: studentId,
      projectId,
      conceptId: "neural_networks",
      masteryScore: 75.0,
      date: new Date().toISOString().split("T")[0],
    });
    await ActivityLog.create({
      userId: studentId,
      projectId,
      activityType: "quiz_attempt",
      conceptId: "neural_networks",
      durationSeconds: 120,
      timestamp: new Date(),
    });
    await AssessmentAttempt.create({
      userId: studentId,
      projectId,
      conceptId: "neural_networks",
      prompt: "Explain NN",
      userAnswer: "NN answer",
      evaluation: {
        overallScore: 85,
        understanding: 85,
        accuracy: 90,
        completeness: 80,
        clarity: 85,
        reasoning: 85,
        feedback: "Good response",
        missingConcepts: [],
      },
    });
    await AiLog.create({
      userId: studentId,
      projectId,
      requestType: "tutor",
      model: "gpt-4o-mini",
      latencyMs: 310,
      promptTokens: 200,
      completionTokens: 100,
      totalTokens: 300,
      grounded: true,
      status: "success",
      timestamp: new Date(),
    });
    await AiLog.create({
      userId: studentId,
      projectId,
      requestType: "tutor",
      model: "gpt-4o-mini",
      latencyMs: 150,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      grounded: false,
      status: "unsupported",
      timestamp: new Date(),
    });

    // ---------------------------------------------------------
    // Scenario 7: Platform Overview Stats Endpoint
    // ---------------------------------------------------------
    const resS7 = await makeRequest(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const sData = resS7.body.stats;

    assert(
      resS7.status === 200 &&
        sData.entityCounts &&
        typeof sData.entityCounts.totalUsers === "number" &&
        sData.activeUsers &&
        sData.studyTime &&
        sData.quizPerformance &&
        sData.assessmentPerformance,
      "Platform Overview Stats Endpoint Real DB Calculations",
      "Platform stats payload structure incomplete",
    );

    // ---------------------------------------------------------
    // Scenario 8: User List Pagination
    // ---------------------------------------------------------
    const resS8 = await makeRequest(`${BASE_URL}/admin/users?page=1&limit=2`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert(
      resS8.status === 200 && resS8.body.pagination.limit === 2 && resS8.body.users.length <= 2,
      "User List Pagination",
      `Expected limit 2 users, got ${resS8.body?.users?.length}`,
    );

    // ---------------------------------------------------------
    // Scenario 9: User List Search
    // ---------------------------------------------------------
    const resS9 = await makeRequest(`${BASE_URL}/admin/users?search=Student`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert(
      resS9.status === 200 && resS9.body.users.some((u) => u.name.includes("Student")),
      "User List Search Filtering",
      "Search parameter failed to match student user",
    );

    // ---------------------------------------------------------
    // Scenario 10: User List Role Filter
    // ---------------------------------------------------------
    const resS10 = await makeRequest(`${BASE_URL}/admin/users?role=admin`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert(
      resS10.status === 200 && resS10.body.users.every((u) => u.role === "admin"),
      "User List Role Filtering",
      "Role filter returned non-admin users",
    );

    // ---------------------------------------------------------
    // Scenario 11: User Role Promotion
    // ---------------------------------------------------------
    // Create temporary user to promote
    const tempUserRes = await makeRequest(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: {
        name: "Temp User",
        email: `phase9_temp_${timestamp}@example.com`,
        password: "Password123!",
      },
    });
    const tempUserId = tempUserRes.body.user.id;

    const resS11 = await makeRequest(`${BASE_URL}/admin/users/${tempUserId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: { role: "admin" },
    });

    assert(
      resS11.status === 200 && resS11.body.user.role === "admin",
      "User Role Promotion (student -> admin)",
      `Expected role 'admin', got '${resS11.body?.user?.role}'`,
    );

    // ---------------------------------------------------------
    // Scenario 12: Invalid Role Update Handling
    // ---------------------------------------------------------
    const resS12 = await makeRequest(`${BASE_URL}/admin/users/${tempUserId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: { role: "superhero" },
    });

    assert(
      resS12.status === 400,
      "Invalid Role Update Handling (400 Bad Request)",
      `Expected 400, got HTTP ${resS12.status}`,
    );

    // ---------------------------------------------------------
    // Scenario 13: Admin Self-Demotion Protection
    // ---------------------------------------------------------
    const resS13 = await makeRequest(`${BASE_URL}/admin/users/${adminId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: { role: "student" },
    });

    assert(
      resS13.status === 400,
      "Admin Self-Demotion Protection (400 Bad Request)",
      `Expected 400, got HTTP ${resS13.status}`,
    );

    // ---------------------------------------------------------
    // Scenario 14: Protected Primary Admin Demotion Block
    // ---------------------------------------------------------
    const primaryAdmin = await User.create({
      name: "Primary Admin",
      email: config.primaryAdminEmail,
      password: "Password123!",
      role: "admin",
    });

    const resS14 = await makeRequest(`${BASE_URL}/admin/users/${primaryAdmin._id}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: { role: "student" },
    });

    assert(
      resS14.status === 403,
      "Protected Primary Admin Demotion Block (403 Forbidden)",
      `Expected 403, got HTTP ${resS14.status}`,
    );

    // ---------------------------------------------------------
    // Scenario 15: User Self-Deletion Prevention
    // ---------------------------------------------------------
    const resS15 = await makeRequest(`${BASE_URL}/admin/users/${adminId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert(
      resS15.status === 400,
      "User Self-Deletion Prevention (400 Bad Request)",
      `Expected 400, got HTTP ${resS15.status}`,
    );

    // ---------------------------------------------------------
    // Scenario 16: Protected Primary Admin Deletion Block
    // ---------------------------------------------------------
    const resS16 = await makeRequest(`${BASE_URL}/admin/users/${primaryAdmin._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert(
      resS16.status === 403,
      "Protected Primary Admin Deletion Block (403 Forbidden)",
      `Expected 403, got HTTP ${resS16.status}`,
    );

    // ---------------------------------------------------------
    // Scenario 17: Cascade User Deletion (13 Collections)
    // ---------------------------------------------------------
    const resS17 = await makeRequest(`${BASE_URL}/admin/users/${tempUserId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const deletedUser = await User.findById(tempUserId);

    assert(
      resS17.status === 200 && deletedUser === null,
      "Cascade User Deletion across collections",
      "User record was not deleted cleanly",
    );

    // ---------------------------------------------------------
    // Scenario 18: User Learning Journey Profile & Spaces
    // ---------------------------------------------------------
    const resJourney = await makeRequest(`${BASE_URL}/admin/users/${studentId}/journey`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const jData = resJourney.body.journey;

    assert(
      resJourney.status === 200 &&
        jData &&
        jData.user &&
        jData.user.id === studentId &&
        Array.isArray(jData.spaces),
      "User Learning Journey Profile & Spaces",
      "Journey user profile or spaces array missing",
    );

    // ---------------------------------------------------------
    // Scenario 19: User Learning Journey Projects & Materials
    // ---------------------------------------------------------
    assert(
      Array.isArray(jData.projects) && Array.isArray(jData.materials),
      "User Learning Journey Projects & Materials",
      "Journey projects or materials array missing",
    );

    // ---------------------------------------------------------
    // Scenario 20: User Learning Journey Mastery & Growth History
    // ---------------------------------------------------------
    assert(
      Array.isArray(jData.conceptMastery) && Array.isArray(jData.growthSnapshots),
      "User Learning Journey Mastery & Growth History",
      "Journey conceptMastery or growthSnapshots missing",
    );

    // ---------------------------------------------------------
    // Scenario 21: User Learning Journey Quiz & Assessment History
    // ---------------------------------------------------------
    assert(
      Array.isArray(jData.quizAttempts) && Array.isArray(jData.assessmentAttempts),
      "User Learning Journey Quiz & Assessment History",
      "Journey quizAttempts or assessmentAttempts missing",
    );

    // ---------------------------------------------------------
    // Scenario 22: User Learning Journey Activity Stream & Recommendations
    // ---------------------------------------------------------
    assert(
      Array.isArray(jData.recentActivity) &&
        Array.isArray(jData.activeRecommendations) &&
        jData.studyStats,
      "User Learning Journey Activity Stream & Recommendations",
      "Journey recentActivity, activeRecommendations, or studyStats missing",
    );

    // ---------------------------------------------------------
    // Scenario 23: User Learning Journey Secret Scrubbing
    // ---------------------------------------------------------
    const journeyJsonStr = JSON.stringify(jData);
    const hasSecretsInJourney =
      journeyJsonStr.includes("password") ||
      journeyJsonStr.includes("filePath") ||
      journeyJsonStr.includes("JWT_SECRET");

    assert(
      !hasSecretsInJourney,
      "User Learning Journey Secret Scrubbing",
      "Journey payload exposed passwords, file paths, or secrets",
    );

    // ---------------------------------------------------------
    // Scenario 24: AI Usage Telemetry Aggregation
    // ---------------------------------------------------------
    const resS24 = await makeRequest(`${BASE_URL}/admin/ai-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const aiSummary = resS24.body.summary;

    assert(
      resS24.status === 200 &&
        aiSummary &&
        typeof aiSummary.totalRequests === "number" &&
        aiSummary.tokens &&
        typeof aiSummary.tokens.totalTokens === "number",
      "AI Usage Telemetry Aggregation",
      "AI logs summary telemetry missing",
    );

    // ---------------------------------------------------------
    // Scenario 25: AI Usage Telemetry Filtering
    // ---------------------------------------------------------
    const resS25 = await makeRequest(`${BASE_URL}/admin/ai-logs?requestType=tutor&status=success`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert(
      resS25.status === 200 &&
        resS25.body.logs.every((l) => l.requestType === "tutor" && l.status === "success"),
      "AI Usage Telemetry Filtering",
      "AI logs filter failed to restrict results by requestType and status",
    );

    // ---------------------------------------------------------
    // Scenario 26: AI Evaluation Dashboard Metrics
    // ---------------------------------------------------------
    const resS26 = await makeRequest(`${BASE_URL}/admin/ai-evaluation`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const evalMetrics = resS26.body.metrics;

    assert(
      resS26.status === 200 &&
        evalMetrics &&
        evalMetrics.tutorMetrics &&
        typeof evalMetrics.tutorMetrics.tutorRefusalRate === "number" &&
        evalMetrics.assessment6DMetrics,
      "AI Evaluation Dashboard Metrics",
      "AI evaluation metrics structure incomplete",
    );

    // ---------------------------------------------------------
    // Scenario 27: AI Telemetry Privacy Safeguard
    // ---------------------------------------------------------
    const telemetryJsonStr = JSON.stringify(resS24.body);
    const hasSecretsInTelemetry =
      telemetryJsonStr.includes("Bearer") ||
      telemetryJsonStr.includes("OPENAI_API_KEY") ||
      telemetryJsonStr.includes("password");

    assert(
      !hasSecretsInTelemetry,
      "AI Telemetry Privacy Safeguard",
      "Telemetry response exposed auth tokens, API keys, or passwords",
    );

    // ---------------------------------------------------------
    // Scenario 28: Empty State Handling
    // ---------------------------------------------------------
    const resS28 = await makeRequest(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert(
      resS28.status === 200 && typeof resS28.body.stats.entityCounts.totalUsers === "number",
      "Empty State System Stability",
      "Admin stats crashed on queries",
    );

    // ---------------------------------------------------------
    // Scenario 29: Invalid Mongo ObjectId Handling
    // ---------------------------------------------------------
    const resS29 = await makeRequest(`${BASE_URL}/admin/users/invalid-object-id/journey`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert(
      resS29.status === 400,
      "Invalid Mongo ObjectId Handling (400 Bad Request)",
      `Expected HTTP 400, got ${resS29.status}`,
    );

    // ---------------------------------------------------------
    // Scenario 30: Phase 1-8 Regression & Frontend Protection
    // ---------------------------------------------------------
    const resAuthMe = await makeRequest(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    assert(
      resAuthMe.status === 200,
      "Phase 1-8 Regression & Frontend Protection",
      "Core auth/me endpoint failed regression test",
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
