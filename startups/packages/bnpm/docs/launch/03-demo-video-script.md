# Demo Video Script: First Block in 60 Seconds

**Draft — NPM-029**  
**Length:** ~60 seconds  
**Format:** Terminal screencast + lower-third captions

---

## Scene 1 (0:00–0:10) — The problem

**VISUAL:** News headline montage — "npm package compromised"

**VO:**  
"Another week, another npm compromise. Your CI still runs plain npm install."

---

## Scene 2 (0:10–0:25) — Setup

**VISUAL:** Terminal

```bash
cd my-app
bunx @theo-startups/bnpm init --strict
cat .better-npmrc
```

**VO:**  
"bnpm adds a policy file and a block gate in one command."

---

## Scene 3 (0:25–0:45) — The block

**VISUAL:** Add malicious version to package.json

```bash
# package.json deps: "axios": "1.14.1"
bunx @theo-startups/bnpm install --json
```

**VISUAL:** Red error output — blocked with remediation

**VO:**  
"When a known-bad version hits your tree, install never runs. No postinstall. No payload."

---

## Scene 4 (0:45–0:55) — CI angle

**VISUAL:** GitHub Action PR check failing

**VO:**  
"Add the GitHub Action. Every PR gets audited before merge."

---

## Scene 5 (0:55–1:00) — CTA

**VISUAL:** Logo + URL

**VO:**  
"bnpm. Block before install. betternpm.dev"

---

## Tweet thread (condensed)

1. We shipped bnpm v0.1 — a drop-in npm overlay that blocks malicious packages *before* install 🛡️
2. Inspired by axios 1.14.1 + TanStack May 2026 — IOCs embedded, updates via threat feed
3. `bnpm init --strict` → `.better-npmrc` + GitHub Action
4. `bnpm audit-pipeline` catches pull_request_target + OIDC risks in your workflows
5. Free OSS CLI. Try it: `bunx @theo-startups/bnpm install`
