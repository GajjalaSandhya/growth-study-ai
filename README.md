# StudyMate AI — AI Study Companion

> **"Learn smarter. Practice better. Grow continuously."**

StudyMate AI is a production-grade, AI-native study companion and learning analytics platform. It goes far beyond a generic AI chatbot by integrating document processing, Retrieval-Augmented Generation (RAG), adaptive quizzes, server-side grading, concept mastery tracking, continuous growth analytics, personalized recommendations, and real-time administrative telemetry.

---

## 🌟 Executive Summary & Key Capabilities

- 🔒 **End-to-End Authentication & RBAC**: JWT-based session management, role-based access control (`student` vs `admin`), and strict multi-tenant resource isolation.
- 🗂️ **Spaces & Projects Hierarchy**: Organized workspace system isolating materials, chat history, quizzes, mastery, and analytics by project.
- 📄 **PDF Processing & Vector Search Pipeline**: Background PDF text extraction, document chunking (500 tokens / 50 overlap), vector embeddings (`text-embedding-3-small`), and 1536-dim Atlas Vector Search.
- 🤖 **Grounded AI Tutor**: Context-aware AI tutoring powered by RAG evidence retrieval. Provides precise source citations (document name, page number, excerpt) and refuses unsupported out-of-domain queries (`unsupported: true, grounded: false`).
- 🎯 **Adaptive Quizzes & Answer Key Security**: Server-side generated adaptive quizzes targeting weak concepts. **Question answer keys (`correctAnswerIndex`) and explanations are stripped before sending to the client** to guarantee anti-cheat security.
- 📝 **Open-Ended RAG Assessments**: Structured 6D AI evaluation (`overallScore`, `understanding`, `accuracy`, `completeness`, `clarity`, `reasoning`, `feedback`, `improvements`, `citations`) evaluating student explanations against uploaded study evidence.
- 📈 **Concept Mastery & Growth Analytics**: Automated backend-calculated concept decay, mastery deltas, practice streak counts, and continuous growth snapshot tracking.
- 💡 **Personalized Recommendation Engine**: Rule-based backend engine prioritizing learning actions based on weak concepts and unstudied materials.
- 🛡️ **Comprehensive Admin Telemetry & Health**: Real-time admin dashboard monitoring platform entity counts, user learning journeys, AI request logs, tutor accuracy, groundedness ratios, and system health diagnostics.

---

## 🏗️ Architecture Overview

```
[ Web Browser Client ]
       │
       │ REST API + JWT Bearer Token (HTTPS)
       ▼
[ Deployed Express Backend Server ] (Node.js + Express)
       ├── Auth Middleware (JWT Validation + RBAC Enforcement)
       ├── Controllers & Services (Spaces, Projects, Materials, Tutor, Quiz, Mastery, Admin)
       ├── Background Processing Pipeline (PDF extraction, chunking, vector embedding)
       ├── MongoDB Atlas Database (Mongoose models: Users, Spaces, Projects, Materials, Chunks, Quizzes, Attempts, Mastery, ActivityLog, AiLog)
       ├── Atlas Vector Search Engine (1536-dim vector index for RAG retrieval)
       └── OpenAI API Provider (text-embedding-3-small + gpt-4o-mini)
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | React 18, TypeScript, Vite, TanStack Router, TanStack Query, Tailwind CSS, Lucide Icons, Recharts, Sonner |
| **Backend API** | Node.js, Express.js, Mongoose ODM, JWT (`jsonwebtoken`), bcryptjs, Multer, pdf-parse |
| **AI / RAG / Vectors** | OpenAI API (`text-embedding-3-small`, `gpt-4o-mini`), MongoDB Atlas Vector Search, Cosine Similarity Fallback |
| **Database** | MongoDB Atlas / Local MongoDB 8.0 |
| **Build & Deployment** | Cloudflare Nitro SSR / Vite Build, Node.js process runner |

---

## 🔑 Environment Variables Reference

Create a `.env` file in the project root or `server/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://127.0.0.1:27017/studymate_ai

# Authentication & Security
JWT_SECRET=super_secret_jwt_key_studymate_2026
PRIMARY_ADMIN_EMAIL=admin@studymate.ai

# OpenAI AI Provider Configuration
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536
TUTOR_MODEL=gpt-4o-mini

# RAG & Tutor Parameters
RAG_TOP_K=4
RAG_MIN_SCORE=0.6
TUTOR_HISTORY_LIMIT=10

# Frontend API URL (for Vite build)
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## ⚡ Quick Start & Setup Instructions

### 1. Prerequisites
- Node.js >= 18.0
- MongoDB 8.0 or MongoDB Atlas Cluster

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### 3. Start Database & Backend Server
```bash
# Start MongoDB (if local)
mongod --dbpath scratch/mongodb_data --port 27018 --fork --logpath scratch/mongod.log

# Start backend Express server (Port 5000)
npm run server
# or
node server/server.js
```

### 4. Start Frontend Development Server
```bash
# Start Vite development server (Port 5173 / 3000)
npm run dev
```

---

## 🧪 Verification & Automated Testing

StudyMate AI includes 10 comprehensive automated test suites covering all API routes, database models, RAG retrieval, security controls, and end-to-end user workflows.

### Run All Test Suites
```bash
node scratch/run_all_tests.js
```

### Test Suite Breakdown:
- `server/test_phase10.js` — Backend Core & Security Audit (15 tests)
- `scratch/test_phase12_1.js` — Authentication & Session Integration (14 tests)
- `scratch/test_phase12_2.js` — Spaces & Projects Integration (21 tests)
- `scratch/test_phase12_3.js` — Materials & Processing Integration (15 tests)
- `scratch/test_phase12_4.js` — Tutor RAG & Citations Integration (13 tests)
- `scratch/test_phase12_5.js` — Adaptive Quiz & Assessment Integration (18 tests)
- `scratch/test_phase12_6.js` — Concept Mastery & Growth Integration (18 tests)
- `scratch/test_phase12_7.js` — Analytics, Recs & Activity Integration (19 tests)
- `scratch/test_phase12_8.js` — Admin Telemetry & Health Integration (20 tests)
- `scratch/test_phase12_9.js` — Final End-to-End Learning Loop Integration (38 tests)

**Total Test Verdict: 171 / 171 PASSED**

### Code Quality Verification
```bash
# TypeScript check
npx tsc --noEmit

# ESLint check
npx eslint src/routes/

# Production build check
npm run build
```

---

## 🤖 AI Models vs Development AI Tools

### AI Models Used by StudyMate AI Product:
- **`text-embedding-3-small`**: Generates 1536-dimensional vector embeddings for material chunks.
- **`gpt-4o-mini`**: Powers the grounded Tutor QA, adaptive quiz generation, open-ended 6D assessment evaluation, and concept extraction.

### AI Tools Used to Build the Codebase:
- **Google Antigravity / Gemini 3.6 Flash**: Pair programming agent used for codebase auditing, frontend-backend integration, test suite construction, and quality assurance.

---

## 📌 Known Limitations

1. **Local File Storage**: PDF uploads are saved locally in `server/uploads/`. Deployments on ephemeral container platforms (e.g., Heroku, AWS Fargate) should attach cloud object storage (S3/GCS).
2. **Local Vector Search Fallback**: When running without MongoDB Atlas Search index configuration, vector retrieval automatically uses local fallback cosine similarity calculation.
3. **Offline Development Fallback**: When `OPENAI_API_KEY` is omitted in development mode, the system defaults to deterministic offline dev generators for tutor answers and quiz generation.

---

## 📄 License & Author

StudyMate AI — AI Study Companion
Developed as an advanced AI-native EdTech project.
