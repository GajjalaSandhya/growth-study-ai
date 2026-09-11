import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { ListSkeleton } from "@/components/common/states";
import { MasteryBadge, masteryLevel } from "@/components/common/MasteryBits";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { projectsApi } from "@/services/api";

export const Route = createFileRoute("/admin/projects")({
  component: AdminProjects,
});

function AdminProjects() {
  const query = useQuery({ queryKey: ["projects"], queryFn: () => projectsApi.list() });

  return (
    <div className="space-y-6">
      <PageHeader title="Projects" description="Every project across all spaces and users." />
      {query.isLoading ? (
        <ListSkeleton rows={4} />
      ) : (
        <div className="surface-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="text-right">Materials</TableHead>
                <TableHead className="text-right">Progress</TableHead>
                <TableHead className="text-right">Quiz accuracy</TableHead>
                <TableHead>Mastery</TableHead>
                <TableHead>Last activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(query.data ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.subject}</TableCell>
                  <TableCell className="text-right">{p.materialCount}</TableCell>
                  <TableCell className="text-right">{p.progress}%</TableCell>
                  <TableCell className="text-right">{p.quizAccuracy}%</TableCell>
                  <TableCell>
                    <MasteryBadge level={masteryLevel(p.masteryScore)} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.lastActivity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
