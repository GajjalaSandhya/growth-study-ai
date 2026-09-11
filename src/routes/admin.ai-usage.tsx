import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { AnalyticsChart, ChartCard } from "@/components/charts/AnalyticsChart";
import { Clock, Cpu, MessageSquare, PenLine, Sparkles, TriangleAlert } from "lucide-react";
import { adminApi } from "@/services/api";

export const Route = createFileRoute("/admin/ai-usage")({
  component: AdminAiUsage,
});

function AdminAiUsage() {
  const query = useQuery({ queryKey: ["admin", "overview"], queryFn: adminApi.overview });

  return (
    <div className="space-y-6">
      <PageHeader title="AI usage" description="Requests, tokens and latency across AI features." />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total AI requests" value="128,430" hint="All time" icon={Cpu} />
        <StatCard label="Tutor requests" value="86,210" hint="67% of traffic" icon={MessageSquare} />
        <StatCard label="Quiz generations" value="24,905" hint="19% of traffic" icon={Sparkles} />
        <StatCard label="Assessments" value="12,480" hint="10% of traffic" icon={PenLine} />
        <StatCard label="Recommendations" value="4,835" hint="4% of traffic" icon={Sparkles} tone="neutral" />
        <StatCard label="Failure rate" value="0.6%" hint="Below 1% target" icon={TriangleAlert} tone="warning" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Requests today" value="21,030" icon={Cpu} tone="neutral" />
        <StatCard label="Requests this week" value="108,430" icon={Cpu} tone="neutral" />
        <StatCard label="Token usage" value="42.8M" hint="This month" icon={Cpu} tone="neutral" />
        <StatCard label="Avg response time" value="1.4 s" hint="p95: 2.9 s" icon={Clock} tone="neutral" />
      </section>

      <ChartCard title="AI requests per day" description="Last 7 days">
        <AnalyticsChart
          type="line"
          data={query.data?.aiUsage ?? []}
          xKey="label"
          series={[{ key: "requests", label: "Requests" }]}
        />
      </ChartCard>
    </div>
  );
}
