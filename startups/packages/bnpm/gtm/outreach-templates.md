# Maintainer Outreach Templates (NPM-028)

Email and Twitter templates for reaching top npm package maintainers.
Target: **100 scopes** in phase 1; goal **15% reply rate**.

---

## Email — Publish Wizard Early Access

**Subject:** Early access: safer `npm publish` for `{{PACKAGE_NAME}}` maintainers

Hi {{MAINTAINER_NAME}},

I'm reaching out because you maintain **{{PACKAGE_NAME}}** ({{WEEKLY_DOWNLOADS}}+ weekly downloads) — a package many teams depend on.

We built **bnpm** (Better npm) — a drop-in CLI that blocks compromised packages *before* install, plus a **publish wizard** that:

1. Shows a tarball diff vs your last published version
2. Flags new lifecycle scripts and suspicious dependencies
3. Supports staged approval (second maintainer signs off in CI)

We're offering early access to maintainers of high-impact packages. No cost, no lock-in — it's MIT licensed.

**Try it in 30 seconds:**
```bash
bunx @theo-startups/bnpm publish --dry-run
```

Would you be open to a 15-minute call this week? I'd love your feedback on the publish flow.

Best,
{{SENDER_NAME}}
{{SENDER_TITLE}}, Better npm
https://betternpm.dev

---

## Email — Post-Incident (timing-sensitive)

**Subject:** We blocked `{{COMPROMISED_PACKAGE}}@{{VERSION}}` — heads up for {{PACKAGE_NAME}} deps

Hi {{MAINTAINER_NAME}},

A supply-chain incident was reported today affecting `{{COMPROMISED_PACKAGE}}@{{VERSION}}`. bnpm's threat feed blocked it within {{BLOCK_LATENCY_MINUTES}} minutes.

Your package `{{PACKAGE_NAME}}` lists `{{COMPROMISED_PACKAGE}}` as a dependency. Recommended actions:

1. Pin or upgrade away from the compromised range
2. Rotate CI/npm tokens if you installed during the exposure window
3. Run `bnpm audit-pipeline` on your repo

Happy to help set up a free block gate for `{{PACKAGE_NAME}}` — takes about 5 minutes with `bnpm init`.

{{SENDER_NAME}}

---

## Twitter / X — Thread opener

> npm supply-chain tip for maintainers 🧵
>
> If you publish packages with install scripts, attackers target you first.
>
> We built `bnpm publish` — tarball diff vs last version, flags risky scripts, optional staged approval.
>
> Free for OSS maintainers → betternpm.dev

---

## Twitter / X — Incident response

> 🚨 We added `{{PACKAGE}}@{{VERSION}}` to the bnpm blocklist.
>
> If you use {{PACKAGE}}, do NOT install that version.
>
> `bunx @theo-startups/bnpm install` blocks it before extract.
>
> Details: betternpm.dev/blocks

---

## Twitter / X — Maintainer DM (short)

> Hey! Saw you maintain {{PACKAGE_NAME}} — we're giving top maintainers early access to bnpm's publish wizard (tarball diff + script flags). Interested in trying `bnpm publish` on your next release? No pitch deck, just feedback 🙏

---

## Scope list template (track in spreadsheet)

| # | Package | Maintainer | Email | Twitter | Sent | Replied | Call booked |
|---|---------|------------|-------|---------|------|---------|-------------|
| 1 | lodash | | | | | | |
| 2 | express | | | | | | |
| 3 | axios | | | | | | |
| … | | | | | | | |
| 100 | | | | | | | |

### Priority tiers

1. **Tier A (1–25):** >10M weekly downloads, active maintainers
2. **Tier B (26–60):** 1M–10M downloads, recent publish activity
3. **Tier C (61–100):** Framework-adjacent, frequent incident exposure

### Personalization tokens

- `{{PACKAGE_NAME}}` — scoped package name
- `{{MAINTAINER_NAME}}` — from package.json `author` or GitHub profile
- `{{WEEKLY_DOWNLOADS}}` — npm API `downloads/week`
- `{{COMPROMISED_PACKAGE}}` / `{{VERSION}}` — incident-specific
- `{{BLOCK_LATENCY_MINUTES}}` — from ingestion metrics

### Follow-up sequence

1. Day 0 — initial email
2. Day 4 — bump with link to docs (`docs/site/index.html`)
3. Day 10 — Twitter DM if no reply
4. Day 21 — close loop, add to newsletter list
