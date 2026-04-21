/* ============================================
   ABOUT PAGE
   ============================================ */

function AboutPage() {
  return (
    <Chrome>
      <section className="page-intro container">
        <div className="page-intro-inner">
          <div>
            <div className="page-label">/ About · 03</div>
            <h1 className="page-title">Full<br />story.</h1>
          </div>
          <p className="page-intro-desc">
            Engineer. Founder. MIT aerospace '19 who ended up shipping web3 protocols.
            Here's how that happened, what I care about, and what I'm good at.
          </p>
        </div>
      </section>

      <section className="about-bio-section container" data-reveal>
        <div className="about-bio">
          <div className="about-bio-label">01 / Bio</div>
          <div className="about-bio-prose">
            <p>I build systems that have to work when it counts—user scale, serious capital at risk, or missions where failure isn't recoverable.</p>
            <p>I started at <em>NASA JPL</em> in 2014, writing sequencing software for the Europa Mission. Then <em>Google</em>, then <em>Facebook</em>, where I shipped GIF comments to News Feed. Then, <em>MIT's Space Systems Lab</em>, where I validated flight hardware for OSIRIS-REx as part of NASA's successful mission to asteroid Bennu.</p>
            <p>After an aerospace stint at <em>Lockheed's Skunk Works</em>, I pivoted to founding. Five years co-running <em>Elphi</em>, a mortgage platform that reduced loan origination time by 30%+. Three years now as a founding engineer at <em>Bello</em>, where I've shipped a web3 creator protocol driving $2M+ in revenue and distributed $1M+ in onchain incentives. More recently at <em>NBN (Neural Broadcast Network)</em>, I've shipped <em>AI Podcast</em> and other AI product work.</p>
            <p>My throughline is the same in all of them: take a hard, ambiguous problem — thermodynamics, or ingestion pipelines, or multi-chain incentive design — and turn it into a system that just works.</p>
          </div>
        </div>

        <div className="about-facts">
          <div className="about-fact">
            <div className="about-fact-k">Based in</div>
            <div className="about-fact-v">Los Angeles · Remote</div>
          </div>
          <div className="about-fact">
            <div className="about-fact-k">Education</div>
            <div className="about-fact-v">BS Aerospace, MIT '19</div>
          </div>
          <div className="about-fact">
            <div className="about-fact-k">Currently</div>
            <div className="about-fact-v">Founding Engineer @ Bello</div>
          </div>
        </div>
      </section>

      <section className="skills-section container">
        <div className="section-head">
          <span className="section-idx">02</span>
          <h3 className="section-kicker">Stack · tools · methods.</h3>
        </div>
        <div className="skills-grid">
          {Object.entries(RESUME_DATA.skills).map(([group, items]) =>
          <div className="skill-group" key={group}>
              <div className="skill-group-label">{group}</div>
              <div className="skill-group-items">
                {items.map((i) => <span className="skill-item" key={i}>{i}</span>)}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="writing-section container">
        <div className="section-head">
          <span className="section-idx">03</span>
          <h3 className="section-kicker">Writing & notes.</h3>
        </div>
        <div className="writing-list">
          {RESUME_DATA.writing.map((w, i) =>
          <a href="#" key={i} className="writing-row" data-reveal style={{ transitionDelay: `${i * 50}ms` }}>
              <div className="writing-row-date">{w.date}</div>
              <div className="writing-row-title">{w.title}</div>
              <div className="writing-row-meta">{w.tag} · {w.read}</div>
              <div className="writing-row-arrow">→</div>
            </a>
          )}
        </div>
      </section>
    </Chrome>);

}

ReactDOM.createRoot(document.getElementById('root')).render(<AboutPage />);
