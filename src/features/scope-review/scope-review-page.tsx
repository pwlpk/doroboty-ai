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
  ownWords,
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
              <span className="scope-no-quote">Bez cytatu: kandydat tego nie opisał</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** I2, exposed: the candidate's preserved scope sentences, outside the assistant text. */
function OwnWords({ application }: { application: ScopeApplication }) {
  return (
    <section className="scope-own" aria-labelledby={`${application.id}-own`}>
      <span className="scope-chip">Słowa kandydata, bez poprawek asystenta</span>
      <h3 id={`${application.id}-own`}>Zakres własnej pracy</h3>
      <blockquote className="scope-own-text">„{ownWords(application)}”</blockquote>
    </section>
  );
}

/** O1.3: one place to compare the scope sentences before opening the cards. */
function ScopeOverview({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <section className="scope-overview" aria-labelledby="scope-overview-title">
      <div className="scope-overview-head">
        <h2 id="scope-overview-title">Kto co zrobił sam</h2>
        <p className="scope-caption">
          Zdania kandydatów o własnym zakresie, w kolejności aplikacji. Kliknij imię, by przejść do
          aplikacji.
        </p>
      </div>
      <ol className="scope-overview-list">
        {scenario.applications.map((a) => (
          <li key={a.id}>
            <button type="button" className="scope-overview-name" onClick={() => onOpen(a.id)}>
              {a.candidateName}
            </button>
            <MatchScore score={a.score} />
            <p>„{ownWords(a)}”</p>
          </li>
        ))}
      </ol>
    </section>
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
    // Wait for the original region to render and lay out before moving focus.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        originalRef.current?.focus({ preventScroll: true });
        originalRef.current?.scrollIntoView({ block: "nearest" });
      }),
    );
  }

  return (
    <article
      id={application.id}
      tabIndex={-1}
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

      {variant !== "obecna" && <OwnWords application={application} />}

      {variant === "i2-i5" && (
        <section
          className="scope-summary"
          aria-label={`Podsumowanie AI: ${application.candidateName}`}
        >
          <div className="scope-summary-head">
            <span className="scope-chip scope-chip-ai">Podsumowanie AI</span>
            <h3>Co kandydat zrobił sam</h3>
            <p className="scope-caption">
              Z odpowiedzi i portfolio. Każde zdanie ma cytat; kliknij go, by sprawdzić w oryginale.
            </p>
          </div>
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
          <div className="scope-followups">
            <h4>O co dopytać na rozmowie</h4>
            <ul>
              {application.followUps.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="scope-answer">
        <span className="scope-chip">Odpowiedź kandydata</span>
        <p className="scope-caption">
          {variant === "obecna"
            ? "Wersja poprawiona przez asystenta."
            : "Wersja poprawiona przez asystenta. Zachowane zdania kandydata o zakresie są podkreślone."}
        </p>
        <p className="scope-answer-text">
          {variant === "obecna" ? answer : <Marked text={answer} quote={ownWords(application)} />}
        </p>
      </section>

      <div className="scope-card-actions">
        {variant !== "obecna" && (
          <Button
            variant="secondary"
            className="scope-btn scope-btn-alt"
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
          variant="default"
          className={invited ? "scope-btn scope-btn-on" : "scope-btn"}
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
          <span className="scope-chip">Oryginał, przed poprawkami asystenta</span>
          <p>
            <Marked
              text={application.originalAnswer}
              quote={mark?.source === "raw" ? mark.quote : null}
            />
          </p>
          <span className="scope-chip">Portfolio</span>
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
      <span className="scope-chip">Panel moderatora</span>
      <p className="scope-caption">
        Widoczny tylko z parametrem ?moderator=1. Uczestnik testu go nie widzi.
      </p>
      <div className="scope-variant" role="group" aria-label="Wersja listy">
        {variants.map((v) => (
          <Button
            key={v}
            variant="secondary"
            className={v === variant ? "scope-btn scope-btn-on" : "scope-btn scope-btn-alt"}
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
      <Button variant="secondary" className="scope-btn scope-btn-alt" onClick={onReset}>
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

  const company = state.companies.find((x) => x.id === job.companyId);
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
        <Button
          variant="secondary"
          className="scope-btn scope-btn-alt"
          onClick={() => setConfirmed(false)}
        >
          Zmień wybór
        </Button>
      ) : (
        <Button
          className="scope-btn"
          disabled={selected.length !== INVITE_LIMIT}
          onClick={() => setConfirmed(true)}
        >
          Zatwierdź wybór
        </Button>
      )}
    </div>
  );

  return (
    <div className="scope-page">
      <BackLink to="/app/kandydaci">Wróć do kandydatów</BackLink>
      <div className="scope-head">
        <span className="scope-chip" data-cat={job.category}>
          {job.category} · {company?.name}
        </span>
        <PageTitle>Kandydaci: {job.title}</PageTitle>
        <p className="scope-lead">
          6 aplikacji na ogłoszenie. Wybierz {INVITE_LIMIT} osoby, które zaprosisz na pierwszą
          rozmowę.
        </p>
      </div>

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

      {variant !== "obecna" && (
        <ScopeOverview
          onOpen={(id) => {
            const card = document.getElementById(id);
            card?.focus({ preventScroll: true });
            card?.scrollIntoView({ block: "start" });
          }}
        />
      )}

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
