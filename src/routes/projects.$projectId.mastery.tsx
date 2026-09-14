import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CardSkeletonGrid, EmptyState } from "@/components/common/states";
import { MasteryBadge, ProgressBar, toneForScore } from "@/components/common/MasteryBits";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { masteryApi, conceptsApi } from "@/services/api";
import type { Concept } from "@/services/types";

export const Route = createFileRoute("/projects/$projectId/mastery")({
  component: MasteryTab,
});

function MasteryTab() {
  const { projectId } = Route.useParams();

  const masteryQuery = useQuery({
    queryKey: ["mastery", projectId],
    queryFn: () => masteryApi.getProjectMastery(projectId),
  });

  const query = useQuery({
    queryKey: ["concepts", projectId],
    queryFn: () => conceptsApi.list(projectId),
  });

  const [active, setActive] = useState<Concept | null>(null);
  const derivedMastery = masteryQuery.data?.derivedProjectMastery ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Concept Mastery</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mastery combines quiz accuracy, assessment quality and tutor interactions.
          </p>
        </div>
        {masteryQuery.data && (
          <div className="surface-card flex items-center gap-3 px-4 py-2 text-sm font-medium">
            <span className="text-muted-foreground">Project Mastery:</span>
            <span className="text-lg font-bold text-foreground">{derivedMastery}%</span>
          </div>
        )}
      </div>

      {query.isLoading || masteryQuery.isLoading ? (
        <CardSkeletonGrid count={6} height={150} />
      ) : (query.data ?? []).length === 0 ? (
        <EmptyState
          title="No concepts tracked yet"
          description="Upload material and take your first adaptive quiz to start measuring mastery."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(query.data ?? []).map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c)}
              className="surface-card p-5 text-left transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 truncate text-base font-semibold">{c.name}</h3>
                <MasteryBadge level={c.level} />
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight">{c.mastery}%</p>
              <ProgressBar value={c.mastery} tone={toneForScore(c.mastery)} className="mt-2" />
              <p className="mt-3 text-xs text-muted-foreground">
                {c.quizzesTaken} quizzes · {c.assessmentsTaken} assessments · last practiced{" "}
                {c.lastPracticed.toLowerCase()}
              </p>
            </button>
          ))}
        </div>
      )}

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle>{active.name}</SheetTitle>
                <SheetDescription>{active.summary}</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-8">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Mastery score</span>
                    <MasteryBadge level={active.level} />
                  </div>
                  <p className="mt-2 text-3xl font-semibold">{active.mastery}%</p>
                  <ProgressBar
                    value={active.mastery}
                    tone={toneForScore(active.mastery)}
                    className="mt-2"
                  />
                </div>

                <Section title="Quiz history">
                  <Row label="Quizzes taken" value={`${active.quizzesTaken}`} />
                  <Row
                    label="Current mastery"
                    value={active.quizzesTaken > 0 ? `${active.mastery}%` : "—"}
                  />
                  <Row label="Last attempt" value={active.lastPracticed} />
                </Section>

                <Section title="Assessment history">
                  <Row label="Assessments" value={`${active.assessmentsTaken}`} />
                  <Row
                    label="Assessment mastery"
                    value={active.assessmentsTaken > 0 ? `${active.mastery}%` : "—"}
                  />
                </Section>

                <Section title="Recommended practice">
                  <p className="text-sm text-muted-foreground">
                    {active.mastery >= 80
                      ? "Keep this concept warm with a short adaptive quiz."
                      : "Re-read the source pages, then explain the concept in an open-ended assessment."}
                  </p>
                </Section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
