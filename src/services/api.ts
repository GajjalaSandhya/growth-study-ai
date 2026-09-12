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
  "stack",
  "array",
  "queue",
  "sliding",
  "window",
  "hash",
  "tree",
  "pointer",
  "traversal",
  "complexity",
];

function buildTutorAnswer(question: string): ChatMessageData {
  const grounded = IN_SCOPE.some((k) => question.toLowerCase().includes(k));
  if (!grounded) {
    return {
      id: `msg_${Date.now()}`,
      role: "assistant",
      unsupported: true,
      content:
        "I couldn't find enough information about this topic in your uploaded materials for this project.",
      suggestions: ["Monotonic Stack", "Sliding Window", "Binary Trees"],
      createdAt: now(),
    };
  }
  return {
    id: `msg_${Date.now()}`,
    role: "assistant",
    grounded: true,
    content:
      "Based on your uploaded material: the pattern you're asking about works by maintaining an invariant as you scan the input once. Elements that would violate the invariant are removed before the next element is processed, so every element is handled a constant number of times and the whole scan stays linear.\n\nWork through the small example in your notes step by step — writing down the structure's contents after each step is the fastest way to internalise it.",
    citations: [
      {
        id: `cit_${Date.now()}`,
        document: "Java DSA Notes.pdf",
        page: 24,
        excerpt:
          "Maintain the invariant while scanning; remove violating elements before pushing the new one.",
      },
      {
        id: `cit_${Date.now() + 1}`,
        document: "Sliding Window.pdf",
        page: 11,
        excerpt: "Each index enters and leaves the window at most once, so the scan is O(n).",
      },
    ],
    createdAt: now(),
  };
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
