import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ListSkeleton } from "@/components/common/states";
import { Activity, Cpu, Database, HardDrive, Server } from "lucide-react";
import { adminApi } from "@/services/api";

export const Route = createFileRoute("/admin/system-health")({
  component: AdminSystemHealth,
});

interface SystemHealthData {
  server?: {
    status?: string;
    nodeVersion?: string;
    environment?: string;
    uptimeSeconds?: number;
    memoryUsage?: {
      heapUsed?: string;
      heapTotal?: string;
      rss?: string;
    };
  };
  database?: {
    status?: string;
    name?: string;
  };
  vectorSearch?: {
    status?: string;
    engine?: string;
  };
  llmService?: {
    status?: string;
    model?: string;
    mode?: string;
  };
  recentAiFailures24h?: number;
}

export function AdminSystemHealth() {
  const healthQuery = useQuery({
    queryKey: ["admin", "health"],
    queryFn: () => adminApi.health(),
  });

  const health = healthQuery.data as SystemHealthData | undefined;
  const server = health?.server;
  const db = health?.database;
  const vector = health?.vectorSearch;
  const llm = health?.llmService;

  const uptimeMins = server?.uptimeSeconds ? Math.round(server.uptimeSeconds / 60) : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="System health" description="Live status of platform services." />

      {healthQuery.isError ? (
        <div className="surface-card p-6 text-center text-destructive">
          Failed to load system health: {(healthQuery.error as Error)?.message || "Unknown error"}
        </div>
      ) : healthQuery.isLoading ? (
        <ListSkeleton rows={5} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="surface-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-medium">
                  <Server className="size-4 text-primary" /> Express Backend Server
                </div>
                <span className="rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-medium text-success">
                  {server?.status ?? "UP"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Node {server?.nodeVersion} ({server?.environment} mode)
              </p>
              <p className="mt-3 text-xs text-muted-foreground">Uptime: {uptimeMins} mins</p>
            </div>

            <div className="surface-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-medium">
                  <Database className="size-4 text-primary" /> MongoDB Database
                </div>
                <span
                  className={
                    db?.status === "CONNECTED"
                      ? "rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-medium text-success"
                      : "rounded-full bg-warning/18 px-2.5 py-0.5 text-xs font-medium text-warning"
                  }
                >
                  {db?.status ?? "UNKNOWN"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Database: {db?.name ?? "studymate_ai"}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">Mongoose Connection State</p>
            </div>

            <div className="surface-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-medium">
                  <HardDrive className="size-4 text-primary" /> Vector Search Engine
                </div>
                <span className="rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-medium text-success">
                  {vector?.status ?? "READY"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {vector?.engine ?? "Local / Atlas"}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">RAG Vector Indexing</p>
            </div>

            <div className="surface-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-medium">
                  <Cpu className="size-4 text-primary" /> AI / LLM Service
                </div>
                <span className="rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-medium text-success">
                  {llm?.status ?? "READY"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Model: {llm?.model}</p>
              <p className="mt-3 text-xs text-muted-foreground">Mode: {llm?.mode}</p>
            </div>

            <div className="surface-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-medium">
                  <Activity className="size-4 text-primary" /> Heap Memory Used
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Active
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {server?.memoryUsage?.heapUsed} / {server?.memoryUsage?.heapTotal}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">RSS: {server?.memoryUsage?.rss}</p>
            </div>
          </div>

          <section className="grid gap-4 sm:grid-cols-2">
            <StatCard
              label="AI Failures (Last 24h)"
              value={`${health?.recentAiFailures24h ?? 0}`}
              hint="Failed AI execution logs"
              icon={Activity}
              tone={(health?.recentAiFailures24h ?? 0) > 0 ? "warning" : "success"}
            />
            <StatCard
              label="Node Environment"
              value={server?.environment ?? "development"}
              hint="Server Environment"
              icon={Server}
              tone="neutral"
            />
          </section>
        </>
      )}
    </div>
  );
}
