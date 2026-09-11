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

export interface Material {
  id: string;
  projectId: string;
  name: string;
  sizeMb: number;
  pages: number;
  status: MaterialStatus;
  progress?: number;
  error?: string;
  uploadedAt: string;
}

export type MasteryLevel = "Mastered" | "Strong" | "Developing" | "Needs Review";

export interface Concept {
  id: string;
  projectId: string;
  name: string;
  mastery: number;
  level: MasteryLevel;
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

export interface Recommendation {
  id: string;
  title: string;
  reason: string;
  priority: "High" | "Medium" | "Low";
  estimatedMinutes: number;
  type: "review" | "practice" | "quiz" | "assessment";
  projectId?: string;
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

export interface SystemService {
  name: string;
  status: "Healthy" | "Warning" | "Error";
  detail: string;
  uptime: string;
}
