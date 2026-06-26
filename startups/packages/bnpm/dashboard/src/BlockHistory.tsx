import { useEffect, useState } from "react";
import type { AuditEvent } from "./api";
import { fetchAuditEvents } from "./api";

function typeColor(type: AuditEvent["type"]): string {
  switch (type) {
    case "block":
      return "var(--danger)";
    case "warn":
      return "var(--warn)";
    default:
      return "var(--muted)";
  }
}

export function BlockHistory() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditEvents().then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <p style={{ color: "var(--muted)" }}>Loading block history…</p>;

  return (
    <section>
      <h2 style={{ marginBottom: "1rem" }}>Block History</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
            <th style={{ padding: "0.5rem" }}>Time</th>
            <th style={{ padding: "0.5rem" }}>Type</th>
            <th style={{ padding: "0.5rem" }}>Package</th>
            <th style={{ padding: "0.5rem" }}>Message</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "0.5rem", color: "var(--muted)" }}>
                {new Date(e.createdAt).toLocaleString()}
              </td>
              <td style={{ padding: "0.5rem", color: typeColor(e.type), fontWeight: 600 }}>
                {e.type}
              </td>
              <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>
                {e.package ? `${e.package}@${e.version}` : "—"}
              </td>
              <td style={{ padding: "0.5rem", color: "var(--muted)" }}>{e.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
