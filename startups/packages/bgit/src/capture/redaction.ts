import { createHash } from "node:crypto";

const PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: "aws_key", regex: /AKIA[0-9A-Z]{16}/g },
  { name: "jwt", regex: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g },
  { name: "pem", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: "api_key", regex: /(?:api[_-]?key|secret[_-]?key|token)\s*[:=]\s*['"]?([A-Za-z0-9_\-./+=]{16,})/gi },
  { name: "env_line", regex: /^[A-Z][A-Z0-9_]*=\S+$/gm },
  { name: "github_pat", regex: /ghp_[A-Za-z0-9]{36,}/g },
  { name: "openai_key", regex: /sk-[A-Za-z0-9]{20,}/g },
];

export function redact(text: string): string {
  let result = text;
  for (const { name, regex } of PATTERNS) {
    result = result.replace(regex, (match) => {
      const hash = createHash("sha256").update(match).digest("hex").slice(0, 8);
      return `[REDACTED:${name}:${hash}]`;
    });
  }
  return result;
}

export function redactObject<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") out[k] = redact(v);
    else if (v && typeof v === "object" && !Array.isArray(v)) out[k] = redactObject(v as Record<string, unknown>);
    else if (Array.isArray(v)) out[k] = v.map((item) => (typeof item === "string" ? redact(item) : item));
    else out[k] = v;
  }
  return out as T;
}
