import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { askAssistant, splitAnswerLinks } from "./client";
import { MAX_QUESTION_LENGTH, questionSchema, type ChatMessage } from "./schema";

const suggestions = [
  "Jak wybieracie oferty?",
  "Czym różnią się Build, Apply i Lead?",
  "Jak zaaplikować na ofertę?",
  "Co serwis daje pracodawcom?",
] as const;

function Inline({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  return (
    <>
      {splitAnswerLinks(text).map((part, index) =>
        part.type === "link" ? (
          <a key={index} href={part.href} onClick={onNavigate}>
            {part.href.slice(1)}
          </a>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

const bullet = /^\s*[-•*]\s+/;

/** Renders plain-text answers: blank lines split paragraphs, "- " lines become a list. */
function Answer({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  return (
    <>
      {text.split(/\n{2,}/).map((block, index) => {
        const lines = block.split("\n").filter((line) => line.trim());
        if (lines.length > 0 && lines.every((line) => bullet.test(line))) {
          return (
            <ul key={index}>
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>
                  <Inline text={line.replace(bullet, "")} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index}>
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 && <br />}
                <Inline text={line} onNavigate={onNavigate} />
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
}

/** Floating site assistant for public pages. Answers come from /api/chat (Claude). */
export function SiteAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const panelId = useId();
  const hintId = useId();
  const errorId = useId();

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [messages, pending, error]);

  function close() {
    setOpen(false);
    requestAnimationFrame(() => launcher.current?.focus());
  }

  async function send(question: string) {
    const parsed = questionSchema.safeParse(question);
    if (!parsed.success) {
      setInputError(parsed.error.issues[0]?.message ?? "Wpisz pytanie.");
      input.current?.focus();
      return;
    }
    if (pending) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: parsed.data }];
    setMessages(next);
    setDraft("");
    setInputError(null);
    setError(null);
    setPending(true);
    const result = await askAssistant(next);
    setPending(false);
    if (result.ok) {
      setMessages([...next, { role: "assistant", content: result.reply }]);
    } else {
      // Keep the unanswered question out of the history so a retry resends it once.
      setMessages(messages);
      setDraft(parsed.data);
      setError(result.error);
    }
    input.current?.focus();
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void send(draft);
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send(draft);
    }
  }

  const remaining = MAX_QUESTION_LENGTH - draft.length;

  return (
    <div className="e-assistant" data-open={open || undefined}>
      {open && (
        <section
          id={panelId}
          className="e-assistant-panel"
          role="dialog"
          aria-labelledby={titleId}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              close();
            }
          }}
        >
          <div className="e-assistant-head">
            <div>
              <span className="e-chip e-assistant-chip">Asystent AI</span>
              <h2 id={titleId}>Zapytaj o DoRoboty.ai</h2>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Zamknij asystenta" onClick={close}>
              <X aria-hidden="true" />
            </Button>
          </div>

          <div className="e-assistant-log" ref={log} role="log" aria-live="polite" tabIndex={0}>
            {messages.length === 0 && !pending && (
              <div className="e-assistant-empty">
                <p>
                  Odpowiem na proste pytania o serwis: jak wybieramy role, jak aplikować, co zyskują
                  pracodawcy i jakie oferty są teraz dostępne.
                </p>
                <ul aria-label="Przykładowe pytania">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion}>
                      <button type="button" onClick={() => void send(suggestion)}>
                        {suggestion}
                        <span aria-hidden="true">→</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {messages.map((message, index) =>
              message.role === "user" ? (
                <div key={index} className="e-assistant-msg" data-role="user">
                  <span className="e-assistant-who">Ty</span>
                  <p>{message.content}</p>
                </div>
              ) : (
                <div key={index} className="e-assistant-msg" data-role="assistant">
                  <span className="e-assistant-who">Asystent</span>
                  <Answer text={message.content} onNavigate={() => setOpen(false)} />
                </div>
              ),
            )}
            {pending && (
              <div className="e-assistant-msg" data-role="assistant" aria-busy="true">
                <span className="e-assistant-who">Asystent</span>
                <p className="e-assistant-pending">Piszę odpowiedź…</p>
              </div>
            )}
            {error && (
              <div className="e-assistant-error" role="alert">
                <p>{error}</p>
                <Button variant="secondary" size="sm" onClick={() => void send(draft)}>
                  Spróbuj ponownie
                </Button>
              </div>
            )}
          </div>

          <form className="e-assistant-form" onSubmit={submit} noValidate>
            <label className="sr-only" htmlFor={`${panelId}-input`}>
              Twoje pytanie
            </label>
            <textarea
              id={`${panelId}-input`}
              ref={input}
              rows={2}
              value={draft}
              maxLength={MAX_QUESTION_LENGTH}
              placeholder="Np. czy mogę aplikować bez konta?"
              aria-describedby={inputError ? `${errorId} ${hintId}` : hintId}
              aria-invalid={inputError ? true : undefined}
              onChange={(event) => {
                setDraft(event.target.value);
                if (inputError) setInputError(null);
              }}
              onKeyDown={onInputKeyDown}
            />
            <Button type="submit" size="icon-sm" aria-label="Wyślij pytanie" disabled={pending}>
              <Send aria-hidden="true" />
            </Button>
            {inputError && (
              <p id={errorId} className="e-assistant-input-error">
                {inputError}
              </p>
            )}
            <p id={hintId} className="e-assistant-hint">
              Odpowiada model AI (Claude), może się mylić. Nie wpisuj danych osobowych.
              {remaining < 100 && <span> Zostało {remaining} znaków.</span>}
            </p>
          </form>
        </section>
      )}
      <button
        ref={launcher}
        type="button"
        className="e-assistant-launcher"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        hidden={open}
        onClick={() => setOpen(true)}
      >
        <MessageCircle aria-hidden="true" />
        <span>Zapytaj asystenta</span>
      </button>
    </div>
  );
}
