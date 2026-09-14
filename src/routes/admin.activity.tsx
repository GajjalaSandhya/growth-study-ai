import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { ListSkeleton } from "@/components/common/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { adminApi } from "@/services/api";

export const Route = createFileRoute("/admin/activity")({
  component: AdminActivity,
});

function AdminActivity() {
  const query = useQuery({ queryKey: ["admin", "stats"], queryFn: () => adminApi.stats() });

  const active7Days = query.data?.activeUsers?.active7Days ?? 0;
  const active30Days = query.data?.activeUsers?.active30Days ?? 0;
  const totalStudyMinutes = query.data?.studyTime?.totalPlatformStudyMinutes ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Activity"
        description="Platform-wide active users and study time."
      />
      {query.isError ? (
        <div className="surface-card p-6 text-center text-destructive">
          Failed to load platform activity statistics:{" "}
          {(query.error as Error)?.message || "Unknown error"}
        </div>
      ) : query.isLoading ? (
        <ListSkeleton rows={3} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="surface-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Users (7 Days)</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{active7Days}</div>
                <p className="text-xs text-muted-foreground">Users active in the last week</p>
              </CardContent>
            </Card>

            <Card className="surface-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Users (30 Days)</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{active30Days}</div>
                <p className="text-xs text-muted-foreground">Users active in the last month</p>
              </CardContent>
            </Card>

            <Card className="surface-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Platform Study Time</CardTitle>
                <Activity className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Math.round((totalStudyMinutes / 60) * 10) / 10} hrs
                </div>
                <p className="text-xs text-muted-foreground">
                  Aggregate study time across platform
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="surface-card p-6 text-center text-muted-foreground text-sm">
            Global real-time activity feed is unavailable. Inspect individual user activity under{" "}
            <a href="/admin/users" className="text-primary underline font-medium">
              Users Management
            </a>{" "}
            to view detailed activity logs per user.
          </div>
        </div>
      )}
    </div>
  );
}
