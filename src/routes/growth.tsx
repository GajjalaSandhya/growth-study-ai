import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { GrowthView } from "@/components/views/GrowthView";

export const Route = createFileRoute("/growth")({
  head: () => ({
    meta: [
      { title: "Learning Growth — StudyMate AI" },
      { name: "description", content: "See how your concept mastery has grown week over week." },
      { property: "og:title", content: "Learning Growth — StudyMate AI" },
      { property: "og:description", content: "Strongest concepts, weakest concepts and monthly gains." },
    ],
  }),
  component: GrowthPage,
});

function GrowthPage() {
  return (
    <AppShell breadcrumbs={[{ label: "Growth" }]}>
      <div className="space-y-6">
        <PageHeader
          title="Your Learning Growth"
          description="Mastery progression, consistency and where you are improving fastest."
        />
        <GrowthView />
      </div>
    </AppShell>
  );
}
