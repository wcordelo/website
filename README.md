# Portfolio

Personal site for William Lopez-Cordero — Vite, React 19, TypeScript, and plain CSS (design tokens in `src/styles/`). Content for metrics, disciplines, timeline, case studies, and consulting largely lives in **`src/data/resume.json`**.

## Scripts

| Command | Purpose |
|--------|---------|
| `npm run dev` | Vite + Bun contact API together (site default `http://127.0.0.1:5173`, API **3001**). |
| `npm run dev:site` | Vite only (no `/api` proxy target). |
| `npm run dev:api` | Bun contact API only (`server/contact-api.ts`). |
| `npm run build` | Typecheck + production bundle to `dist/`. |
| `npm run preview` | Serve the `dist/` build. |

## Routes

| Path | Page |
|------|------|
| `/` | Home: hero (type / orbit / terminal), metrics, five disciplines, case preview, consulting. |
| `/work` | Experience timeline, discipline filters, case studies, projects. |
| `/about` | Bio, facts, skills matrix. |
| `/contact` | Form, FAQ, links. |

Static files in **`public/`** are copied to `dist/` as-is, including **`llms.txt`** and **`humans.txt`**.

## Contact form

- **Local:** Vite proxies **`/api`** to `http://127.0.0.1:3001` (see `vite.config.ts`). `npm run dev` starts both; the form posts to `/api/contact` and reaches the Bun handler.
- **Production:** Set **`VITE_CONTACT_API_BASE`** to the origin that serves the API (no trailing slash). The client builds the URL as `${VITE_CONTACT_API_BASE}/api/contact`.

Server env vars are documented in **`.env.example`**. Copy to **`.env`** for the Bun process; never commit secrets.

## Build-time SEO

- Set **`VITE_SITE_URL`** to your canonical site origin (no trailing slash), e.g. `https://example.com`. Used for:
  - **`PageHelmet`** / **`GlobalJsonLd`** canonical and absolute URLs (`src/lib/siteUrl.ts`).
  - **`sitemap.xml`** and **`robots.txt`** emitted into **`dist/`** on `npm run build` (Vite plugin in `vite.config.ts`).

If `VITE_SITE_URL` is unset at build time, the plugin falls back to `http://127.0.0.1:5173` — override for real deploys.

## Layout and theming

- **`Chrome`** wraps pages with nav, footer, cursor blob, noise, and **`TweaksPanel`**: theme, typography, density, hero variant, and home section order. Preferences persist in **`localStorage`** under `portfolio-tweaks`.
- **`Agentation`** (`agentation`) mounts only in **`import.meta.env.DEV`** for in-editor annotation (see `App.tsx`).

## Data notes

- **`resume.json`** includes a **`writing`** array; it is **not** rendered on `/about` today. Safe to use later or remove if unused.
- Resume PDF paths under **`uploads/`** are referenced from `resume.json`; keep those assets in **`public/`** if the download links should work in production.

## Requirements

- **Node** (for `npm` + Vite).
- **Bun** for `dev:api` as defined in `package.json` (`bun run server/contact-api.ts`).
