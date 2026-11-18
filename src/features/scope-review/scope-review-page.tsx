import { useRef, useState, type ReactNode } from "react";
import { useParams, useSearchParams } from "react-router";
import { BackLink } from "@/components/back-link";
import { Button } from "@/components/ui/button";
import { MatchScore } from "@/features/prototype/match-score";
import { currentPerson } from "@/features/prototype/model";
import { NotFound, PageTitle } from "@/features/prototype/shell";
import { usePrototype } from "@/features/prototype/store";
import { seniorityLabels } from "@/features/jobs/presentation";
import {
  INVITE_LIMIT,
  parseVariant,
  scenario,
  scoreSelection,
  variantLabels,
  variants,
  type ScopeApplication,
  type SummaryItem,
  type Variant,
} from "./scenario";

type Log = { originals: Set<string>; quotes: number };

/** Highlights one verbatim quote inside a source text. */
function Marked({ text, quote }: { text: string; quote: string | null }) {
  const index = quote ? text.indexOf(quote) : -1;
  if (!quote || index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="scope-mark">{quote}</mark>
      {text.slice(index + quote.length)}
    </>
  );
}

function SummaryPart({
  title,
  items,
  onQuote,
}: {
  title: string;
  items: SummaryItem[];
  onQuote: (item: SummaryItem) => void;
}) {
  if (!items.length) return null;
  return (
    <div className="scope-summary-part">
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item.text}>
            <span>{item.text}</span>
            {item.quote ? (
              <button type="button" className="scope-quote" onClick={() => onQuote(item)}>
                „{item.quote}”<span className="sr-only"> — pokaż w oryginale</span>
              </button>
            ) : (
              <span className="scope-no-quote">Bez cytatu: kandydat tego nie opisał.</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CandidateCard({
  application,
  variant,
  invited,
  inviteDisabled,
  moderator,
  locked,
  onInvite,
  onOriginal,
  onQuote,
}: {
  application: ScopeApplication;
  variant: Variant;
  invited: boolean;
  inviteDisabled: boolean;
  moderator: boolean;
  locked: boolean;
  onInvite: () => void;
  onOriginal: () => void;
  onQuote: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mark, setMark] = useState<{ quote: string; source: "raw" | "portfolio" } | null>(null);
  const originalRef = useRef<HTMLDivElement>(null);
  const regionId = `${application.id}-original`;
  const answer = variant === "obecna" ? application.assistantAnswer : application.answerWithScope;

  function showQuote(item: SummaryItem) {
    setOpen(true);
    setMark({ quote: item.quote!, source: item.source ?? "raw" });
    onOriginal();
    onQuote();
    requestAnimationFrame(() => {
      originalRef.current?.focus({ preventScroll: true });
      originalRef.current?.scrollIntoView({ block: "center" });
    });
  }

  return (
    <article
      className="scope-card"
      data-invited={invited || undefined}
      aria-labelledby={`${application.id}-name`}
    >
      <header className="scope-card-header">
        <div>
          <h2 id={`${application.id}-name`} className="scope-card-name">
            {application.candidateName}
          </h2>
          <p className="scope-card-meta">
            {application.headline} · {seniorityLabels[application.seniority]}
          </p>
        </div>
        <div className="scope-card-facts">
          <MatchScore score={application.score} />
          {moderator && (
            <span className="scope-outcome" data-outcome={application.outcome.decision}>
              Po rozmowie:{" "}
              {application.outcome.decision === "continue" ? "kontynuujemy" : "odrzucony"} · rola{" "}
              {application.outcome.scopeClass}
            </span>
          )}
        </div>
      </header>

      {variant === "i2-i5" && (
        <section
          className="scope-summary"
          aria-label={`Podsumowanie AI: ${application.candidateName}`}
        >
          <h3>Co kandydat zrobił sam</h3>
          <p className="record-caption">
            Podsumowanie AI z odpowiedzi i portfolio. Każde zdanie ma cytat; kliknij go, by
            sprawdzić w oryginale.
          </p>
          <div className="scope-summary-grid">
            <SummaryPart title="Zrobił sam" items={application.summary.own} onQuote={showQuote} />
            <SummaryPart
              title="Zrobili inni"
              items={application.summary.others}
              onQuote={showQuote}
            />
            <SummaryPart
              title="Czego nie wiadomo"
              items={application.summary.unknown}
              onQuote={showQuote}
            />
          </div>
        </section>
      )}

      <section className="scope-answer">
        <h3>Odpowiedź kandydata</h3>
        <p className="record-caption">
          {variant === "obecna"
            ? "Wersja poprawiona przez asystenta."
            : "Wersja poprawiona przez asystenta, z zachowanymi zdaniami kandydata o zakresie."}
        </p>
        <p className="scope-answer-text">{answer}</p>
      </section>

      <div className="scope-card-actions">
        {variant !== "obecna" && (
          <Button
            variant="outline"
            size="sm"
            aria-expanded={open}
            aria-controls={regionId}
            onClick={() => {
              if (!open) onOriginal();
              setOpen(!open);
              if (open) setMark(null);
            }}
          >
            {open ? "Ukryj oryginał" : "Pokaż oryginał"}
          </Button>
        )}
        <Button
          variant={invited ? "default" : "outline"}
          size="sm"
          aria-pressed={invited}
          disabled={locked || (!invited && inviteDisabled)}
          onClick={onInvite}
        >
          {invited ? "Wybrano do rozmowy" : "Zaproś na rozmowę"}
        </Button>
      </div>

      {variant !== "obecna" && open && (
        <div
          id={regionId}
          ref={originalRef}
          tabIndex={-1}
          className="scope-original"
          role="region"
          aria-label={`Oryginał: ${application.candidateName}`}
        >
          <h4>Oryginalna odpowiedź, przed poprawkami asystenta</h4>
          <p>
            <Marked
              text={application.originalAnswer}
              quote={mark?.source === "raw" ? mark.quote : null}
            />
          </p>
          <h4>Portfolio</h4>
          <p>
            <Marked
              text={application.portfolio}
              quote={mark?.source === "portfolio" ? mark.quote : null}
            />
          </p>
        </div>
      )}
    </article>
  );
}

function ModeratorPanel({
  variant,
  setVariant,
  selected,
  log,
  confirmed,
  onReset,
}: {
  variant: Variant;
  setVariant: (v: Variant) => void;
  selected: string[];
  log: Log;
  confirmed: boolean;
  onReset: () => void;
}) {
  const { hits, total } = scoreSelection(selected);
  return (
    <aside className="scope-moderator" aria-label="Panel moderatora">
      <h2>Panel moderatora</h2>
      <p className="record-caption">
        Widoczny tylko z parametrem ?moderator=1. Uczestnik testu go nie widzi.
      </p>
      <div className="scope-variant" role="group" aria-label="Wersja listy">
        {variants.map((v) => (
          <Button
            key={v}
            size="sm"
            variant={v === variant ? "default" : "outline"}
            aria-pressed={v === variant}
            onClick={() => setVariant(v)}
          >
            {variantLabels[v]}
          </Button>
        ))}
      </div>
      <dl className="scope-stats">
        <div>
          <dt>Trafne wybory</dt>
          <dd>
            {hits} z {total}
            {confirmed ? " (zatwierdzone)" : ""}
          </dd>
        </div>
        <div>
          <dt>Otwarte oryginały</dt>
          <dd>{log.originals.size} z 6</dd>
        </div>
        <div>
          <dt>Kliknięte cytaty</dt>
          <dd>{log.quotes}</dd>
        </div>
      </dl>
      <Button variant="outline" size="sm" onClick={onReset}>
        Wyczyść sesję
      </Button>
    </aside>
  );
}

export function ScopeReviewPage() {
  const { state } = usePrototype();
  const person = currentPerson(state)!;
  const { jobId } = useParams();
  const [params, setParams] = useSearchParams();
  const job = state.jobs.find((x) => x.id === scenario.jobId);
  const variant = parseVariant(params.get("wersja"));
  const moderator = params.get("moderator") === "1";
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [log, setLog] = useState<Log>({ originals: new Set(), quotes: 0 });
  const [session, setSession] = useState(0);

  if (jobId !== scenario.jobId || !job || job.companyId !== person.companyId) return <NotFound />;

  const names = (ids: string[]) =>
    ids.map((id) => scenario.applications.find((a) => a.id === id)!.candidateName).join(" i ");
  const reset = () => {
    setSelected([]);
    setConfirmed(false);
    setLog({ originals: new Set(), quotes: 0 });
    setSession((n) => n + 1);
  };
  let status: ReactNode = `Wybrano ${selected.length} z ${INVITE_LIMIT}.`;
  if (confirmed) status = `Zapisano wybór: ${names(selected)}.`;

  const taskBar = (live: boolean) => (
    <div className="scope-task" aria-live={live ? "polite" : undefined}>
      <p>
        <strong>{status}</strong>
        {confirmed && " W tym scenariuszu zaproszenia nie są wysyłane do kandydatów."}
      </p>
      {confirmed ? (
        <Button variant="outline" onClick={() => setConfirmed(false)}>
          Zmień wybór
        </Button>
      ) : (
        <Button disabled={selected.length !== INVITE_LIMIT} onClick={() => setConfirmed(true)}>
          Zatwierdź wybór
        </Button>
      )}
    </div>
  );

  return (
    <div className="scope-page">
      <BackLink to="/app/kandydaci">Wróć do kandydatów</BackLink>
      <PageTitle>Kandydaci: {job.title}</PageTitle>
      <p className="scope-lead">
        6 aplikacji na ogłoszenie. Wybierz {INVITE_LIMIT} osoby, które zaprosisz na pierwszą
        rozmowę.
      </p>

      {moderator && (
        <ModeratorPanel
          variant={variant}
          setVariant={(v) => {
            const next = new URLSearchParams(params);
            next.set("wersja", v);
            setParams(next, { replace: true });
            reset();
          }}
          selected={selected}
          log={log}
          confirmed={confirmed}
          onReset={reset}
        />
      )}

      {taskBar(true)}

      <div className="scope-list" key={`${variant}-${session}`}>
        {scenario.applications.map((a) => (
          <CandidateCard
            key={a.id}
            application={a}
            variant={variant}
            moderator={moderator}
            invited={selected.includes(a.id)}
            inviteDisabled={selected.length >= INVITE_LIMIT}
            locked={confirmed}
            onInvite={() =>
              setSelected((s) => (s.includes(a.id) ? s.filter((x) => x !== a.id) : [...s, a.id]))
            }
            onOriginal={() => setLog((l) => ({ ...l, originals: new Set(l.originals).add(a.id) }))}
            onQuote={() => setLog((l) => ({ ...l, quotes: l.quotes + 1 }))}
          />
        ))}
      </div>
      {taskBar(false)}
    </div>
  );
}
