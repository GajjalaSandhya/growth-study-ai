import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ListSkeleton } from "@/components/common/states";
import { Clock, Cpu, ShieldAlert, Sparkles, TriangleAlert } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/services/api";

export const Route = createFileRoute("/admin/ai-usage")({
  component: AdminAiUsage,
});

interface AiUsageSummary {
  totalRequests?: number;
  successRequests?: number;
  unsupportedRequests?: number;
  failedRequests?: number;
  tokens?: { totalTokens?: number };
  avgLatencyMs?: number;
}

interface AiLogEntry {
  id?: string;
  requestType?: string;
  model?: string;
  latencyMs?: number;
  totalTokens?: number;
  grounded?: boolean;
  status?: string;
  timestamp: string | number | Date;
}

export function AdminAiUsage() {
  const query = useQuery({
    queryKey: ["admin", "ai-logs"],
    queryFn: () => adminApi.aiLogs(),
  });

  const data = query.data;
  const summary = data?.summary as AiUsageSummary | undefined;
  const logs = (data?.logs ?? []) as unknown as AiLogEntry[];

  return (
    <div className="space-y-6">
      <PageHeader title="AI usage" description="Requests, tokens and latency across AI features." />

      {query.isError ? (
        <div className="surface-card p-6 text-center text-destructive">
          Failed to load AI usage logs: {(query.error as Error)?.message || "Unknown error"}
        </div>
      ) : query.isLoading ? (
        <ListSkeleton rows={4} />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Total AI requests"
              value={`${summary?.totalRequests ?? 0}`}
              hint="Logged AI calls"
              icon={Cpu}
            />
            <StatCard
              label="Successful requests"
              value={`${summary?.successRequests ?? 0}`}
              hint="Grounded/valid outputs"
              icon={Sparkles}
              tone="success"
            />
            <StatCard
              label="Unsupported refusals"
              value={`${summary?.unsupportedRequests ?? 0}`}
              hint="Refused (out of scope)"
              icon={ShieldAlert}
              tone="neutral"
            />
            <StatCard
              label="Failed requests"
              value={`${summary?.failedRequests ?? 0}`}
              hint="Execution errors"
              icon={TriangleAlert}
              tone="warning"
            />
            <StatCard
              label="Total tokens used"
              value={`${((summary?.tokens?.totalTokens ?? 0) / 1000).toFixed(1)}k`}
              hint="Prompt + completion"
              icon={Cpu}
              tone="neutral"
            />
            <StatCard
              label="Avg response time"
              value={`${((summary?.avgLatencyMs ?? 0) / 1000).toFixed(2)} s`}
              hint="Average latency"
              icon={Clock}
              tone="neutral"
            />
          </section>

          <div className="surface-card overflow-x-auto">
            <p className="border-b px-5 py-4 text-base font-semibold">Recent AI Telemetry Logs</p>
            {logs.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No AI requests logged yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Latency</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead>Grounded</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium capitalize">{log.requestType}</TableCell>
                      <TableCell className="text-muted-foreground">{log.model}</TableCell>
                      <TableCell className="text-right">{log.latencyMs} ms</TableCell>
                      <TableCell className="text-right">{log.totalTokens}</TableCell>
                      <TableCell>
                        <span
                          className={
                            log.grounded
                              ? "rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-medium text-success"
                              : "rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                          }
                        >
                          {log.grounded ? "Yes" : "No"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            log.status === "success"
                              ? "rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-medium text-success"
                              : log.status === "unsupported"
                                ? "rounded-full bg-warning/18 px-2.5 py-0.5 text-xs font-medium text-warning"
                                : "rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive"
                          }
                        >
                          {log.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
