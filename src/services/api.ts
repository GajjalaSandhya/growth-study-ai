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
  AnalyticsBundle,
  ChatMessageData,
  Citation,
  Concept,
  Material,
  MaterialStatus,
  Project,
  ProjectStatus,
  QuizQuestion,
  QuizResult,
  Recommendation,
  Space,
  SystemService,
  User,
} from "./types";

export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:5000/api";
export const TOKEN_STORAGE_KEY = "studymate.token";
export const USER_STORAGE_KEY = "studymate.user";

/** Fetch wrapper connecting to real backend REST endpoints. */
export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const isFormData = init?.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init?.headers as Record<string, string>) ?? {}),
  };

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });

    let data: any = {};
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (_) {
        data = { message: text };
      }
    }

    if (!res.ok) {
      let errorMessage = data.message || data.error;
      if (!errorMessage) {
        if (res.status === 401) errorMessage = "Unauthorized session. Please log in again.";
        else if (res.status === 403)
          errorMessage = "Access denied. You do not have permission to view this resource.";
        else if (res.status === 404) errorMessage = "Requested resource not found.";
        else if (res.status === 400) errorMessage = "Invalid request data.";
        else if (res.status >= 500) errorMessage = "Server error. Please try again later.";
        else errorMessage = `HTTP error ${res.status}`;
      }

      if (res.status === 401) {
        // Clear invalid or expired session token
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
      throw new ApiError(res.status, errorMessage, data);
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(0, err.message || "Network error. Unable to connect to server.", {
      networkError: true,
    });
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const delay = <T>(data: T, ms = 260): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await http<{ success: boolean; token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
    }
    if (res.user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
    }
    return res.user;
  },
  signup: async (name: string, email: string, password: string) => {
    const res = await http<{ success: boolean; token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    if (res.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
    }
    if (res.user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
    }
    return res.user;
  },
  requestPasswordReset: (_email: string) => delay({ sent: true }, 500),
  me: async () => {
    const res = await http<{ success: boolean; user: User }>("/auth/me");
    if (res.user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
    }
    return res.user;
  },
};

function mapSpace(raw: any): Space {
  return {
    id: (raw._id || raw.id).toString(),
    name: raw.name || "",
    description: raw.description || "",
    icon: raw.icon || "BookOpen",
    projectCount: raw.projectCount ?? 0,
    averageProgress: raw.averageProgress ?? 0,
    materials: raw.materials ?? 0,
    studyTimeHours: raw.studyTimeHours ?? 0,
    averageMastery: raw.averageMastery ?? 0,
    lastActivity: raw.lastActivity
      ? new Date(raw.lastActivity).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "Recently",
  };
}

function mapProject(raw: any): Project {
  return {
    id: (raw._id || raw.id).toString(),
    spaceId: (raw.spaceId?._id || raw.spaceId || "").toString(),
    name: raw.name || "",
    description: raw.description || "",
    subject: raw.subject || "General",
    progress: raw.progress ?? 0,
    masteryScore: raw.masteryScore ?? 0,
    conceptsMastered: raw.conceptsMastered ?? 0,
    conceptCount: raw.conceptCount ?? 0,
    materialCount: raw.materialCount ?? 0,
    quizAccuracy: raw.quizAccuracy ?? 0,
    studyTimeHours: raw.studyTimeHours ?? 0,
    status: (raw.status as ProjectStatus) || "in-progress",
    lastActivity: raw.lastActivity
      ? new Date(raw.lastActivity).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "Recently",
  };
}

export const spacesApi = {
  list: async (): Promise<Space[]> => {
    const res = await http<{ success: boolean; count: number; spaces: any[] }>("/spaces");
    return (res.spaces || []).map(mapSpace);
  },
  get: async (id: string): Promise<Space | undefined> => {
    const res = await http<{ success: boolean; space: any }>(`/spaces/${id}`);
    return res.space ? mapSpace(res.space) : undefined;
  },
  create: async (input: { name: string; description?: string; icon?: string }): Promise<Space> => {
    const res = await http<{ success: boolean; space: any }>("/spaces", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return mapSpace(res.space);
  },
  update: async (
    id: string,
    input: { name?: string; description?: string; icon?: string },
  ): Promise<Space> => {
    const res = await http<{ success: boolean; space: any }>(`/spaces/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    return mapSpace(res.space);
  },
  remove: async (id: string): Promise<{ success: boolean; message: string }> => {
    return http<{ success: boolean; message: string }>(`/spaces/${id}`, {
      method: "DELETE",
    });
  },
};

export const projectsApi = {
  list: async (spaceId?: string): Promise<Project[]> => {
    const path = spaceId ? `/projects?spaceId=${encodeURIComponent(spaceId)}` : "/projects";
    const res = await http<{ success: boolean; count: number; projects: any[] }>(path);
    return (res.projects || []).map(mapProject);
  },
  get: async (id: string): Promise<Project | undefined> => {
    const res = await http<{ success: boolean; project: any }>(`/projects/${id}`);
    return res.project ? mapProject(res.project) : undefined;
  },
  create: async (input: {
    spaceId: string;
    name: string;
    description?: string;
    subject?: string;
    status?: ProjectStatus;
  }): Promise<Project> => {
    const res = await http<{ success: boolean; project: any }>("/projects", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return mapProject(res.project);
  },
  update: async (
    id: string,
    input: { name?: string; description?: string; subject?: string; status?: ProjectStatus },
  ): Promise<Project> => {
    const res = await http<{ success: boolean; project: any }>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
    return mapProject(res.project);
  },
  remove: async (id: string): Promise<{ success: boolean; message: string }> => {
    return http<{ success: boolean; message: string }>(`/projects/${id}`, {
      method: "DELETE",
    });
  },
};

function mapMaterial(raw: any): Material {
  return {
    id: (raw._id || raw.id).toString(),
    projectId: (raw.projectId?._id || raw.projectId || "").toString(),
    name: raw.name || "",
    sizeMb: raw.sizeMb ?? 0,
    pages: raw.pages ?? 0,
    status: (raw.status as MaterialStatus) || "processing",
    progress: raw.progress ?? 0,
    error: raw.error || undefined,
    uploadedAt:
      raw.uploadedAt || raw.createdAt
        ? new Date(raw.uploadedAt || raw.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "Recently",
  };
}

export const materialsApi = {
  list: async (projectId: string): Promise<Material[]> => {
    const res = await http<{ success: boolean; count: number; materials: any[] }>(
      `/projects/${projectId}/materials`,
    );
    return (res.materials || []).map(mapMaterial);
  },
  upload: async (projectId: string, file: File): Promise<Material> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await http<{ success: boolean; message: string; material: any }>(
      `/projects/${projectId}/materials/upload`,
      {
        method: "POST",
        body: formData,
      },
    );
    return mapMaterial(res.material);
  },
  remove: async (id: string): Promise<{ success: boolean; message: string }> => {
    return http<{ success: boolean; message: string }>(`/materials/${id}`, {
      method: "DELETE",
    });
  },
  retry: async (id: string): Promise<Material> => {
    const res = await http<{ success: boolean; message: string; material: any }>(
      `/materials/${id}/retry`,
      {
        method: "POST",
      },
    );
    return mapMaterial(res.material);
  },
};

export const conceptsApi = {
  list: async (projectId: string): Promise<Concept[]> => {
    try {
      const res = await http<{ success: boolean; data: { concepts: any[] } }>(
        `/projects/${projectId}/mastery`,
      );
      return (res.data?.concepts || []).map((c: any) => ({
        id: (c.conceptId || c._id || "").toString(),
        projectId,
        name: c.conceptName || c.conceptId || "General",
        mastery: Math.round(c.masteryScore ?? 0),
        level:
          (c.masteryScore ?? 0) >= 80
            ? "Mastered"
            : (c.masteryScore ?? 0) >= 60
              ? "Strong"
              : (c.masteryScore ?? 0) >= 40
                ? "Developing"
                : "Needs Review",
        quizzesTaken: c.quizAttemptsCount ?? 0,
        assessmentsTaken: c.assessmentAttemptsCount ?? 0,
        tutorQuestions: 0,
        lastPracticed: c.lastPracticedAt
          ? new Date(c.lastPracticedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "Recently",
        summary: `Concept ${c.conceptName || c.conceptId}`,
      }));
    } catch (_) {
      return [];
    }
  },
};

function mapCitation(raw: any): Citation {
  const docName = raw.document || raw.documentName;
  const safeDocName =
    docName && docName !== "undefined" && String(docName).trim() !== ""
      ? String(docName).trim()
      : "Study Material";

  return {
    id: raw.id || (raw._id ? raw._id.toString() : `cit_${Math.random()}`),
    document: safeDocName,
    page: raw.page ?? raw.pageNumber ?? 1,
    excerpt: raw.excerpt || "",
  };
}

function mapChatMessage(raw: any): ChatMessageData {
  return {
    id: (raw._id || raw.id).toString(),
    role: raw.role || "assistant",
    content: raw.content || "",
    grounded: raw.grounded ?? true,
    unsupported: raw.unsupported ?? false,
    citations: Array.isArray(raw.citations) ? raw.citations.map(mapCitation) : [],
    suggestions: Array.isArray(raw.suggestions) ? raw.suggestions : [],
    createdAt: raw.createdAt
      ? new Date(raw.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

export const tutorApi = {
  history: async (projectId: string): Promise<ChatMessageData[]> => {
    const res = await http<{
      success: boolean;
      count: number;
      data: { messages: any[] };
    }>(`/projects/${projectId}/tutor/history`);
    return (res.data?.messages || []).map(mapChatMessage);
  },
  ask: async (projectId: string, question: string): Promise<ChatMessageData> => {
    const res = await http<{
      success: boolean;
      data: { message: any };
    }>(`/projects/${projectId}/tutor/ask`, {
      method: "POST",
      body: JSON.stringify({ question }),
    });
    return mapChatMessage(res.data.message);
  },
  clearHistory: async (projectId: string): Promise<{ success: boolean; message: string }> => {
    return http<{ success: boolean; message: string }>(`/projects/${projectId}/tutor/history`, {
      method: "DELETE",
    });
  },
};

function mapQuizQuestion(raw: any, idx: number, quizDifficulty?: string) {
  const options = Array.isArray(raw.options)
    ? raw.options.map((opt: any, oIdx: number) => {
        if (typeof opt === "string") {
          return { id: String(oIdx), text: opt };
        }
        return { id: opt.id ?? String(oIdx), text: opt.text ?? String(opt) };
      })
    : [];

  const rawDiff = raw.difficulty || quizDifficulty || "medium";

  return {
    id: raw.questionId || (raw._id ? raw._id.toString() : `q_${idx}`),
    questionIndex: raw.questionIndex ?? idx,
    concept: raw.conceptId || raw.concept || "General",
    difficulty: rawDiff.charAt(0).toUpperCase() + rawDiff.slice(1),
    prompt: raw.questionText || raw.prompt || "",
    options,
    citation: raw.citation ? mapCitation(raw.citation) : undefined,
  };
}

export const quizApi = {
  list: async (projectId: string) => {
    const res = await http<{ success: boolean; count: number; quizzes: any[] }>(
      `/projects/${projectId}/quizzes`,
    );
    return (res.quizzes || []).map((q) => ({
      id: q._id.toString(),
      title: q.title || "Adaptive Quiz",
      difficulty: q.difficulty || "medium",
      questions: (q.questions || []).map((question: any, idx: number) =>
        mapQuizQuestion(question, idx, q.difficulty),
      ),
    }));
  },

  get: async (projectId: string, quizId: string) => {
    const res = await http<{ success: boolean; quiz: any }>(
      `/projects/${projectId}/quizzes/${quizId}`,
    );
    const q = res.quiz;
    return {
      id: q._id.toString(),
      title: q.title || "Adaptive Quiz",
      difficulty: q.difficulty || "medium",
      questions: (q.questions || []).map((question: any, idx: number) =>
        mapQuizQuestion(question, idx, q.difficulty),
      ),
    };
  },

  generate: async (
    projectId: string,
    params: { conceptIds?: string[]; difficulty?: string; questionCount?: number },
  ) => {
    const res = await http<{
      success: boolean;
      message: string;
      quiz: { _id: string; title: string; difficulty: string; questions: any[] };
    }>(`/projects/${projectId}/quizzes/generate`, {
      method: "POST",
      body: JSON.stringify({
        conceptIds: params.conceptIds || [],
        difficulty: (params.difficulty || "medium").toLowerCase(),
        questionCount: params.questionCount || 5,
      }),
    });

    const quiz = res.quiz;
    return {
      quizId: quiz._id.toString(),
      title: quiz.title || "Adaptive Quiz",
      difficulty: quiz.difficulty || "medium",
      questions: (quiz.questions || []).map((q, idx) => mapQuizQuestion(q, idx, quiz.difficulty)),
    };
  },

  submitAttempt: async (
    projectId: string,
    quizId: string,
    payload: {
      answers: { questionIndex: number; selectedOptionIndex: number }[];
      timeSpentSeconds?: number;
    },
  ) => {
    const res = await http<{
      success: boolean;
      message: string;
      attempt: any;
    }>(`/projects/${projectId}/quizzes/${quizId}/attempts`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const att = res.attempt || {};
    const feedbackAnswers = att.answers || [];

    const conceptMap = new Map<string, { correct: number; total: number }>();
    feedbackAnswers.forEach((fa: any) => {
      const cId = fa.conceptId || "General";
      const entry = conceptMap.get(cId) || { correct: 0, total: 0 };
      entry.total += 1;
      if (fa.isCorrect) entry.correct += 1;
      conceptMap.set(cId, entry);
    });

    const conceptPerformance = Array.from(conceptMap.entries()).map(([concept, v]) => ({
      concept,
      total: v.total,
      correct: v.correct,
      score: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
    }));

    return {
      id: (att.id || att._id || "").toString(),
      score: att.score ?? 0,
      correctCount: att.correctCount ?? 0,
      totalQuestions: att.totalQuestions ?? feedbackAnswers.length,
      incorrectCount: (att.totalQuestions ?? feedbackAnswers.length) - (att.correctCount ?? 0),
      passed: att.passed ?? false,
      timeSpentSeconds: att.timeSpentSeconds ?? 0,
      completedAt: att.completedAt || new Date().toISOString(),
      answers: feedbackAnswers,
      conceptPerformance,
      updatedMastery: att.updatedMastery || [],
    };
  },

  evaluateOpenAnswer: async (
    projectId: string,
    prompt: string,
    answer: string,
    conceptId?: string,
  ) => {
    const res = await http<any>(`/projects/${projectId}/quizzes/evaluate-open`, {
      method: "POST",
      body: JSON.stringify({
        prompt,
        answer,
        conceptId: conceptId || "general",
      }),
    });

    if (res.unsupported) {
      return {
        unsupported: true,
        grounded: false,
        message:
          res.message ||
          "I could not find sufficient evidence in your uploaded study materials to evaluate this answer accurately.",
        assessment: null,
      };
    }

    const att = res.assessment || {};
    const evalData = att.evaluation || {};

    return {
      unsupported: false,
      grounded: true,
      assessment: {
        id: (att.id || att._id || "").toString(),
        conceptId: att.conceptId || "general",
        prompt: att.prompt || prompt,
        userAnswer: att.userAnswer || answer,
        evaluation: {
          overallScore: evalData.overallScore ?? 75,
          understanding: evalData.understanding ?? 75,
          accuracy: evalData.accuracy ?? 75,
          completeness: evalData.completeness ?? 75,
          clarity: evalData.clarity ?? 75,
          reasoning: evalData.reasoning ?? 75,
          missingConcepts: Array.isArray(evalData.missingConcepts) ? evalData.missingConcepts : [],
          feedback: evalData.feedback || "Evaluation completed.",
          improvements: Array.isArray(evalData.improvements) ? evalData.improvements : [],
        },
        citations: Array.isArray(att.citations) ? att.citations.map(mapCitation) : [],
        createdAt: att.createdAt || new Date().toISOString(),
      },
    };
  },
};

export const masteryApi = {
  getProjectMastery: async (projectId: string) => {
    const res = await http<{
      success: boolean;
      data: {
        derivedProjectMastery: number;
        conceptCount: number;
        concepts: any[];
        weakConcepts: any[];
        strongConcepts: any[];
      };
    }>(`/projects/${projectId}/mastery`);
    return res.data;
  },
};

function mapRecommendation(raw: any, defaultProjectId?: string): Recommendation {
  const prio = (raw.priority || "medium").toLowerCase();
  const priority: "High" | "Medium" | "Low" =
    prio === "high" ? "High" : prio === "low" ? "Low" : "Medium";

  const rawType = raw.type || "adaptive_quiz";
  const type: "review" | "practice" | "quiz" | "assessment" =
    rawType === "review_material" || rawType === "review"
      ? "review"
      : rawType === "tutor_practice" || rawType === "practice"
        ? "practice"
        : rawType === "open_assessment" || rawType === "assessment"
          ? "assessment"
          : "quiz";

  return {
    id: raw._id ? raw._id.toString() : raw.id || `rec_${Math.random()}`,
    title: raw.title || "Study Recommendation",
    reason: raw.reason || "Based on your learning progress",
    priority,
    estimatedMinutes: raw.estimatedMinutes ?? 10,
    type,
    projectId: raw.projectId ? raw.projectId.toString() : defaultProjectId,
    action: raw.action,
    conceptId: raw.conceptId,
  };
}

function mapActivityItem(raw: any, projectName: string = "Project"): ActivityItem {
  const timestampStr = raw.timestamp || raw.createdAt || new Date().toISOString();
  const date = new Date(timestampStr);
  const now = new Date();

  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let day: "Today" | "Yesterday" | "This week" | "Earlier" = "Earlier";
  if (diffDays === 0) day = "Today";
  else if (diffDays === 1) day = "Yesterday";
  else if (diffDays <= 7) day = "This week";

  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  let type: "quiz" | "tutor" | "upload" | "mastery" | "assessment" = "quiz";
  let title = "Learning Activity";
  let detail = "";

  const conceptLabel = raw.conceptId && raw.conceptId !== "general" ? raw.conceptId : "";

  if (raw.activityType === "quiz_attempt" || raw.type === "quiz") {
    type = "quiz";
    title = "Adaptive Quiz Attempted";
    detail = raw.durationSeconds
      ? `Completed in ${Math.round(raw.durationSeconds / 60)} mins`
      : "Completed quiz attempt";
  } else if (raw.activityType === "open_assessment" || raw.type === "assessment") {
    type = "assessment";
    title = "Open-Ended Assessment";
    detail = raw.durationSeconds
      ? `Completed in ${Math.round(raw.durationSeconds / 60)} mins`
      : "Evaluation completed";
  } else if (raw.activityType === "tutor_interaction" || raw.type === "tutor") {
    type = "tutor";
    title = "AI Tutor Interaction";
    detail = conceptLabel ? `Practiced topic: ${conceptLabel}` : "Asked AI Tutor a question";
  } else if (raw.activityType === "mastery_update" || raw.type === "mastery") {
    type = "mastery";
    title = "Mastery Level Updated";
    detail = conceptLabel ? `Concept: ${conceptLabel}` : "Mastery updated";
  } else if (raw.activityType === "material_upload" || raw.type === "upload") {
    type = "upload";
    title = "Study Material Uploaded";
    detail = "Material processed successfully";
  }

  return {
    id: raw._id ? raw._id.toString() : raw.id || `act_${date.getTime()}_${Math.random()}`,
    type,
    title,
    detail,
    project: projectName,
    day,
    time,
  };
}

export const analyticsApi = {
  projectAnalytics: async (projectId: string) => {
    const res = await http<{
      success: boolean;
      analytics: any;
    }>(`/projects/${projectId}/analytics`);
    return res.analytics;
  },
  globalGrowth: async () => {
    const res = await http<{
      success: boolean;
      globalGrowth: any;
    }>("/analytics/growth");
    return res.globalGrowth;
  },
  overview: async (projectId?: string): Promise<AnalyticsBundle> => {
    if (projectId) {
      const data = await analyticsApi.projectAnalytics(projectId);
      const studyHrs = Math.round(((data.studyTime?.totalMinutes || 0) / 60) * 10) / 10;
      const quizAcc = Math.round(data.quizPerformance?.averageScore || 0);
      const cMastery = Math.round(data.mastery?.currentScore || 0);
      const qAns = (data.quizPerformance?.totalAttempts || 0) * 5;
      const tQuest = data.tutorActivity?.totalQuestionsAsked || 0;

      const dist = data.conceptDistribution || { beginner: 0, intermediate: 0, advanced: 0 };
      const conceptDistribution = [
        { name: "Beginner (<60%)", value: dist.beginner || 0 },
        { name: "Intermediate (60-79%)", value: dist.intermediate || 0 },
        { name: "Advanced (80%+)", value: dist.advanced || 0 },
      ];

      const masteryTrend =
        data.mastery?.previousScore !== null && data.mastery?.previousScore !== undefined
          ? [
              { label: "Previous", mastery: Math.round(data.mastery.previousScore) },
              { label: "Current", mastery: Math.round(data.mastery.currentScore) },
            ]
          : [{ label: "Current", mastery: Math.round(data.mastery?.currentScore || 0) }];

      const quizPerformance = [
        { label: "Pass Rate", accuracy: Math.round(data.quizPerformance?.passRate || 0) },
        { label: "Average Score", accuracy: Math.round(data.quizPerformance?.averageScore || 0) },
      ];

      const byAct = data.studyTime?.byActivity || {};
      const studyActivity = [
        { label: "Quizzes", minutes: byAct.quizMinutes || 0 },
        { label: "Assessments", minutes: byAct.assessmentMinutes || 0 },
        { label: "Tutor", minutes: byAct.tutorMinutes || 0 },
      ];

      return {
        totals: {
          studyTimeHours: studyHrs,
          quizAccuracy: quizAcc,
          conceptMastery: cMastery,
          questionsAnswered: qAns,
          tutorQuestions: tQuest,
          streak: 0,
        },
        masteryTrend,
        quizPerformance,
        studyActivity,
        conceptDistribution,
      };
    } else {
      const data = await analyticsApi.globalGrowth();
      const studyHrs = Math.round(((data.totalStudyMinutes || 0) / 60) * 10) / 10;
      const quizAcc = Math.round(data.globalAverageScore || 0);
      const cMastery = Math.round(data.growth?.currentMastery || 0);

      const masteryTrend =
        data.growth?.previousMastery !== null && data.growth?.previousMastery !== undefined
          ? [
              { label: "Previous", mastery: Math.round(data.growth.previousMastery) },
              { label: "Current", mastery: Math.round(data.growth.currentMastery) },
            ]
          : [{ label: "Current", mastery: Math.round(data.growth?.currentMastery || 0) }];

      const quizPerformance = [
        { label: "Pass Rate", accuracy: Math.round(data.globalPassRate || 0) },
        { label: "Average Score", accuracy: Math.round(data.globalAverageScore || 0) },
      ];

      const studyActivity = [{ label: "Study Time", minutes: data.totalStudyMinutes || 0 }];

      return {
        totals: {
          studyTimeHours: studyHrs,
          quizAccuracy: quizAcc,
          conceptMastery: cMastery,
          questionsAnswered: data.totalQuizzesTaken || 0,
          tutorQuestions: 0,
          streak: data.streakDays || 0,
        },
        masteryTrend,
        quizPerformance,
        studyActivity,
        conceptDistribution: [],
      };
    }
  },
  growth: async () => {
    const data = await analyticsApi.globalGrowth();
    return data.growth;
  },
};

export const recommendationsApi = {
  projectList: async (projectId: string): Promise<Recommendation[]> => {
    const res = await http<{ success: boolean; recommendations: any[] }>(
      `/projects/${projectId}/recommendations`,
    );
    return (res.recommendations || []).map((r) => mapRecommendation(r, projectId));
  },
  globalList: async (): Promise<Recommendation[]> => {
    const projects = await projectsApi.list();
    const all: Recommendation[] = [];
    for (const p of projects) {
      try {
        const recs = await recommendationsApi.projectList(p.id);
        all.push(...recs);
      } catch (_) {
        // ignore individual project fetch error
      }
    }
    const priorityWeight = { High: 3, Medium: 2, Low: 1 };
    all.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
    return all;
  },
  list: async (projectId?: string): Promise<Recommendation[]> => {
    if (projectId) {
      return recommendationsApi.projectList(projectId);
    }
    return recommendationsApi.globalList();
  },
};

export const activityApi = {
  projectList: async (projectId: string): Promise<ActivityItem[]> => {
    const proj = await projectsApi.get(projectId);
    const projName = proj?.name || "Project";
    const analytics = await analyticsApi.projectAnalytics(projectId);
    const recent = analytics?.recentActivity || [];
    return recent.map((a: any) => mapActivityItem(a, projName));
  },
  globalList: async (): Promise<ActivityItem[]> => {
    const projects = await projectsApi.list();
    const all: ActivityItem[] = [];
    for (const p of projects) {
      try {
        const items = await activityApi.projectList(p.id);
        all.push(...items);
      } catch (_) {
        // ignore individual project fetch error
      }
    }
    return all;
  },
  list: async (projectId?: string): Promise<ActivityItem[]> => {
    if (projectId) {
      return activityApi.projectList(projectId);
    }
    return activityApi.globalList();
  },
};

export const adminApi = {
  stats: async () => {
    const res = await http<{ success: boolean; stats: any }>("/admin/stats");
    return res.stats;
  },
  overview: async (): Promise<AdminOverview> => {
    const s = await adminApi.stats();
    const counts = s?.entityCounts || {};
    const active = s?.activeUsers || {};
    const study = s?.studyTime || {};
    const mastery = s?.masterySummary || {};
    const ai = s?.aiUsageSummary || {};

    const cards = [
      {
        label: "Total Users",
        value: `${counts.totalUsers ?? 0}`,
        delta: `${counts.totalStudents ?? 0} Students · ${counts.totalAdmins ?? 0} Admins`,
      },
      {
        label: "Active Users (30d)",
        value: `${active.active30Days ?? 0}`,
        delta: `${active.active7Days ?? 0} active in last 7 days`,
      },
      {
        label: "Active Projects",
        value: `${counts.totalProjects ?? 0}`,
        delta: `Across ${counts.totalSpaces ?? 0} Spaces`,
      },
      {
        label: "Total Study Time",
        value: `${Math.round(((study.totalPlatformStudyMinutes ?? 0) / 60) * 10) / 10} hrs`,
        delta: `${study.quizMinutes ?? 0}m Quiz · ${study.tutorMinutes ?? 0}m Tutor`,
      },
      {
        label: "Platform Mastery",
        value: `${mastery.platformAverage ?? 0}%`,
        delta: `Avg across ${counts.totalProjects ?? 0} Projects`,
      },
      {
        label: "AI Requests",
        value: `${ai.totalRequests ?? 0}`,
        delta: `${ai.statusCounts?.success ?? 0} successful`,
      },
    ];

    const userActivity = [
      { label: "30d Active", active: active.active30Days ?? 0, new: counts.totalUsers ?? 0 },
      { label: "7d Active", active: active.active7Days ?? 0, new: 0 },
    ];

    const projectActivity = [
      { label: "Spaces", projects: counts.totalSpaces ?? 0 },
      { label: "Projects", projects: counts.totalProjects ?? 0 },
    ];

    const aiUsage = [
      { label: "Success", requests: ai.statusCounts?.success ?? 0 },
      { label: "Unsupported", requests: ai.statusCounts?.unsupported ?? 0 },
      { label: "Failed", requests: ai.statusCounts?.failed ?? 0 },
    ];

    const learningProgress = [
      { label: "Beginner (<60%)", mastery: mastery.distribution?.beginner ?? 0 },
      { label: "Intermediate (60-79%)", mastery: mastery.distribution?.intermediate ?? 0 },
      { label: "Advanced (80%+)", mastery: mastery.distribution?.advanced ?? 0 },
    ];

    return {
      cards,
      userActivity,
      projectActivity,
      aiUsage,
      learningProgress,
    };
  },
  users: async (params?: { page?: number; limit?: number; role?: string; search?: string }) => {
    let path = "/admin/users";
    const queryParams: string[] = [];
    if (params?.page) queryParams.push(`page=${params.page}`);
    if (params?.limit) queryParams.push(`limit=${params.limit}`);
    if (params?.role) queryParams.push(`role=${encodeURIComponent(params.role)}`);
    if (params?.search) queryParams.push(`search=${encodeURIComponent(params.search)}`);
    if (queryParams.length > 0) {
      path += `?${queryParams.join("&")}`;
    }
    return http<{
      success: boolean;
      pagination: Record<string, unknown>;
      users: Record<string, unknown>[];
    }>(path);
  },
  userJourney: async (userId: string) => {
    const res = await http<{ success: boolean; journey: Record<string, unknown> }>(
      `/admin/users/${userId}/journey`,
    );
    return res.journey;
  },
  updateUserRole: async (userId: string, role: string) => {
    return http<{ success: boolean; message: string; user: Record<string, unknown> }>(
      `/admin/users/${userId}/role`,
      {
        method: "PUT",
        body: JSON.stringify({ role }),
      },
    );
  },
  deleteUser: async (userId: string) => {
    return http<{ success: boolean; message: string }>(`/admin/users/${userId}`, {
      method: "DELETE",
    });
  },
  aiLogs: async (params?: {
    requestType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    let path = "/admin/ai-logs";
    const queryParams: string[] = [];
    if (params?.requestType)
      queryParams.push(`requestType=${encodeURIComponent(params.requestType)}`);
    if (params?.status) queryParams.push(`status=${encodeURIComponent(params.status)}`);
    if (params?.startDate) queryParams.push(`startDate=${encodeURIComponent(params.startDate)}`);
    if (params?.endDate) queryParams.push(`endDate=${encodeURIComponent(params.endDate)}`);
    if (params?.page) queryParams.push(`page=${params.page}`);
    if (params?.limit) queryParams.push(`limit=${params.limit}`);
    if (queryParams.length > 0) {
      path += `?${queryParams.join("&")}`;
    }
    return http<{
      success: boolean;
      summary: Record<string, unknown>;
      pagination: Record<string, unknown>;
      logs: Record<string, unknown>[];
    }>(path);
  },
  aiEvaluation: async () => {
    const res = await http<{ success: boolean; metrics: Record<string, unknown> }>(
      "/admin/ai-evaluation",
    );
    return res.metrics;
  },
  health: async () => {
    const res = await http<{ success: boolean; health: Record<string, unknown> }>("/admin/health");
    return res.health;
  },
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
