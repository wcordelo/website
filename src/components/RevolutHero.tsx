import { Link } from 'react-router-dom';
import { RESUME_DATA } from '../data/resume';

export function RevolutHero() {
  const { identity, hero, disciplines, metrics } = RESUME_DATA;
  const [givenName, ...familyName] = identity.name.split(' ');

  return (
    <section className="revolut-hero" aria-labelledby="revolut-title">
      <div className="revolut-hero-meta">
        <span className="tag"><span className="status-dot" />{identity.availability}</span>
        <span>{identity.location}</span>
      </div>
      <h1 id="revolut-title" className="revolut-title">
        <span>{givenName}</span>{' '}<span>{familyName.join(' ')}</span>
      </h1>
      <p className="revolut-roles">{hero.titles.join(' · ')}</p>
      <div className="revolut-hero-grid">
        <div>
          <h2>{hero.tag}</h2>
          <p className="revolut-bio">{hero.subtitle}</p>
        </div>
        <div className="revolut-hero-actions">
          <div className="hero-ctas">
            <Link to="/work" className="btn btn-primary">View selected work <span className="arrow">→</span></Link>
            <Link to="/contact" className="btn">Get in touch <span className="arrow">↗</span></Link>
          </div>
          <div className="revolut-disciplines">
            {disciplines.map((discipline) => <span className="tag" key={discipline.key}>{discipline.label}</span>)}
          </div>
        </div>
      </div>
      <div className="revolut-stage">
        <svg className="revolut-rings" viewBox="0 0 900 900" aria-hidden="true">
          {[160, 260, 360, 440].map((radius) => <circle key={radius} cx="450" cy="450" r={radius} />)}
          <circle className="revolut-orbit-dot" cx="710" cy="450" r="5" />
          <circle className="revolut-orbit-dot" cx="450" cy="90" r="4" />
        </svg>
        <div className="revolut-stage-label"><span>Selected outcomes</span><span>{identity.education}</span></div>
        <div className="revolut-outcomes">
          {metrics.slice(0, 4).map((metric) => (
            <div className="revolut-outcome" key={metric.l}>
              <span className="revolut-outcome-value">{metric.v}</span>
              <span>{metric.l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
