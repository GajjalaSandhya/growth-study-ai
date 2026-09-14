# StudyMate AI — Step 2: Backend Production Deployment Plan

## 1. Executive Summary & Recommended Platform

### Recommended Platform: **Render Web Service** (or Railway / Vercel Serverless / AWS App Runner)
For a college project, live presentation, or production demo, **Render Web Service (Free / Starter Tier)** is the optimal choice for the StudyMate AI Node.js backend:
* Native Node.js ES Modules support (`"type": "module"` in `package.json`).
* Automatic deployment directly from GitHub repository commits.
* Built-in free HTTPS / SSL certificate.
* Native environment variable management.
* Health check monitoring support at `/api/health`.

---

## 2. Server Build & Start Commands

* **Root Directory / Build Context**: `server/` (or repository root with root directory set to `server`)
* **Install Command**: `npm install`
* **Build Command**: `npm run build` (or `npm install` if no compile step is needed)
* **Start Command**: `node server.js` (or `npm start` as defined in `server/package.json`)
* **Node Version**: `20.x` (LTS)

---

## 3. Production Environment Variables Matrix

The following environment variables are strictly required by [`server/config/env.js`](file:///home/rgukt/growth-study-ai/server/config/env.js):

| Variable Name | Required / Default | Purpose | Example / Production Value |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Required** | Sets production mode enforcement | `production` |
| `PORT` | Auto / Required | Server listening port | `10000` (Render sets automatically) |
| `MONGODB_URI` | **Required** | Production MongoDB Atlas SRV URI | `mongodb+srv://<USER>:<PASS>@cluster0.6mvpiph.mongodb.net/studymate_ai?appName=Cluster0` |
| `JWT_SECRET` | **Required** | Secret key for signing JWT auth tokens | `<random-64-character-hex-string>` |
| `CORS_ORIGIN` | **Required** | Allowed frontend origins (comma-separated) | `https://studymate-ai.vercel.app,http://localhost:5173` |
| `OPENAI_API_KEY` | **Required** | OpenAI key for RAG embeddings & Tutor | `sk-proj-...` |
| `EMBEDDING_MODEL` | Optional (default: `text-embedding-3-small`) | Model for text chunk vectorization | `text-embedding-3-small` |
| `EMBEDDING_DIMENSION` | Optional (default: `1536`) | Embedding vector dimensions | `1536` |
| `RAG_TOP_K` | Optional (default: `4`) | Number of material chunks retrieved | `4` |
| `RAG_MIN_SCORE` | Optional (default: `0.60`) | Similarity threshold for citation grounding | `0.60` |
| `TUTOR_MODEL` | Optional (default: `gpt-4o-mini`) | AI Tutor response generation model | `gpt-4o-mini` |
| `TUTOR_HISTORY_LIMIT` | Optional (default: `10`) | Chat context window message limit | `10` |
| `PRIMARY_ADMIN_EMAIL` | Optional (default: `admin@studymate.ai`) | Admin user promotion email | `admin@studymate.ai` |

---

## 4. File-Storage Limitation & Production Mitigation

### Current Architecture Inspection
* File uploads are handled by `multer.diskStorage` in [`server/middleware/uploadMiddleware.js`](file:///home/rgukt/growth-study-ai/server/middleware/uploadMiddleware.js#L16-L29), saving incoming PDFs to local disk directory `server/uploads/`.

### Cloud Container Ephemeral Disk Limitation
* On cloud hosting services (Render, Railway, Heroku), container filesystems are **ephemeral**. Files written to `server/uploads/` are discarded whenever the container restarts or redeploys.

### How StudyMate AI Architecture Prevents Data Loss
1. **Immediate Text & Vector Extraction**: When a PDF is uploaded, [`server/services/processingPipeline.js`](file:///home/rgukt/growth-study-ai/server/services/processingPipeline.js) immediately parses all text pages, creates 1536-dim vector embeddings, and stores the processed content into MongoDB Atlas (`materials` and `materialchunks` collections).
2. **Database Grounding**: Vector search, RAG Tutor answers, Adaptive Quizzes, and Analytics query MongoDB Atlas (`materialchunks`), **never the raw disk file**.
3. **Container Recovery**: On server startup, `recoverStalledProcessingJobs()` in [`server/services/processingPipeline.js`](file:///home/rgukt/growth-study-ai/server/services/processingPipeline.js#L119) automatically detects and recovers any background jobs interrupted by container restarts.

*Conclusion*: Temporary local disk storage during processing is completely sufficient for production deployment without code changes.

---

## 5. Background-Processing Considerations

* Processing pipelines run asynchronously in Node.js background memory.
* On Render Free Tier, instances spin down after 15 minutes of inactivity. When a request arrives, instance cold-start takes ~30-40 seconds.
* Background PDF processing jobs run during active request lifetime. Once finished, processed chunks are permanently safe in MongoDB Atlas.

---

## 6. Security Requirements & Fail-Fast Safeguards

1. **JWT Fail-Fast**: [`server/config/env.js`](file:///home/rgukt/growth-study-ai/server/config/env.js#L33) enforces that if `NODE_ENV=production`, the application throws a fatal error on boot if `JWT_SECRET` is missing or set to a default fallback.
2. **MongoDB URI Fail-Fast**: [`server/config/env.js`](file:///home/rgukt/growth-study-ai/server/config/env.js#L36) throws a fatal error if `MONGODB_URI` is missing in production.
3. **Scrubbed Health Endpoint**: `/api/health` scrubs sensitive connection string details and database passwords.
4. **CORS Security**: Cross-Origin Request Sharing strictly validates request origins against `CORS_ORIGIN`.

---

## 7. Step-by-Step Backend Deployment Execution Plan

1. **Repository Push**: Ensure latest code is pushed to GitHub repository branch.
2. **Render Web Service Creation**:
   * Connect GitHub repository to Render dashboard.
   * Root directory: `server`
   * Environment: `Node`
   * Build Command: `npm install`
   * Start Command: `node server.js`
3. **Environment Variables Setup**:
   * Add all production environment variables listed in Section 3 above into the Render environment configuration panel.
4. **Deploy Service**: Click **Deploy Web Service**.
5. **Obtain Backend Production URL**:
   * Note the live backend service URL (e.g. `https://studymate-backend.onrender.com`).

---

## 8. Post-Deployment Verification Plan

Once the backend is deployed, the following empirical tests will be executed before declaring success:

1. **Public Health Check**:
   `GET https://<BACKEND_URL>/api/health`
   * Expected: HTTP 200 OK, `status: "healthy"`, `database.state: "connected"`.
2. **Root Endpoint**:
   `GET https://<BACKEND_URL>/`
   * Expected: HTTP 200 OK greeting JSON.
3. **Fail-Fast Secret Verification**:
   Verify no credentials or secret keys are exposed in HTTP responses or log outputs.
4. **Live Atlas RAG Integration**:
   Verify backend communicates with the live Atlas Vector Search index `material_chunks_vector_index`.
