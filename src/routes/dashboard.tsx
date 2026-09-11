import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BrainCircuit, Clock, Flame, Target } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/common/StatCard";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { RecommendationCard } from "@/components/cards/RecommendationCard";
import { ActivityTimeline } from "@/components/cards/ActivityTimeline";
import { CardSkeletonGrid, ListSkeleton } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { activityApi, analyticsApi, projectsApi, recommendationsApi } from "@/services/api";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Overview — StudyMate AI" },
      { name: "description", content: "Your learning streak, active projects and next best action." },
      { property: "og:title", content: "Overview — StudyMate AI" },
      { property: "og:description", content: "Track streaks, mastery and what to study next." },
    ],
  }),
  component: DashboardPage,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function DashboardPage() {
  const { user } = useAuth();
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => projectsApi.list() });
  const stats = useQuery({ queryKey: ["analytics", "30d"], queryFn: () => analyticsApi.overview("30d") });
  const recs = useQuery({ queryKey: ["recommendations"], queryFn: recommendationsApi.list });
  const acts = useQuery({ queryKey: ["activity"], queryFn: activityApi.list });

  const firstName = user.name.split(" ")[0];

  return (
    <AppShell breadcrumbs={[{ label: "Overview" }]}>
      <div className="space-y-10">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Let&apos;s continue learning.</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Learning streak"
            value={`${stats.data?.totals.streak ?? 7} Day Streak`}
            hint="Longest streak: 14 days"
            icon={Flame}
            tone="warning"
          />
          <StatCard
            label="Total study time"
            value={`${stats.data?.totals.studyTimeHours ?? 12.5} hrs`}
            hint="+2.4 hrs vs last week"
            icon={Clock}
          />
          <StatCard
            label="Concepts mastered"
            value="24 Concepts"
            hint="Across 4 active projects"
            icon={Target}
            tone="success"
          />
          <StatCard
            label="Quiz accuracy"
            value={`${stats.data?.totals.quizAccuracy ?? 82}%`}
            hint="Last 5 quizzes"
            icon={BrainCircuit}
          />
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Continue Learning</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/projects">View all projects</Link>
            </Button>
          </div>
          {projects.isLoading ? (
            <CardSkeletonGrid count={3} height={260} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {(projects.data ?? []).slice(0, 3).map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Recommended Next</h2>
          {recs.isLoading ? (
            <ListSkeleton rows={2} />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {(recs.data ?? []).slice(0, 2).map((r) => (
                <RecommendationCard key={r.id} recommendation={r} />
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="surface-card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <Button asChild variant="ghost" size="sm">
                <Link to="/activity">See all</Link>
              </Button>
            </div>
            {acts.isLoading ? (
              <ListSkeleton rows={4} />
            ) : (
              <ActivityTimeline items={(acts.data ?? []).slice(0, 5)} />
            )}
          </div>

          <div className="surface-card p-5">
            <h2 className="text-lg font-semibold">This week at a glance</h2>
            <dl className="mt-4 space-y-4 text-sm">
              {[
                { label: "Study sessions", value: "9 sessions" },
                { label: "Tutor questions", value: "18 asked · 17 grounded" },
                { label: "Quizzes completed", value: "3 quizzes · 79% average" },
                { label: "Concepts improved", value: "Stack, Sliding Window, Queue" },
              ].map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className="text-right font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
            <Button asChild variant="outline" size="sm" className="mt-6 w-full">
              <Link to="/growth">View growth analysis</Link>
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
