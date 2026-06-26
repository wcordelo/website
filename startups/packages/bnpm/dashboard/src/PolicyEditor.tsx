import { useEffect, useState } from "react";
import type { PolicyRecord } from "./api";
import { fetchPolicies, savePolicy } from "./api";

function policyToIni(policy: PolicyRecord["policy"]): string {
  const lines = [
    `blocklist = ${policy.blocklist ?? "strict"}`,
    `lifecycle_scripts = ${policy.lifecycle_scripts ?? "allowlist"}`,
    `allowed_registries = ${(policy.allowed_registries ?? []).join(", ")}`,
    `telemetry = ${policy.telemetry ?? "off"}`,
  ];
  return lines.join("\n") + "\n";
}

function parseIni(text: string): PolicyRecord["policy"] {
  const policy: PolicyRecord["policy"] = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key === "blocklist") policy.blocklist = value;
    if (key === "lifecycle_scripts") policy.lifecycle_scripts = value;
    if (key === "telemetry") policy.telemetry = value;
    if (key === "allowed_registries") {
      policy.allowed_registries = value.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return policy;
}

export function PolicyEditor() {
  const [policy, setPolicy] = useState<PolicyRecord | null>(null);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchPolicies().then((list) => {
      const p = list[0] ?? null;
      setPolicy(p);
      if (p) setText(policyToIni(p.policy));
    });
  }, []);

  async function handleSave() {
    if (!policy) return;
    const parsed = parseIni(text);
    const saved = await savePolicy(policy.id, parsed);
    setStatus(saved ? "Policy saved" : "Saved locally (API offline)");
    if (saved) setPolicy(saved);
  }

  if (!policy) return <p style={{ color: "var(--muted)" }}>Loading policy…</p>;

  return (
    <section>
      <h2 style={{ marginBottom: "1rem" }}>Policy Editor</h2>
      <p style={{ color: "var(--muted)", marginBottom: "0.75rem" }}>
        Editing: <strong style={{ color: "var(--text)" }}>{policy.name}</strong>
      </p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} />
      <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <button
          onClick={handleSave}
          style={{
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "0.5rem 1rem",
          }}
        >
          Save policy
        </button>
        {status && <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>{status}</span>}
      </div>
    </section>
  );
}
