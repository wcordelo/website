import { CURRENT_ROLE, RESUME_DATA } from '../data/resume';
import { Chrome } from '../layout/Chrome';
import { PageHelmet } from '../seo/PageHelmet';

export function AboutPage() {
  return (
    <>
      <PageHelmet
        title="About · William Lopez-Cordero"
        description={RESUME_DATA.hero.subtitle}
        path="/about"
      />
      <Chrome>
        <section className="page-intro container">
          <div className="page-intro-inner">
            <div>
              <div className="page-label">/ About · 03</div>
              <h1 className="page-title">
                About me
              </h1>
            </div>
            <p className="page-intro-desc">
              {RESUME_DATA.hero.subtitle}
            </p>
          </div>
        </section>

        <section className="about-bio-section container" data-reveal>
          <div className="about-bio">
            <div className="about-bio-label">01 / Bio</div>
            <div className="about-bio-prose">
              <p>
                I lead AI enablement and IT at Handl Health. I work with Operations, Customer Success, Sales,
                Marketing, and Legal on AI adoption, provide ongoing employee training, and run IT using AI workflows.
              </p>
              <p>
                I administer Claude Enterprise and its connectors, pilot AI tools, and manage AI usage and
                data-handling policies. My IT work covers Google Workspace, identity and access, SSO,
                onboarding and offboarding, JAMF Pro and Protect, SaaS vendors and licenses, and endpoint support.
              </p>
              <p>
                I also research agentic engineering methods to develop data science techniques for product data
                integrity. My AI adoption work delivers 2× business value relative to AI spend.
              </p>
              <p>
                From July 2023 to May 2026, I was founding engineer at <em>Bello</em>. I built a creator platform
                serving 60K+ users and an onchain protocol that generated $2M+ in revenue and distributed $1M+ in
                incentives. At <em>Elphi</em>, I co-founded a mortgage platform that reduced loan origination time
                by 30%+. I also built automated AI podcast workflows for <em>NBN (Neural Broadcast Network)</em>.
              </p>
              <p>
                My earlier work includes spacecraft sequencing software at <em>NASA JPL</em>, software at{' '}
                <em>Google</em>, GIF comments for <em>Facebook</em> News Feed, REXIS flight hardware testing at{' '}
                <em>MIT&apos;s Space Systems Lab</em>, and thermodynamic and structural analysis at{' '}
                <em>Lockheed Martin&apos;s Skunk Works</em>. I earned my aerospace engineering degree at MIT in 2019.
              </p>
            </div>
          </div>

          <div className="about-facts">
            <div className="about-fact">
              <div className="about-fact-k">Based in</div>
              <div className="about-fact-v">Los Angeles · Remote</div>
            </div>
            <div className="about-fact">
              <div className="about-fact-k">Education</div>
              <div className="about-fact-v">BS Aerospace, MIT &apos;19</div>
            </div>
            <div className="about-fact">
              <div className="about-fact-k">Current role</div>
              <div className="about-fact-v">{CURRENT_ROLE.role} · {CURRENT_ROLE.org}</div>
            </div>
            <div className="about-fact">
              <div className="about-fact-k">Availability</div>
              <div className="about-fact-v">{RESUME_DATA.identity.availability}</div>
            </div>
          </div>
        </section>

        <section className="skills-section container">
          <div className="section-head">
            <span className="section-idx">02</span>
            <h2 className="section-kicker">Tools and methods</h2>
          </div>
          <div className="skills-grid">
            {Object.entries(RESUME_DATA.skills).map(([group, items]) => (
              <div className="skill-group" key={group}>
                <div className="skill-group-label">{group}</div>
                <div className="skill-group-items">
                  {items.map((i) => (
                    <span className="skill-item" key={i}>
                      {i}
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
