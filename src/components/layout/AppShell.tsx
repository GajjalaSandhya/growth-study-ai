import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

const mainNav: NavItem[] = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard },
  { label: "Spaces", to: "/spaces", icon: BookOpen },
  { label: "Projects", to: "/projects", icon: Brain },
  { label: "Tutor", to: "/projects/pr_java_dsa/tutor", icon: MessageSquare },
  { label: "Quizzes", to: "/projects/pr_java_dsa/quiz", icon: Sparkles },
  { label: "Growth", to: "/growth", icon: TrendingUp },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
];

const secondaryNav: NavItem[] = [
  { label: "Activity", to: "/activity", icon: Activity },
  { label: "Recommendations", to: "/recommendations", icon: Sparkles },
];

const notifications = [
  { id: "n1", title: "Quiz graded", detail: "Adaptive Quiz · 82% · Java DSA", time: "10m ago" },
  {
    id: "n2",
    title: "Document processing finished",
    detail: "Sliding Window.pdf is ready for the Tutor",
    time: "1h ago",
  },
  {
    id: "n3",
    title: "Mastery updated",
    detail: "Stack increased by 8% to 78%",
    time: "Yesterday",
  },
];

export interface Crumb {
  label: string;
  to?: string;
  params?: Record<string, string>;
}

export function AppShell({
  children,
  breadcrumbs = [],
  admin = false,
  adminNav,
}: {
  children: ReactNode;
  breadcrumbs?: Crumb[];
  admin?: boolean;
  adminNav?: NavItem[];
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar lg:block">
        <SidebarContent admin={admin} adminNav={adminNav ?? []} />
      </aside>

      <div className="lg:pl-64">
        <TopBar
          breadcrumbs={breadcrumbs}
          onOpenMobile={() => setMobileOpen(true)}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          admin={admin}
          adminNav={adminNav ?? []}
        />
        <main className="mx-auto w-full max-w-[1400px] px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
          {children}
        </main>
      </div>

      <MobileTabBar />
    </div>
  );
}

function SidebarContent({
  admin,
  adminNav,
  onNavigate,
}: {
  admin: boolean;
  adminNav: NavItem[];
  onNavigate?: (() => void) | undefined;
}) {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b px-4">
        <Link to="/dashboard" onClick={onNavigate} className="min-w-0">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {admin ? (
          adminNav.map((item) => <NavLink key={item.to} item={item} onNavigate={onNavigate} />)
        ) : (
          <>
            {mainNav.map((item) => (
              <NavLink key={item.to} item={item} onNavigate={onNavigate} />
            ))}
            <Divider />
            {secondaryNav.map((item) => (
              <NavLink key={item.to} item={item} onNavigate={onNavigate} />
            ))}
            <Divider />
            <NavLink item={{ label: "Settings", to: "/settings", icon: Settings }} onNavigate={onNavigate} />
            {isAdmin && (
              <NavLink
                item={{ label: "Admin Dashboard", to: "/admin", icon: Shield }}
                onNavigate={onNavigate}
              />
            )}
          </>
        )}
        {admin && (
          <>
            <Divider />
            <NavLink
              item={{ label: "Back to learning", to: "/dashboard", icon: LayoutDashboard }}
              onNavigate={onNavigate}
            />
          </>
        )}
      </nav>

      <div className="border-t p-3">
        <div className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
            {user.avatarInitials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="mt-1 flex gap-2">
          <Button asChild variant="ghost" size="sm" className="flex-1 justify-start">
            <Link to="/settings" onClick={onNavigate}>
              <Settings className="size-4" /> Settings
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => {
              signOut();
              onNavigate?.();
              void navigate({ to: "/login" });
            }}
          >
            <LogOut className="size-4" /> Logout
          </Button>
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="my-3 h-px bg-sidebar-border" />;
}

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
  const Icon = item.icon;
  return (
    <Link
      to={item.to as never}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60",
      )}
    >
      <Icon className="size-4.5 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function TopBar({
  breadcrumbs,
  mobileOpen,
  setMobileOpen,
  admin,
  adminNav,
}: {
  breadcrumbs: Crumb[];
  onOpenMobile: () => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  admin: boolean;
  adminNav: NavItem[];
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SidebarContent
              admin={admin}
              adminNav={adminNav}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div className="hidden min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground md:flex">
          {breadcrumbs.map((crumb, i) => (
            <span key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-2">
              {i > 0 && <ChevronRight className="size-3.5 shrink-0" />}
              {crumb.to ? (
                <Link
                  to={crumb.to as never}
                  params={crumb.params as never}
                  className="truncate transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="truncate font-medium text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </div>

        <div className="relative ml-auto hidden w-full max-w-xs sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search concepts, projects…" className="pl-9" />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell className="size-5" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <p className="border-b px-4 py-3 text-sm font-semibold">Notifications</p>
            <ul className="max-h-80 divide-y overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id} className="px-4 py-3">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.detail}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{n.time}</p>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90"
              aria-label="Profile menu"
            >
              {user.avatarInitials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block truncate">{user.name}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {user.email}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/activity">My activity</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                signOut();
                void navigate({ to: "/login" });
              }}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function MobileTabBar() {
  const items: NavItem[] = [
    { label: "Home", to: "/dashboard", icon: LayoutDashboard },
    { label: "Projects", to: "/projects", icon: Brain },
    { label: "Tutor", to: "/projects/pr_java_dsa/tutor", icon: MessageSquare },
    { label: "Growth", to: "/growth", icon: TrendingUp },
  ];
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur lg:hidden">
      <ul className="mx-auto flex max-w-md">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to;
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to as never}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
