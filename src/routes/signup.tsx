import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AuthLayout, GoogleButton, fieldError } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/services/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — StudyMate AI" },
      { name: "description", content: "Sign up for StudyMate AI and start learning smarter." },
      { property: "og:title", content: "Create your account — StudyMate AI" },
      { property: "og:description", content: "Learn smarter. Practice better. Grow continuously." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next["name"] = "Please enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next["email"] = "Enter a valid email address.";
    if (form.password.length < 8) next["password"] = "Use at least 8 characters.";
    if (form.confirm !== form.password) next["confirm"] = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const user = await authApi.signup(form.name, form.email, form.password);
      signIn(user);
      void navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to create account. Please try again.";
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start building measurable understanding, not just notes."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {fieldError(errors["form"])}
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={form.name} onChange={set("name")} placeholder="Yuvtej Sharma" />
          {fieldError(errors["name"])}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="you@university.edu"
          />
          {fieldError(errors["email"])}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={form.password} onChange={set("password")} />
            {fieldError(errors["password"])}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" value={form.confirm} onChange={set("confirm")} />
            {fieldError(errors["confirm"])}
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? "Creating account…" : "Create account"}
        </Button>
        <GoogleButton label="Sign up with Google" />
      </form>
    </AuthLayout>
  );
}
