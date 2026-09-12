import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { ProgressBar, toneForScore } from "@/components/common/MasteryBits";
import { ListSkeleton } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { adminApi } from "@/services/api";

export const Route = createFileRoute("/admin/users/")({
  component: AdminUsers,
});

const statusClass = {
  Active: "bg-success/12 text-success",
  Invited: "bg-warning/18 text-warning",
  Suspended: "bg-destructive/10 text-destructive",
};

function AdminUsers() {
  const query = useQuery({ queryKey: ["admin", "users"], queryFn: adminApi.users });

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Everyone using StudyMate AI on this workspace." />
      {query.isLoading ? (
        <ListSkeleton rows={5} />
      ) : (
        <div className="surface-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Spaces</TableHead>
                <TableHead className="text-right">Projects</TableHead>
                <TableHead>Last active</TableHead>
                <TableHead className="w-40">Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(query.data ?? []).map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-right">{u.spaces}</TableCell>
                  <TableCell className="text-right">{u.projects}</TableCell>
                  <TableCell className="text-muted-foreground">{u.lastActive}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={u.progress} tone={toneForScore(u.progress)} />
                      <span className="w-9 shrink-0 text-right text-xs text-muted-foreground">
                        {u.progress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        statusClass[u.status],
                      )}
                    >
                      {u.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View User
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
