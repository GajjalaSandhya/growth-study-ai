import { Outlet, createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Boxes,
  Cpu,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export const adminNav = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Spaces", to: "/admin/spaces", icon: Boxes },
  { label: "Projects", to: "/admin/projects", icon: FolderKanban },
  { label: "Activity", to: "/admin/activity", icon: Activity },
  { label: "Learning Progress", to: "/admin/analytics", icon: BarChart3 },
  { label: "AI Usage", to: "/admin/ai-usage", icon: Cpu },
  { label: "AI Evaluation", to: "/admin/ai-evaluation", icon: ShieldCheck },
  { label: "System Health", to: "/admin/system-health", icon: Gauge },
];

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — StudyMate AI" },
      { name: "description", content: "Platform metrics, users, AI usage and system health." },
      { property: "og:title", content: "Admin — StudyMate AI" },
      { property: "og:description", content: "Operate and monitor the StudyMate AI platform." },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AppShell admin adminNav={adminNav} breadcrumbs={[{ label: "Admin" }]}>
      <Outlet />
    </AppShell>
  );
}
