import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASS = {
  sm: 'h-[var(--size-avatar-sm)] w-[var(--size-avatar-sm)] text-[var(--type-size-xs)]',
  md: 'h-[var(--size-avatar-md)] w-[var(--size-avatar-md)] text-[var(--type-size-sm)]',
  lg: 'h-[var(--size-avatar-lg)] w-[var(--size-avatar-lg)] text-[var(--type-size-base)]',
} as const;

function getInitial(name?: string) {
  return name?.trim().charAt(0).toUpperCase() || 'D';
}

export function Avatar({ src, alt = '', name, size = 'md', className, ...props }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-subtle bg-surface-1 font-black uppercase text-[var(--accent-contrast)]',
        SIZE_CLASS[size],
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={`var(--size-avatar-${size})`}
          className="object-cover"
          unoptimized
        />
      ) : (
        <span className="relative z-10">{getInitial(name)}</span>
      )}
    </span>
  );
}
