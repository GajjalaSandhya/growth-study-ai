import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FolderPlus, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { SpaceCard } from "@/components/cards/SpaceCard";
import { CardSkeletonGrid, EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { spacesApi } from "@/services/api";
import type { Space } from "@/services/types";

export const Route = createFileRoute("/spaces/")({
  head: () => ({
    meta: [
      { title: "My Spaces — StudyMate AI" },
      { name: "description", content: "Organise your learning into subject spaces and projects." },
      { property: "og:title", content: "My Spaces — StudyMate AI" },
      { property: "og:description", content: "Spaces group your projects, materials and mastery." },
    ],
  }),
  component: SpacesPage,
});

function SpacesPage() {
  const query = useQuery({ queryKey: ["spaces"], queryFn: spacesApi.list });
  const [extra, setExtra] = useState<Space[]>([]);
  const [open, setOpen] = useState(false);

  const spaces = [...(query.data ?? []), ...extra];

  return (
    <AppShell breadcrumbs={[{ label: "Spaces" }]}>
      <div className="space-y-6">
        <PageHeader
          title="My Spaces"
          description="Spaces group related projects, materials and concept mastery."
          actions={
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" /> Create Space
            </Button>
          }
        />

        {query.isLoading ? (
          <CardSkeletonGrid count={3} height={210} />
        ) : spaces.length === 0 ? (
          <EmptyState
            icon={FolderPlus}
            title="Create your first learning space"
            description="Spaces keep subjects separate — Computer Science, Machine Learning, Mathematics."
            action={<Button onClick={() => setOpen(true)}>Create Space</Button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {spaces.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        )}
      </div>

      <CreateSpaceDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={(space) => {
          setExtra((s) => [...s, space]);
          toast.success(`Space "${space.name}" created`);
        }}
      />
    </AppShell>
  );
}

export function CreateSpaceDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (space: Space) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("BookOpen");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (name.trim().length < 2) return;
    setSaving(true);
    const space = await spacesApi.create({ name, description, icon });
    setSaving(false);
    onCreated(space);
    onOpenChange(false);
    setName("");
    setDescription("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a space</DialogTitle>
          <DialogDescription>
            Group projects by subject so mastery and analytics stay meaningful.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="space-name">Space name</Label>
            <Input
              id="space-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Computer Science"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="space-desc">Description</Label>
            <Textarea
              id="space-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will you study in this space?"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Icon</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BookOpen">Book</SelectItem>
                <SelectItem value="Cpu">Computing</SelectItem>
                <SelectItem value="Brain">Machine Learning</SelectItem>
                <SelectItem value="Sigma">Mathematics</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || name.trim().length < 2}>
            {saving ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
