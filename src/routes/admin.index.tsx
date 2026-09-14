import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { AnalyticsChart, ChartCard } from "@/components/charts/AnalyticsChart";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/services/api";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const query = useQuery({ queryKey: ["admin", "stats"], queryFn: () => adminApi.overview() });
  const d = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="Platform-wide usage, learning outcomes and AI reliability."
      />

      {query.isError ? (
        <div className="surface-card p-6 text-center text-destructive">
          Failed to load platform stats: {(query.error as Error)?.message || "Unknown error"}
        </div>
      ) : query.isLoading || !d ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {d.cards.map((c) => (
            <div key={c.label} className="surface-card p-5">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{c.value}</p>
              <p className="mt-1 text-xs text-success">{c.delta}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="User activity" description="Active and new users per day">
          <AnalyticsChart
            type="bar"
            data={d?.userActivity ?? []}
            xKey="label"
            series={[
              { key: "active", label: "Active" },
              { key: "new", label: "New" },
            ]}
          />
        </ChartCard>
        <ChartCard title="Project activity" description="Projects worked on per day">
          <AnalyticsChart
            type="area"
            data={d?.projectActivity ?? []}
            xKey="label"
            series={[{ key: "projects", label: "Projects" }]}
          />
        </ChartCard>
        <ChartCard title="AI usage" description="Requests per day across all features">
          <AnalyticsChart
            type="line"
            data={d?.aiUsage ?? []}
            xKey="label"
            series={[{ key: "requests", label: "Requests" }]}
          />
        </ChartCard>
        <ChartCard title="Learning progress" description="Average platform mastery">
          <AnalyticsChart
            type="area"
            data={d?.learningProgress ?? []}
            xKey="label"
            series={[{ key: "mastery", label: "Mastery" }]}
            unit="%"
          />
        </ChartCard>
      </div>
    </div>
  );
}
