import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { generateEmbedding } from "./services/embeddingService.js";
import { executeVectorSearch } from "./services/vectorSearchService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "http://localhost:5000";

function makeJsonRequest(pathStr, method = "GET", token = null, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathStr, BASE_URL);
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data), raw: data });
          } catch (e) {
            resolve({ status: res.statusCode, body: null, raw: data });
          }
        });
      },
    );

    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function makeFileUploadRequest(pathStr, token, filePath, fileName) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathStr, BASE_URL);
    const boundary = "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
    const fileData = fs.readFileSync(filePath);

    const headerBuffer = Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
        `Content-Type: application/pdf\r\n\r\n`,
    );
    const footerBuffer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const payload = Buffer.concat([headerBuffer, fileData, footerBuffer]);

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": payload.length,
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data), raw: data });
          } catch (e) {
            resolve({ status: res.statusCode, body: null, raw: data });
          }
        });
      },
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateTestPdfBuffer() {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Count 2 /Kids [ 3 0 R 4 0 R ] >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 6 0 R >>
endobj
4 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 7 0 R >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Length 120 >>
stream
BT /F1 12 Tf 100 700 Td (Data Structures: Binary Search Trees, AVL Trees, and Graph Traversal Algorithms.) Tj ET
endstream
endobj
7 0 obj
<< /Length 130 >>
stream
BT /F1 12 Tf 100 700 Td (Algorithm Analysis: Time Complexity, Asymptotic Notation, and Big-O Space Efficiency.) Tj ET
endstream
endobj
xref
0 8
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000125 00000 n 
0000000257 00000 n 
0000000389 00000 n 
0000000467 00000 n 
0000000638 00000 n 
trailer
<< /Size 8 /Root 1 0 R >>
startxref
819
%%EOF`;
  return Buffer.from(content);
}

async function runPhase5Tests() {
  console.log("=== PHASE 5 AUTOMATED VERIFICATION SUITE ===\n");
  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = "") {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
    }
  }

  const tmpDir = path.resolve(__dirname, "tmp_phase5_files");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const pdfPath = path.join(tmpDir, "ds_algo.pdf");
  fs.writeFileSync(pdfPath, generateTestPdfBuffer());

  await mongoose.connect("mongodb://127.0.0.1:27018/studymate_ai");

  try {
    // 1. Regression Check Phase 1: GET /api/health
    const health = await makeJsonRequest("/api/health", "GET");
    assert(
      health.status === 200 && health.body.database?.isConnected === true,
      "Test 1: Phase 1 Health API returns 200 OK with database connected",
    );

    // 2. Embedding Generation Test (1536 dimensions)
    const vec1 = await generateEmbedding("Binary Search Trees and Graph Traversal");
    const vec2 = await generateEmbedding("Binary Search Trees and Graph Traversal");
    assert(
      Array.isArray(vec1) && vec1.length === 1536,
      "Test 2: generateEmbedding returns 1536-dimensional vector array",
      `Vector length: ${vec1.length}`,
    );

    const isIdentical = vec1.every((val, idx) => val === vec2[idx]);
    assert(isIdentical, "Test 3: Identical input text produces identical embedding vector");

    // 3. User & Workspace Setup
    const userAEmail = `phase5_usera_${Date.now()}@example.com`;
    const userBEmail = `phase5_userb_${Date.now()}@example.com`;

    const regA = await makeJsonRequest("/api/auth/register", "POST", null, {
      name: "Phase5 UserA",
      email: userAEmail,
      password: "Password123!",
    });
    const tokenA = regA.body.token;

    const regB = await makeJsonRequest("/api/auth/register", "POST", null, {
      name: "Phase5 UserB",
      email: userBEmail,
      password: "Password123!",
    });
    const tokenB = regB.body.token;

    const spaceA = await makeJsonRequest("/api/spaces", "POST", tokenA, { name: "CS Space" });
    const spaceAId = spaceA.body.space._id;

    const projA1 = await makeJsonRequest("/api/projects", "POST", tokenA, {
      spaceId: spaceAId,
      name: "Data Structures Project",
    });
    const projA1Id = projA1.body.project._id;

    const projA2 = await makeJsonRequest("/api/projects", "POST", tokenA, {
      spaceId: spaceAId,
      name: "Unrelated Project",
    });
    const projA2Id = projA2.body.project._id;

    // 4. Upload PDF to Project A1 & Wait for Embedding Pipeline
    const uploadRes = await makeFileUploadRequest(
      `/api/projects/${projA1Id}/materials/upload`,
      tokenA,
      pdfPath,
      "ds_algo.pdf",
    );
    const matId = uploadRes.body.material._id;

    await sleep(1800);

    // 5. Verify MaterialChunk Embeddings in MongoDB
    const chunks = await mongoose.connection.db
      .collection("materialchunks")
      .find({ materialId: new mongoose.Types.ObjectId(matId) })
      .toArray();

    assert(
      chunks.length > 0 &&
        Array.isArray(chunks[0].embedding) &&
        chunks[0].embedding.length === 1536,
      "Test 4: MaterialChunks stored in MongoDB contain populated 1536-dim embedding array",
      `Chunk count: ${chunks.length}, Embedding length: ${chunks[0]?.embedding?.length}`,
    );

    // 6. Test RAG Vector Search & Citation Formatting
    const ragSearchRes = await makeJsonRequest(
      `/api/projects/${projA1Id}/rag/search`,
      "POST",
      tokenA,
      {
        query: "Binary Search Trees and Graph Traversal",
        minScore: 0.2,
      },
    );

    assert(
      ragSearchRes.status === 200 &&
        ragSearchRes.body.grounded === true &&
        ragSearchRes.body.citations?.length > 0,
      "Test 5: Relevant RAG search returns 200 OK, grounded: true, and formatted citations",
      `Got status ${ragSearchRes.status}: ${JSON.stringify(ragSearchRes.body)}`,
    );

    const firstCite = ragSearchRes.body.citations[0];
    assert(
      !!firstCite.id &&
        !!firstCite.materialId &&
        !!firstCite.document &&
        typeof firstCite.page === "number" &&
        typeof firstCite.excerpt === "string" &&
        typeof firstCite.score === "number",
      "Test 6: Citation objects contain id, materialId, document, page, excerpt, and score",
      `Citation sample: ${JSON.stringify(firstCite)}`,
    );

    // 7. Test Multi-Tenant User & Project Isolation
    const userBSearchRes = await makeJsonRequest(
      `/api/projects/${projA1Id}/rag/search`,
      "POST",
      tokenB,
      {
        query: "Binary Search Trees",
      },
    );
    assert(
      userBSearchRes.status === 404,
      "Test 7: User B attempting RAG search on User A's Project returns 404 Not Found (User Isolation)",
      `Got status ${userBSearchRes.status}`,
    );

    const projA2SearchRes = await makeJsonRequest(
      `/api/projects/${projA2Id}/rag/search`,
      "POST",
      tokenA,
      {
        query: "Binary Search Trees",
      },
    );
    assert(
      projA2SearchRes.status === 200 &&
        projA2SearchRes.body.unsupported === true &&
        projA2SearchRes.body.citations?.length === 0,
      "Test 8: Search on Project A2 (with zero materials) returns unsupported: true & 0 citations (Project Isolation)",
      `Got body: ${JSON.stringify(projA2SearchRes.body)}`,
    );

    // 8. Test Unsupported Evidence Protection (High Threshold / Irrelevant Query)
    const unsupportedRes = await makeJsonRequest(
      `/api/projects/${projA1Id}/rag/search`,
      "POST",
      tokenA,
      {
        query: "Deep Ocean Hydrothermal Vents Marine Biology",
        minScore: 0.95,
      },
    );
    assert(
      unsupportedRes.status === 200 &&
        unsupportedRes.body.grounded === false &&
        unsupportedRes.body.unsupported === true &&
        unsupportedRes.body.citations?.length === 0,
      "Test 9: Irrelevant query below RAG_MIN_SCORE returns grounded: false & unsupported: true (Evidence Protection)",
      `Got body: ${JSON.stringify(unsupportedRes.body)}`,
    );

    // Cleanup tmp directory & disconnect MongoDB
    fs.rmSync(tmpDir, { recursive: true, force: true });
    await mongoose.disconnect();

    console.log(`\nRESULTS: ${passed}/${total} tests PASSED.`);
    if (passed === total) {
      console.log("=== PHASE 5 ALL AUTOMATED TESTS PASSED ===");
      process.exit(0);
    } else {
      console.error("=== SOME TESTS FAILED ===");
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution error:", err);
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    await mongoose.disconnect();
    process.exit(1);
  }
}

runPhase5Tests();
