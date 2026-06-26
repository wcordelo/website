# Show HN: bnpm – npm wrapper that blocks malicious packages before install

**Draft — NPM-029 HN post**

---

**Title:** Show HN: bnpm – npm wrapper that blocks malicious packages before install

**Body:**

Hi HN — we shipped v0.1 of bnpm, a CLI that wraps npm with an install-time block gate.

Recent axios (1.14.1) and TanStack compromises showed the gap: scanners detect fast, but most teams still run plain `npm install` in CI. bnpm refuses install when a dependency matches a threat blocklist *before* npm extracts tarballs or runs lifecycle scripts.

**Try it:**

```
bunx @theo-startups/bnpm init --strict
bunx @theo-startups/bnpm install
```

**What it does today:**

- Pre-check lockfile/package.json against embedded IOCs
- `bnpm ci` injects `--ignore-scripts` in strict mode
- `bnpm audit-pipeline` flags risky GitHub Actions (pull_request_target, OIDC, cache)
- GitHub Action for PRs

**What it doesn't do yet:** registry proxy, full arborist hook, publish wizard (v0.5).

We wrap npm via child_process (ADR in repo) to ship fast. Open to feedback on false positive handling — we support warn vs strict modes in `.better-npmrc`.

Repo: [github.com/theo-startups/bnpm](https://github.com/theo-startups/bnpm)  
Docs: betternpm.dev

Happy to answer questions on the blocklist schema and TanStack/axios IOC sources.
