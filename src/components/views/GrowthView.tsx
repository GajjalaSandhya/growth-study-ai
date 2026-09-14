import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, Flame, Target, TrendingUp } from "lucide-react";
import { AnalyticsChart, ChartCard } from "@/components/charts/AnalyticsChart";
import { StatCard } from "@/components/common/StatCard";
import { ProgressBar, toneForScore } from "@/components/common/MasteryBits";
import { CardSkeletonGrid, EmptyState } from "@/components/common/states";
import { analyticsApi, conceptsApi } from "@/services/api";

export function GrowthView({ projectId }: { projectId?: string }) {
  const targetProjectId = projectId === "pr_java_dsa" ? undefined : projectId;

  const projectAnalytics = useQuery({
    queryKey: ["growth", targetProjectId],
    queryFn: () => analyticsApi.projectAnalytics(targetProjectId!),
    enabled: Boolean(targetProjectId),
  });

  const globalGrowth = useQuery({
    queryKey: ["growth", "global"],
    queryFn: () => analyticsApi.globalGrowth(),
    enabled: !targetProjectId,
  });

  const concepts = useQuery({
    queryKey: ["concepts", targetProjectId],
    queryFn: () => (targetProjectId ? conceptsApi.list(targetProjectId) : Promise.resolve([])),
    enabled: Boolean(targetProjectId),
  });

  const isLoading = targetProjectId
    ? projectAnalytics.isLoading || concepts.isLoading
    : globalGrowth.isLoading;

  if (isLoading) {
    return <CardSkeletonGrid count={4} height={120} />;
  }

  const pData = projectAnalytics.data;
  const gData = globalGrowth.data;
  const conceptList = concepts.data ?? [];

  const sorted = [...conceptList].sort((a, b) => b.mastery - a.mastery);
  const strongest = sorted.slice(0, 3);
  const weakest = sorted.slice(-3).reverse();

  const chartData = targetProjectId
    ? pData?.mastery
      ? pData.mastery.previousScore !== null
        ? [
            { label: "Previous", mastery: pData.mastery.previousScore },
            { label: "Current", mastery: pData.mastery.currentScore },
          ]
        : [{ label: "Current", mastery: pData.mastery.currentScore }]
      : []
    : gData?.growth
      ? gData.growth.previousMastery !== null
        ? [
            { label: "Previous", mastery: gData.growth.previousMastery },
            { label: "Current", mastery: gData.growth.currentMastery },
          ]
        : [{ label: "Current", mastery: gData.growth.currentMastery }]
      : [];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {targetProjectId ? (
          <>
            <StatCard
              label="Concepts tracked"
              value={`${conceptList.length} concepts`}
              hint={`${pData?.materials?.totalMaterials ?? 0} materials uploaded`}
              icon={TrendingUp}
              tone="success"
            />
            <StatCard
              label="Quiz accuracy"
              value={`${pData?.quizPerformance?.averageScore ?? 0}%`}
              hint={`Pass rate: ${pData?.quizPerformance?.passRate ?? 0}%`}
              icon={Target}
            />
            <StatCard
              label="Study time"
              value={`${pData?.studyTime?.totalMinutes ?? 0} mins`}
              hint={`${pData?.quizPerformance?.totalAttempts ?? 0} quiz attempts`}
              icon={Flame}
              tone="warning"
            />
            <StatCard
              label="Project mastery"
              value={`${pData?.mastery?.currentScore ?? 0}%`}
              hint={
                pData?.mastery?.delta != null
                  ? `${pData.mastery.delta >= 0 ? "+" : ""}${pData.mastery.delta}% vs previous`
                  : "Initial baseline"
              }
              icon={ArrowUpRight}
              tone="success"
            />
          </>
        ) : (
          <>
            <StatCard
              label="Active projects"
              value={`${gData?.totalActiveProjects ?? 0} projects`}
              hint="Across all spaces"
              icon={TrendingUp}
              tone="success"
            />
            <StatCard
              label="Global quiz accuracy"
              value={`${gData?.globalAverageScore ?? 0}%`}
              hint={`Pass rate: ${gData?.globalPassRate ?? 0}%`}
              icon={Target}
            />
            <StatCard
              label="Study consistency"
              value={`${gData?.streakDays ?? 0} days`}
              hint={`Total time: ${gData?.totalStudyMinutes ?? 0} mins`}
              icon={Flame}
              tone="warning"
            />
            <StatCard
              label="Overall mastery"
              value={`${gData?.growth?.currentMastery ?? 0}%`}
              hint={
                gData?.growth?.deltaPercentage != null
                  ? `${gData.growth.deltaPercentage >= 0 ? "+" : ""}${gData.growth.deltaPercentage}% change`
                  : "Baseline score"
              }
              icon={ArrowUpRight}
              tone="success"
            />
          </>
        )}
      </section>

      <ChartCard title="Mastery over time" description="Average mastery across tracked concepts">
        {chartData.length > 0 ? (
          <AnalyticsChart
            type="line"
            data={chartData}
            xKey="label"
            series={[{ key: "mastery", label: "Mastery" }]}
            unit="%"
            height={300}
          />
        ) : (
          <EmptyState
            title="No history yet"
            description="Take adaptive quizzes or open-ended assessments to build growth history."
          />
        )}
      </ChartCard>

      <section className="surface-card p-5">
        <h3 className="text-base font-semibold">Your Progress Summary</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {targetProjectId
            ? `Project mastery is currently ${pData?.mastery?.currentScore ?? 0}%. Trend: ${pData?.mastery?.trend || "stable"}.`
            : `Overall mastery across all projects is ${gData?.growth?.currentMastery ?? 0}%. Current active streak: ${gData?.streakDays ?? 0} days.`}
        </p>
      </section>

      {targetProjectId && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ConceptList title="Strongest concepts" concepts={strongest} icon="up" />
          <ConceptList title="Weakest concepts" concepts={weakest} icon="down" />
        </div>
      )}
    </div>
  );
}

function ConceptList({
  title,
  concepts,
  icon,
}: {
  title: string;
  concepts: { id: string; name: string; mastery: number }[];
  icon: "up" | "down";
}) {
  const Icon = icon === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <section className="surface-card p-5">
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <Icon className={icon === "up" ? "size-4 text-success" : "size-4 text-warning"} />
        {title}
      </h3>
      {concepts.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">No concept data available yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {concepts.map((c) => (
            <li key={c.id}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground">{c.mastery}%</span>
              </div>
              <ProgressBar value={c.mastery} tone={toneForScore(c.mastery)} className="mt-2" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
