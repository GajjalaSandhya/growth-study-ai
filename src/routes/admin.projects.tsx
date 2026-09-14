import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { ListSkeleton } from "@/components/common/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban } from "lucide-react";
import { adminApi } from "@/services/api";

export const Route = createFileRoute("/admin/projects")({
  component: AdminProjects,
});

function AdminProjects() {
  const query = useQuery({ queryKey: ["admin", "stats"], queryFn: () => adminApi.stats() });

  const totalProjects = query.data?.entityCounts?.totalProjects ?? 0;
  const totalMaterials = query.data?.entityCounts?.totalMaterials ?? 0;
  const totalQuizzes = query.data?.entityCounts?.totalQuizzes ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Projects" description="Platform-wide project summary." />
      {query.isError ? (
        <div className="surface-card p-6 text-center text-destructive">
          Failed to load project summary: {(query.error as Error)?.message || "Unknown error"}
        </div>
      ) : query.isLoading ? (
        <ListSkeleton rows={3} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="surface-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <FolderKanban className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalProjects}</div>
                <p className="text-xs text-muted-foreground">Across all user spaces</p>
              </CardContent>
            </Card>

            <Card className="surface-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Uploaded Materials</CardTitle>
                <FolderKanban className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalMaterials}</div>
                <p className="text-xs text-muted-foreground">PDFs & documents processed</p>
              </CardContent>
            </Card>

            <Card className="surface-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Generated Quizzes</CardTitle>
                <FolderKanban className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalQuizzes}</div>
                <p className="text-xs text-muted-foreground">Adaptive quizzes generated</p>
              </CardContent>
            </Card>
          </div>

          <div className="surface-card p-6 text-center text-muted-foreground text-sm">
            Itemized global project listing is unavailable. Inspect individual user journeys under{" "}
            <a href="/admin/users" className="text-primary underline font-medium">
              Users Management
            </a>{" "}
            to view user-specific projects.
          </div>
        </div>
      )}
    </div>
  );
}
