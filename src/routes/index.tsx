import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, BookOpenCheck, Brain, Quote, Target } from "lucide-react";
import { Logo } from "@/components/common/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudyMate AI — Your AI Study Companion" },
      {
        name: "description",
        content:
          "Turn lecture PDFs into grounded explanations, adaptive quizzes and measurable concept mastery with StudyMate AI.",
      },
      { property: "og:title", content: "StudyMate AI — Your AI Study Companion" },
      {
        property: "og:description",
        content: "Learn smarter. Practice better. Grow continuously.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Quote,
    title: "Grounded AI tutor",
    body: "Every answer cites the page in your own PDF. When the material doesn't cover it, the tutor says so instead of guessing.",
  },
  {
    icon: Brain,
    title: "Adaptive practice",
    body: "Quizzes and open-ended assessments adjust to what you already understand and target the gaps.",
  },
  {
    icon: Target,
    title: "Concept mastery",
    body: "Track each concept from Needs Review to Mastered, with evidence from quizzes and assessments.",
  },
  {
    icon: BarChart3,
    title: "Growth analytics",
    body: "See mastery trends, study consistency and what to learn next — week by week.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="grid gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
              <BookOpenCheck className="size-3.5" /> AI study companion, not another chatbot
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              Learn smarter. Practice better. Grow continuously.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              StudyMate AI reads your course material, explains it with citations, tests your
              understanding with adaptive quizzes, and shows exactly which concepts you have
              mastered — and what to study next.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/dashboard">
                  Explore the demo <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">Log in</Link>
              </Button>
            </div>
          </div>

          <div className="surface-card p-6">
            <p className="text-sm font-medium text-muted-foreground">Java DSA · concept mastery</p>
            <ul className="mt-4 space-y-4">
              {[
                { name: "Arrays", value: 92 },
                { name: "HashMap", value: 88 },
                { name: "Stack", value: 78 },
                { name: "Sliding Window", value: 61 },
                { name: "Binary Trees", value: 45 },
              ].map((c) => (
                <li key={c.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">{c.value}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={
                        c.value >= 85
                          ? "h-full rounded-full bg-success"
                          : c.value >= 70
                            ? "h-full rounded-full bg-primary"
                            : c.value >= 55
                              ? "h-full rounded-full bg-warning"
                              : "h-full rounded-full bg-destructive"
                      }
                      style={{ width: `${c.value}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="grid gap-4 pb-20 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, body }) => (
            <article key={title} className="surface-card p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-4 text-base font-semibold">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        StudyMate AI — Learn smarter. Practice better. Grow continuously.
      </footer>
    </div>
  );
}
