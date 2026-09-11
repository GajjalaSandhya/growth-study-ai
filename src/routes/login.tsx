import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AuthLayout, GoogleButton, fieldError } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/services/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — StudyMate AI" },
      { name: "description", content: "Log in to your StudyMate AI study companion." },
      { property: "og:title", content: "Log in — StudyMate AI" },
      { property: "og:description", content: "Learn smarter. Practice better. Grow continuously." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("yuvtej@studymate.ai");
  const [password, setPassword] = useState("demo1234");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next["email"] = "Enter a valid email address.";
    if (password.length < 8) next["password"] = "Password must be at least 8 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    const user = await authApi.login(email, password);
    signIn(user);
    void navigate({ to: "/dashboard" });
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue your learning streak."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors["email"]}
            placeholder="you@university.edu"
          />
          {fieldError(errors["email"])}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors["password"]}
          />
          {fieldError(errors["password"])}
        </div>
        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} /> Remember me
          </label>
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? "Signing in…" : "Log in"}
        </Button>
        <GoogleButton />
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 text-success" /> Demo credentials are pre-filled.
        </p>
      </form>
    </AuthLayout>
  );
}
