import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { AnalyticsChart, ChartCard } from "@/components/charts/AnalyticsChart";
import { adminApi } from "@/services/api";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminLearningProgress,
});

function AdminLearningProgress() {
  const query = useQuery({ queryKey: ["admin", "overview"], queryFn: adminApi.overview });
  const d = query.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Learning progress"
        description="How understanding develops across the whole platform."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Average mastery" description="Weekly platform average">
          <AnalyticsChart
            type="area"
            data={d?.learningProgress ?? []}
            xKey="label"
            series={[{ key: "mastery", label: "Mastery" }]}
            unit="%"
          />
        </ChartCard>
        <ChartCard title="Project activity" description="Projects worked on per day">
          <AnalyticsChart
            type="bar"
            data={d?.projectActivity ?? []}
            xKey="label"
            series={[{ key: "projects", label: "Projects" }]}
          />
        </ChartCard>
      </div>
    </div>
  );
}
