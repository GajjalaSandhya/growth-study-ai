import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import processMaterial from "./services/processingPipeline.js";

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

// Generate valid multi-page PDF buffer with text on each page
function generateMultiPagePdfBuffer() {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Count 3 /Kids [ 3 0 R 4 0 R 5 0 R ] >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 6 0 R >> >> /Contents 7 0 R >>
endobj
4 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 6 0 R >> >> /Contents 8 0 R >>
endobj
5 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 6 0 R >> >> /Contents 9 0 R >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
7 0 obj
<< /Length 120 >>
stream
BT
/F1 12 Tf
100 700 Td
(Page 1: Introduction to Data Structures and Algorithmic Analysis for StudyMate AI.) Tj
ET
endstream
endobj
8 0 obj
<< /Length 130 >>
stream
BT
/F1 12 Tf
100 700 Td
(Page 2: Array structures, Linked Lists, Binary Search Trees, and Graph Traversal algorithms.) Tj
ET
endstream
endobj
9 0 obj
<< /Length 140 >>
stream
BT
/F1 12 Tf
100 700 Td
(Page 3: Dynamic Programming, Greedy Heuristics, and Big-O Time Complexity Metrics.) Tj
ET
endstream
endobj
xref
0 10
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000125 00000 n 
0000000257 00000 n 
0000000389 00000 n 
0000000521 00000 n 
0000000599 00000 n 
0000000770 00000 n 
0000000951 00000 n 
trailer
<< /Size 10 /Root 1 0 R >>
startxref
1142
%%EOF`;
  return Buffer.from(content);
}

// Generate image-only/scanned PDF buffer without extractable text
function generateScannedPdfBuffer() {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Count 1 /Kids [ 3 0 R ] >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
178
%%EOF`;
  return Buffer.from(content);
}

async function runPhase4Tests() {
  console.log("=== PHASE 4 AUTOMATED VERIFICATION SUITE ===\n");
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

  const tmpDir = path.resolve(__dirname, "tmp_phase4_files");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const multiPagePdfPath = path.join(tmpDir, "multipage_study.pdf");
  const scannedPdfPath = path.join(tmpDir, "scanned_doc.pdf");

  fs.writeFileSync(multiPagePdfPath, generateMultiPagePdfBuffer());
  fs.writeFileSync(scannedPdfPath, generateScannedPdfBuffer());

  await mongoose.connect("mongodb://127.0.0.1:27018/studymate_ai");

  try {
    // 1. Setup User A
    const userAEmail = `phase4_usera_${Date.now()}@example.com`;
    const regA = await makeJsonRequest("/api/auth/register", "POST", null, {
      name: "Phase4 UserA",
      email: userAEmail,
      password: "Password123!",
    });
    const tokenA = regA.body.token;

    const spaceA = await makeJsonRequest("/api/spaces", "POST", tokenA, { name: "Phase 4 Space" });
    const spaceAId = spaceA.body.space._id;

    const projA = await makeJsonRequest("/api/projects", "POST", tokenA, {
      spaceId: spaceAId,
      name: "Phase 4 Project",
    });
    const projAId = projA.body.project._id;

    assert(!!projAId, "Setup: User A, Space A, Project A created");

    // 2. Upload Multi-Page PDF & Check Initial Status ("processing", 0)
    const uploadRes = await makeFileUploadRequest(
      `/api/projects/${projAId}/materials/upload`,
      tokenA,
      multiPagePdfPath,
      "multipage_study.pdf",
    );
    assert(
      uploadRes.status === 201 && uploadRes.body.material?.status === "processing",
      "Test 1: Upload returns 201 Created with status 'processing' & progress 0",
      `Got status ${uploadRes.status}: ${JSON.stringify(uploadRes.body)}`,
    );
    const matId = uploadRes.body.material._id;

    // 3. Wait for Background Processing Pipeline to finish
    await sleep(1500);

    const getMatRes = await makeJsonRequest(`/api/projects/${projAId}/materials`, "GET", tokenA);
    const processedMat = getMatRes.body.materials?.find((m) => m._id === matId);

    assert(
      processedMat?.status === "ready" &&
        processedMat?.progress === 100 &&
        processedMat?.pages === 3,
      "Test 2: Background process sets status 'ready', progress 100, and actual page count 3",
      `Got material state: ${JSON.stringify(processedMat)}`,
    );

    // 4. Verify MaterialChunk Documents in MongoDB
    const chunks = await mongoose.connection.db
      .collection("materialchunks")
      .find({ materialId: new mongoose.Types.ObjectId(matId) })
      .toArray();

    assert(
      chunks.length >= 3,
      "Test 3: MaterialChunks created in MongoDB for extracted pages",
      `Found ${chunks.length} chunks`,
    );

    const firstChunk = chunks[0];
    assert(
      !!firstChunk.userId &&
        !!firstChunk.projectId &&
        !!firstChunk.materialId &&
        typeof firstChunk.chunkIndex === "number" &&
        typeof firstChunk.pageNumber === "number" &&
        !!firstChunk.documentName &&
        !!firstChunk.text,
      "Test 4: MaterialChunk retains pageNumber, documentName, chunkIndex, userId, projectId, materialId",
      `Chunk sample: ${JSON.stringify(firstChunk)}`,
    );

    // 5. Scanned / No-Text PDF Test
    const scannedUpload = await makeFileUploadRequest(
      `/api/projects/${projAId}/materials/upload`,
      tokenA,
      scannedPdfPath,
      "scanned_doc.pdf",
    );
    const scannedMatId = scannedUpload.body.material._id;

    await sleep(1500);

    const getScannedMat = await makeJsonRequest(
      `/api/projects/${projAId}/materials`,
      "GET",
      tokenA,
    );
    const failedMat = getScannedMat.body.materials?.find((m) => m._id === scannedMatId);

    assert(
      failedMat?.status === "failed" &&
        failedMat?.progress < 100 &&
        failedMat?.error?.includes("No extractable text found"),
      "Test 5: Scanned/no-text PDF fails gracefully with status 'failed' and descriptive error message",
      `Got failed material: ${JSON.stringify(failedMat)}`,
    );

    // 6. Test Retry Without Duplicate Chunks
    const countBeforeRetry = chunks.length;
    await makeJsonRequest(`/api/materials/${matId}/retry`, "POST", tokenA);
    await sleep(1500);

    const chunksAfterRetry = await mongoose.connection.db
      .collection("materialchunks")
      .find({ materialId: new mongoose.Types.ObjectId(matId) })
      .toArray();

    assert(
      chunksAfterRetry.length === countBeforeRetry,
      "Test 6: Material retry safely regenerates chunks without creating duplicates",
      `Chunks before: ${countBeforeRetry}, after: ${chunksAfterRetry.length}`,
    );

    // 7. Concurrent Processing Protection Test
    const matObjId = new mongoose.Types.ObjectId(matId);
    await Promise.all([
      processMaterial(matObjId),
      processMaterial(matObjId),
      processMaterial(matObjId),
    ]);

    const chunksAfterConcurrent = await mongoose.connection.db
      .collection("materialchunks")
      .find({ materialId: matObjId })
      .toArray();

    assert(
      chunksAfterConcurrent.length === countBeforeRetry,
      "Test 7: Concurrent processMaterial invocations are locked & produce zero duplicate chunks",
      `Chunk count: ${chunksAfterConcurrent.length}`,
    );

    // 8. Test Cascade Chunk Deletion (Deleting Material)
    await makeJsonRequest(`/api/materials/${matId}`, "DELETE", tokenA);
    const chunksAfterMatDelete = await mongoose.connection.db
      .collection("materialchunks")
      .find({ materialId: matObjId })
      .toArray();

    assert(
      chunksAfterMatDelete.length === 0,
      "Test 8: Deleting Material deletes all associated MaterialChunk documents from MongoDB",
      `Remaining chunks: ${chunksAfterMatDelete.length}`,
    );

    // Cleanup tmp files
    fs.rmSync(tmpDir, { recursive: true, force: true });
    await mongoose.disconnect();

    console.log(`\nRESULTS: ${passed}/${total} tests PASSED.`);
    if (passed === total) {
      console.log("=== PHASE 4 ALL AUTOMATED TESTS PASSED ===");
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

runPhase4Tests();
