export type Role = "student" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarInitials: string;
  joinedAt: string;
}

export interface Space {
  id: string;
  name: string;
  description: string;
  icon: string;
  projectCount: number;
  averageProgress: number;
  materials: number;
  studyTimeHours: number;
  averageMastery: number;
  lastActivity: string;
}

export type ProjectStatus = "in-progress" | "completed" | "needs-review";

export interface Project {
  id: string;
  spaceId: string;
  name: string;
  description: string;
  /** Explicit learning goal shown in the tutor context panel. */
  goal: string;
  subject: string;
  progress: number;
  masteryScore: number;
  conceptsMastered: number;
  conceptCount: number;
  materialCount: number;
  quizAccuracy: number;
  studyTimeHours: number;
  status: ProjectStatus;
  lastActivity: string;
}

export type MaterialStatus = "uploading" | "processing" | "ready" | "failed";

/** Ordered ingestion lifecycle shown while a document is being indexed. */
export const MATERIAL_STAGES = [
  "Uploaded",
  "Queued",
  "Processing",
  "Reading Content",
  "Understanding Structure",
  "Extracting Knowledge",
  "Creating Searchable Representation",
  "Ready",
] as const;

export type MaterialStage = (typeof MATERIAL_STAGES)[number];

export interface Material {
  id: string;
  projectId: string;
  name: string;
  sizeMb: number;
  pages: number;
  status: MaterialStatus;
  stage?: MaterialStage;
  progress?: number;
  error?: string;
  uploadedAt: string;
}

export type MasteryLevel = "Mastered" | "Strong" | "Developing" | "Needs Review";

/** Trend label used across the Machine Learning demo content. */
export type ConceptStatus = "Strong" | "Improving" | "Stable" | "Needs Attention";

export interface Concept {
  id: string;
  projectId: string;
  name: string;
  mastery: number;
  level: MasteryLevel;
  status: ConceptStatus;
  weeklyChange: number;
  quizzesTaken: number;
  assessmentsTaken: number;
  tutorQuestions: number;
  lastPracticed: string;
  summary: string;
}

export interface Citation {
  id: string;
  document: string;
  page: number;
  excerpt: string;
}

export interface KnowledgeNode {
  id: string;
  projectId: string;
  name: string;
  description: string;
  mastery: number;
  document: string;
  page: number;
  related: string[];
  children?: KnowledgeNode[];
}

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  grounded?: boolean;
  unsupported?: boolean;
  citations?: Citation[];
  suggestions?: string[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  projectId: string;
  title: string;
  preview: string;
  concept: string;
  messageCount: number;
  grounded: boolean;
  updatedAt: string;
  day: "Today" | "Yesterday" | "This week" | "Earlier";
}

export interface QuizQuestion {
  id: string;
  concept: string;
  difficulty: "Easy" | "Medium" | "Hard";
  prompt: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
}

export interface QuizResult {
  score: number;
  correct: number;
  incorrect: number;
  conceptPerformance: { concept: string; score: number; correct: number; total: number }[];
}

export interface OpenAnswerEvaluation {
  understanding: number;
  accuracy: number;
  relevance: number;
  reasoningQuality: number;
  conceptsCovered: string[];
  conceptsMissing: string[];
  feedback: string;
  improvements: string[];
}

export interface Recommendation {
  id: string;
  title: string;
  reason: string;
  priority: "High" | "Medium" | "Low";
  estimatedMinutes: number;
  type: "review" | "practice" | "quiz" | "assessment";
  projectId?: string;
  action?: string;
  conceptId?: string;
}

export interface LearningPulse {
  currentFocus: string;
  strongest: { name: string; mastery: number };
  weakest: { name: string; mastery: number };
  weeklyImprovement: number;
  nextAction: { label: string; description: string; projectId: string; concept: string };
}

export interface ActivityItem {
  id: string;
  type: "quiz" | "tutor" | "upload" | "mastery" | "assessment";
  title: string;
  detail: string;
  project: string;
  day: "Today" | "Yesterday" | "This week" | "Earlier";
  time: string;
}

export interface NotificationItem {
  id: string;
  type: "processing" | "mastery" | "quiz";
  title: string;
  detail: string;
  time: string;
  read: boolean;
}

export interface SearchResult {
  id: string;
  type: "Project" | "Material" | "Concept" | "Conversation";
  title: string;
  subtitle: string;
  projectId?: string;
}

export interface AnalyticsBundle {
  totals: {
    studyTimeHours: number;
    quizAccuracy: number;
    conceptMastery: number;
    questionsAnswered: number;
    tutorQuestions: number;
    streak: number;
  };
  masteryTrend: { label: string; mastery: number }[];
  quizPerformance: { label: string; accuracy: number }[];
  studyActivity: { label: string; minutes: number }[];
  conceptDistribution: { name: string; value: number }[];
}

export interface AdminOverview {
  cards: { label: string; value: string; delta: string }[];
  userActivity: { label: string; active: number; new: number }[];
  projectActivity: { label: string; projects: number }[];
  aiUsage: { label: string; requests: number }[];
  learningProgress: { label: string; mastery: number }[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  spaces: number;
  projects: number;
  lastActive: string;
  progress: number;
  status: "Active" | "Invited" | "Suspended";
}

export interface AdminUserDetail extends AdminUser {
  joinedAt: string;
  role: Role;
  studyTimeHours: number;
  streak: number;
  tokensUsed: number;
  tokenCostUsd: number;
  aiRequests: number;
  groundingRate: number;
  projectList: { id: string; name: string; progress: number; mastery: number }[];
  quizHistory: { id: string; title: string; score: number; date: string; concept: string }[];
  masteryTrend: { label: string; mastery: number }[];
  tokenTrend: { label: string; tokens: number }[];
  timeline: ActivityItem[];
}

export interface SystemService {
  name: string;
  status: "Healthy" | "Warning" | "Error";
  detail: string;
  uptime: string;
}
