import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { ListSkeleton } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar, toneForScore } from "@/components/common/MasteryBits";
import { ArrowLeft, BookOpen, Brain, Flame, HelpCircle, Layers, Trophy } from "lucide-react";
import { adminApi } from "@/services/api";

export const Route = createFileRoute("/admin/users/$userId")({
  component: UserJourneyView,
});

interface UserJourneyData {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
  studyStats?: {
    streakDays?: number;
    totalStudyMinutes?: number;
  };
  tutorActivity?: {
    totalQuestionsAsked?: number;
    groundedRatio?: number;
  };
  spaces?: { id?: string }[];
  projects?: { id?: string }[];
  conceptMastery?: {
    conceptId?: string;
    conceptName?: string;
    masteryScore?: number;
  }[];
  quizAttempts?: {
    id?: string;
    score?: number;
    passed?: boolean;
  }[];
  assessmentAttempts?: {
    id?: string;
    overallScore?: number;
    createdAt?: string;
  }[];
}

function UserJourneyView() {
  const { userId } = Route.useParams();

  const query = useQuery({
    queryKey: ["admin", "user", userId, "journey"],
    queryFn: () => adminApi.userJourney(userId),
    enabled: !!userId,
  });

  const journey = query.data as UserJourneyData | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
          </Link>
        </Button>
      </div>

      {query.isError ? (
        <div className="surface-card p-6 text-center text-destructive">
          Failed to load user journey: {(query.error as Error)?.message || "User not found"}
        </div>
      ) : query.isLoading || !journey ? (
        <ListSkeleton rows={5} />
      ) : (
        <>
          <PageHeader
            title={journey.user?.name || "User Journey"}
            description={`Email: ${journey.user?.email || "N/A"} · Role: ${journey.user?.role || "student"}`}
          />

          <div className="grid gap-4 md:grid-cols-4">
            <Card className="surface-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
                <Flame className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{journey.studyStats?.streakDays ?? 0} days</div>
                <p className="text-xs text-muted-foreground">Active learning streak</p>
              </CardContent>
            </Card>

            <Card className="surface-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Study Time</CardTitle>
                <BookOpen className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {journey.studyStats?.totalStudyMinutes ?? 0} mins
                </div>
                <p className="text-xs text-muted-foreground">Total platform time</p>
              </CardContent>
            </Card>

            <Card className="surface-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Tutor Questions</CardTitle>
                <HelpCircle className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {journey.tutorActivity?.totalQuestionsAsked ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Grounded ratio: {Math.round((journey.tutorActivity?.groundedRatio ?? 1) * 100)}%
                </p>
              </CardContent>
            </Card>

            <Card className="surface-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Spaces & Projects</CardTitle>
                <Layers className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {journey.spaces?.length ?? 0} / {journey.projects?.length ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">Spaces / Projects created</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="surface-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" /> Concept Mastery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(journey.conceptMastery ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No concepts mastered yet</p>
                ) : (
                  (journey.conceptMastery ?? []).map((c) => (
                    <div key={(c.conceptId || c.conceptName) ?? "concept"} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{c.conceptName || "Concept"}</span>
                        <span className="text-muted-foreground">{c.masteryScore ?? 0}%</span>
                      </div>
                      <ProgressBar
                        value={c.masteryScore ?? 0}
                        tone={toneForScore(c.masteryScore ?? 0)}
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="surface-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" /> Quiz & Assessment History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">Quizzes</h4>
                  {(journey.quizAttempts ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No quiz attempts</p>
                  ) : (
                    (journey.quizAttempts ?? []).map((q) => (
                      <div
                        key={q.id ?? Math.random().toString()}
                        className="flex justify-between items-center text-sm border-b py-1"
                      >
                        <span>Score: {q.score ?? 0}%</span>
                        <Badge variant={q.passed ? "default" : "destructive"}>
                          {q.passed ? "PASSED" : "FAILED"}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground">
                    Assessments
                  </h4>
                  {(journey.assessmentAttempts ?? []).length === 0 ? (
                    <p className="text-xs text-muted-foreground">No assessment attempts</p>
                  ) : (
                    (journey.assessmentAttempts ?? []).map((a) => (
                      <div
                        key={a.id ?? Math.random().toString()}
                        className="flex justify-between items-center text-sm border-b py-1"
                      >
                        <span>Score: {a.overallScore ?? 0}%</span>
                        <span className="text-xs text-muted-foreground">
                          {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
