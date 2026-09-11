import { Link } from "@tanstack/react-router";
import { BarChart3, BookOpen, MessageSquareQuote, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/ui/button";

export function fieldError(message?: string) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  return (
    <Button type="button" variant="outline" className="w-full">
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
        <path
          fill="currentColor"
          d="M21.35 11.1H12v2.9h5.35c-.24 1.4-1.67 4.1-5.35 4.1a5.9 5.9 0 1 1 0-11.8c1.7 0 2.84.72 3.5 1.34l2.39-2.3C16.4 3.9 14.4 3 12 3a9 9 0 1 0 0 18c5.2 0 8.63-3.65 8.63-8.8 0-.6-.1-1.05-.28-1.1Z"
        />
      </svg>
      {label}
    </Button>
  );
}

const highlights = [
  { icon: BookOpen, text: "Grounded answers from your own PDFs, with page citations." },
  { icon: MessageSquareQuote, text: "An AI tutor that refuses to guess outside your material." },
  { icon: BarChart3, text: "Adaptive quizzes, concept mastery and growth analytics." },
  { icon: ShieldCheck, text: "Always know what to study next — and why." },
];

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/">
            <Logo />
          </Link>
          <h1 className="mt-9 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-7">{children}</div>
          {footer && <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>}
        </div>
      </div>

      <aside className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-center">
        <div className="max-w-md">
          <p className="text-sm font-medium uppercase tracking-[0.18em] opacity-80">StudyMate AI</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight">
            Learn smarter. Practice better. Grow continuously.
          </h2>
          <p className="mt-4 text-sm leading-relaxed opacity-85">
            Your AI study companion turns lecture PDFs into grounded explanations, adaptive practice
            and a measurable picture of what you actually understand.
          </p>
          <ul className="mt-10 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm opacity-90">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary-foreground/12">
                  <Icon className="size-4" />
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <div className="mt-12 rounded-2xl border border-primary-foreground/15 bg-primary-foreground/8 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-80">Concept mastery · Java DSA</span>
              <span className="font-semibold">74%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-foreground/20">
              <div className="h-full w-[74%] rounded-full bg-primary-foreground/85" />
            </div>
            <p className="mt-3 text-xs opacity-75">+18% mastery this month</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
