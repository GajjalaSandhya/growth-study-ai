import { BrainCircuit, FileUp, MessageSquare, PenLine, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/services/types";

const config: Record<ActivityItem["type"], { icon: LucideIcon; tone: string }> = {
  quiz: { icon: BrainCircuit, tone: "bg-accent text-accent-foreground" },
  tutor: { icon: MessageSquare, tone: "bg-primary/10 text-primary" },
  upload: { icon: FileUp, tone: "bg-muted text-muted-foreground" },
  mastery: { icon: TrendingUp, tone: "bg-success/12 text-success" },
  assessment: { icon: PenLine, tone: "bg-warning/18 text-warning" },
};

export function ActivityTimeline({ items, grouped }: { items: ActivityItem[]; grouped?: boolean }) {
  if (!grouped) return <Timeline items={items} />;
  const days = ["Today", "Yesterday", "This week", "Earlier"] as const;
  return (
    <div className="space-y-8">
      {days.map((day) => {
        const dayItems = items.filter((i) => i.day === day);
        if (!dayItems.length) return null;
        return (
          <section key={day}>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{day}</h3>
            <Timeline items={dayItems} />
          </section>
        );
      })}
    </div>
  );
}

function Timeline({ items }: { items: ActivityItem[] }) {
  return (
    <ol className="relative space-y-4 pl-6 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-border">
      {items.map((item) => {
        const { icon: Icon, tone } = config[item.type];
        return (
          <li key={item.id} className="relative">
            <span
              className={cn(
                "absolute -left-6 top-0.5 grid size-8 place-items-center rounded-full ring-4 ring-background",
                tone,
              )}
            >
              <Icon className="size-4" />
            </span>
            <div className="ml-4 min-w-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="min-w-0 text-sm font-medium">{item.title}</p>
                <span className="shrink-0 text-xs text-muted-foreground">{item.time}</span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{item.detail}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.project}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
