# Agent instructions

## Testing

- Never write unit tests after you write the code.
- Highly prefer E2E tests as the sole testing mechanism. Use them to verify complex features work. At the end of E2E tests, produce a verifiable and repeatable artifact (for example a screenshot, HTML report, saved response fixture, or deterministic log the next run can compare).
- If you must test a system in isolation, first write down all the ways it could fail, then write the code (and the tests that exercise those failures).

### Review checklist (apply to every test)

- Would a wrong refactor still make this test pass? If yes, it is low-signal. Delete or rewrite it.
- Does the E2E leave an artifact someone can re-run and compare?
- Are AGENTS.md (or CLAUDE.md / project instructions) updated so the next agent inherits these rules?
