/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string;
  /** Base URL for POST /api/contact when not same-origin (no trailing slash) */
  readonly VITE_CONTACT_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
