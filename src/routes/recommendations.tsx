import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { RecommendationCard } from "@/components/cards/RecommendationCard";
import { EmptyState, ListSkeleton } from "@/components/common/states";
import { recommendationsApi } from "@/services/api";

export const Route = createFileRoute("/recommendations")({
  head: () => ({
    meta: [
      { title: "Recommendations — StudyMate AI" },
      { name: "description", content: "Priority-ranked next actions based on your mastery data." },
      { property: "og:title", content: "Recommendations — StudyMate AI" },
      { property: "og:description", content: "Know exactly what to study next, and why." },
    ],
  }),
  component: RecommendationsPage,
});

const labels: Record<string, string> = {
  review: "Start Review",
  practice: "Start Practice",
  quiz: "Start Quiz",
  assessment: "Start Assessment",
};

function RecommendationsPage() {
  const query = useQuery({ queryKey: ["recommendations"], queryFn: recommendationsApi.list });
  const items = [...(query.data ?? [])].sort((a, b) => {
    const order = { High: 0, Medium: 1, Low: 2 } as const;
    return order[a.priority] - order[b.priority];
  });

  return (
    <AppShell breadcrumbs={[{ label: "Recommendations" }]}>
      <div className="space-y-6">
        <PageHeader
          title="Recommended for You"
          description="Generated from quiz results, assessments and mastery decay across your projects."
        />
        {query.isLoading ? (
          <ListSkeleton rows={4} />
        ) : items.length === 0 ? (
          <EmptyState
            title="No recommendations yet"
            description="Take an adaptive quiz so StudyMate can measure where you need reinforcement."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {items.map((r) => (
              <RecommendationCard
                key={r.id}
                recommendation={r}
                actionLabel={labels[r.type] ?? "Start"}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
