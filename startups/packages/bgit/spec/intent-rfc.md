# GIT-001: Intent Schema RFC

**Status:** Draft v0.1  
**Version:** 0.1.0

## Overview

Every bgit session records structured intent linking agent work to git commits. This RFC defines the canonical JSON schema for sessions, checkpoints, and trace events.

## Session Intent (`meta.json`)

```json
{
  "session_id": "sess_abc123",
  "agent": "claude-code",
  "user": "dev@company.com",
  "intent": "Fix authentication bug in login flow",
  "issue_ref": "JIRA-4521",
  "started_at": "2026-06-01T10:00:00Z",
  "ended_at": "2026-06-01T11:30:00Z",
  "checkpoints": ["cp_001", "cp_002"],
  "final_commit": "a1b2c3d4e5f6789012345678901234567890abcd",
  "head_at_start": "deadbeef...",
  "status": "ended"
}
```

## Checkpoint Record

```json
{
  "id": "cp_001",
  "session_id": "sess_abc123",
  "created_at": "2026-06-01T10:15:00Z",
  "head": "abc123...",
  "commit": "def456...",
  "diff_stat": { "files_changed": 3, "insertions": 42, "deletions": 7 },
  "files": [{ "path": "src/auth.ts", "action": "edit", "lines": [42] }]
}
```

## Trace Events (`trace.jsonl`)

One JSON object per line. See `session-event.schema.json`.

## Version Policy

- Schema version tracked in `.bgit/config.yaml` (`version` field).
- Breaking changes bump major; additive fields bump minor.
- Unknown fields MUST be preserved on read.

## Git Integration

- Commit trailer: `bgit-trace: <session_id>`
- Git note ref: `refs/notes/bgit`
- Session ref: `refs/bgit/sessions/<session_id>`
