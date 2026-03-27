import { ShieldAlert } from 'lucide-react';
import { Paper } from '@/components/atoms/Paper';
import { cn, ThemeType } from '@/lib/utils';

interface AdsProps {
  type?: 'horizontal' | 'vertical' | 'square';
  compact?: boolean;
  className?: string;
  theme?: ThemeType;
}

const ADS_SIZES = {
  horizontal: 'min-h-32 w-full md:min-h-40',
  vertical: 'h-[600px] w-full max-w-sm',
  square: 'aspect-square w-full',
} as const;

export function Ads({ type = 'horizontal', compact = false, className, theme }: AdsProps) {
  return (
    <Paper
      data-theme={theme}
      tone="muted"
      shadow="sm"
      className={cn(
        'relative overflow-hidden border border-border-subtle/80 bg-surface-1',
        ADS_SIZES[type],
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.05),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.03),transparent_30%)]" />
      <div
        className={cn(
          'relative flex h-full min-h-full flex-col items-center justify-center text-center',
          compact ? 'gap-2 px-4 py-3.5' : 'gap-3 px-6 py-8'
        )}
      >
        <div
          className={cn(
            'inline-flex items-center justify-center border border-border-subtle bg-accent-soft text-accent',
            compact ? 'h-9 w-9 rounded-xl' : 'h-12 w-12 rounded-2xl'
          )}
        >
          <ShieldAlert className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-accent">Partner Spotlight</p>
          <p className={cn('text-zinc-400', compact ? 'max-w-[14rem] text-[11px] leading-4' : 'max-w-xs text-xs leading-5')}>
            Active sponsor campaigns and network promotions appear here when available.
          </p>
        </div>
      </div>
    </Paper>
  );
}
