# GIT-028: Policy Engine Specification

**Status:** Draft v0.1

## Goals

Enforce provenance and security rules at commit time without breaking git interop.

## Policy Schema (YAML)

```yaml
version: 0.1
rules:
  - id: require_session
    when: commit
    enforce: error
    condition: active_session_or_note

  - id: block_plaintext_secrets
    when: pre_commit
    enforce: error
    condition: no_secret_patterns_in_staged

  - id: require_intent_min_length
    when: session_start
    enforce: warn
    condition: intent.length >= 10
```

## Hook Integration

| Hook | Policy phase |
|------|--------------|
| pre-commit | `block_plaintext_secrets`, auto-checkpoint |
| commit-msg | `require_session` trailer validation |
| post-commit | bind commit to session |

## MCP Policy (future)

`policy_check` tool evaluates rules before `checkpoint` and `session_end`.

## v0.1 Scope

Spec only — enforcement deferred to v0.5. Hooks install templates; full engine in v1.0.
