import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
        <GraduationCap className="size-5" />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold leading-tight">
            StudyMate AI
          </span>
          <span className="block truncate text-[11px] leading-tight text-muted-foreground">
            Learn smarter. Grow continuously.
          </span>
        </span>
      )}
    </div>
  );
}
