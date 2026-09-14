import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ShieldAlert, Star, Target } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { EmptyState, ListSkeleton } from "@/components/common/states";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/services/api";

export const Route = createFileRoute("/admin/ai-evaluation")({
  component: AdminAiEvaluation,
});

interface EvaluationMetrics {
  tutorMetrics?: {
    tutorGroundednessRatio?: number;
    tutorRefusalRate?: number;
    totalTutorRequests?: number;
    groundedTutorRequests?: number;
    unsupportedTutorRequests?: number;
  };
  assessment6DMetrics?: {
    totalAssessments?: number;
    averages?: {
      overall?: number;
      understanding?: number;
      accuracy?: number;
      completeness?: number;
      clarity?: number;
      reasoning?: number;
    };
  };
}

export function AdminAiEvaluation() {
  const query = useQuery({
    queryKey: ["admin", "ai-evaluation"],
    queryFn: () => adminApi.aiEvaluation(),
  });

  const metrics = query.data as EvaluationMetrics | undefined;
  const tutor = metrics?.tutorMetrics;
  const assessment = metrics?.assessment6DMetrics;
  const averages = assessment?.averages;

  const groundednessPct = tutor ? Math.round((tutor.tutorGroundednessRatio ?? 1) * 100) : 0;
  const refusalPct = tutor ? Math.round((tutor.tutorRefusalRate ?? 0) * 100) : 0;
  const overallQuality = assessment?.averages?.overall
    ? Math.round(assessment.averages.overall)
    : 0;

  const hasData = (tutor?.totalTutorRequests ?? 0) > 0 || (assessment?.totalAssessments ?? 0) > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI evaluation"
        description="How reliably answers stay grounded in user materials."
      />

      {query.isError ? (
        <div className="surface-card p-6 text-center text-destructive">
          Failed to load AI evaluation data: {(query.error as Error)?.message || "Unknown error"}
        </div>
      ) : query.isLoading ? (
        <ListSkeleton rows={4} />
      ) : !hasData ? (
        <EmptyState
          title="No evaluation data available"
          description="Take an open-ended assessment or interact with the AI Tutor to log evaluation metrics."
        />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Tutor Grounding"
              value={`${groundednessPct}%`}
              hint={`${tutor?.groundedTutorRequests ?? 0} grounded of ${tutor?.totalTutorRequests ?? 0}`}
              icon={BadgeCheck}
              tone="success"
            />
            <StatCard
              label="Assessment Quality"
              value={`${overallQuality}%`}
              hint="6D Overall Average"
              icon={Star}
            />
            <StatCard
              label="Refusal Rate"
              value={`${refusalPct}%`}
              hint={`${tutor?.unsupportedTutorRequests ?? 0} unsupported refusals`}
              icon={ShieldAlert}
              tone="neutral"
            />
            <StatCard
              label="Assessments Evaluated"
              value={`${assessment?.totalAssessments ?? 0}`}
              hint="Open-ended submissions"
              icon={Target}
              tone="neutral"
            />
          </section>

          <div className="surface-card overflow-x-auto">
            <p className="border-b px-5 py-4 text-base font-semibold">
              6D Assessment Evaluation Metrics
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dimension</TableHead>
                  <TableHead className="text-right">Average Score</TableHead>
                  <TableHead>Benchmark Threshold</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { name: "Understanding", score: averages?.understanding ?? 0 },
                  { name: "Accuracy", score: averages?.accuracy ?? 0 },
                  { name: "Completeness", score: averages?.completeness ?? 0 },
                  { name: "Clarity", score: averages?.clarity ?? 0 },
                  { name: "Reasoning", score: averages?.reasoning ?? 0 },
                ].map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right font-semibold">{row.score}%</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-medium text-success">
                        Target &ge; 70%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
