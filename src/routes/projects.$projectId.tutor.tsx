import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  FileText,
  Info,
  Paperclip,
  Quote,
  SendHorizonal,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { ErrorState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { materialsApi, tutorApi } from "@/services/api";
import type { ChatMessageData, Citation } from "@/services/types";

export const Route = createFileRoute("/projects/$projectId/tutor")({
  component: TutorTab,
});

const quickPrompts = [
  "Explain key concepts",
  "Give me an example",
  "Summarize main topics",
  "Test my understanding",
];

const thinkingStages = ["Thinking…", "Searching your materials…", "Generating grounded response…"];

function TutorTab() {
  const { projectId } = Route.useParams();
  const queryClient = useQueryClient();

  const history = useQuery({
    queryKey: ["tutor", projectId],
    queryFn: () => tutorApi.history(projectId),
  });

  const docs = useQuery({
    queryKey: ["materials", projectId],
    queryFn: () => materialsApi.list(projectId),
  });

  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [stage, setStage] = useState(0);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (history.data) setMessages(history.data);
  }, [history.data]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, pending]);

  useEffect(() => {
    if (!pending) return;
    setStage(0);
    const timer = setInterval(
      () => setStage((s) => Math.min(s + 1, thinkingStages.length - 1)),
      500,
    );
    return () => clearInterval(timer);
  }, [pending]);

  const latestSources = [...messages].reverse().find((m) => m.citations?.length)?.citations ?? [];

  async function send(text: string) {
    const question = text.trim();
    if (!question || pending) return;

    const tempUserMsg: ChatMessageData = {
      id: `u_${Date.now()}`,
      role: "user",
      content: question,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((m) => [...m, tempUserMsg]);
    setInput("");
    setPending(true);

    try {
      const answer = await tutorApi.ask(projectId, question);
      setMessages((m) => [...m, answer]);
      queryClient.invalidateQueries({ queryKey: ["tutor", projectId] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tutor request failed. Please try again.";
      toast.error(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_280px]">
      <aside className="surface-card hidden p-4 xl:block">
        <h2 className="text-sm font-semibold">Project context</h2>
        <p className="mt-1 text-xs text-muted-foreground">Documents used to ground every answer.</p>
        <ul className="mt-4 space-y-2">
          {(docs.data ?? []).map((d) => (
            <li key={d.id} className="flex items-start gap-2 rounded-lg border px-3 py-2 text-xs">
              <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0">
                <span className="block truncate font-medium">{d.name}</span>
                <span className="block text-muted-foreground">
                  {d.status === "ready" ? `${d.pages} pages indexed` : d.status}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </aside>

      <section className="surface-card flex min-h-[620px] flex-col">
        <header className="border-b px-5 py-4">
          <h2 className="text-base font-semibold">AI Tutor</h2>
          <p className="text-sm text-muted-foreground">
            Ask questions about your learning materials.
          </p>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-5">
          {history.isLoading ? (
            <>
              <Skeleton className="h-16 w-2/3 rounded-xl" />
              <Skeleton className="ml-auto h-24 w-3/4 rounded-xl" />
            </>
          ) : history.isError ? (
            <ErrorState
              description={history.error.message || "Failed to load chat history."}
              onRetry={() => history.refetch()}
            />
          ) : (
            messages.map((m) => (
              <ChatMessage key={m.id} message={m} onCite={setActiveCitation} onAsk={send} />
            ))
          )}
          {pending && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-1.5 animate-pulse rounded-full bg-primary"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </span>
              {thinkingStages[stage]}
            </p>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {quickPrompts.map((p) => (
              <button
                key={p}
                onClick={() => void send(p)}
                className="rounded-full border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {p}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
            className="flex items-end gap-2"
          >
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              rows={2}
              placeholder="Ask anything about this project…"
              className="min-h-11 resize-none"
            />
            <Button type="button" variant="outline" size="icon" aria-label="Attach file">
              <Paperclip className="size-4" />
            </Button>
            <Button type="submit" size="icon" aria-label="Send" disabled={pending}>
              <SendHorizonal className="size-4" />
            </Button>
          </form>
        </div>
      </section>

      <aside className="surface-card p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Quote className="size-4" /> Sources
        </h2>
        {latestSources.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Sources for the latest grounded answer appear here.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {latestSources.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActiveCitation(c)}
                  className="w-full rounded-lg border px-3 py-2 text-left transition-colors hover:border-primary"
                >
                  <span className="block truncate text-xs font-medium">{c.document}</span>
                  <span className="block text-xs text-muted-foreground">Page {c.page}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {activeCitation && (
          <div className="mt-4 rounded-lg bg-muted p-3">
            <p className="text-xs font-medium">
              {activeCitation.document} — Page {activeCitation.page}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              “{activeCitation.excerpt}”
            </p>
          </div>
        )}

        <div className="mt-5 rounded-lg border border-success/25 bg-success/8 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-success">
            <BadgeCheck className="size-3.5" /> Grounded AI Tutor
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Answers without supporting material are refused, not invented.
          </p>
        </div>
      </aside>
    </div>
  );
}

function ChatMessage({
  message,
  onCite,
  onAsk,
}: {
  message: ChatMessageData;
  onCite: (c: Citation) => void;
  onAsk: (q: string) => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm text-primary-foreground">
          {message.content}
          <p className="mt-1 text-[11px] opacity-70">{message.createdAt}</p>
        </div>
      </div>
    );
  }

  if (message.unsupported) {
    return (
      <div className="max-w-[92%] rounded-2xl border border-warning/30 bg-warning/8 p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-warning">
          <ShieldAlert className="size-4" /> Not covered by your materials
        </p>
        <p className="mt-2 text-sm text-foreground">{message.content}</p>
        {!!message.suggestions?.length && (
          <>
            <p className="mt-3 text-xs font-medium text-muted-foreground">Try asking about:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {message.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => onAsk(s)}
                  className="rounded-full border bg-card px-3 py-1 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[92%] space-y-3">
      {message.grounded && (
        <p className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-1 text-xs font-medium text-success">
          <BadgeCheck className="size-3.5" /> Answer grounded in your materials
        </p>
      )}
      <div className="whitespace-pre-line text-sm leading-relaxed">{message.content}</div>
      {!!message.citations?.length && (
        <div>
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Info className="size-3.5" /> Sources
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {message.citations.map((c) => (
              <button
                key={c.id}
                onClick={() => onCite(c)}
                className={cn(
                  "rounded-lg border bg-card px-3 py-2 text-left text-xs transition-colors hover:border-primary",
                )}
              >
                <span className="block font-medium">{c.document}</span>
                <span className="block text-muted-foreground">Page {c.page}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">{message.createdAt}</p>
    </div>
  );
}
