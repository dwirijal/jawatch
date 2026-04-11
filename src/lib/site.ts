const DEFAULT_SITE_URL = 'https://jawatch.web.id';

function normalizeSiteUrl(value: string): string {
  return value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`;
}

function resolveSiteUrl(): URL {
  const explicit =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    DEFAULT_SITE_URL;

  return new URL(normalizeSiteUrl(explicit));
}

export const SITE_URL = resolveSiteUrl();
