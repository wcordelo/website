import { BlockHistory } from "./BlockHistory";
import { PolicyEditor } from "./PolicyEditor";

export function App() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "1rem 2rem",
          background: "var(--surface)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.25rem" }}>bnpm Dashboard</h1>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>
            Block history &amp; policy management
          </p>
        </div>
        <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>app.betternpm.dev</span>
      </header>

      <main
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2rem",
          padding: "2rem",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <BlockHistory />
        <PolicyEditor />
      </main>
    </div>
  );
}
