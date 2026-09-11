import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { ListSkeleton } from "@/components/common/states";
import { cn } from "@/lib/utils";
import { adminApi } from "@/services/api";

export const Route = createFileRoute("/admin/system-health")({
  component: AdminSystemHealth,
});

const dot = {
  Healthy: "bg-success",
  Warning: "bg-warning",
  Error: "bg-destructive",
};

const levelClass: Record<string, string> = {
  Info: "text-muted-foreground",
  Warning: "text-warning",
  Error: "text-destructive",
};

function AdminSystemHealth() {
  const services = useQuery({ queryKey: ["admin", "health"], queryFn: adminApi.systemHealth });
  const events = useQuery({ queryKey: ["admin", "events"], queryFn: adminApi.systemEvents });

  return (
    <div className="space-y-6">
      <PageHeader title="System health" description="Live status of platform services." />

      {services.isLoading ? (
        <ListSkeleton rows={5} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(services.data ?? []).map((s) => (
            <div key={s.name} className="surface-card p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{s.name}</p>
                <span className="flex items-center gap-2 text-xs font-medium">
                  <span className={cn("size-2 rounded-full", dot[s.status])} />
                  {s.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{s.detail}</p>
              <p className="mt-3 text-xs text-muted-foreground">Uptime {s.uptime}</p>
            </div>
          ))}
        </div>
      )}

      <section className="surface-card p-5">
        <h2 className="text-base font-semibold">Recent system events</h2>
        <ul className="mt-4 divide-y">
          {(events.data ?? []).map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span className="min-w-0">
                <span className={cn("font-medium", levelClass[e.level])}>{e.level}</span>
                <span className="ml-2 text-muted-foreground">{e.message}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{e.time}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
