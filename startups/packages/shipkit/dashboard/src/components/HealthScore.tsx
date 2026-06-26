import "./components.css";

interface HealthScoreProps {
  score: number;
  incompatible: number;
  preflightErrors: number;
  nativeModules: number;
}

function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#eab308";
  return "#ef4444";
}

export function HealthScore({
  score,
  incompatible,
  preflightErrors,
  nativeModules,
}: HealthScoreProps) {
  return (
    <section className="health-score" style={{ "--ring-color": scoreColor(score) } as React.CSSProperties}>
      <div className="health-score__ring">{score}</div>
      <div className="health-score__label">Release Health Score</div>
      <div className="health-score__stats">
        <div className="stat-card">
          <div className="stat-card__value">{incompatible}</div>
          <div className="stat-card__label">16KB Issues</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{preflightErrors}</div>
          <div className="stat-card__label">Preflight Errors</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{nativeModules}</div>
          <div className="stat-card__label">Native Modules</div>
        </div>
      </div>
    </section>
  );
}
