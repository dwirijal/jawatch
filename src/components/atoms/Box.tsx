import * as React from 'react';
import { cn } from '@/lib/utils';

interface BoxProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
}

export function Box({ as: Comp = 'div', className, ...props }: BoxProps) {
  return <Comp className={cn(className)} {...props} />;
}
