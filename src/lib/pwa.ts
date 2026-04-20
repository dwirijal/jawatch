const PWA_AUTO_SHOW_PATHS = new Set([
  '/read/comics',
  '/vault',
  '/watch/movies',
  '/watch/series',
  '/watch/shorts',
]);

const PWA_DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function normalizePathname(pathname: string): string {
  const normalized = pathname.trim().replace(/\/+$/, '');
  return normalized || '/';
}

export function isPwaPromptAutoShowPath(pathname: string): boolean {
  return PWA_AUTO_SHOW_PATHS.has(normalizePathname(pathname));
}

export function buildPwaPromptDismissedUntil(nowMs = Date.now()): number {
  return nowMs + PWA_DISMISS_DURATION_MS;
}

export function isPwaPromptDismissed(rawValue: string | null | undefined, nowMs = Date.now()): boolean {
  const parsed = Number.parseInt(rawValue || '', 10);
  return Number.isFinite(parsed) && parsed > nowMs;
}
