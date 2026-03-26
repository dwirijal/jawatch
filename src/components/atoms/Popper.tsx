'use client';

import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

export const PopperRoot = Popover.Root;
export const PopperTrigger = Popover.Trigger;
export const PopperAnchor = Popover.Anchor;

interface PopperContentProps extends React.ComponentPropsWithoutRef<typeof Popover.Content> {
  contentClassName?: string;
}

export const PopperContent = React.forwardRef<
  React.ElementRef<typeof Popover.Content>,
  PopperContentProps
>(({ className, contentClassName, children, sideOffset = 8, align = 'end', ...props }, ref) => {
  return (
    <Popover.Portal>
      <Popover.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'z-[250] rounded-[var(--radius-sm)] border border-border-subtle bg-background p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200',
          className
        )}
        {...props}
      >
        <div className={contentClassName}>{children}</div>
        <Popover.Arrow className="fill-background" />
      </Popover.Content>
    </Popover.Portal>
  );
});

PopperContent.displayName = 'PopperContent';
