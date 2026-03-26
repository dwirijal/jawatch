'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type TextareaAutosizeProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const TextareaAutosize = React.forwardRef<HTMLTextAreaElement, TextareaAutosizeProps>(
  ({ className, onChange, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

    const setRefs = (node: HTMLTextAreaElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    };

    const resize = React.useCallback(() => {
      const node = innerRef.current;
      if (!node) return;
      node.style.height = '0px';
      node.style.height = `${node.scrollHeight}px`;
    }, []);

    React.useEffect(() => {
      resize();
    }, [resize, props.value]);

    return (
      <textarea
        ref={setRefs}
        className={cn(
          'min-h-[2.75rem] w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-500 focus:border-zinc-700',
          className
        )}
        onChange={(event) => {
          resize();
          onChange?.(event);
        }}
        {...props}
      />
    );
  }
);

TextareaAutosize.displayName = 'TextareaAutosize';
