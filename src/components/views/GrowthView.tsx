import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, Flame, Target, TrendingUp } from "lucide-react";
import { AnalyticsChart, ChartCard } from "@/components/charts/AnalyticsChart";
import { StatCard } from "@/components/common/StatCard";
import { ProgressBar, toneForScore } from "@/components/common/MasteryBits";
import { analyticsApi, conceptsApi } from "@/services/api";

export function GrowthView({ projectId = "pr_java_dsa" }: { projectId?: string }) {
  const stats = useQuery({ queryKey: ["analytics", "30d"], queryFn: () => analyticsApi.overview("30d") });
  const concepts = useQuery({
    queryKey: ["concepts", projectId],
    queryFn: () => conceptsApi.list(projectId),
  });

  const sorted = [...(concepts.data ?? [])].sort((a, b) => b.mastery - a.mastery);
  const strongest = sorted.slice(0, 3);
  const weakest = sorted.slice(-3).reverse();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Concepts improved" value="9 concepts" hint="Last 30 days" icon={TrendingUp} tone="success" />
        <StatCard label="Quiz accuracy improvement" value="+24 pts" hint="58% → 82%" icon={Target} />
        <StatCard label="Study consistency" value="6 of 7 days" hint="Current streak: 7 days" icon={Flame} tone="warning" />
        <StatCard label="Mastery this month" value="+18%" hint="42% → 74%" icon={ArrowUpRight} tone="success" />
      </section>

      <ChartCard title="Mastery over time" description="Weekly average across tracked concepts">
        <AnalyticsChart
          type="line"
          data={stats.data?.masteryTrend ?? []}
          xKey="label"
          series={[{ key: "mastery", label: "Mastery" }]}
          unit="%"
          height={300}
        />
      </ChartCard>

      <section className="surface-card p-5">
        <h3 className="text-base font-semibold">Your Progress</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          +18% mastery this month. You&apos;re improving fastest in Data Structures — stacks and
          queues moved from Developing to Strong in three weeks.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <ConceptList title="Strongest concepts" concepts={strongest} icon="up" />
        <ConceptList title="Weakest concepts" concepts={weakest} icon="down" />
      </div>
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
    </section>
  );
}
