import { Link } from "@tanstack/react-router";
import { BookOpen, Clock, MessageSquare, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MasteryBadge, ProgressBar, masteryLevel } from "@/components/common/MasteryBits";
import type { Project } from "@/services/types";

export function ProjectCard({ project, compact }: { project: Project; compact?: boolean }) {
  return (
    <article className="surface-card flex flex-col p-5 transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {project.subject}
          </p>
          <h3 className="mt-1 truncate text-base font-semibold">{project.name}</h3>
        </div>
        <MasteryBadge level={masteryLevel(project.masteryScore)} className="shrink-0" />
      </div>

      {!compact && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{project.progress}%</span>
        </div>
        <ProgressBar value={project.progress} className="mt-2" />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Target className="size-4 shrink-0" />
          <span className="truncate">
            {project.conceptsMastered}/{project.conceptCount} concepts
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <BookOpen className="size-4 shrink-0" />
          <span className="truncate">{project.materialCount} materials</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="size-4 shrink-0" />
          <span className="truncate">Last: {project.lastActivity}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageSquare className="size-4 shrink-0" />
          <span className="truncate">{project.quizAccuracy}% quiz accuracy</span>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild size="sm" className="flex-1">
          <Link to="/projects/$projectId" params={{ projectId: project.id }}>
            Continue Learning
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/projects/$projectId/tutor" params={{ projectId: project.id }}>
            Ask Tutor
          </Link>
        </Button>
      </div>
    </article>
  );
}
