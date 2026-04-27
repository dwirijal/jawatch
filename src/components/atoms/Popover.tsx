'use client';

import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

export const PopoverRoot = Popover.Root;
export const PopoverTrigger = Popover.Trigger;
export const PopoverAnchor = Popover.Anchor;

interface PopoverContentProps extends React.ComponentPropsWithoutRef<typeof Popover.Content> {
  contentClassName?: string;
}

export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof Popover.Content>,
  PopoverContentProps
>(({ className, contentClassName, children, sideOffset = 8, align = 'end', ...props }, ref) => {
  return (
    <Popover.Portal>
      <Popover.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'z-[250] rounded-[var(--radius-sm)] border border-border-subtle bg-background p-[var(--space-md)] shadow-2xl animate-in fade-in zoom-in-95 duration-200',
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

PopoverContent.displayName = 'PopoverContent';
