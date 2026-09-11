import { createFileRoute } from "@tanstack/react-router";
import { GrowthView } from "@/components/views/GrowthView";

export const Route = createFileRoute("/projects/$projectId/growth")({
  component: ProjectGrowthTab,
});

function ProjectGrowthTab() {
  const { projectId } = Route.useParams();
  return <GrowthView projectId={projectId} />;
}
