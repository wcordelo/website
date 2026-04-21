/* ============================================
   WORK PAGE
   ============================================ */

function CaseStudyCard({ s }) {
  return (
    <div className="case-card" data-reveal>
      <div className="case-card-head">
        <span>{s.context}</span>
        <span className="case-card-year">{s.year}</span>
      </div>
      <h3 className="case-card-title">{s.title}</h3>
      <p className="case-card-summary">{s.summary}</p>
      <div className="case-card-role">Role · {s.role}</div>
      <div className="case-card-metrics">
        {s.metrics.map(([v, l], i) =>
        <div key={i}>
            <div className="case-card-metric-v">{v}</div>
            <div className="case-card-metric-l">{l}</div>
          </div>
        )}
      </div>
      <div className="case-card-tags">
        {s.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
      </div>
    </div>);

}

function TimelineEntry({ e }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className={`timeline-period ${e.status === 'current' ? 'current' : ''}`} style={{ padding: "24px 24px 24px 40px" }}>
        {e.period.includes('—') ?
        <>
            {e.period.split('—')[0].trim()} —<br />
            {e.period.split('—')[1].trim()}
          </> :
        e.period}
      </div>
      <div className="timeline-entry" data-expanded={open ? '' : undefined} onClick={() => setOpen((o) => !o)}>
        <div className="timeline-role">
          <span className="timeline-role-title">{e.role}</span>
          <span className="timeline-role-org" style={{ margin: "0px 40px 0px 0px" }}>{e.org}</span>
        </div>
        <div className="timeline-location">{e.location}</div>
        <p className="timeline-blurb" style={{ margin: "0px 40px 16px 0px" }}>{e.blurb}</p>
        <ul className="timeline-highlights">
          {e.highlights.map((h, i) => <li key={i}>{h}</li>)}
        </ul>
        <div className="timeline-stack">
          {e.stack.map((s) => <span className="tag" key={s}>{s}</span>)}
        </div>
        <div className="timeline-toggle">
          <span className="timeline-toggle-icon">+</span>
          <span>{open ? 'Collapse' : 'Highlights'}</span>
        </div>
      </div>
    </>);

}

function WorkPage() {
  const [filter, setFilter] = useState('all');
  const disciplines = [
  { key: 'all', label: 'All' },
  ...RESUME_DATA.disciplines.map((d) => ({ key: d.key, label: d.label }))];


  const filteredExp = RESUME_DATA.experience.filter((e) =>
  filter === 'all' || e.discipline.includes(filter)
  );

  return (
    <Chrome>
      <section className="page-intro container">
        <div className="page-intro-inner">
          <div>
            <div className="page-label" style={{ margin: "0px 0px 24px 40px" }}>/ Work · 02</div>
            <h1 className="page-title" style={{ margin: "0px 0px 0px 40px" }}>The<br />outcomes.</h1>
          </div>
          <p className="page-intro-desc" style={{ padding: "0px 40px 8px 0px" }}>
            10+ years shipping systems at Google, Facebook, NASA JPL, and Skunk Works — through to startups Elphi and
            Bello. Case studies first, then the full timeline.
          </p>
        </div>
      </section>

      <section className="cases-full container">
        <div className="section-head" style={{ padding: "40px 0px 24px 40px" }}>
          <span className="section-idx">A.</span>
          <h3 className="section-kicker">Case studies.</h3>
        </div>
        <div className="cases-full-grid">
          {RESUME_DATA.caseStudies.map((s) => <CaseStudyCard s={s} key={s.id} />)}
        </div>
      </section>

      <section className="timeline-section container">
        <div className="section-head" style={{ padding: "40px 0px 24px 40px" }}>
          <span className="section-idx">B.</span>
          <h3 className="section-kicker">Experience timeline.</h3>
        </div>
        <div className="filter-bar" style={{ padding: "24px 0px 24px 40px" }}>
          <span className="filter-label">Filter:</span>
          {disciplines.map((d) =>
          <button
            key={d.key}
            className="tweak-btn"
            data-active={filter === d.key ? '' : undefined}
            onClick={() => setFilter(d.key)}>
            {d.label}</button>
          )}
        </div>
        <div className="timeline">
          {filteredExp.map((e) => <TimelineEntry e={e} key={e.id} />)}
        </div>
      </section>

      <section className="projects-section container">
        <div className="section-head" style={{ padding: "40px 0px 24px 40px" }}>
          <span className="section-idx">C.</span>
          <h3 className="section-kicker">Projects & side work.</h3>
        </div>
        <div className="projects-grid">
          {RESUME_DATA.projects.map((p, i) =>
          <div className="project-card" key={i} data-reveal style={{ transitionDelay: `${i * 60}ms`, width: "300px", borderWidth: "0px 1px 1px 0px" }}>
              <span className="project-kind">{p.kind}</span>
              <h4 className="project-title">{p.title}</h4>
              <p className="project-summary">{p.summary}</p>
              <div className="project-tags">
                {p.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
              </div>
            </div>
          )}
        </div>
      </section>
    </Chrome>);

}

ReactDOM.createRoot(document.getElementById('root')).render(<WorkPage />);