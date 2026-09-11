import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, FolderOpen, Plus, Target } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ProjectCard } from "@/components/cards/ProjectCard";
import { CardSkeletonGrid, EmptyState, ErrorState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { projectsApi, spacesApi } from "@/services/api";

export const Route = createFileRoute("/spaces/$spaceId")({
  head: () => ({
    meta: [
      { title: "Space — StudyMate AI" },
      { name: "description", content: "Projects, materials and mastery inside this learning space." },
      { property: "og:title", content: "Space — StudyMate AI" },
      { property: "og:description", content: "See every project inside this learning space." },
    ],
  }),
  component: SpaceDetailPage,
});

function SpaceDetailPage() {
  const { spaceId } = Route.useParams();
  const space = useQuery({ queryKey: ["space", spaceId], queryFn: () => spacesApi.get(spaceId) });
  const projects = useQuery({
    queryKey: ["projects", spaceId],
    queryFn: () => projectsApi.list(spaceId),
  });

  if (!space.isLoading && !space.data) {
    return (
      <AppShell breadcrumbs={[{ label: "Spaces", to: "/spaces" }, { label: "Not found" }]}>
        <ErrorState
          title="Space not found"
          description="This space may have been deleted or the link is incorrect."
        />
        <Button asChild variant="outline" className="mt-4">
          <Link to="/spaces">Back to Spaces</Link>
        </Button>
      </AppShell>
    );
  }

  const s = space.data;

  return (
    <AppShell
      breadcrumbs={[{ label: "Spaces", to: "/spaces" }, { label: s?.name ?? "Loading…" }]}
    >
      <div className="space-y-8">
        <PageHeader
          title={s?.name ?? "Loading…"}
          description={s?.description}
          actions={
            <Button>
              <Plus className="size-4" /> Create Project
            </Button>
          }
        />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Projects" value={`${s?.projectCount ?? 0}`} icon={FolderOpen} />
          <StatCard label="Materials" value={`${s?.materials ?? 0}`} icon={BookOpen} tone="neutral" />
          <StatCard
            label="Study time"
            value={`${s?.studyTimeHours ?? 0} hrs`}
            icon={Clock}
            tone="neutral"
          />
          <StatCard
            label="Average mastery"
            value={`${s?.averageMastery ?? 0}%`}
            icon={Target}
            tone="success"
          />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Projects</h2>
          {projects.isLoading ? (
            <CardSkeletonGrid count={2} height={260} />
          ) : (projects.data ?? []).length === 0 ? (
            <EmptyState
              title="Create a project to start learning"
              description="Projects hold your materials, tutor conversations, quizzes and mastery for one topic."
              action={<Button>Create Project</Button>}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {(projects.data ?? []).map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
