import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { projectsApi, spacesApi } from "@/services/api";
import type { Project, ProjectStatus } from "@/services/types";

export function CreateProjectDialog({
  open,
  onOpenChange,
  defaultSpaceId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultSpaceId?: string;
  onCreated?: (project: Project) => void;
}) {
  const queryClient = useQueryClient();
  const spacesQuery = useQuery({ queryKey: ["spaces"], queryFn: spacesApi.list, enabled: open });

  const [spaceId, setSpaceId] = useState(defaultSpaceId || "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("Computer Science");
  const [status, setStatus] = useState<ProjectStatus>("in-progress");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (defaultSpaceId) {
      setSpaceId(defaultSpaceId);
    } else if (spacesQuery.data && spacesQuery.data.length > 0 && !spaceId && spacesQuery.data[0]) {
      setSpaceId(spacesQuery.data[0].id);
    }
  }, [defaultSpaceId, spacesQuery.data, spaceId]);

  async function submit() {
    if (name.trim().length < 2) {
      setError("Project name must be at least 2 characters.");
      return;
    }
    if (!spaceId) {
      setError("Please select a space for this project.");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const created = await projectsApi.create({
        spaceId,
        name: name.trim(),
        description: description.trim(),
        subject: subject.trim() || "General",
        status,
      });

      // Invalidate relevant queries to keep UI in sync
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      void queryClient.invalidateQueries({ queryKey: ["projects", spaceId] });
      void queryClient.invalidateQueries({ queryKey: ["spaces"] });
      void queryClient.invalidateQueries({ queryKey: ["space", spaceId] });

      toast.success(`Project "${created.name}" created successfully`);
      onCreated?.(created);
      onOpenChange(false);
      setName("");
      setDescription("");
    } catch (err: any) {
      setError(err.message || "Failed to create project. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a project</DialogTitle>
          <DialogDescription>
            Projects hold materials, tutor history, practice quizzes and concept mastery.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {!defaultSpaceId && (
            <div className="space-y-1.5">
              <Label>Target Space</Label>
              <Select value={spaceId} onValueChange={setSpaceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a learning space" />
                </SelectTrigger>
                <SelectContent>
                  {(spacesQuery.data || []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="project-name">Project name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Java DSA Patterns"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-subject">Subject</Label>
            <Input
              id="project-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Computer Science"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-desc">Description</Label>
            <Textarea
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What topic or material are you working on?"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Initial Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="needs-review">Needs Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || name.trim().length < 2 || !spaceId}>
            {saving ? "Creating…" : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
