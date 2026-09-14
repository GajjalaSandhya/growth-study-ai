import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ActivityTimeline } from "@/components/cards/ActivityTimeline";
import { EmptyState, ListSkeleton } from "@/components/common/states";
import { activityApi } from "@/services/api";

export const Route = createFileRoute("/projects/$projectId/activity")({
  component: ProjectActivityTab,
});

function ProjectActivityTab() {
  const { projectId } = Route.useParams();
  const query = useQuery({
    queryKey: ["activity", projectId],
    queryFn: () => activityApi.list(projectId),
  });
  const items = query.data ?? [];

  return (
    <div className="surface-card p-5">
      <h2 className="mb-4 text-lg font-semibold">Project activity</h2>
      {query.isLoading ? (
        <ListSkeleton rows={5} />
      ) : items.length === 0 ? (
        <EmptyState title="No activity yet" description="Your learning events will appear here." />
      ) : (
        <ActivityTimeline items={items} grouped />
      )}
    </div>
  );
}
