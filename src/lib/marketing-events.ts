export type MarketingEventName =
  | 'ad_slot_ready'
  | 'share_copy'
  | 'share_native'
  | 'share_social'
  | 'support_click';

export type MarketingEventProperties = Record<string, string | number | boolean | null | undefined>;

export function normalizeMarketingEventProperties(properties: MarketingEventProperties = {}): Record<string, string> {
  return Object.fromEntries(
    Object.entries(properties)
      .map(([key, value]) => [key, value == null ? '' : String(value).trim()] as const)
      .filter(([, value]) => value.length > 0),
  );
}

export function buildMarketingEvent(name: MarketingEventName, properties: MarketingEventProperties = {}) {
  return {
    name: `marketing_${name}`,
    properties: normalizeMarketingEventProperties(properties),
  };
}

export function trackMarketingEvent(name: MarketingEventName, properties: MarketingEventProperties = {}) {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
    return;
  }

  const event = buildMarketingEvent(name, properties);

  void import('@vercel/analytics')
    .then(({ track }) => {
      track(event.name, event.properties);
    })
    .catch(() => undefined);
}
