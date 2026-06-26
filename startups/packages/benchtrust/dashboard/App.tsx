/** BenchTrust Dashboard v0 (BENCH-021) — eval run management UI. */

import { useEffect, useState } from "react";
import { Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import { api, type EvalRunSummary, type EvalRun, type Scorecard } from "./api";

function Layout({ children }: { children: React.ReactNode }) {
  const [health, setHealth] = useState<string>("checking…");

  useEffect(() => {
    api
      .health()
      .then((h) => setHealth(`${h.service} v${h.version}`))
      .catch(() => setHealth("API offline"));
  }, []);

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>BenchTrust</h1>
        <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{health}</p>
        <nav>
          <Link to="/">Runs</Link>
          <Link to="/new">New Eval</Link>
        </nav>
        <p style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "auto" }}>
          API: localhost:3848
        </p>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

function RunsPage() {
  const [runs, setRuns] = useState<EvalRunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listRuns()
      .then((r) => setRuns(r.runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt)))
      )
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load runs"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="empty">Loading runs…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <>
      <div className="page-header">
        <h2>Eval Runs</h2>
        <p>Manage and monitor benchmark evaluations</p>
      </div>

      {runs.length === 0 ? (
        <p className="empty">No runs yet. Start a new eval.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Run ID</th>
              <th>Model</th>
              <th>Status</th>
              <th>Started</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id}>
                <td>
                  <Link to={`/runs/${run.id}`} className="row-link mono">
                    {run.id}
                  </Link>
                </td>
                <td>{run.model}</td>
                <td>
                  <span className={`badge ${run.status}`}>{run.status}</span>
                </td>
                <td>{new Date(run.startedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}

function RunDetailPage() {
  const { runId } = useParams<{ runId: string }>();
  const [run, setRun] = useState<EvalRun | null>(null);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!runId) return;
    Promise.all([api.getRun(runId), api.getReport(runId).catch(() => null)])
      .then(([r, sc]) => {
        setRun(r);
        setScorecard(sc);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load run"))
      .finally(() => setLoading(false));
  }, [runId]);

  async function handleGenerateReport() {
    if (!runId) return;
    setGenerating(true);
    try {
      await api.generateReport(runId);
      const sc = await api.getReport(runId);
      setScorecard(sc);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Report generation failed");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <p className="empty">Loading run…</p>;
  if (error && !run) return <p className="error">{error}</p>;
  if (!run) return <p className="empty">Run not found</p>;

  const passCount = run.results.filter((r) => r.passed).length;
  const passRate = run.results.length ? (passCount / run.results.length) * 100 : 0;

  return (
    <>
      <div className="page-header">
        <h2 className="mono">{run.id}</h2>
        <div className="status-bar">
          <span className={`badge ${run.status}`}>{run.status}</span>
          <span className="mono" style={{ color: "var(--muted)" }}>
            {run.model} · vault {run.vaultVersion}
          </span>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="card">
          <h3>Pass Rate</h3>
          <div className="metric">{passRate.toFixed(1)}%</div>
        </div>
        <div className="card">
          <h3>Total Runs</h3>
          <div className="metric">{run.results.length}</div>
        </div>
        <div className="card">
          <h3>Runs / Task</h3>
          <div className="metric">{run.runsPerTask}</div>
        </div>
        <div className="card">
          <h3>Tasks</h3>
          <div className="metric">{new Set(run.results.map((r) => r.taskId)).size}</div>
        </div>
      </div>

      {!scorecard ? (
        <button onClick={handleGenerateReport} disabled={generating || run.status !== "completed"}>
          {generating ? "Generating…" : "Generate Scorecard"}
        </button>
      ) : (
        <ScorecardView scorecard={scorecard} runId={run.id} />
      )}
    </>
  );
}

function ScorecardView({ scorecard, runId }: { scorecard: Scorecard; runId: string }) {
  return (
    <div>
      <div className="page-header" style={{ marginTop: "1.5rem" }}>
        <h2>Scorecard</h2>
        <p>
          {scorecard.methodologyVersion} · generated {new Date(scorecard.generatedAt).toLocaleString()}
        </p>
      </div>

      <div className="metrics-grid">
        {scorecard.passAtK.map((p) => (
          <div className="card" key={p.k}>
            <h3>pass@{p.k}</h3>
            <div className="metric">{(p.estimate * 100).toFixed(1)}%</div>
            <p className="mono" style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>
              CI: {(p.wilsonLower * 100).toFixed(1)}–{(p.wilsonUpper * 100).toFixed(1)}%
            </p>
          </div>
        ))}
        <div className="card">
          <h3>Reward Hack Rate</h3>
          <div className="metric">{(scorecard.rewardHackRate * 100).toFixed(1)}%</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Failure Mode</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(scorecard.failureModes).map(([mode, count]) => (
            <tr key={mode}>
              <td>{mode}</td>
              <td>{count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
        <a href={`/v1/runs/${runId}/report?format=html`} target="_blank" rel="noreferrer">
          <button className="secondary" type="button">
            View HTML Report
          </button>
        </a>
        <a href={`/v1/runs/${runId}/report?format=markdown`} target="_blank" rel="noreferrer">
          <button className="secondary" type="button">
            View Markdown
          </button>
        </a>
      </div>
    </div>
  );
}

function NewEvalPage() {
  const navigate = useNavigate();
  const [model, setModel] = useState("reference-agent");
  const [runsPerTask, setRunsPerTask] = useState(16);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { runId } = await api.createRun({ model, runsPerTask });
      navigate(`/runs/${runId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create run");
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>New Eval Run</h2>
        <p>Submit a model for benchmark evaluation</p>
      </div>

      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Model identifier</label>
            <input value={model} onChange={(e) => setModel(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Runs per task</label>
            <input
              type="number"
              min={1}
              max={64}
              value={runsPerTask}
              onChange={(e) => setRunsPerTask(Number(e.target.value))}
            />
          </div>
          <button type="submit" disabled={submitting}>
            {submitting ? "Starting…" : "Start Eval"}
          </button>
        </div>
      </form>
    </>
  );
}

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<RunsPage />} />
        <Route path="/runs/:runId" element={<RunDetailPage />} />
        <Route path="/new" element={<NewEvalPage />} />
      </Routes>
    </Layout>
  );
}
