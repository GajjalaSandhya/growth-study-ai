# Phase 12.7 — Real Analytics + Recommendations + Activity Integration Documentation

## Overview

Phase 12.7 connected the existing Lovable frontend Analytics (`/analytics`, `/projects/$projectId/analytics`), Recommendations (`/recommendations`), and Activity (`/activity`, `/projects/$projectId/activity`) views to the live, deterministic Node.js + Express + MongoDB backend.

Active mock data, fake metrics, artificial delays, and client-side fallback engines were removed from these flows. The backend remains the single source of truth for all mastery-derived metrics, recommendation logic, and activity logging.

---

## 1. Endpoints & Response Shapes

### Project Analytics

- **Endpoint**: `GET /api/projects/:projectId/analytics`
- **Auth**: `Authorization: Bearer <JWT>`
- **Response**:
  ```json
  {
    "success": true,
    "analytics": {
      "projectId": "...",
      "mastery": { "currentScore": 75, "previousScore": 70, "delta": 5, "trend": "improving" },
      "conceptDistribution": { "beginner": 1, "intermediate": 2, "advanced": 3 },
      "quizPerformance": { "totalAttempts": 5, "passedAttempts": 4, "passRate": 80, "averageScore": 85 },
      "assessmentPerformance": { "totalAssessments": 2, "averageScore": 78, "averages6D": { ... } },
      "tutorActivity": { "totalQuestionsAsked": 10, "groundedRatio": 1 },
      "materials": { "totalMaterials": 3, "totalPages": 45 },
      "studyTime": { "totalMinutes": 120, "byActivity": { "quizMinutes": 40, "assessmentMinutes": 30, "tutorMinutes": 50 } },
      "recentActivity": [ { "activityType": "quiz_attempt", "conceptId": "...", "durationSeconds": 300, "timestamp": "..." } ]
    }
  }
  ```

### Global Analytics

- **Endpoint**: `GET /api/analytics/growth`
- **Auth**: `Authorization: Bearer <JWT>`
- **Response**:
  ```json
  {
    "success": true,
    "globalGrowth": {
      "userId": "...",
      "growth": {
        "currentMastery": 75,
        "previousMastery": 70,
        "deltaPercentage": 7.14,
        "trend": "improving"
      },
      "streakDays": 3,
      "totalStudyMinutes": 120,
      "totalQuizzesTaken": 5,
      "globalPassRate": 80,
      "globalAverageScore": 85,
      "totalActiveProjects": 2
    }
  }
  ```

### Recommendations

- **Endpoint**: `GET /api/projects/:projectId/recommendations`
- **Auth**: `Authorization: Bearer <JWT>`
- **Response**:
  ```json
  {
    "success": true,
    "recommendations": [
      {
        "priority": "high",
        "type": "adaptive_quiz",
        "conceptId": "concept_1",
        "title": "Practice Algebra Concepts",
        "action": "Take an adaptive 5-question quiz focusing on Algebra.",
        "reason": "Current concept mastery is 45.0% (below target threshold of 60%).",
        "estimatedMinutes": 8
      }
    ]
  }
  ```

---

## 2. API Layer & Data Mappings

All API interactions are handled strictly through `src/services/api.ts` using `http()` wrapper and TanStack Query.

- `analyticsApi.projectAnalytics(projectId)`: fetches project learning-loop analytics.
- `analyticsApi.globalGrowth()`: fetches global growth analytics across projects.
- `analyticsApi.overview(projectId?)`: maps backend metrics into `AnalyticsBundle` for UI render.
- `recommendationsApi.projectList(projectId)`: maps raw backend recommendations to `Recommendation` objects with normalized priorities (`High` | `Medium` | `Low`) and dynamic route links (`/projects/$projectId/quiz`, `/projects/$projectId/tutor`, `/projects/$projectId/materials`).
- `recommendationsApi.globalList()`: aggregates recommendations across user projects.
- `activityApi.projectList(projectId)`: transforms backend `recentActivity` items into `ActivityItem` timeline format (`Today`, `Yesterday`, `This week`, `Earlier`).
- `activityApi.globalList()`: aggregates timeline events across all user projects.

---

## 3. TanStack Query Keys

- **Project Analytics**: `["analytics", projectId]`
- **Global Analytics**: `["analytics"]`
- **Project Recommendations**: `["recommendations", projectId]`
- **Global Recommendations**: `["recommendations"]`
- **Project Activity**: `["activity", projectId]`
- **Global Activity**: `["activity"]`

---

## 4. UI Components & Route Integration

1. `src/components/views/AnalyticsView.tsx`: Accepts `projectId?` prop. Renders real stat cards and analytics charts for project-scoped or global analytics.
2. `src/routes/projects.$projectId.analytics.tsx`: Passes `projectId` from URL params to `<AnalyticsView projectId={projectId} />`.
3. `src/routes/analytics.tsx`: Renders global analytics view using `analyticsApi.overview()`.
4. `src/components/cards/RecommendationCard.tsx`: Dynamically routes action clicks to real project tool views (`quiz`, `tutor`, `materials`, `mastery`).
5. `src/routes/projects.$projectId.activity.tsx`: Connects tab to `activityApi.list(projectId)` with `["activity", projectId]`.
6. `src/routes/activity.tsx`: Connects global timeline to `activityApi.list()` with `["activity"]`.

---

## 5. Security & Project Isolation

- Every analytics, activity, and recommendation request uses `Authorization: Bearer <JWT>`.
- Project routes verify user ownership on the backend. Attempting to fetch User A's project analytics, recommendations, or activity with User B's token returns `404 Not Found` (Access Denied).

---

## 6. Verification & Test Results

### Phase 12.7 Test Suite (`scratch/test_phase12_7.js`)

**Result: 19/19 PASSED**

1. User A & User B authentication/setup succeeds — **PASS**
2. Authenticated project analytics request succeeds — **PASS**
3. Unauthenticated project analytics request returns 401 — **PASS**
4. Project analytics contains real backend-supported data structure — **PASS**
5. Global analytics request succeeds — **PASS**
6. Global analytics returns backend-defined growth data structure — **PASS**
7. Project recommendations request succeeds — **PASS**
8. Recommendation data comes from backend recommendation engine — **PASS**
9. Frontend does not contain active mock recommendation data in API layer — **PASS**
10. Project activity request succeeds — **PASS**
11. Activity response contains real backend activity logged in database — **PASS**
12. Global project listing for activity aggregation succeeds — **PASS**
13. Activity events maintain exact backend schema without fabricated fields — **PASS**
14. User B cannot access User A project analytics (returns 404 access denied) — **PASS**
15. User B cannot access User A project recommendations (returns 404 access denied) — **PASS**
16. User B cannot access User A project activity (returns 404 access denied) — **PASS**
17. Invalid project ID format is handled correctly with status 400 — **PASS**
18. Empty/no-data state is handled honestly without fabricated fallback scores — **PASS**
19. Source audit verifies no active mock delays or mock analytics/activity in services — **PASS**

### Regression Test Results

- **Phase 12.6**: 18/18 PASSED
- **Phase 12.5**: 18/18 PASSED
- **Phase 12.4**: 13/13 PASSED
- **Phase 12.3**: 15/15 PASSED
- **Phase 12.2**: 21/21 PASSED
- **Phase 12.1**: 14/14 PASSED
- **Phase 10**: 15/15 PASSED

### Code Quality & Build Checks

- **TypeScript (`npx tsc --noEmit`)**: 0 errors
- **ESLint (`npm run lint`)**: Clean (0 errors in Phase 12.7 code)
- **Production Build (`npm run build`)**: Successful (Nitro server output in 5.01s)
- **Backend Freeze (`git status --porcelain server/`)**: 0 modifications (strict 0-change compliance)

---

## 7. Modified & Created Files

### Created Files

- `scratch/test_phase12_7.js`
- `PHASE_12.7_ANALYTICS_RECOMMENDATIONS_ACTIVITY_INTEGRATION.md`

### Modified Files

- `src/services/api.ts`
- `src/components/views/AnalyticsView.tsx`
- `src/components/cards/RecommendationCard.tsx`
- `src/routes/projects.$projectId.analytics.tsx`
- `src/routes/projects.$projectId.activity.tsx`
- `src/routes/projects.$projectId.index.tsx`
- `src/routes/activity.tsx`
- `src/routes/recommendations.tsx`
- `src/routes/dashboard.tsx`
- `src/routes/admin.activity.tsx`
- `src/routes/settings.tsx`
- `src/components/dialogs/CreateProjectDialog.tsx`

---

## 8. Known Limitations

- Global recommendations across projects perform parallel requests across active user projects; for users with a large number of projects (>20), backend batching endpoint could be added in future un-frozen backend releases.
- Analytics charts display chronological snapshots and category distributions as provided by the backend, but empty projects with zero attempts display honest empty state messages rather than interpolated dummy graphs.
