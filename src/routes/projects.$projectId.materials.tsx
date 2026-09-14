import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { EmptyState, ErrorState, ListSkeleton } from "@/components/common/states";
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
  const queryClient = useQueryClient();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const materialsQuery = useQuery({
    queryKey: ["materials", projectId],
    queryFn: () => materialsApi.list(projectId),
    refetchInterval: (query) => {
      const list = query.state.data;
      const isProcessing = list?.some((m) => m.status === "processing" || m.status === "uploading");
      return isProcessing ? 2000 : false;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => materialsApi.upload(projectId, file),
    onSuccess: (material) => {
      toast.success(`${material.name} uploaded successfully. Processing queued.`);
      queryClient.invalidateQueries({ queryKey: ["materials", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to upload PDF document.");
    },
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => materialsApi.retry(id),
    onSuccess: () => {
      toast.success("Retry queued.");
      queryClient.invalidateQueries({ queryKey: ["materials", projectId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to retry material processing.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => materialsApi.remove(id),
    onSuccess: () => {
      toast.success("Material deleted.");
      queryClient.invalidateQueries({ queryKey: ["materials", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete material.");
    },
  });

  function handleFileUpload(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are supported right now.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size limit exceeded. Maximum allowed size is 20MB.");
      return;
    }
    uploadMutation.mutate(file);
  }

  const materials = materialsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:flex sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Learning Materials</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Uploaded PDFs give your AI Tutor grounded context with page-level citations.
          </p>
        </div>
        <Button onClick={() => inputRef.current?.click()} disabled={uploadMutation.isPending}>
          {uploadMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {uploadMutation.isPending ? "Uploading…" : "Upload PDF"}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          e.target.value = "";
        }}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!uploadMutation.isPending) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (uploadMutation.isPending) return;
          const file = e.dataTransfer.files?.[0];
          if (file) handleFileUpload(file);
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
          Upload your learning material · supported format: PDF (max 20 MB)
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => inputRef.current?.click()}
          disabled={uploadMutation.isPending}
        >
          {uploadMutation.isPending ? "Uploading…" : "Browse files"}
        </Button>
      </div>

      {materialsQuery.isLoading ? (
        <ListSkeleton rows={3} />
      ) : materialsQuery.isError ? (
        <ErrorState
          description={materialsQuery.error.message || "Failed to load materials."}
          onRetry={() => materialsQuery.refetch()}
        />
      ) : materials.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Upload a PDF to give your AI Tutor learning context"
          description="Without material, the tutor has nothing to ground its answers in."
          action={
            <Button onClick={() => inputRef.current?.click()} disabled={uploadMutation.isPending}>
              Upload PDF
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {materials.map((m) => (
            <MaterialRow
              key={m.id}
              material={m}
              projectId={projectId}
              onRetry={() => retryMutation.mutate(m.id)}
              onDelete={() => deleteMutation.mutate(m.id)}
              isRetrying={retryMutation.isPending && retryMutation.variables === m.id}
              isDeleting={deleteMutation.isPending && deleteMutation.variables === m.id}
            />
          ))}
        </ul>
      )}
    </div>
  );
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
  isRetrying,
  isDeleting,
}: {
  material: Material;
  projectId: string;
  onRetry: () => void;
  onDelete: () => void;
  isRetrying: boolean;
  isDeleting: boolean;
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
            <Button variant="outline" size="sm" onClick={onRetry} disabled={isRetrying}>
              {isRetrying ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCcw className="size-4" />
              )}
              Retry
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${material.name}`}
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4 text-muted-foreground" />
            )}
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
