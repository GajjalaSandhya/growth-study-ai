import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BarChart3, BrainCircuit, Clock, Flame, MessageSquare, Target } from "lucide-react";
import { AnalyticsChart, ChartCard } from "@/components/charts/AnalyticsChart";
import { StatCard } from "@/components/common/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { analyticsApi } from "@/services/api";

const ranges = ["7d", "30d", "90d"] as const;

export function AnalyticsView({ projectId }: { projectId?: string }) {
  const [range, setRange] = useState<(typeof ranges)[number]>("30d");
  const query = useQuery({
    queryKey: projectId ? ["analytics", projectId] : ["analytics"],
    queryFn: () => analyticsApi.overview(projectId),
  });
  const d = query.data;

  const filter = (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {ranges.map((r) => (
        <button
          key={r}
          onClick={() => setRange(r)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            range === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "90 days"}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">{filter}</div>

      {query.isLoading || !d ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Total study time"
            value={`${d.totals.studyTimeHours} hrs`}
            icon={Clock}
          />
          <StatCard label="Quiz accuracy" value={`${d.totals.quizAccuracy}%`} icon={BrainCircuit} />
          <StatCard
            label="Concept mastery"
            value={`${d.totals.conceptMastery}%`}
            icon={Target}
            tone="success"
          />
          <StatCard
            label="Questions answered"
            value={`${d.totals.questionsAnswered}`}
            icon={BarChart3}
            tone="neutral"
          />
          <StatCard
            label="Tutor questions"
            value={`${d.totals.tutorQuestions}`}
            icon={MessageSquare}
            tone="neutral"
          />
          <StatCard
            label="Learning streak"
            value={`${d.totals.streak} days`}
            icon={Flame}
            tone="warning"
          />
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Mastery trend" description="Average concept mastery">
          <AnalyticsChart
            type="area"
            data={d?.masteryTrend ?? []}
            xKey="label"
            series={[{ key: "mastery", label: "Mastery" }]}
            unit="%"
          />
        </ChartCard>
        <ChartCard title="Quiz performance" description="Accuracy per quiz attempt">
          <AnalyticsChart
            type="line"
            data={d?.quizPerformance ?? []}
            xKey="label"
            series={[{ key: "accuracy", label: "Accuracy" }]}
            unit="%"
          />
        </ChartCard>
        <ChartCard title="Study activity" description="Minutes studied per day">
          <AnalyticsChart
            type="bar"
            data={d?.studyActivity ?? []}
            xKey="label"
            series={[{ key: "minutes", label: "Minutes" }]}
          />
        </ChartCard>
        <ChartCard title="Concept distribution" description="Concepts by mastery status">
          <AnalyticsChart
            type="pie"
            data={d?.conceptDistribution ?? []}
            xKey="name"
            series={[{ key: "value", label: "Concepts" }]}
          />
        </ChartCard>
      </div>
    </div>
  );
}
