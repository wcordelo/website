export const SITE_URL = 'https://wcordelo.com';

export function getSiteUrl(): string {
  return import.meta.env?.VITE_SITE_URL?.replace(/\/$/, '') || SITE_URL;
}
