'use client';

import * as React from 'react';
import { Link } from '@/components/atoms/Link';
import { trackMarketingEvent, type MarketingEventName, type MarketingEventProperties } from '@/lib/marketing-events';

interface TrackedMarketingLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  eventName: MarketingEventName;
  eventProperties?: MarketingEventProperties;
  prefetch?: boolean | null;
}

export function TrackedMarketingLink({
  eventName,
  eventProperties,
  onClick,
  ...props
}: TrackedMarketingLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackMarketingEvent(eventName, eventProperties);
        onClick?.(event);
      }}
    />
  );
}
