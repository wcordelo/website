export interface AuditEvent {
  id: string;
  orgId: string;
  type: "block" | "warn" | "policy_change" | "api_key_created";
  package?: string;
  version?: string;
  message: string;
  createdAt: string;
}

export interface PolicyRecord {
  id: string;
  orgId: string;
  name: string;
  policy: {
    blocklist?: string;
    lifecycle_scripts?: string;
    allowed_registries?: string[];
    telemetry?: string;
  };
  updatedAt: string;
}

const API_BASE = "/api/v1";

export async function fetchAuditEvents(): Promise<AuditEvent[]> {
  try {
    const res = await fetch(`${API_BASE}/audit?limit=50`);
    if (!res.ok) throw new Error("fetch failed");
    const data = (await res.json()) as { events: AuditEvent[] };
    return data.events;
  } catch {
    return MOCK_EVENTS;
  }
}

export async function fetchPolicies(): Promise<PolicyRecord[]> {
  try {
    const res = await fetch(`${API_BASE}/policies`);
    if (!res.ok) throw new Error("fetch failed");
    const data = (await res.json()) as { policies: PolicyRecord[] };
    return data.policies;
  } catch {
    return [MOCK_POLICY];
  }
}

export async function savePolicy(
  id: string,
  policy: PolicyRecord["policy"],
): Promise<PolicyRecord | null> {
  try {
    const res = await fetch(`${API_BASE}/policies/${id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ policy }),
    });
    if (!res.ok) throw new Error("save failed");
    return (await res.json()) as PolicyRecord;
  } catch {
    return null;
  }
}

const MOCK_POLICY: PolicyRecord = {
  id: "default",
  orgId: "org_default",
  name: "Default strict policy",
  policy: {
    blocklist: "strict",
    lifecycle_scripts: "allowlist",
    allowed_registries: ["https://registry.npmjs.org"],
    telemetry: "off",
  },
  updatedAt: new Date().toISOString(),
};

const MOCK_EVENTS: AuditEvent[] = [
  {
    id: "evt_1",
    orgId: "org_default",
    type: "block",
    package: "axios",
    version: "1.14.1",
    message: "Compromised version — credential stealer",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "evt_2",
    orgId: "org_default",
    type: "warn",
    package: "eslint-config-prettierr",
    version: "1.0.0",
    message: "Typosquat of eslint-config-prettier",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "evt_3",
    orgId: "org_default",
    type: "policy_change",
    message: 'Updated policy "Default strict policy"',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];
