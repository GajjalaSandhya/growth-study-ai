import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ShieldAlert, Star, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ListSkeleton } from "@/components/common/states";
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

function AdminAiEvaluation() {
  const query = useQuery({ queryKey: ["admin", "evaluations"], queryFn: adminApi.evaluations });

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI evaluation"
        description="How reliably answers stay grounded in user materials."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Grounding" value="94%" hint="Answers citing source pages" icon={BadgeCheck} tone="success" />
        <StatCard label="Answer quality" value="89%" hint="Average evaluation score" icon={Star} />
        <StatCard label="Unsupported handling" value="97%" hint="Correct refusals" icon={ShieldAlert} tone="success" />
        <StatCard label="Failed AI requests" value="42" hint="Last 7 days" icon={TriangleAlert} tone="warning" />
      </section>

      <div className="surface-card overflow-x-auto">
        <p className="border-b px-5 py-4 text-base font-semibold">Recent evaluations</p>
        {query.isLoading ? (
          <div className="p-5">
            <ListSkeleton rows={4} />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(query.data ?? []).map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="max-w-xs truncate font-medium">{e.question}</TableCell>
                  <TableCell className="text-muted-foreground">{e.project}</TableCell>
                  <TableCell>
                    <span
                      className={
                        e.grounded
                          ? "rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-medium text-success"
                          : "rounded-full bg-warning/18 px-2.5 py-0.5 text-xs font-medium text-warning"
                      }
                    >
                      {e.grounded ? "Grounded" : "Refused (unsupported)"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{e.score}%</TableCell>
                  <TableCell className="text-right text-muted-foreground">{e.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
