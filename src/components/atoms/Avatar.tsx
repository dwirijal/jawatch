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
  sm: 'h-5 w-5 text-[10px]',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
} as const;

function getInitial(name?: string) {
  return name?.trim().charAt(0).toUpperCase() || 'D';
}

export function Avatar({ src, alt = '', name, size = 'md', className, ...props }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-zinc-800 bg-zinc-900 font-black uppercase text-white',
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
          sizes={size === 'lg' ? '48px' : size === 'md' ? '36px' : '20px'}
          className="object-cover"
          unoptimized
        />
      ) : (
        <span className="relative z-10">{getInitial(name)}</span>
      )}
    </span>
  );
}
