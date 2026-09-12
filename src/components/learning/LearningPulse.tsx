import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Sparkles, Target, TrendingUp, TriangleAlert } from "lucide-react";
import { ProgressBar, toneForScore } from "@/components/common/MasteryBits";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { pulseApi } from "@/services/api";

/**
 * Learning Pulse — the signature "where am I right now" panel shown on both the
 * home dashboard and each project dashboard.
 */
export function LearningPulse({ projectId }: { projectId?: string }) {
  const pulse = useQuery({
    queryKey: ["pulse", projectId ?? "all"],
    queryFn: () => pulseApi.get(projectId),
  });

  if (pulse.isLoading || !pulse.data) {
    return <Skeleton className="h-56 w-full rounded-2xl" />;
  }

  const p = pulse.data;

  return (
    <section className="surface-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/50 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/12 text-primary">
            <Sparkles className="size-4" />
          </span>
          <h2 className="text-base font-semibold">Learning Pulse</h2>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Current focus · {p.currentFocus}
        </span>
      </div>

      <div className="grid gap-5 p-5 md:grid-cols-3">
        <PulseStat
          icon={<TrendingUp className="size-4 text-success" />}
          label="Strongest concept"
          name={p.strongest.name}
          value={p.strongest.mastery}
        />
        <PulseStat
          icon={<TriangleAlert className="size-4 text-warning" />}
          label="Needs attention"
          name={p.weakest.name}
          value={p.weakest.mastery}
        />
        <div>
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Target className="size-4 text-primary" /> Recent improvement
          </p>
          <p className="mt-2 text-2xl font-semibold text-success">
            +{p.weeklyImprovement}%
            <span className="ml-2 text-sm font-normal text-muted-foreground">this week</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Across practised concepts</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{p.nextAction.label}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{p.nextAction.description}</p>
        </div>
        <Button asChild size="sm">
          <Link to="/projects/$projectId/quiz" params={{ projectId: p.nextAction.projectId }}>
            Start now <ArrowUpRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function PulseStat({
  icon,
  label,
  name,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  value: number;
}) {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-2 truncate text-base font-semibold">{name}</p>
      <div className="mt-2 flex items-center gap-2">
        <ProgressBar value={value} tone={toneForScore(value)} />
        <span className="w-9 shrink-0 text-right text-xs text-muted-foreground">{value}%</span>
      </div>
    </div>
  );
}
