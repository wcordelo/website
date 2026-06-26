# Portfolio

Personal site for William Lopez-Cordero — Vite, React 19, TypeScript, and plain CSS (design tokens in `src/styles/`). Content for metrics, disciplines, timeline, case studies, and consulting largely lives in **`src/data/resume.json`**.

## Setup

```bash
bun install
```

Dependencies are locked with **`bun.lock`**. **`package-lock.json`** is ignored so npm does not introduce a second lockfile.

## Scripts

| Command | Purpose |
|--------|---------|
| `bun run dev` | Vite + Bun contact API together (site default `http://127.0.0.1:5173`, API **3001**). |
| `bun run dev:site` | Vite only (no `/api` proxy target — contact form will not reach the API). |
| `bun run dev:api` | Bun contact API only (`server/contact-api.ts`). |
| `bun run build` | Typecheck + production bundle to `dist/`. |
| `bun run preview` | Serve the `dist/` build. |

Uses **`concurrently`** so one command starts the frontend and `POST /api/contact` handler.

## Routes

| Path | Page |
|------|------|
| `/` | Home: hero (type / orbit / terminal), metrics (**Selected numbers. 10+ years.**), five disciplines, selected work, consulting. |
| `/work` | Experience timeline, discipline filters, case studies, projects. |
| `/about` | Full-story bio, facts, skills matrix. |
| `/contact` | Form (validated client + server), FAQ. |

Static files in **`public/`** are copied to `dist/` as-is, including **`llms.txt`** and **`humans.txt`**.

## Contact form

- **Local:** Vite proxies **`/api`** to `http://127.0.0.1:3001` (`vite.config.ts`). **`bun run dev`** starts both. Submissions go to **`/api/contact`** (Bun + Resend).
- **Production:** Set **`VITE_CONTACT_API_BASE`** to the origin that serves the API (no trailing slash). The client calls `${VITE_CONTACT_API_BASE}/api/contact`.
- **From / Reply-To:** `from` must be a Resend-verified sender (`RESEND_FROM_EMAIL`). The visitor’s email is set as **`replyTo`** and in the message body — see `server/contact-api.ts`.

Env vars for the API are in **`.env.example`**. Copy to **`.env`** for the Bun process; never commit secrets.

## Build-time SEO

- Set **`VITE_SITE_URL`** to your canonical origin (no trailing slash), e.g. `https://example.com`. Used for:
  - **`PageHelmet`** / **`GlobalJsonLd`** canonical and absolute URLs (`src/lib/siteUrl.ts`).
  - **`sitemap.xml`** and **`robots.txt`** emitted into **`dist/`** on **`bun run build`** (plugin in `vite.config.ts`).

If `VITE_SITE_URL` is unset at build time, the plugin falls back to `http://127.0.0.1:5173` — set it for real deploys.

## Layout and theming

- **`Chrome`** wraps pages with nav, footer, cursor blob, noise, and **`TweaksPanel`**: theme, typography, density, hero variant, and home section order. Preferences persist in **`localStorage`** under `portfolio-tweaks`.
- **`Agentation`** (`agentation`) mounts only in **`import.meta.env.DEV`** for in-editor annotation (`App.tsx`).

## Execution plans + working implementations
See [docs/startup-ideas/](docs/startup-ideas/) for analysis and [startups/](startups/) for runnable MVPs (198 tasks, 250 tests).


- **`resume.json`** includes a **`writing`** array; it is **not** rendered on the site today. Safe to keep for later or delete if unused.
- There are **no resume PDFs** in this repo. If you add download links, put files under **`public/`** (e.g. `public/uploads/...`) and reference **site-root paths** in data so production URLs resolve.

## Requirements

- **[Bun](https://bun.sh)** — install, scripts, lockfile, and contact API (`bun run server/contact-api.ts`).
