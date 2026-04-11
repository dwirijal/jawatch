import 'server-only';

export type ComicAnalyticsEvent = {
  eventName: string;
  comicSlug?: string | null;
  comicType?: string | null;
  source?: string | null;
  status?: string | null;
  details?: Record<string, unknown> | null;
  occurredAt?: string | null;
};

export function hasComicAnalyticsSink(): boolean {
  return false;
}

export async function trackComicAnalyticsEvent(event: ComicAnalyticsEvent): Promise<boolean> {
  if (!event.eventName.trim()) {
    return false;
  }
  return false;
}
