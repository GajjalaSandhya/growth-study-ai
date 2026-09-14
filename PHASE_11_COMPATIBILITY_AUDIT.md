# Phase 11 — Frontend ↔ Backend Compatibility Audit

## Executive Summary

This document presents a comprehensive, code-level compatibility audit between the **StudyMate AI** frontend (built with React, TypeScript, and TanStack Router using mock services) and the completed **StudyMate AI Backend API** (Phases 1–10, Express, MongoDB, OpenAI RAG).

The audit verified that the Phase 1–10 backend capabilities fully support all core user-facing and administrator features expected by the frontend. Out of **28 frontend API methods** inspected in `src/services/api.ts`:

- **0 methods** have unresolvable architectural blockers.
- **4 methods** match the backend response shape directly (Status A).
- **23 methods** require standard field/type mapping or token persistence handling (Status B).
- **1 method** (`authApi.requestPasswordReset`) has no dedicated backend endpoint in Phase 1–10 (Status C) and should remain a client placeholder.
- **4 major backend capabilities** (Role promotion, Cascade user deletion, Student Learning Journey inspection, and Chat history clearing) currently lack UI triggers in the frontend (Status D).

---

## 1. Frontend Architecture & API Abstraction

The frontend architecture isolates all data operations inside `src/services/api.ts`, which imports mock data definitions from `src/services/mockData.ts` and type declarations from `src/services/types.ts`.

Key characteristics of the current frontend state:

- **Centralized Service Abstraction**: Every screen imports `authApi`, `spacesApi`, `projectsApi`, `materialsApi`, `conceptsApi`, `tutorApi`, `quizApi`, `analyticsApi`, `activityApi`, `recommendationsApi`, or `adminApi` from `@/services/api`.
- **Pre-configured Fetch Wrapper**: `src/services/api.ts` contains a pre-built `http<T>(path, init)` function configured with `VITE_API_BASE_URL` (defaulting to `/api`).
- **State & Authentication Context**: Auth state is managed via `AuthContext` in `src/lib/auth.tsx`. Currently, it initializes `user` from `localStorage` under `studymate.user` and falls back to `mockData.currentUser`. It does not yet manage JWT bearer token storage.
- **Client-Side Assumptions**:
  - Quizzes are currently graded on the client using a local `gradeQuiz()` helper.
  - Open-ended assessments are graded on the client using a text-length heuristic (`Math.round(answer.length / 12)`).
  - Grounded vs unsupported tutor responses are evaluated client-side based on a keyword match array (`IN_SCOPE`).

---

## 2. Backend API Inventory (Phases 1–10 Frozen State)

The StudyMate AI backend operates on base URL `/api` with JWT Bearer authentication (`Authorization: Bearer <token>`).

| Method   | Endpoint                                            | Auth Required |   Access   | Request Body / Params                             | Primary Response Object                               |
| :------- | :-------------------------------------------------- | :-----------: | :--------: | :------------------------------------------------ | :---------------------------------------------------- |
| `POST`   | `/api/auth/register`                                |      No       |   Public   | `{ name, email, password, role }`                 | `{ success, token, user }` (forces `role: "student"`) |
| `POST`   | `/api/auth/login`                                   |      No       |   Public   | `{ email, password }`                             | `{ success, token, user }`                            |
| `GET`    | `/api/auth/me`                                      |      Yes      |  Private   | None                                              | `{ success, user }`                                   |
| `GET`    | `/api/spaces`                                       |      Yes      |  Private   | None                                              | `{ success, count, spaces }`                          |
| `POST`   | `/api/spaces`                                       |      Yes      |  Private   | `{ name, description, icon }`                     | `{ success, space }`                                  |
| `GET`    | `/api/spaces/:id`                                   |      Yes      |  Private   | `params.id`                                       | `{ success, space }`                                  |
| `PUT`    | `/api/spaces/:id`                                   |      Yes      |  Private   | `{ name, description, icon }`                     | `{ success, space }`                                  |
| `DELETE` | `/api/spaces/:id`                                   |      Yes      |  Private   | `params.id`                                       | `{ success, message }`                                |
| `GET`    | `/api/projects`                                     |      Yes      |  Private   | Query: `spaceId`                                  | `{ success, count, projects }`                        |
| `POST`   | `/api/projects`                                     |      Yes      |  Private   | `{ spaceId, name, description, subject }`         | `{ success, project }`                                |
| `GET`    | `/api/projects/:id`                                 |      Yes      |  Private   | `params.id`                                       | `{ success, project }`                                |
| `PUT`    | `/api/projects/:id`                                 |      Yes      |  Private   | `{ name, description, subject, status }`          | `{ success, project }`                                |
| `DELETE` | `/api/projects/:id`                                 |      Yes      |  Private   | `params.id`                                       | `{ success, message }`                                |
| `GET`    | `/api/materials`                                    |      Yes      |  Private   | Query: `projectId`                                | `{ success, count, materials }`                       |
| `POST`   | `/api/materials/upload`                             |      Yes      |  Private   | FormData: `file`, `projectId`                     | `{ success, material }`                               |
| `GET`    | `/api/materials/:id/status`                         |      Yes      |  Private   | `params.id`                                       | `{ success, status, progress, error }`                |
| `DELETE` | `/api/materials/:id`                                |      Yes      |  Private   | `params.id`                                       | `{ success, message }`                                |
| `POST`   | `/api/materials/:id/retry`                          |      Yes      |  Private   | `params.id`                                       | `{ success, message }`                                |
| `POST`   | `/api/projects/:projectId/tutor/ask`                |      Yes      |  Private   | `{ query }`                                       | `{ success, message }`                                |
| `GET`    | `/api/projects/:projectId/tutor/history`            |      Yes      |  Private   | `params.projectId`                                | `{ success, history }`                                |
| `DELETE` | `/api/projects/:projectId/tutor/history`            |      Yes      |  Private   | `params.projectId`                                | `{ success, message }`                                |
| `POST`   | `/api/projects/:projectId/quizzes/generate`         |      Yes      |  Private   | `{ conceptIds, difficulty, questionCount }`       | `{ success, quiz }` (answer key stripped)             |
| `POST`   | `/api/projects/:projectId/quizzes/:quizId/attempts` |      Yes      |  Private   | `{ answers: [{ questionId, selectedOptionId }] }` | `{ success, attempt }`                                |
| `POST`   | `/api/quizzes/evaluate-open`                        |      Yes      |  Private   | `{ projectId, conceptId, prompt, userAnswer }`    | `{ success, evaluation }`                             |
| `GET`    | `/api/projects/:projectId/mastery`                  |      Yes      |  Private   | `params.projectId`                                | `{ success, mastery }`                                |
| `GET`    | `/api/projects/:projectId/analytics`                |      Yes      |  Private   | `params.projectId`                                | `{ success, analytics }`                              |
| `GET`    | `/api/analytics/growth`                             |      Yes      |  Private   | None                                              | `{ success, globalGrowth }`                           |
| `GET`    | `/api/projects/:projectId/recommendations`          |      Yes      |  Private   | `params.projectId`                                | `{ success, recommendations }`                        |
| `GET`    | `/api/admin/health`                                 |      Yes      | Admin Only | None                                              | `{ success, health }`                                 |
| `GET`    | `/api/admin/stats`                                  |      Yes      | Admin Only | None                                              | `{ success, stats }`                                  |
| `GET`    | `/api/admin/users`                                  |      Yes      | Admin Only | Query: `page`, `limit`, `search`, `role`          | `{ success, pagination, users }`                      |
| `GET`    | `/api/admin/users/:userId/journey`                  |      Yes      | Admin Only | `params.userId`                                   | `{ success, journey }`                                |
| `PUT`    | `/api/admin/users/:userId/role`                     |      Yes      | Admin Only | `{ role }`                                        | `{ success, user }`                                   |
| `DELETE` | `/api/admin/users/:userId`                          |      Yes      | Admin Only | `params.userId`                                   | `{ success, message }`                                |
| `GET`    | `/api/admin/ai-logs`                                |      Yes      | Admin Only | Query: `requestType`, `status`, `page`, `limit`   | `{ success, summary, pagination, logs }`              |
| `GET`    | `/api/admin/ai-evaluation`                          |      Yes      | Admin Only | None                                              | `{ success, metrics }`                                |

---

## 3. Detailed Frontend-to-Backend Compatibility Analysis

### 3.1 Authentication & Profile (`authApi`)

- **`authApi.login`**: Maps to `POST /api/auth/login`. Response contains `token` and `user`. **Status: B**. Requires unwrap & saving `token` to `localStorage.setItem("studymate.token", token)`.
- **`authApi.signup`**: Maps to `POST /api/auth/register`. Returns `token` and `user` (forces `role: "student"`). **Status: B**.
- **`authApi.requestPasswordReset`**: No backend endpoint in Phase 1–10. **Status: C**. Keep simulated client response.
- **`authApi.me`**: Maps to `GET /api/auth/me`. Returns `{ success: true, user }`. **Status: B**.

### 3.2 Spaces (`spacesApi`)

- **`spacesApi.list`**: Maps to `GET /api/spaces`. Returns `{ success: true, spaces: [{ _id, name, description, projectCount, createdAt }] }`. **Status: B**. Map `_id` $\rightarrow$ `id`, default missing UI fields (`icon`, `averageProgress`, `materials`, `studyTimeHours`, `averageMastery`).
- **`spacesApi.get`**: Maps to `GET /api/spaces/:id`. **Status: B**. Map `_id` $\rightarrow$ `id`.
- **`spacesApi.create`**: Maps to `POST /api/spaces`. Body: `{ name, description, icon }`. **Status: B**. Map `_id` $\rightarrow$ `id`.

### 3.3 Projects (`projectsApi`)

- **`projectsApi.list`**: Maps to `GET /api/projects?spaceId=:spaceId`. Returns `{ success: true, projects: [{ _id, spaceId, name, description, subject, status, createdAt }] }`. **Status: B**. Map `_id` $\rightarrow$ `id`, populate progress & mastery metrics from analytics/mastery.
- **`projectsApi.get`**: Maps to `GET /api/projects/:id`. **Status: B**. Map `_id` $\rightarrow$ `id`.

### 3.4 Materials & PDF Upload (`materialsApi`)

- **`materialsApi.list`**: Maps to `GET /api/materials?projectId=:projectId`. **Status: A/B**. Map `_id` $\rightarrow$ `id`, `createdAt` $\rightarrow$ `uploadedAt`.
- **`materialsApi.upload`**: Maps to `POST /api/materials/upload` (FormData with `file` and `projectId`). **Status: B**. Send FormData request instead of JSON body.
- **`materialsApi.remove`**: Maps to `DELETE /api/materials/:id`. **Status: A**. Exact match.
- **`materialsApi.retry`**: Maps to `POST /api/materials/:id/retry`. **Status: A**. Exact match.

### 3.5 Concepts & Mastery (`conceptsApi`)

- **`conceptsApi.list`**: Maps to `GET /api/projects/:projectId/mastery`. Returns `{ success: true, mastery: [{ conceptId, conceptName, masteryScore, quizAttemptsCount, assessmentAttemptsCount, lastPracticedAt }] }`. **Status: B**. Map `conceptId` $\rightarrow$ `id`, `conceptName` $\rightarrow$ `name`, `masteryScore` $\rightarrow$ `mastery`, derive `level` ("Mastered" if $\ge 80$, "Strong" if $\ge 70$, etc.).

### 3.6 AI Tutor (`tutorApi`)

- **`tutorApi.history`**: Maps to `GET /api/projects/:projectId/tutor/history`. Returns `{ success: true, history: [{ id, role, content, grounded, unsupported, citations, suggestions, createdAt }] }`. **Status: A/B**. Direct field alignment.
- **`tutorApi.ask`**: Maps to `POST /api/projects/:projectId/tutor/ask`. Body: `{ query }`. Returns `{ success: true, message }`. **Status: B**. Send `query` key, unwrap `message`.

### 3.7 Quizzes & Open Assessment (`quizApi`)

- **`quizApi.questions`**: Maps to `POST /api/projects/:projectId/quizzes/generate`. Body: `{ conceptIds, difficulty, questionCount }`. Returns `{ success: true, quiz }`. **Status: B**. _Security Feature_: Backend strips answer key before returning questions to client.
- **`quizApi.submit`**: Maps to `POST /api/projects/:projectId/quizzes/:quizId/attempts`. Body: `{ answers: [{ questionId, selectedOptionId }] }`. Returns `{ success: true, attempt }`. **Status: B**. Replaces client-side `gradeQuiz` with authoritative server-side grading.
- **`quizApi.evaluateOpenAnswer`**: Maps to `POST /api/quizzes/evaluate-open`. Body: `{ projectId, conceptId, prompt, userAnswer }`. Returns `{ success: true, evaluation: { overallScore, understanding, accuracy, completeness, clarity, reasoning, feedback, missingConcepts } }`. **Status: B**. Replaces local string-length evaluation with real 6D grounded RAG evaluation.

### 3.8 Growth, Recommendations & Analytics (`analyticsApi`, `activityApi`, `recommendationsApi`)

- **`analyticsApi.overview`**: Maps to `GET /api/projects/:projectId/analytics` + `GET /api/analytics/growth`. **Status: B**. Combine project analytics and global growth into `AnalyticsBundle`.
- **`analyticsApi.growth`**: Maps to `GET /api/analytics/growth`. Returns `{ success: true, globalGrowth }`. **Status: B**.
- **`activityApi.list`**: Maps to recent activity array in `GET /api/projects/:projectId/analytics`. **Status: B**.
- **`recommendationsApi.list`**: Maps to `GET /api/projects/:projectId/recommendations`. Returns `{ success: true, recommendations }`. **Status: A/B**.

### 3.9 Admin Suite (`adminApi`)

- **`adminApi.overview`**: Maps to `GET /api/admin/stats`. Returns `{ success: true, stats }`. **Status: B**. Map `stats.entityCounts` and performance metrics to `AdminOverview.cards`.
- **`adminApi.users`**: Maps to `GET /api/admin/users`. Returns `{ success: true, pagination, users }`. **Status: B**. Map backend user fields to `AdminUser`.
- **`adminApi.systemHealth`**: Maps to `GET /api/admin/health`. Returns `{ success: true, health }`. **Status: B**. Map database, uptime, and memory diagnostics to `SystemService[]`.
- **`adminApi.systemEvents`**: Maps to `GET /api/admin/ai-logs`. Returns `{ success: true, logs }`. **Status: B**. Map `AiLog` telemetry objects.
- **`adminApi.evaluations`**: Maps to `GET /api/admin/ai-evaluation`. Returns `{ success: true, metrics }`. **Status: B**.

---

## 4. Special Security Audit Findings

1. **JWT Auth Flow & Token Handling**:
   - The frontend currently stores user object in `localStorage.setItem("studymate.user", ...)` but does not store JWT tokens.
   - _Requirement_: Update `http()` fetch wrapper in `src/services/api.ts` to retrieve `localStorage.getItem("studymate.token")` and include header `Authorization: Bearer <token>`.
2. **Answer Key Protection**:
   - Frontend `quizApi.questions()` currently expects `correctOptionId` in the retrieved question object.
   - _Backend Security Rule_: The backend intentionally omits `correctOptionId` and `explanation` on quiz retrieval. The frontend UI must defer showing correct answers until after submission when the backend returns the `attempt` evaluation.
3. **Authoritative AI & Groundedness**:
   - Frontend client-side `IN_SCOPE` keyword array in `api.ts` must be removed. Groundedness and unsupported state flags (`grounded: boolean`, `unsupported: boolean`) are computed authoritatively by the backend RAG engine and returned in the chat response.

---

## 5. Mock Data Audit Table

| Frontend Feature           | Mock File Location       | Real Backend Available? | Backend Endpoint                                             | Action                                |
| :------------------------- | :----------------------- | :---------------------: | :----------------------------------------------------------- | :------------------------------------ |
| Current User Profile       | `mockData.ts` (line 3)   |           Yes           | `GET /api/auth/me`                                           | **REPLACE WITH API**                  |
| Spaces List                | `mockData.ts` (line 12)  |           Yes           | `GET /api/spaces`                                            | **MAP EXISTING API**                  |
| Space Creation             | `api.ts` (line 71)       |           Yes           | `POST /api/spaces`                                           | **REPLACE WITH API**                  |
| Projects List              | `mockData.ts` (line 46)  |           Yes           | `GET /api/projects`                                          | **MAP EXISTING API**                  |
| Materials Upload           | `api.ts` (line 95)       |           Yes           | `POST /api/materials/upload`                                 | **REPLACE WITH API (FormData)**       |
| Material Removal / Retry   | `api.ts` (lines 106–107) |           Yes           | `DELETE /api/materials/:id`, `POST /api/materials/:id/retry` | **REPLACE WITH API**                  |
| Concept Mastery            | `mockData.ts` (line 119) |           Yes           | `GET /api/projects/:projectId/mastery`                       | **MAP EXISTING API**                  |
| Tutor History & Ask        | `api.ts` (lines 116–118) |           Yes           | `GET/POST /api/projects/:projectId/tutor/*`                  | **REPLACE WITH API**                  |
| Quiz Generation            | `api.ts` (line 122)      |           Yes           | `POST /api/projects/:projectId/quizzes/generate`             | **MAP EXISTING API**                  |
| Quiz Submission / Grading  | `api.ts` (line 129)      |           Yes           | `POST /api/projects/:projectId/quizzes/:quizId/attempts`     | **REPLACE WITH API (Server Grading)** |
| Open Assessment Evaluation | `api.ts` (line 131)      |           Yes           | `POST /api/quizzes/evaluate-open`                            | **REPLACE WITH API (6D Evaluation)**  |
| Analytics Overview         | `mockData.ts` (line 155) |           Yes           | `GET /api/projects/:projectId/analytics`                     | **MAP EXISTING API**                  |
| Growth Analytics           | `mockData.ts` (line 166) |           Yes           | `GET /api/analytics/growth`                                  | **MAP EXISTING API**                  |
| Activity Stream            | `mockData.ts` (line 173) |           Yes           | `GET /api/projects/:projectId/analytics`                     | **MAP EXISTING API**                  |
| Study Recommendations      | `mockData.ts` (line 197) |           Yes           | `GET /api/projects/:projectId/recommendations`               | **REPLACE WITH API**                  |
| Admin Stats / Overview     | `mockData.ts` (line 218) |           Yes           | `GET /api/admin/stats`                                       | **MAP EXISTING API**                  |
| Admin User List            | `mockData.ts` (line 238) |           Yes           | `GET /api/admin/users`                                       | **MAP EXISTING API**                  |
| Admin System Health        | `mockData.ts` (line 270) |           Yes           | `GET /api/admin/health`                                      | **MAP EXISTING API**                  |
| Admin AI Telemetry Logs    | `mockData.ts` (line 277) |           Yes           | `GET /api/admin/ai-logs`                                     | **MAP EXISTING API**                  |
| Admin AI Evaluation        | `mockData.ts` (line 284) |           Yes           | `GET /api/admin/ai-evaluation`                               | **MAP EXISTING API**                  |
| Password Reset Request     | `api.ts` (line 64)       |           No            | None                                                         | **KEEP TEMPORARY PLACEHOLDER**        |

---

## 6. Recommended Implementation Sequence for Phase 12 Integration

1. **Step 1: Auth & Token Integration**: Update `http()` helper in `src/services/api.ts` to attach `Authorization: Bearer <token>`, update `authApi` login/signup methods to store token in `localStorage`, and wire `useAuth` to validate against `GET /api/auth/me`.
2. **Step 2: Core Domain APIs (Spaces, Projects, Materials)**: Connect `spacesApi`, `projectsApi`, and `materialsApi` to real REST endpoints, handling `_id` $\rightarrow$ `id` mapping and FormData file upload.
3. **Step 3: RAG AI Tutor Integration**: Connect `tutorApi.history` and `tutorApi.ask` to backend RAG tutor endpoints.
4. **Step 4: Quiz & Assessment Server Integration**: Connect `quizApi.questions` and `quizApi.submit` to real backend quiz generation and server-side evaluation. Connect `quizApi.evaluateOpenAnswer` to `/api/quizzes/evaluate-open`.
5. **Step 5: Mastery, Growth & Analytics Integration**: Connect `conceptsApi`, `analyticsApi`, `activityApi`, and `recommendationsApi` to real backend analytics services.
6. **Step 6: Admin Suite Integration**: Connect `adminApi` endpoints to `/api/admin/*`. Add minor UI triggers for User Role Update and User Deletion if desired.
