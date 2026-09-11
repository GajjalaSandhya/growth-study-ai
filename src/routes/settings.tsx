import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — StudyMate AI" },
      { name: "description", content: "Manage your profile, notifications, appearance and security." },
      { property: "og:title", content: "Settings — StudyMate AI" },
      { property: "og:description", content: "Control how StudyMate AI works for you." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <AppShell breadcrumbs={[{ label: "Settings" }]}>
      <div className="space-y-6">
        <PageHeader title="Settings" description="Your account, preferences and security." />

        <Tabs defaultValue="profile">
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="surface-card mt-5 p-6">
            <div className="flex items-center gap-4">
              <span className="grid size-16 place-items-center rounded-full bg-accent text-lg font-semibold text-accent-foreground">
                {user.avatarInitials}
              </span>
              <div>
                <p className="font-medium">Avatar</p>
                <p className="text-sm text-muted-foreground">PNG or JPG, up to 2 MB.</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Upload new
                </Button>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <Button
              className="mt-6"
              onClick={() => {
                updateUser({ name, email });
                toast.success("Profile updated");
              }}
            >
              Save changes
            </Button>
          </TabsContent>

          <TabsContent value="account" className="surface-card mt-5 p-6">
            <dl className="space-y-4 text-sm">
              <Row label="Plan" value="Student · Free" />
              <Row label="Member since" value={user.joinedAt} />
              <Row label="Role" value={user.role === "admin" ? "Administrator" : "Student"} />
              <Row label="Data region" value="EU (Frankfurt)" />
            </dl>
            <Button variant="outline" className="mt-6">
              Export my learning data
            </Button>
          </TabsContent>

          <TabsContent value="notifications" className="surface-card mt-5 p-6">
            <ul className="space-y-5">
              {[
                { label: "Study reminders", detail: "A nudge when your streak is at risk." },
                { label: "Quiz results", detail: "Notify me when grading and mastery updates finish." },
                { label: "Document processing", detail: "Tell me when an uploaded PDF is ready." },
                { label: "Weekly growth summary", detail: "A Monday email with mastery changes." },
              ].map((n, i) => (
                <li key={n.label} className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{n.label}</p>
                    <p className="text-sm text-muted-foreground">{n.detail}</p>
                  </div>
                  <Switch defaultChecked={i !== 3} />
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="appearance" className="surface-card mt-5 p-6">
            <p className="text-sm font-medium">Theme</p>
            <div className="mt-3 flex gap-3">
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    "flex-1 rounded-xl border p-4 text-left text-sm capitalize transition-colors",
                    theme === t ? "border-primary bg-accent text-accent-foreground" : "hover:border-primary/40",
                  )}
                >
                  <span className="font-medium">{t}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {t === "light" ? "Bright, neutral surfaces" : "Low-light study sessions"}
                  </span>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="security" className="surface-card mt-5 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="current">Current password</Label>
                <Input id="current" type="password" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new">New password</Label>
                <Input id="new" type="password" />
              </div>
            </div>
            <Button className="mt-5" onClick={() => toast.success("Password updated")}>
              Update password
            </Button>
            <div className="mt-8 flex items-start justify-between gap-6 border-t pt-6">
              <div>
                <p className="text-sm font-medium">Two-factor authentication</p>
                <p className="text-sm text-muted-foreground">
                  Require a one-time code when signing in from a new device.
                </p>
              </div>
              <Switch />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
