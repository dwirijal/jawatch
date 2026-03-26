import * as React from 'react';
import NextLink from 'next/link';
import { cn } from '@/lib/utils';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

function isExternalHref(href: string) {
  return href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:');
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, className, rel, target, ...props }, ref) => {
    if (isExternalHref(href)) {
      return (
        <a
          ref={ref}
          href={href}
          target={target ?? '_blank'}
          rel={rel ?? 'noopener noreferrer'}
          className={cn(className)}
          {...props}
        />
      );
    }

    return <NextLink ref={ref} href={href} className={cn(className)} {...props} />;
  }
);

Link.displayName = 'Link';
