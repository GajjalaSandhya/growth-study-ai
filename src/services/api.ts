/**
 * API service layer.
 *
 * Every screen reads data through this module only. Today each method resolves
 * mock data after a small artificial delay; to connect a real Node.js + Express
 * backend later, replace the bodies with `http()` calls — no UI changes needed.
 */
import * as mock from "./mockData";
import type {
  ActivityItem,
  AdminOverview,
  AdminUser,
  AdminUserDetail,
  AnalyticsBundle,
  ChatMessageData,
  Concept,
  Conversation,
  KnowledgeNode,
  LearningPulse,
  Material,
  NotificationItem,
  OpenAnswerEvaluation,
  Project,
  QuizQuestion,
  QuizResult,
  Recommendation,
  SearchResult,
  Space,
  SystemService,
  User,
} from "./types";


export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "/api";

/** Thin fetch wrapper kept ready for the future REST backend. */
export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return (await res.json()) as T;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const delay = <T>(data: T, ms = 260): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

export const authApi = {
  login: (email: string, _password: string) =>
    delay<User>({ ...mock.currentUser, email: email || mock.currentUser.email }, 500),
  signup: (name: string, email: string, _password: string) =>
    delay<User>(
      {
        ...mock.currentUser,
        name: name || mock.currentUser.name,
        email: email || mock.currentUser.email,
        avatarInitials: initials(name || mock.currentUser.name),
      },
      600,
    ),
  requestPasswordReset: (_email: string) => delay({ sent: true }, 500),
  me: () => delay<User>(mock.currentUser, 100),
};

export const spacesApi = {
  list: () => delay<Space[]>(mock.spaces),
  get: (id: string) => delay<Space | undefined>(mock.spaces.find((s) => s.id === id)),
  create: (input: { name: string; description: string; icon?: string }) =>
    delay<Space>({
      id: `sp_${Date.now()}`,
      name: input.name,
      description: input.description,
      icon: input.icon ?? "BookOpen",
      projectCount: 0,
      averageProgress: 0,
      materials: 0,
      studyTimeHours: 0,
      averageMastery: 0,
      lastActivity: "Just now",
    }),
};

export const projectsApi = {
  list: (spaceId?: string) =>
    delay<Project[]>(spaceId ? mock.projects.filter((p) => p.spaceId === spaceId) : mock.projects),
  get: (id: string) => delay<Project | undefined>(mock.projects.find((p) => p.id === id)),
};

export const materialsApi = {
  list: (projectId: string) =>
    delay<Material[]>(mock.materials.filter((m) => m.projectId === projectId)),
  upload: (projectId: string, file: { name: string; sizeMb: number }) =>
    delay<Material>({
      id: `m_${Date.now()}`,
      projectId,
      name: file.name,
      sizeMb: file.sizeMb,
      pages: 0,
      status: "uploading",
      stage: "Uploaded",
      progress: 0,
      uploadedAt: new Date().toISOString().slice(0, 10),
    }),
  remove: (_id: string) => delay({ ok: true }),
  retry: (_id: string) => delay({ ok: true }),
};

export const conceptsApi = {
  list: (projectId: string) =>
    delay<Concept[]>(mock.concepts.filter((c) => c.projectId === projectId)),
};

export const knowledgeApi = {
  map: (projectId: string) =>
    delay<KnowledgeNode[]>(mock.knowledgeMap.filter((n) => n.projectId === projectId), 320),
};

export const conversationsApi = {
  list: (projectId: string) =>
    delay<Conversation[]>(mock.conversations.filter((c) => c.projectId === projectId), 320),
};

export const tutorApi = {
  history: (_projectId: string) => delay<ChatMessageData[]>(mock.tutorConversation, 400),
  ask: (_projectId: string, question: string) =>
    delay<ChatMessageData>(buildTutorAnswer(question), 1400),
};

export const quizApi = {
  questions: (concepts: string[], count: number) =>
    delay<QuizQuestion[]>(
      mock.quizQuestions
        .filter((q) => (concepts.length ? concepts.includes(q.concept) : true))
        .slice(0, count),
      500,
    ),
  /** Concepts the learner should be tested on, weakest first. */
  recommendedConcepts: (projectId: string) =>
    delay<string[]>(
      [...mock.concepts.filter((c) => c.projectId === projectId)]
        .sort((a, b) => a.mastery - b.mastery)
        .slice(0, 3)
        .map((c) => c.name),
      200,
    ),
  openEndedPrompt: () => delay<string>(mock.openEndedPrompt, 200),
  submit: (questions: QuizQuestion[], answers: Record<string, string>) =>
    delay<QuizResult>(gradeQuiz(questions, answers), 700),
  evaluateOpenAnswer: (_prompt: string, answer: string) =>
    delay<OpenAnswerEvaluation>(evaluateOpenAnswer(answer), 1500),
};

export const analyticsApi = {
  overview: (range: "7d" | "30d" | "90d" = "30d") => delay<AnalyticsBundle>(scaleAnalytics(range)),
  growth: () => delay(mock.analytics.masteryTrend),
};

export const activityApi = { list: () => delay<ActivityItem[]>(mock.activity) };
export const recommendationsApi = { list: () => delay<Recommendation[]>(mock.recommendations) };
export const pulseApi = { get: (_projectId?: string) => delay<LearningPulse>(mock.learningPulse, 200) };
export const notificationsApi = {
  list: () => delay<NotificationItem[]>(mock.notifications, 200),
};

export const searchApi = {
  query: (term: string) => delay<SearchResult[]>(searchEverything(term), 120),
};

export const adminApi = {
  overview: () => delay<AdminOverview>(mock.adminOverview),
  users: () => delay<AdminUser[]>(mock.adminUsers),
  user: (id: string) =>
    delay<AdminUserDetail | undefined>(mock.adminUserDetails.find((u) => u.id === id), 320),
  systemHealth: () => delay<SystemService[]>(mock.systemServices),
  systemEvents: () => delay(mock.systemEvents),
  evaluations: () => delay(mock.aiEvaluations),
};


/* ------------------------------ helpers ------------------------------ */

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const IN_SCOPE = [
  "regression",
  "linear",
  "logistic",
  "gradient",
  "descent",
  "learning rate",
  "decision tree",
  "tree",
  "overfit",
  "regulari",
  "cross validation",
  "k-fold",
  "validation",
  "loss",
  "bias",
  "variance",
  "supervised",
  "classification",
  "evaluation",
  "sigmoid",
];

function buildTutorAnswer(question: string): ChatMessageData {
  const grounded = IN_SCOPE.some((k) => question.toLowerCase().includes(k));
  if (!grounded) {
    return {
      id: `msg_${Date.now()}`,
      role: "assistant",
      unsupported: true,
      content:
        "I couldn't find enough information in your Project materials to answer this reliably.",
      suggestions: ["Gradient Descent", "Cross Validation", "Regularization"],
      createdAt: now(),
    };
  }
  return {
    id: `msg_${Date.now()}`,
    role: "assistant",
    grounded: true,
    content:
      "Based on your uploaded material: the idea you're asking about comes down to how the model measures error and then reduces it. The loss function scores how wrong the current parameters are, and each training step adjusts those parameters in the direction that lowers the score.\n\nYour notes work through this on a small example — following the numbers for two or three iterations is the fastest way to make the intuition stick, and it also explains why the learning rate matters so much.",
    citations: [
      {
        id: `cit_${Date.now()}`,
        document: "Machine Learning Notes.pdf",
        page: 55,
        excerpt:
          "Each parameter is updated by subtracting the learning rate times the partial derivative of the loss.",
      },
      {
        id: `cit_${Date.now() + 1}`,
        document: "Model Evaluation.pdf",
        page: 18,
        excerpt:
          "Validation loss rising while training loss falls is the clearest early signal of overfitting.",
      },
    ],
    createdAt: now(),
  };
}

function evaluateOpenAnswer(answer: string): OpenAnswerEvaluation {
  const text = answer.toLowerCase();
  const keyConcepts = [
    { name: "Loss function", keys: ["loss", "error", "cost"] },
    { name: "Gradient direction", keys: ["gradient", "derivative", "slope"] },
    { name: "Learning rate", keys: ["learning rate", "step size"] },
    { name: "Convergence", keys: ["converge", "minimum", "settle"] },
    { name: "Divergence risk", keys: ["diverge", "oscillat", "overshoot"] },
  ];
  const covered = keyConcepts.filter((c) => c.keys.some((k) => text.includes(k))).map((c) => c.name);
  const missing = keyConcepts.filter((c) => !covered.includes(c.name)).map((c) => c.name);
  const coverage = Math.round((covered.length / keyConcepts.length) * 100);
  const lengthScore = Math.min(40, Math.round(answer.trim().length / 12));

  return {
    understanding: Math.min(97, 45 + lengthScore + Math.round(coverage / 6)),
    accuracy: Math.min(96, 52 + Math.round(coverage / 2.2)),
    relevance: Math.min(98, 60 + Math.round(coverage / 3)),
    reasoningQuality: Math.min(95, 48 + lengthScore),
    conceptsCovered: covered,
    conceptsMissing: missing,
    feedback: covered.length
      ? `You correctly connect ${covered.slice(0, 2).join(" and ").toLowerCase()} to how parameters are updated. The explanation reads clearly and follows a sensible order.`
      : "Your answer is on topic but stays general. Anchor it to the specific mechanism: loss, gradient, and the size of each update step.",
    improvements: missing.length
      ? missing.slice(0, 3).map((m) => `Say more about ${m.toLowerCase()} and why it changes the outcome.`)
      : ["Add a short worked example with concrete numbers to make the reasoning concrete."],
  };
}

function searchEverything(term: string): SearchResult[] {
  const q = term.trim().toLowerCase();
  const results: SearchResult[] = [
    ...mock.projects.map((p) => ({
      id: p.id,
      type: "Project" as const,
      title: p.name,
      subtitle: p.subject,
      projectId: p.id,
    })),
    ...mock.materials.map((m) => ({
      id: m.id,
      type: "Material" as const,
      title: m.name,
      subtitle: m.status === "ready" ? `${m.pages} pages indexed` : (m.stage ?? m.status),
      projectId: m.projectId,
    })),
    ...mock.concepts.map((c) => ({
      id: c.id,
      type: "Concept" as const,
      title: c.name,
      subtitle: `${c.mastery}% mastery · ${c.status}`,
      projectId: c.projectId,
    })),
    ...mock.conversations.map((c) => ({
      id: c.id,
      type: "Conversation" as const,
      title: c.title,
      subtitle: `${c.messageCount} messages · ${c.concept}`,
      projectId: c.projectId,
    })),
  ];
  if (!q) return results.slice(0, 8);
  return results
    .filter((r) => `${r.title} ${r.subtitle}`.toLowerCase().includes(q))
    .slice(0, 12);
}


function now() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function gradeQuiz(questions: QuizQuestion[], answers: Record<string, string>): QuizResult {
  let correct = 0;
  const byConcept = new Map<string, { correct: number; total: number }>();
  for (const q of questions) {
    const isCorrect = answers[q.id] === q.correctOptionId;
    if (isCorrect) correct += 1;
    const entry = byConcept.get(q.concept) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (isCorrect) entry.correct += 1;
    byConcept.set(q.concept, entry);
  }
  return {
    score: questions.length ? Math.round((correct / questions.length) * 100) : 0,
    correct,
    incorrect: questions.length - correct,
    conceptPerformance: [...byConcept.entries()].map(([concept, v]) => ({
      concept,
      correct: v.correct,
      total: v.total,
      score: Math.round((v.correct / v.total) * 100),
    })),
  };
}

function scaleAnalytics(range: "7d" | "30d" | "90d"): AnalyticsBundle {
  const base = mock.analytics;
  const factor = range === "7d" ? 0.3 : range === "30d" ? 1 : 2.8;
  return {
    ...base,
    totals: {
      ...base.totals,
      studyTimeHours: Math.round(base.totals.studyTimeHours * factor * 10) / 10,
      questionsAnswered: Math.round(base.totals.questionsAnswered * factor),
      tutorQuestions: Math.round(base.totals.tutorQuestions * factor),
    },
    masteryTrend:
      range === "90d"
        ? [
            { label: "Month 1", mastery: 38 },
            { label: "Month 2", mastery: 55 },
            { label: "Month 3", mastery: 74 },
          ]
        : range === "7d"
          ? [
              { label: "Mon", mastery: 68 },
              { label: "Wed", mastery: 71 },
              { label: "Fri", mastery: 73 },
              { label: "Sun", mastery: 74 },
            ]
          : base.masteryTrend,
  };
}
