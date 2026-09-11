import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { AnalyticsView } from "@/components/views/AnalyticsView";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — StudyMate AI" },
      { name: "description", content: "Study time, quiz accuracy, mastery trends and concept distribution." },
      { property: "og:title", content: "Analytics — StudyMate AI" },
      { property: "og:description", content: "Measure how your understanding changes over time." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <AppShell breadcrumbs={[{ label: "Analytics" }]}>
      <div className="space-y-6">
        <PageHeader
          title="Analytics"
          description="Global analytics across every space and project."
        />
        <AnalyticsView />
      </div>
    </AppShell>
  );
}
