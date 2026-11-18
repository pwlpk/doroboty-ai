import { Link } from "react-router";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrototype } from "@/features/prototype/store";
import type { JobWithCompany } from "./types";
import { categoryLabels, contractLabels, remoteLabels, seniorityLabels } from "./presentation";
import { CompanyLogo } from "./company-logo";

/** Direction E job card: category mosaic, chip, full title, meta, footer cells. */
export function JobCard({ job, saved }: { job: JobWithCompany; saved?: boolean }) {
  const { run } = usePrototype();
  const amount = [job.salaryMin, job.salaryMax]
    .filter((x): x is number => x !== undefined)
    .map((x) => new Intl.NumberFormat("pl-PL").format(x))
    .join("–");
  const note = `${contractLabels[job.contract]} ${
    job.salaryKind === "net" ? "netto" + (job.contract === "b2b" ? " + VAT" : "") : "brutto"
  } / ${job.salaryPeriod === "year" ? "rok" : "mies."}`;
  return (
    <article className="pp-job-card e-card" data-cat={job.category}>
      <div className="e-mosaic" data-cat={job.category}>
        <span className="e-mosaic-logo">
          <CompanyLogo company={job.company} />
        </span>
      </div>
      <div className="e-card-body">
        <div className="e-card-top">
          <span className="e-chip" data-cat={job.category}>
            {categoryLabels[job.category]}
          </span>
          {saved !== undefined && (
            <Button
              className="pp-save-button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Zapisz ofertę: ${job.title}`}
              aria-pressed={saved}
              onClick={() => run({ type: "toggle_saved", jobId: job.id })}
            >
              <Bookmark className="pp-icon" />
            </Button>
          )}
        </div>
        <h3 className="pp-job-title">
          <Link to={`/oferty/${job.slug}`}>{job.title}</Link>
        </h3>
        <p className="e-card-meta">
          <Link to={`/firmy/${job.company.slug}`}>{job.company.name}</Link> ·{" "}
          {job.locations.join(" / ")} · {seniorityLabels[job.seniority]}
        </p>
      </div>
      <div className="e-card-foot">
        <span>
          {amount ? (
            <>
              <b>
                {amount} {job.salaryCurrency === "EUR" ? "EUR" : "zł"}
              </b>
              <small>{note}</small>
            </>
          ) : (
            <>
              <b>Pensja do ustalenia</b>
              <small>brak widełek w ogłoszeniu</small>
            </>
          )}
        </span>
        <span>{remoteLabels[job.remoteStatus]}</span>
        <Link
          className="e-card-arrow"
          to={`/oferty/${job.slug}`}
          aria-label={`Zobacz rolę: ${job.title}`}
        >
          →
        </Link>
      </div>
    </article>
  );
}
