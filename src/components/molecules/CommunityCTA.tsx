import { MessageSquare, ExternalLink } from 'lucide-react';
import { Paper } from '@/components/atoms/Paper';
import { cn, THEME_CONFIG, ThemeType } from '@/lib/utils';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';

interface CommunityCTAProps {
  mediaId: string;
  title: string;
  type: string;
  theme?: ThemeType;
}

export function CommunityCTA({ title, type, theme = 'default' }: CommunityCTAProps) {
  const config = THEME_CONFIG[theme] || THEME_CONFIG.default;

  return (
    <section className="pt-3">
      <Paper
        as="div"
        tone="muted"
        shadow="sm"
        className={cn(
          'group relative overflow-hidden rounded-[var(--radius-2xl)] px-[var(--space-xl)] py-8 transition-colors duration-500 hover:bg-surface-elevated md:px-8 md:py-10'
        )}
      >
        <MessageSquare className="absolute -bottom-10 -right-10 h-32 w-32 rotate-6 text-muted-foreground/20 transition-transform duration-700 group-hover:scale-110 md:h-40 md:w-40" />

        <div className="relative z-10 flex flex-col gap-[var(--space-lg)] md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3.5">
            <div className={cn('inline-flex h-[var(--size-control-lg)] w-[var(--size-control-lg)] items-center justify-center rounded-2xl border border-border-subtle bg-surface-1', config.glow)}>
              <MessageSquare className={cn('h-5 w-5', config.text)} />
            </div>
            <div className="space-y-2.5">
              <Typography as="h2" size="2xl" className="text-[var(--accent-contrast)] leading-tight md:text-3xl">
                Lanjut ngobrol soal <span className={config.text}>{type}</span> <span className="italic">{title}</span> bareng komunitas.
              </Typography>
              <p className="max-w-xl text-xs font-medium leading-relaxed text-muted-foreground md:text-sm">
                FUDCOURT jadi tempat buat bahas episode baru, teori, chapter favorit, dan cari rekomendasi konten berikutnya.
              </p>
            </div>
          </div>

          <Button variant={theme} size="lg" className="h-[var(--size-control-lg)] rounded-[var(--radius-sm)] px-[var(--space-xl)] text-sm md:h-14 md:px-8 md:text-base" asChild>
            <a href="https://discord.gg/gu5bgTXxhQ" target="_blank" rel="noopener noreferrer">
              Gabung komunitas
              <ExternalLink className="ml-2.5 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 md:ml-3 md:h-5 md:w-5" />
            </a>
          </Button>
        </div>
      </Paper>
    </section>
  );
}
