export function getSiteUrl(): string {
  const env = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '');
  if (env) return env;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}
