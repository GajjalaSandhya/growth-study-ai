import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsView } from "@/components/views/AnalyticsView";

export const Route = createFileRoute("/projects/$projectId/analytics")({
  component: () => <AnalyticsView />,
});
