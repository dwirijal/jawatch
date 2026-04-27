import * as React from 'react';
import { cn } from '@/lib/utils';

export function Backdrop({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('fixed inset-0 bg-surface-1/80 backdrop-blur-sm', className)} {...props} />;
}
