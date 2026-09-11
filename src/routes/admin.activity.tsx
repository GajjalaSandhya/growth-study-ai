import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { ActivityTimeline } from "@/components/cards/ActivityTimeline";
import { ListSkeleton } from "@/components/common/states";
import { activityApi } from "@/services/api";

export const Route = createFileRoute("/admin/activity")({
  component: AdminActivity,
});

function AdminActivity() {
  const query = useQuery({ queryKey: ["activity"], queryFn: activityApi.list });
  return (
    <div className="space-y-6">
      <PageHeader title="Platform activity" description="Recent learning events across all users." />
      <div className="surface-card p-5">
        {query.isLoading ? (
          <ListSkeleton rows={6} />
        ) : (
          <ActivityTimeline items={query.data ?? []} grouped />
        )}
      </div>
    </div>
  );
}
