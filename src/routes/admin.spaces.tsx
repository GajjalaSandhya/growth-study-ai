import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { ListSkeleton } from "@/components/common/states";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { spacesApi } from "@/services/api";

export const Route = createFileRoute("/admin/spaces")({
  component: AdminSpaces,
});

function AdminSpaces() {
  const query = useQuery({ queryKey: ["spaces"], queryFn: spacesApi.list });

  return (
    <div className="space-y-6">
      <PageHeader title="Spaces" description="All learning spaces created on the platform." />
      {query.isLoading ? (
        <ListSkeleton rows={4} />
      ) : (
        <div className="surface-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Space</TableHead>
                <TableHead className="text-right">Projects</TableHead>
                <TableHead className="text-right">Materials</TableHead>
                <TableHead className="text-right">Study time</TableHead>
                <TableHead className="text-right">Avg mastery</TableHead>
                <TableHead>Last activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(query.data ?? []).map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-right">{s.projectCount}</TableCell>
                  <TableCell className="text-right">{s.materials}</TableCell>
                  <TableCell className="text-right">{s.studyTimeHours} hrs</TableCell>
                  <TableCell className="text-right">{s.averageMastery}%</TableCell>
                  <TableCell className="text-muted-foreground">{s.lastActivity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
