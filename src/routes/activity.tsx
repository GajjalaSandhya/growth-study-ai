import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { ActivityTimeline } from "@/components/cards/ActivityTimeline";
import { EmptyState, ListSkeleton } from "@/components/common/states";
import { cn } from "@/lib/utils";
import { activityApi } from "@/services/api";
import type { ActivityItem } from "@/services/types";

export const Route = createFileRoute("/activity")({
  head: () => ({
    meta: [
      { title: "Activity — StudyMate AI" },
      { name: "description", content: "A chronological timeline of your learning activity." },
      { property: "og:title", content: "Activity — StudyMate AI" },
      {
        property: "og:description",
        content: "Quizzes, tutor questions, uploads and mastery changes.",
      },
    ],
  }),
  component: ActivityPage,
});

const filters: { label: string; value: "all" | ActivityItem["type"] }[] = [
  { label: "All", value: "all" },
  { label: "Quizzes", value: "quiz" },
  { label: "Tutor", value: "tutor" },
  { label: "Uploads", value: "upload" },
  { label: "Mastery", value: "mastery" },
  { label: "Assessments", value: "assessment" },
];

function ActivityPage() {
  const query = useQuery({ queryKey: ["activity"], queryFn: () => activityApi.list() });
  const [filter, setFilter] = useState<"all" | ActivityItem["type"]>("all");
  const items = (query.data ?? []).filter((i) => filter === "all" || i.type === filter);

  return (
    <AppShell breadcrumbs={[{ label: "Activity" }]}>
      <div className="space-y-6">
        <PageHeader title="Activity" description="Everything you have done, newest first." />

        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="surface-card p-5">
          {query.isLoading ? (
            <ListSkeleton rows={6} />
          ) : items.length === 0 ? (
            <EmptyState
              title="Nothing here yet"
              description="Take a quiz or ask the tutor a question to start your timeline."
            />
          ) : (
            <ActivityTimeline items={items} grouped />
          )}
        </div>
      </div>
    </AppShell>
  );
}
