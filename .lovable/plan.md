# StudyMate AI — full specification build

Reworks the demo content around a Machine Learning theme and adds the missing
screens: Knowledge map, Conversations, Onboarding, admin user detail, plus the
Learning Pulse and Visual Learning Loop components, richer tutor/quiz flows,
command-palette search and a notifications drawer.

Note on addresses: pages already live at `/projects/:id/...` (no `/app` prefix).
I'll keep that scheme so existing links keep working.

## 1. Demo data (Machine Learning theme)

Rewrite the mock data set:
- User: Yuvtej.
- Spaces: Machine Learning (primary), Data Structures, Generative AI, Interview Preparation.
- ML projects: Machine Learning Fundamentals (with the stated goal), Deep Learning Basics, ML Interview Preparation.
- Materials: Machine Learning Notes.pdf, Supervised Learning.pdf, Model Evaluation.pdf.
- Concepts with mastery + trend: Linear Regression 86 Strong, Logistic Regression 72 Improving,
  Decision Trees 64 Stable, Gradient Descent 51 Needs Attention, Cross Validation 58 Needs Attention,
  Overfitting 42 Needs Attention, Regularization 65 Improving.
- Quiz bank, tutor conversation, citations, activity, recommendations, analytics and admin
  records all re-themed to ML.

## 2. Signature components

- **Learning Pulse** card (home + project overview): current focus, strongest concept,
  weakest concept, weekly improvement, and a next-best-action button that navigates
  straight into the recommended quiz.
- **Visual Learning Loop** (project overview): Materials → Knowledge → Tutor → Practice →
  Assessment → Mastery → Growth → Next Action, with the active step highlighted and each
  step clickable.

## 3. Materials lifecycle

Full staged status display: Uploaded → Queued → Processing → Reading Content →
Understanding Structure → Extracting Knowledge → Creating Searchable Representation → Ready,
plus a failed state with Retry. Simulated stage timing in the service layer.

## 4. New pages

- **Knowledge** (`/projects/:id/knowledge`): expandable concept hierarchy
  (Supervised Learning → Regression, Classification; Optimization; Model Evaluation) with
  mastery score, source document and page citation, and related concepts per node.
- **Conversations** (`/projects/:id/conversations`): saved tutor conversations with search,
  filters, message counts, last message preview and resume action.
- **Onboarding** (`/onboarding`): 5-step flow — Welcome, What do you want to learn,
  First Space, First Project, First Material — with progress dots and Skip.
- **Admin user detail** (`/admin/users/:userId`): learning journey, projects, quiz history,
  AI token usage and activity timeline; user rows in the admin table link here.

Project tab bar becomes: Overview, Materials, Knowledge, AI Tutor, Conversations, Quiz,
Mastery, Growth, Analytics.

## 5. Tutor, quiz and assessment upgrades

- Tutor: quick prompts (Explain this simply, Give me an example, Test my understanding,
  Compare these concepts, Create a revision plan); clickable page-excerpt citations;
  unsupported-question state with the specified wording and two CTAs; right context panel
  showing Learning Goal, Current Focus, Mastery and Recent Difficulties.
- Quiz: setup with count, difficulty, concept picker and a "Recommended Quiz" preset built
  from the weakest concepts; per-question explanation after answering with a review CTA;
  results screen with score, accuracy, concept breakdown and next recommendation.
- Open-ended assessment: prompt, textarea with character counter, and grading breakdown for
  Understanding, Accuracy, Relevance, key concepts covered vs missing, and reasoning quality.

## 6. Global search and notifications

- Cmd/Ctrl+K command palette searching projects, materials, concepts and conversations,
  each result tagged by type and navigating on select.
- Notifications dropdown with unread dots, grouped items for processing updates, mastery
  milestones and quiz suggestions, plus mark-all-read.

## 7. Technical notes

- All new data flows through `src/services/types.ts` + `mock-data.ts` + `api.ts`; components
  never import mock data directly, so a real backend can drop in later.
- New route files under `src/routes/`, new components under `src/components/`
  (`learning/LearningPulse.tsx`, `learning/LearningLoop.tsx`, `search/CommandPalette.tsx`,
  `layout/NotificationsMenu.tsx`, `onboarding/*`).
- Keyboard accessible dialogs, labelled controls, semantic headings; unique page metadata
  per new route.
