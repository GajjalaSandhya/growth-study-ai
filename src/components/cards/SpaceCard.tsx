import { Link } from "@tanstack/react-router";
import { Brain, Cpu, BookOpen, Sigma, FolderOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/common/MasteryBits";
import type { Space } from "@/services/types";

const icons: Record<string, LucideIcon> = { Brain, Cpu, Sigma, BookOpen, FolderOpen };

export function SpaceCard({ space }: { space: Space }) {
  const Icon = icons[space.icon] ?? FolderOpen;
  return (
    <article className="surface-card flex flex-col p-5 transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{space.name}</h3>
          <p className="truncate text-xs text-muted-foreground">
            {space.projectCount} projects · Last activity {space.lastActivity}
          </p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{space.description}</p>
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Average progress</span>
          <span className="font-medium">{space.averageProgress}%</span>
        </div>
        <ProgressBar value={space.averageProgress} className="mt-2" />
      </div>
      <Button asChild variant="outline" size="sm" className="mt-5 w-full">
        <Link to="/spaces/$spaceId" params={{ spaceId: space.id }}>
          Open Space
        </Link>
      </Button>
    </article>
  );
}
