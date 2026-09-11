import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Recommendation } from "@/services/types";

const priorityClasses = {
  High: "bg-warning/18 text-warning ring-warning/30",
  Medium: "bg-primary/10 text-primary ring-primary/25",
  Low: "bg-muted text-muted-foreground ring-border",
};

export function RecommendationCard({
  recommendation,
  actionLabel = "Start Review",
}: {
  recommendation: Recommendation;
  actionLabel?: string;
}) {
  const target = recommendation.projectId;
  return (
    <article className="surface-card p-5 transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Lightbulb className="size-4.5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{recommendation.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{recommendation.reason}</p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
            priorityClasses[recommendation.priority],
          )}
        >
          {recommendation.priority}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" /> ~{recommendation.estimatedMinutes} min
        </span>
        {target ? (
          <Button asChild size="sm">
            <Link to="/projects/$projectId/quiz" params={{ projectId: target }}>
              {actionLabel} <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : (
          <Button size="sm">
            {actionLabel} <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </article>
  );
}
