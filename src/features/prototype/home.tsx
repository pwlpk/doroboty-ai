import { Link } from "react-router";
import { buttonVariants } from "@/components/ui/button";
import { JobCard } from "@/features/jobs/job-card";
import { usePrototype } from "./store";
import { publishedJobs } from "./model";
import { cn } from "@/lib/utils";
import { siteCategories } from "@/features/public/site-content";

import peopleArt from "../../../docs/design-system/agent-kit/assets/people.png";

const categories = siteCategories;

export default function HomePage() {
  const { state } = usePrototype();
  const latestJobs = publishedJobs(state).slice(0, 4);

  return (
    <div className="e-sheet">
      <section className="e-hero">
        <div className="e-hero-text">
          <span className="e-chip">Dobra robota. Z AI w środku.</span>
          <h1>Praca dla ludzi, którzy dowożą z AI.</h1>
          <p className="e-lead">
            Wyselekcjonowane role, w których AI jest częścią odpowiedzialności, decyzji i wyniku
            pracy — nie dopiskiem w employer brandingu.
          </p>
          <div className="e-actions">
            <Link to="/oferty" className={buttonVariants()}>
              Zobacz oferty
            </Link>
            <Link to="/metodologia" className={cn(buttonVariants({ variant: "secondary" }))}>
              Jak wybieramy role
            </Link>
          </div>
        </div>
        <div className="e-art-cell">
          <img src={peopleArt} alt="Dwie osoby pracujące razem z laptopem" />
        </div>
      </section>

      <section className="e-section-head">
        <span className="e-chip">Trzy sposoby pracy z AI</span>
        <h2>Build. Apply. Lead.</h2>
      </section>
      <div className="e-cats">
        {categories.map((category, index) => (
          <Link
            key={category.slug}
            className="e-cat"
            data-cat={category.slug}
            to={`/oferty?category=${category.slug}`}
          >
            <h3>{category.label}</h3>
            <p>{category.description}</p>
            <span className="e-cat-foot">
              <span>0{index + 1} · Przeglądaj role</span>
              <span aria-hidden="true">→</span>
            </span>
          </Link>
        ))}
      </div>

      <section className="e-section-head e-section-head-row">
        <div>
          <span className="e-chip">Aktualne role</span>
          <h2>Najnowsze oferty</h2>
        </div>
        <Link className={buttonVariants({ variant: "secondary" })} to="/oferty">
          Wszystkie oferty
        </Link>
      </section>
      <div className="pp-job-list e-joblist">
        {latestJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
