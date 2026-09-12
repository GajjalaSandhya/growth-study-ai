import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Lightbulb,
  Loader2,
  PenLine,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { ProgressBar, toneForScore } from "@/components/common/MasteryBits";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { conceptsApi, quizApi } from "@/services/api";
import type { OpenAnswerEvaluation, QuizQuestion, QuizResult } from "@/services/types";

export const Route = createFileRoute("/projects/$projectId/quiz")({
  component: QuizTab,
});

type Phase = "setup" | "running" | "result" | "assessment";

function QuizTab() {
  const { projectId } = Route.useParams();
  const concepts = useQuery({
    queryKey: ["concepts", projectId],
    queryFn: () => conceptsApi.list(projectId),
  });
  const recommended = useQuery({
    queryKey: ["quiz", "recommended", projectId],
    queryFn: () => quizApi.recommendedConcepts(projectId),
  });

  const [phase, setPhase] = useState<Phase>("setup");
  const [selected, setSelected] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("Adaptive");
  const [count, setCount] = useState("10");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recommended.data && selected.length === 0) setSelected(recommended.data);
  }, [recommended.data, selected.length]);

  async function start(concepts: string[], questionCount: number) {
    setLoading(true);
    const qs = await quizApi.questions(concepts, questionCount);
    setQuestions(qs);
    setAnswers({});
    setRevealed({});
    setIndex(0);
    setResult(null);
    setLoading(false);
    setPhase("running");
  }

  async function submit() {
    setLoading(true);
    const res = await quizApi.submit(questions, answers);
    setResult(res);
    setLoading(false);
    setPhase("result");
  }

  if (phase === "assessment") {
    return <OpenEndedAssessment projectId={projectId} onBack={() => setPhase("setup")} />;
  }

  if (phase === "running" && questions.length) {
    const q = questions[index]!;
    const answered = Object.keys(answers).length;
    const chosen = answers[q.id];
    const showExplanation = !!revealed[q.id];

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="surface-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium">
              Question {index + 1} of {questions.length}
            </span>
            <span className="text-muted-foreground">
              {answered} answered · {questions.length - answered} remaining
            </span>
          </div>
          <ProgressBar value={((index + 1) / questions.length) * 100} className="mt-3" />
        </div>

        <div className="surface-card p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {q.concept} · {q.difficulty}
          </p>
          <h2 className="mt-2 text-lg font-semibold">{q.prompt}</h2>
          <ul className="mt-5 space-y-3">
            {q.options.map((opt) => {
              const active = chosen === opt.id;
              const isCorrect = opt.id === q.correctOptionId;
              return (
                <li key={opt.id}>
                  <button
                    onClick={() => {
                      setAnswers((a) => ({ ...a, [q.id]: opt.id }));
                      setRevealed((r) => ({ ...r, [q.id]: true }));
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                      showExplanation && isCorrect && "border-success bg-success/8",
                      showExplanation && active && !isCorrect && "border-destructive bg-destructive/8",
                      !showExplanation && active
                        ? "border-primary bg-accent text-accent-foreground"
                        : !showExplanation
                          ? "hover:border-primary/40"
                          : "",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold uppercase",
                        active && !showExplanation && "border-primary bg-primary text-primary-foreground",
                      )}
                    >
                      {opt.id}
                    </span>
                    <span className="min-w-0 flex-1">{opt.text}</span>
                    {showExplanation && isCorrect && (
                      <CheckCircle2 className="size-4 shrink-0 text-success" />
                    )}
                    {showExplanation && active && !isCorrect && (
                      <XCircle className="size-4 shrink-0 text-destructive" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {showExplanation && (
            <div className="mt-5 rounded-xl bg-muted p-4 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <Lightbulb className="size-4 text-warning" /> Explanation
              </p>
              <p className="mt-1.5 text-muted-foreground">{q.explanation}</p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link to="/projects/$projectId/mastery" params={{ projectId }}>
                  Review {q.concept}
                </Link>
              </Button>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
            >
              Previous
            </Button>
            {index === questions.length - 1 ? (
              <Button onClick={submit} disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" />} Submit quiz
              </Button>
            ) : (
              <Button onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "result" && result) {
    const weakest = [...result.conceptPerformance].sort((a, b) => a.score - b.score)[0];
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="surface-card p-6 text-center">
          <h2 className="text-xl font-semibold">Quiz Complete 🎉</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mastery scores have been updated for the concepts you practised.
          </p>
          <p className="mt-6 text-5xl font-semibold tracking-tight">{result.score}%</p>
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <Stat label="Correct" value={`${result.correct}`} tone="text-success" />
            <Stat label="Incorrect" value={`${result.incorrect}`} tone="text-destructive" />
            <Stat label="Questions" value={`${questions.length}`} tone="text-foreground" />
            <Stat label="Accuracy" value={`${result.score}%`} tone="text-primary" />
          </div>
        </div>

        <section className="surface-card p-5">
          <h3 className="text-base font-semibold">Concept performance</h3>
          <ul className="mt-4 space-y-4">
            {result.conceptPerformance.map((c) => (
              <li key={c.concept}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{c.concept}</span>
                  <span className="text-muted-foreground">
                    {c.score}% · {c.correct}/{c.total}
                  </span>
                </div>
                <ProgressBar value={c.score} tone={toneForScore(c.score)} className="mt-2" />
              </li>
            ))}
          </ul>
        </section>

        {weakest && (
          <section className="surface-card border-warning/30 bg-warning/6 p-5">
            <p className="text-sm font-semibold text-warning">Needs Review</p>
            <p className="mt-1 text-base font-semibold">{weakest.concept}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You answered {weakest.total - weakest.correct} of {weakest.total} questions
              incorrectly.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link to="/projects/$projectId/mastery" params={{ projectId }}>
                  Review Concept
                </Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPhase("assessment")}>
                <PenLine className="size-4" /> Try an open-ended assessment
              </Button>
            </div>
          </section>
        )}

        <section className="surface-card p-5">
          <h3 className="text-base font-semibold">Recommended next action</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Re-explain {weakest?.concept ?? "the weakest concept"} in your own words, then retake an
            adaptive quiz focused on it.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setPhase("setup")}>
              <RotateCcw className="size-4" /> New adaptive quiz
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/projects/$projectId/tutor" params={{ projectId }}>
                Ask the tutor about it
              </Link>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const weakConcepts = recommended.data ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold">Adaptive Quiz</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Questions are selected based on your current understanding.
        </p>

        <div className="mt-6">
          <Label className="text-sm font-medium">Select concepts</Label>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {(concepts.data ?? []).map((c) => {
              const checked = selected.includes(c.name);
              return (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:border-primary/40">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) =>
                        setSelected((s) =>
                          v ? [...s, c.name] : s.filter((name) => name !== c.name),
                        )
                      }
                    />
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{c.mastery}%</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Adaptive">Adaptive</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Questions</Label>
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          className="mt-6"
          onClick={() => void start(selected, Number(count))}
          disabled={loading}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Start Quiz
        </Button>
      </section>

      <div className="space-y-6">
        <section className="surface-card border-primary/30 bg-primary/5 p-6">
          <h3 className="text-base font-semibold">Recommended Quiz</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Five questions built from your weakest concepts right now.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {weakConcepts.map((c) => (
              <li
                key={c}
                className="rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {c}
              </li>
            ))}
          </ul>
          <Button className="mt-5" onClick={() => void start(weakConcepts, 5)} disabled={loading}>
            <Sparkles className="size-4" /> Start recommended quiz
          </Button>
        </section>

        <section className="surface-card p-6">
          <h3 className="text-base font-semibold">Open-ended assessment</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Explain a concept in your own words and get an AI evaluation of understanding, accuracy,
            relevance and reasoning.
          </p>
          <Button variant="outline" className="mt-5" onClick={() => setPhase("assessment")}>
            <PenLine className="size-4" /> Start assessment
          </Button>

          <div className="mt-8 rounded-xl bg-muted p-4 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="size-4 text-success" /> How adaptive selection works
            </p>
            <p className="mt-2 text-muted-foreground">
              Concepts below 70% mastery are weighted more heavily, and difficulty rises as you
              answer correctly.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl bg-muted px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold", tone)}>{value}</p>
    </div>
  );
}

function OpenEndedAssessment({ projectId, onBack }: { projectId: string; onBack: () => void }) {
  const prompt = useQuery({ queryKey: ["quiz", "prompt"], queryFn: quizApi.openEndedPrompt });
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<OpenAnswerEvaluation | null>(null);

  async function submit() {
    if (answer.trim().length < 20) return;
    setLoading(true);
    const res = await quizApi.evaluateOpenAnswer(prompt.data ?? "", answer);
    setEvaluation(res);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold">Open-ended assessment</h2>
        <p className="mt-3 rounded-xl bg-muted px-4 py-3 text-sm">
          {prompt.data ?? "Loading question…"}
        </p>
        <Label htmlFor="open-answer" className="mt-4 block text-sm font-medium">
          Your answer
        </Label>
        <Textarea
          id="open-answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={8}
          maxLength={2000}
          className="mt-2"
          placeholder="Write your explanation in your own words…"
        />
        <div className="mt-2 flex justify-end text-xs text-muted-foreground">
          {answer.trim().length} / 2000 characters
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={submit} disabled={loading || answer.trim().length < 20}>
            {loading && <Loader2 className="size-4 animate-spin" />} Submit Answer
          </Button>
          <Button variant="ghost" onClick={onBack}>
            Back to quiz
          </Button>
          {answer.trim().length < 20 && (
            <span className="text-xs text-muted-foreground">
              Write at least 20 characters to submit.
            </span>
          )}
        </div>
      </section>

      {loading && (
        <p className="text-sm text-muted-foreground">
          Evaluating your explanation against your materials…
        </p>
      )}

      {evaluation && (
        <section className="surface-card p-6">
          <h3 className="text-base font-semibold">AI Evaluation</h3>
          <p className="mt-4 text-4xl font-semibold tracking-tight">
            {evaluation.understanding}%
            <span className="ml-2 align-middle text-sm font-normal text-muted-foreground">
              understanding
            </span>
          </p>
          <ul className="mt-6 space-y-4">
            {[
              { label: "Accuracy", value: evaluation.accuracy },
              { label: "Relevance", value: evaluation.relevance },
              { label: "Reasoning quality", value: evaluation.reasoningQuality },
            ].map((row) => (
              <li key={row.label}>
                <div className="flex items-center justify-between text-sm">
                  <span>{row.label}</span>
                  <span className="text-muted-foreground">{row.value}%</span>
                </div>
                <ProgressBar value={row.value} tone={toneForScore(row.value)} className="mt-2" />
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-success/30 bg-success/8 p-4 text-sm">
              <p className="font-medium text-success">Key concepts covered</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {evaluation.conceptsCovered.length ? (
                  evaluation.conceptsCovered.map((c) => <li key={c}>{c}</li>)
                ) : (
                  <li>None detected yet</li>
                )}
              </ul>
            </div>
            <div className="rounded-xl border border-warning/30 bg-warning/8 p-4 text-sm">
              <p className="font-medium text-warning">Missing concepts</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {evaluation.conceptsMissing.length ? (
                  evaluation.conceptsMissing.map((c) => <li key={c}>{c}</li>)
                ) : (
                  <li>Nothing important missing</li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-muted p-4 text-sm">
            <p className="font-medium">Feedback</p>
            <p className="mt-1 text-muted-foreground">{evaluation.feedback}</p>
          </div>
          <div className="mt-4 rounded-xl border p-4 text-sm">
            <p className="font-medium">Areas to improve</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              {evaluation.improvements.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setEvaluation(null);
                setAnswer("");
              }}
            >
              Practice Again
            </Button>
            <Button asChild variant="outline">
              <Link to="/projects/$projectId/tutor" params={{ projectId }}>
                Ask the tutor to clarify
              </Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
