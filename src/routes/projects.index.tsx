import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { CardSkeletonGrid, EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { projectsApi } from "@/services/api";
import type { ProjectStatus } from "@/services/types";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "My Projects — StudyMate AI" },
      { name: "description", content: "All your learning projects, progress and mastery in one place." },
      { property: "og:title", content: "My Projects — StudyMate AI" },
      { property: "og:description", content: "Filter projects by progress and jump back in." },
    ],
  }),
  component: ProjectsPage,
});

const filters: { label: string; value: "all" | ProjectStatus }[] = [
  { label: "All", value: "all" },
  { label: "In Progress", value: "in-progress" },
  { label: "Completed", value: "completed" },
  { label: "Needs Review", value: "needs-review" },
];

function ProjectsPage() {
  const [filter, setFilter] = useState<"all" | ProjectStatus>("all");
  const query = useQuery({ queryKey: ["projects"], queryFn: () => projectsApi.list() });

  const projects = (query.data ?? []).filter((p) => filter === "all" || p.status === filter);

  return (
    <AppShell breadcrumbs={[{ label: "Projects" }]}>
      <div className="space-y-6">
        <PageHeader
          title="My Projects"
          description="Each project holds its materials, tutor history, quizzes and concept mastery."
          actions={
            <Button>
              <Plus className="size-4" /> Create Project
            </Button>
          }
        />

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {query.isLoading ? (
          <CardSkeletonGrid count={3} height={260} />
        ) : projects.length === 0 ? (
          <EmptyState
            title="No projects in this view"
            description="Create a project to start learning, or switch to another filter."
            action={<Button onClick={() => setFilter("all")}>Show all projects</Button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
