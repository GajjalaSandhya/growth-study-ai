import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { ListSkeleton } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { adminApi } from "@/services/api";

export const Route = createFileRoute("/admin/users/")({
  component: AdminUsers,
});

interface AdminUserRow {
  id: string;
  name?: string;
  avatarInitials?: string;
  email?: string;
  role?: string;
  joinedAt?: string;
}

export function AdminUsers() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [deletingUser, setDeletingUser] = useState<{ id: string; name: string } | null>(null);

  const query = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => adminApi.users(),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminApi.updateUserRole(userId, role),
    onSuccess: (data) => {
      toast.success(data.message || "User role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update user role");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: (data) => {
      toast.success(data.message || "User deleted successfully");
      setDeletingUser(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete user");
      setDeletingUser(null);
    },
  });

  const users = (query.data?.users as unknown as AdminUserRow[]) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Everyone using StudyMate AI on this workspace." />

      {query.isError ? (
        <div className="surface-card p-6 text-center text-destructive">
          Failed to load users: {(query.error as Error)?.message || "Unknown error"}
        </div>
      ) : query.isLoading ? (
        <ListSkeleton rows={5} />
      ) : (
        <div className="surface-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {u.avatarInitials || u.name?.slice(0, 2)?.toUpperCase() || "U"}
                        </div>
                        <span>{u.name || "User"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email || "N/A"}</TableCell>
                    <TableCell>
                      <Select
                        value={u.role || "student"}
                        onValueChange={(newRole) =>
                          roleMutation.mutate({ userId: u.id, role: newRole })
                        }
                        disabled={roleMutation.isPending}
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">student</SelectItem>
                          <SelectItem value="admin">admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {u.joinedAt ? new Date(u.joinedAt).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate({ to: `/admin/users/${u.id}` as never })}
                      >
                        View Journey
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingUser({ id: u.id, name: u.name || "User" })}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user "{deletingUser?.name}"? This action is permanent
              and will remove all their spaces, projects, quiz attempts, and activity data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingUser && deleteMutation.mutate(deletingUser.id)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
