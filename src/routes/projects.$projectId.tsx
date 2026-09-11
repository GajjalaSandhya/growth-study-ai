import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BrainCircuit, Clock, MessageSquare, Target, TrendingUp, Upload } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { projectsApi } from "@/services/api";

export const Route = createFileRoute("/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project — StudyMate AI" },
      { name: "description", content: "Materials, tutor, quizzes, mastery and analytics for this project." },
      { property: "og:title", content: "Project — StudyMate AI" },
      { property: "og:description", content: "Everything you are learning in one project workspace." },
    ],
  }),
  component: ProjectLayout,
});

const tabs = [
  { label: "Overview", suffix: "" },
  { label: "Materials", suffix: "/materials" },
  { label: "Tutor", suffix: "/tutor" },
  { label: "Quiz", suffix: "/quiz" },
  { label: "Mastery", suffix: "/mastery" },
  { label: "Growth", suffix: "/growth" },
  { label: "Analytics", suffix: "/analytics" },
  { label: "Activity", suffix: "/activity" },
];

function ProjectLayout() {
  const { projectId } = Route.useParams();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const project = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.get(projectId),
  });
  const p = project.data;
  const base = `/projects/${projectId}`;

  return (
    <AppShell
      breadcrumbs={[
        { label: "Projects", to: "/projects" },
        { label: p?.name ?? "Project" },
      ]}
    >
      <div className="space-y-6">
        <header className="grid gap-4 lg:flex lg:items-start lg:justify-between">
          <div className="min-w-0">
            {project.isLoading ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              <h1 className="text-2xl font-semibold tracking-tight">{p?.name}</h1>
            )}
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{p?.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/projects/$projectId/materials" params={{ projectId }}>
                <Upload className="size-4" /> Upload Material
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/projects/$projectId/tutor" params={{ projectId }}>
                <MessageSquare className="size-4" /> Ask Tutor
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/projects/$projectId/quiz" params={{ projectId }}>
                <BrainCircuit className="size-4" /> Take Quiz
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Progress" value={`${p?.progress ?? 0}%`} icon={TrendingUp} />
          <StatCard
            label="Mastery"
            value={`${p?.masteryScore ?? 0}%`}
            icon={Target}
            tone="success"
          />
          <StatCard
            label="Study time"
            value={`${p?.studyTimeHours ?? 0} hrs`}
            icon={Clock}
            tone="neutral"
          />
          <StatCard label="Quiz accuracy" value={`${p?.quizAccuracy ?? 0}%`} icon={BrainCircuit} />
        </section>

        <nav className="-mx-4 overflow-x-auto border-b px-4 sm:mx-0 sm:px-0">
          <ul className="flex min-w-max gap-1">
            {tabs.map((tab) => {
              const to = `${base}${tab.suffix}`;
              const active = pathname === to;
              return (
                <li key={tab.label}>
                  <Link
                    to={to as never}
                    className={cn(
                      "-mb-px inline-block border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Outlet />
      </div>
    </AppShell>
  );
}
