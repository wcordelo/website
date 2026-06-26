# GIT-031: bgit Threat Model

**Version:** 0.1.0  
**Scope:** Local overlay, MCP stdio, encrypted secrets vault

## Assets

| Asset | Location | Sensitivity |
|-------|----------|-------------|
| Master key | `.bgit/master.key` | Critical |
| Encrypted secrets | `.bgit/secrets/*.enc.json` | High |
| Session logs | `.bgit/sessions/*/trace.jsonl` | Medium |
| Redacted prompts | `.bgit/sessions/*/prompts/` | Medium |
| Git repo | `.git/` | High |

## Threat Actors

1. **Malicious agent (MCP)** — attempts exfiltration via `secret_get`, log injection
2. **Local attacker** — reads `.bgit/` from filesystem
3. **Accidental commit** — agent commits plaintext secrets
4. **Supply chain** — compromised bgit binary

## Mitigations (v0.1)

| Threat | Mitigation |
|--------|------------|
| MCP secret exfil | `secret_get` gated behind `BGIT_MCP_SECRET_GET=1` |
| Log secret leakage | Redaction engine (GIT-009) before persistence |
| Filesystem read | Master key wrapped; env `BGIT_MASTER_KEY` for production |
| Plaintext in git | Pre-commit hook template; secret patterns in redaction |
| Key material exposure | `master.key` mode 0600; secrets mode 0600 |

## Attack Surfaces

### MCP stdio

- Tools run with user privileges in repo cwd.
- No network exposure in v0.1.
- `workspace_add` stub — no path traversal in v0.1.

### Crypto

- AES-256-GCM for secrets at rest.
- Age-style key wrap for master key.
- OS keychain: macOS Keychain (production path); file fallback at `~/.bgit/keys/` (GIT-018).

## Out of Scope (v0.1)

- Remote vault, team tokens, hosted MCP
- Pen test, SOC 2

## Git filter (GIT-019)

- Smudge/clean filter replaces `bgit-secret:NAME` placeholders in the index with vault values in the working tree only.
- Installed via `bgit init` on `*.env` files.

## Recommendations

1. Set `BGIT_MASTER_KEY` from a password manager in CI.
2. Keep `BGIT_MCP_SECRET_GET` unset unless agent needs secrets.
3. Add `.bgit/secrets/` to backup exclusion policies.
4. Run `bgit why` in PR review for agent-generated changes.
