import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { ActivityTimeline } from "@/components/cards/ActivityTimeline";
import { RecommendationCard } from "@/components/cards/RecommendationCard";
import { MasteryBadge, ProgressBar, toneForScore } from "@/components/common/MasteryBits";
import { ListSkeleton } from "@/components/common/states";
import { AnalyticsChart, ChartCard } from "@/components/charts/AnalyticsChart";
import { Button } from "@/components/ui/button";
import { activityApi, analyticsApi, conceptsApi, recommendationsApi } from "@/services/api";

export const Route = createFileRoute("/projects/$projectId/")({
  component: ProjectOverviewTab,
});

function ProjectOverviewTab() {
  const { projectId } = Route.useParams();
  const concepts = useQuery({
    queryKey: ["concepts", projectId],
    queryFn: () => conceptsApi.list(projectId),
  });
  const acts = useQuery({ queryKey: ["activity"], queryFn: activityApi.list });
  const recs = useQuery({ queryKey: ["recommendations"], queryFn: recommendationsApi.list });
  const stats = useQuery({ queryKey: ["analytics", "30d"], queryFn: () => analyticsApi.overview("30d") });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <div className="space-y-6">
        <ChartCard title="Learning progress" description="Concept mastery over the last 4 weeks">
          <AnalyticsChart
            type="area"
            data={stats.data?.masteryTrend ?? []}
            xKey="label"
            series={[{ key: "mastery", label: "Mastery" }]}
            unit="%"
          />
        </ChartCard>

        <section className="surface-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Concept mastery overview</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/projects/$projectId/mastery" params={{ projectId }}>
                View all <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          {concepts.isLoading ? (
            <ListSkeleton rows={4} />
          ) : (
            <ul className="space-y-4">
              {(concepts.data ?? []).slice(0, 5).map((c) => (
                <li key={c.id}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium">{c.name}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <MasteryBadge level={c.level} />
                      <span className="w-9 text-right text-muted-foreground">{c.mastery}%</span>
                    </span>
                  </div>
                  <ProgressBar value={c.mastery} tone={toneForScore(c.mastery)} className="mt-2" />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="mb-3 text-base font-semibold">Recommended next action</h2>
          {recs.data?.[0] && <RecommendationCard recommendation={recs.data[0]} />}
        </div>
        <section className="surface-card p-5">
          <h2 className="mb-4 text-base font-semibold">Recent activity</h2>
          {acts.isLoading ? (
            <ListSkeleton rows={4} />
          ) : (
            <ActivityTimeline items={(acts.data ?? []).slice(0, 4)} />
          )}
        </section>
      </div>
    </div>
  );
}
