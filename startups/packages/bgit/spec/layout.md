# GIT-002: `.bgit/` Directory Layout

## Root Structure

```
.bgit/
├── config.yaml          # Repo config (version, created_at, repo_root)
├── master.key           # Wrapped master encryption key (mode 0600)
├── index.json           # Fast lookup index (sessions, files, commits)
├── sessions/
│   └── sess_<id>/
│       ├── meta.json    # Session intent (GIT-001)
│       ├── trace.jsonl  # Agent action log
│       ├── prompts/     # Redacted prompt fragments
│       └── checkpoints/
│           └── cp_<id>.json
├── secrets/
│   ├── <NAME>.enc.json  # AES-256-GCM encrypted blob
│   └── <NAME>.meta.json # Secret metadata
└── hooks/               # Hook templates installed to .git/hooks
```

## Config Format

YAML key-value (v0.1):

```yaml
version: 0.1.0
created_at: 2026-06-26T00:00:00.000Z
repo_root: /path/to/repo
```

## Index Schema

```json
{
  "sessions": { "sess_abc": { "path": "...", "status": "active" } },
  "file_index": { "src/foo.ts": [{ "session_id": "...", "checkpoint_id": "...", "lines": [42] }] },
  "commit_index": { "<sha>": "sess_abc" }
}
```

## Migration

- Layout version in `config.yaml`.
- Future migrations run via `bgit migrate`.
