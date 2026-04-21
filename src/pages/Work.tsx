import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { RESUME_DATA } from '../data/resume';
import type { CaseStudy, DisciplineKey, JobExperience } from '../data/resume.types';
import { Chrome } from '../layout/Chrome';
import { PageHelmet } from '../seo/PageHelmet';

function CaseStudyCard({ s, highlight }: { s: CaseStudy; highlight?: boolean }) {
  return (
    <div
      className="case-card"
      id={`case-${s.id}`}
      data-reveal
      data-filter-highlight={highlight ? '' : undefined}
    >
      <div className="case-card-head">
        <span>{s.context}</span>
        <span className="case-card-year">{s.year}</span>
      </div>
      <h3 className="case-card-title">{s.title}</h3>
      <p className="case-card-summary">{s.summary}</p>
      <div className="case-card-role">Role · {s.role}</div>
      <div className="case-card-metrics">
        {s.metrics.map(([v, l], i) => (
          <div key={i}>
            <div className="case-card-metric-v">{v}</div>
            <div className="case-card-metric-l">{l}</div>
          </div>
        ))}
      </div>
      <div className="case-card-tags">
        {s.tags.map((t) => (
          <span className="tag" key={t}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function TimelineEntry({ e }: { e: JobExperience }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className={`timeline-period ${e.status === 'current' ? 'current' : ''}`}>
        {e.period.includes('—') ? (
          <>
            {e.period.split('—')[0].trim()} —<br />
            {e.period.split('—')[1].trim()}
          </>
        ) : (
          e.period
        )}
      </div>
      <div
        className="timeline-entry"
        data-expanded={open ? '' : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            setOpen((o) => !o);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="timeline-role">
          <span className="timeline-role-title">{e.role}</span>
          <span className="timeline-role-org">{e.org}</span>
        </div>
        <div className="timeline-location">{e.location}</div>
        <p className="timeline-blurb">{e.blurb}</p>
        <ul className="timeline-highlights">
          {e.highlights.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
        <div className="timeline-stack">
          {e.stack.map((s) => (
            <span className="tag" key={s}>
              {s}
            </span>
          ))}
        </div>
        <div className="timeline-toggle">
          <span className="timeline-toggle-icon">+</span>
          <span>{open ? 'Collapse' : 'Highlights'}</span>
        </div>
      </div>
    </>
  );
}

export function WorkPage() {
  const location = useLocation();
  const [filter, setFilter] = useState<DisciplineKey | 'all'>('all');
  const casesSectionRef = useRef<HTMLElement>(null);
  const disciplines: { key: DisciplineKey | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    ...RESUME_DATA.disciplines.map((d) => ({ key: d.key, label: d.label })),
  ];

  const filteredCaseStudies =
    filter === 'all'
      ? RESUME_DATA.caseStudies
      : RESUME_DATA.caseStudies.filter((s) => s.disciplines.includes(filter));

  const filteredExp = RESUME_DATA.experience.filter(
    (e) => filter === 'all' || e.discipline.includes(filter),
  );

  useEffect(() => {
    if (filter === 'all') return;
    casesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [filter]);

  useEffect(() => {
    if (!location.hash.startsWith('#case-')) return;
    const id = location.hash.slice(1);
    const el = document.getElementById(id);
    if (!el) return;
    const frame = window.requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.hash]);

  return (
    <>
      <PageHelmet
        title="Work · William Lopez-Cordero"
        description="Case studies and experience — Google, Facebook, NASA JPL, Skunk Works, and startups Elphi and Bello."
        path="/work"
      />
      <Chrome>
        <section className="page-intro container">
          <div className="page-intro-inner">
            <div>
              <div className="page-label">/ Work · 02</div>
              <h1 className="page-title">
                The
                <br />
                outcomes.
              </h1>
            </div>
            <p className="page-intro-desc">
              10+ years shipping systems at Google, Facebook, NASA JPL, and Skunk Works — through to startups Elphi and
              Bello. Case studies first, then the full timeline.
            </p>
          </div>
        </section>

        <section ref={casesSectionRef} className="cases-full container" id="case-studies">
          <div className="section-head work-section-head">
            <span className="section-idx">A.</span>
            <h3 className="section-kicker">Case studies.</h3>
            {filter !== 'all' && (
              <span className="work-filter-showing">
                Showing: {disciplines.find((d) => d.key === filter)?.label}
              </span>
            )}
          </div>
          <div className="cases-full-grid">
            {filteredCaseStudies.map((s) => (
              <CaseStudyCard
                s={s}
                key={s.id}
                highlight={filter !== 'all' && s.disciplines.includes(filter)}
              />
            ))}
          </div>
          {filteredCaseStudies.length === 0 && (
            <p className="page-intro-desc work-empty-cases">
              No case studies tagged for this discipline — try another filter or All.
            </p>
          )}
        </section>

        <section className="timeline-section container">
          <div className="section-head work-section-head">
            <span className="section-idx">B.</span>
            <h3 className="section-kicker">Experience timeline.</h3>
          </div>
          <div className="filter-bar work-filter-bar">
            <span className="filter-label">Filter:</span>
            {disciplines.map((d) => (
              <button
                key={d.key}
                type="button"
                className="tweak-btn"
                data-active={filter === d.key ? '' : undefined}
                onClick={() => {
                  setFilter(d.key);
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="timeline">
            {filteredExp.map((e) => (
              <TimelineEntry e={e} key={e.id} />
            ))}
          </div>
        </section>

        <section className="projects-section container">
          <div className="section-head work-section-head">
            <span className="section-idx">C.</span>
            <h3 className="section-kicker">Projects & side work.</h3>
          </div>
          <div className="projects-grid">
            {RESUME_DATA.projects.map((p, i) => (
              <div
                className="project-card"
                key={p.title}
                data-reveal
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <span className="project-kind">{p.kind}</span>
                <h4 className="project-title">{p.title}</h4>
                <p className="project-summary">{p.summary}</p>
                <div className="project-tags">
                  {p.tags.map((t) => (
                    <span className="tag" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </Chrome>
    </>
  );
}
