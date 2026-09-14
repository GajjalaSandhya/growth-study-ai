import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { ListSkeleton } from "@/components/common/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Boxes } from "lucide-react";
import { adminApi } from "@/services/api";

export const Route = createFileRoute("/admin/spaces")({
  component: AdminSpaces,
});

function AdminSpaces() {
  const query = useQuery({ queryKey: ["admin", "stats"], queryFn: () => adminApi.stats() });

  const totalSpaces = query.data?.entityCounts?.totalSpaces ?? 0;
  const totalProjects = query.data?.entityCounts?.totalProjects ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Spaces" description="Platform-wide learning space summary." />
      {query.isError ? (
        <div className="surface-card p-6 text-center text-destructive">
          Failed to load spaces summary: {(query.error as Error)?.message || "Unknown error"}
        </div>
      ) : query.isLoading ? (
        <ListSkeleton rows={3} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="surface-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Platform Spaces</CardTitle>
                <Boxes className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalSpaces}</div>
                <p className="text-xs text-muted-foreground">Spaces created across all users</p>
              </CardContent>
            </Card>

            <Card className="surface-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Platform Projects</CardTitle>
                <Boxes className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalProjects}</div>
                <p className="text-xs text-muted-foreground">Projects created across all spaces</p>
              </CardContent>
            </Card>
          </div>

          <div className="surface-card p-6 text-center text-muted-foreground text-sm">
            Detailed itemized global space listing is unavailable. Inspect individual user journeys
            under{" "}
            <a href="/admin/users" className="text-primary underline font-medium">
              Users Management
            </a>{" "}
            to view user-specific spaces.
          </div>
        </div>
      )}
    </div>
  );
}
