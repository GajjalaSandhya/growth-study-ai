import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState, ListSkeleton } from "@/components/common/states";
import { ProgressBar } from "@/components/common/MasteryBits";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { materialsApi } from "@/services/api";
import type { Material } from "@/services/types";

export const Route = createFileRoute("/projects/$projectId/materials")({
  component: MaterialsTab,
});

function MaterialsTab() {
  const { projectId } = Route.useParams();
  const query = useQuery({
    queryKey: ["materials", projectId],
    queryFn: () => materialsApi.list(projectId),
  });
  const [local, setLocal] = useState<Material[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const materials = [...local, ...(query.data ?? [])];

  async function addFile(name: string, sizeMb: number) {
    if (!name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are supported right now.");
      return;
    }
    const created = await materialsApi.upload(projectId, { name, sizeMb });
    setLocal((m) => [created, ...m]);
    simulate(created.id, setLocal);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:flex sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Learning Materials</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Uploaded PDFs give your AI Tutor grounded context with page-level citations.
          </p>
        </div>
        <Button onClick={() => inputRef.current?.click()}>
          <Upload className="size-4" /> Upload PDF
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void addFile(file.name, Math.round((file.size / 1_048_576) * 10) / 10);
          e.target.value = "";
        }}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void addFile(file.name, Math.round((file.size / 1_048_576) * 10) / 10);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          dragging ? "border-primary bg-accent/60" : "border-border bg-card",
        )}
      >
        <span className="grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <Upload className="size-6" />
        </span>
        <p className="mt-4 font-medium">Drag and drop PDF here</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your learning material · supported format: PDF (max 50 MB)
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => inputRef.current?.click()}>
          Browse files
        </Button>
      </div>

      {query.isLoading ? (
        <ListSkeleton rows={3} />
      ) : materials.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Upload a PDF to give your AI Tutor learning context"
          description="Without material, the tutor has nothing to ground its answers in."
          action={<Button onClick={() => inputRef.current?.click()}>Upload PDF</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {materials.map((m) => (
            <MaterialRow
              key={m.id}
              material={m}
              projectId={projectId}
              onRetry={() => {
                setLocal((list) =>
                  list.some((x) => x.id === m.id)
                    ? list.map((x) =>
                        x.id === m.id ? { ...x, status: "processing", progress: 5 } : x,
                      )
                    : [{ ...m, status: "processing", progress: 5 }, ...list],
                );
                simulate(m.id, setLocal);
              }}
              onDelete={() => {
                setLocal((list) => list.filter((x) => x.id !== m.id));
                toast.success(`${m.name} deleted`);
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function simulate(id: string, setLocal: React.Dispatch<React.SetStateAction<Material[]>>) {
  let progress = 0;
  const timer = setInterval(() => {
    progress += 12;
    setLocal((list) =>
      list.map((m) => {
        if (m.id !== id) return m;
        if (progress < 48) return { ...m, status: "uploading", progress };
        if (progress < 100) return { ...m, status: "processing", progress };
        return { ...m, status: "ready", progress: 100, pages: m.pages || 64 };
      }),
    );
    if (progress >= 100) {
      clearInterval(timer);
      toast.success("Document processed and ready for the Tutor");
    }
  }, 600);
}

const statusConfig = {
  uploading: { label: "Uploading", className: "bg-muted text-muted-foreground" },
  processing: { label: "Processing", className: "bg-warning/18 text-warning" },
  ready: { label: "Ready", className: "bg-success/12 text-success" },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive" },
} as const;

function MaterialRow({
  material,
  projectId,
  onRetry,
  onDelete,
}: {
  material: Material;
  projectId: string;
  onRetry: () => void;
  onDelete: () => void;
}) {
  const status = statusConfig[material.status];
  const busy = material.status === "uploading" || material.status === "processing";

  return (
    <li className="surface-card p-4">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 sm:flex sm:items-center sm:justify-between">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
          <FileText className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{material.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {material.sizeMb} MB · {material.pages || "—"} pages · uploaded {material.uploadedAt}
          </p>
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-auto">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              status.className,
            )}
          >
            {busy && <Loader2 className="size-3 animate-spin" />}
            {material.status === "ready" && <CheckCircle2 className="size-3" />}
            {material.status === "failed" && <AlertTriangle className="size-3" />}
            {status.label}
          </span>

          {material.status === "ready" && (
            <>
              <Button variant="outline" size="sm">
                Open
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link to="/projects/$projectId/tutor" params={{ projectId }}>
                  <MessageSquare className="size-4" /> Ask Tutor
                </Link>
              </Button>
            </>
          )}
          {material.status === "failed" && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCcw className="size-4" /> Retry
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${material.name}`}
            onClick={onDelete}
          >
            <Trash2 className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {busy && (
        <div className="mt-3">
          <ProgressBar value={material.progress ?? 0} tone="warning" />
          <p className="mt-1.5 text-xs text-muted-foreground">
            {material.status === "uploading"
              ? "Uploading document…"
              : "Extracting text and indexing pages…"}
          </p>
        </div>
      )}

      {material.status === "failed" && material.error && (
        <p className="mt-3 rounded-lg bg-destructive/8 px-3 py-2 text-xs text-destructive">
          {material.error}
        </p>
      )}
    </li>
  );
}

export function useNoop() {
  useEffect(() => {}, []);
}
