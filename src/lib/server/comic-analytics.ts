import 'server-only';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

type ComicAnalyticsConfig = {
  baseUrl: string;
  table: string;
  schema: string;
  serviceRoleKey: string;
};

export type ComicAnalyticsEvent = {
  eventName: string;
  comicSlug?: string | null;
  comicType?: string | null;
  source?: string | null;
  status?: string | null;
  details?: Record<string, unknown> | null;
  occurredAt?: string | null;
};

function readComicAnalyticsConfig(): ComicAnalyticsConfig | null {
  const baseUrl =
    process.env.SUPABASE_URL?.trim() ||
    process.env.ANIME_SUPABASE_URL?.trim() ||
    '';
  const table = process.env.SUPABASE_COMIC_ANALYTICS_TABLE?.trim() || '';
  const schema = process.env.SUPABASE_COMIC_ANALYTICS_SCHEMA?.trim() || 'public';
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.ANIME_SUPABASE_SECRET_KEY?.trim() ||
    '';

  if (!baseUrl || !table || !serviceRoleKey) {
    return null;
  }

  return { baseUrl, table, schema, serviceRoleKey };
}

function buildAnalyticsRow(event: ComicAnalyticsEvent): Record<string, unknown> {
  return {
    event_name: event.eventName.trim(),
    comic_slug: event.comicSlug?.trim() || null,
    comic_type: event.comicType?.trim() || null,
    source: event.source?.trim() || null,
    status: event.status?.trim() || null,
    details: event.details ?? {},
    occurred_at: event.occurredAt?.trim() || new Date().toISOString(),
  };
}

export function hasComicAnalyticsSink(): boolean {
  return Boolean(readComicAnalyticsConfig());
}

export async function trackComicAnalyticsEvent(event: ComicAnalyticsEvent): Promise<boolean> {
  const config = readComicAnalyticsConfig();
  if (!config) {
    return false;
  }

  if (!event.eventName.trim()) {
    return false;
  }

  try {
    const response = await fetchWithTimeout(new URL(`/rest/v1/${encodeURIComponent(config.table)}`, config.baseUrl).toString(), {
      method: 'POST',
      timeoutMs: 2500,
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
        'Content-Profile': config.schema,
        'Accept-Profile': config.schema,
      },
      body: JSON.stringify([buildAnalyticsRow(event)]),
    });

    return response.ok;
  } catch {
    return false;
  }
}
