import * as React from 'react';
import { LucideIcon, Play } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { cn, THEME_CONFIG, ThemeType } from '@/lib/utils';

interface DetailAction {
  href: string;
  label: string;
  icon?: LucideIcon;
  variant?: 'solid' | 'outline';
}

interface DetailActionCardProps {
  title: string;
  description: string;
  theme: ThemeType;
  actions: DetailAction[];
  className?: string;
}

export function DetailActionCard({ title, description, theme, actions, className }: DetailActionCardProps) {
  const config = THEME_CONFIG[theme] || THEME_CONFIG.default;

  return (
    <Paper
      as="section"
      tone="muted"
      shadow="sm"
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-2xl)] px-5 py-5 md:px-6 md:py-6',
        'bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]',
        className
      )}
    >
      <Play className={cn('absolute -bottom-10 -right-10 h-32 w-32 text-white/5', theme === 'movie' ? '-rotate-12' : 'rotate-12')} />

      <div className="relative z-10 space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-black uppercase tracking-tight text-white md:text-xl">{title}</h3>
          <p className="text-sm leading-6 text-zinc-400">{description}</p>
        </div>

        <div className="flex flex-col gap-2.5">
          {actions.map((action) => {
            const Icon = action.icon ?? Play;
            return (
              <Button
                key={action.href}
                variant={action.variant === 'outline' ? 'outline' : theme}
                className={cn(
                  'h-11 w-full justify-center rounded-[var(--radius-sm)] md:h-12',
                  action.variant === 'outline' && cn('border-border-subtle bg-surface-1 hover:bg-surface-elevated', config.border)
                )}
                asChild
              >
                <Link href={action.href}>
                  {action.label}
                  <Icon className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            );
          })}
        </div>
      </div>
    </Paper>
  );
}
