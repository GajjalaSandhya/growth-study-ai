import { cn } from "@/lib/utils";
import type { MasteryLevel } from "@/services/types";

export function masteryLevel(score: number): MasteryLevel {
  if (score >= 85) return "Mastered";
  if (score >= 70) return "Strong";
  if (score >= 55) return "Developing";
  return "Needs Review";
}

const levelClasses: Record<MasteryLevel, string> = {
  Mastered: "bg-success/12 text-success ring-success/25",
  Strong: "bg-primary/10 text-primary ring-primary/25",
  Developing: "bg-warning/18 text-warning ring-warning/30",
  "Needs Review": "bg-destructive/10 text-destructive ring-destructive/25",
};

export function MasteryBadge({ level, className }: { level: MasteryLevel; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        levelClasses[level],
        className,
      )}
    >
      {level}
    </span>
  );
}

export function ProgressBar({
  value,
  tone = "primary",
  className,
}: {
  value: number;
  tone?: "primary" | "success" | "warning" | "destructive";
  className?: string;
}) {
  const barTone = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
  }[tone];
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", barTone)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function toneForScore(score: number) {
  if (score >= 85) return "success" as const;
  if (score >= 70) return "primary" as const;
  if (score >= 55) return "warning" as const;
  return "destructive" as const;
}
