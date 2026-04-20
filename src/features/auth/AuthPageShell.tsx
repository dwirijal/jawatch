import type { ReactNode } from 'react';
import { BookOpenText, Film, Sparkles, Tv2, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import { ThemeToggle } from '@/components/molecules/ThemeToggle';

type AuthPageMode = 'login' | 'signup';
type ServerFormAction = (formData: FormData) => void | Promise<void>;
type HeroCard = {
  description: string;
  Icon: LucideIcon;
  label: string;
};

type HeroContent = {
  badges: Array<{
    label: string;
    variant: 'outline' | 'solid';
  }>;
  cards: HeroCard[];
  description: string;
  heading: string;
};

export type AuthStatusNotice = {
  message: string;
  tone: 'error' | 'success';
};

type AuthPageShellProps = {
  children: ReactNode;
  description: string;
  discordAction: ServerFormAction;
  googleAction: ServerFormAction;
  kicker: string;
  mode: AuthPageMode;
  notices: AuthStatusNotice[];
  primaryFooterHref: string;
  primaryFooterLabel: string;
  secondaryFooterHref: string;
  secondaryFooterLabel: string;
  title: string;
};

const HERO_CONTENT: Record<AuthPageMode, HeroContent> = {
  login: {
    badges: [
      { label: 'Akses jawatch', variant: 'solid' },
      { label: 'Nonton dulu', variant: 'outline' },
      { label: 'Baca nyaman', variant: 'outline' },
    ],
    heading: 'Satu akun buat nonton dan baca.',
    description:
      'Masuk ke jawatch untuk lanjut anime, series, film, dan komik dari perangkat apa pun.',
    cards: [
      {
        Icon: Film,
        label: 'Film',
        description: 'Cari film, lanjutkan tontonan, dan buka detail lebih cepat.',
      },
      {
        Icon: Tv2,
        label: 'Series',
        description: 'Episode tetap dekat ke pemutar buat sesi maraton.',
      },
      {
        Icon: BookOpenText,
        label: 'Komik',
        description: 'Manga, manhwa, dan manhua gampang dilanjutkan.',
      },
    ],
  },
  signup: {
    badges: [
      { label: 'Akses jawatch', variant: 'solid' },
      { label: 'Mulai rapi', variant: 'outline' },
      { label: 'Koleksi siap', variant: 'outline' },
    ],
    heading: 'Bikin akun buat simpan tontonan.',
    description:
      'Buat akun jawatch untuk menyimpan koleksi, lanjut onboarding, dan menjaga progres nonton serta baca.',
    cards: [
      {
        Icon: Film,
        label: 'Film',
        description: 'Lanjut nonton lebih cepat dan rak tetap rapi.',
      },
      {
        Icon: Tv2,
        label: 'Series',
        description: 'Riwayat episode dan tontonan tersimpan rapi.',
      },
      {
        Icon: BookOpenText,
        label: 'Komik',
        description: 'Progres baca ikut tersimpan di koleksi kamu.',
      },
    ],
  },
};

function StatusNotice({ tone, message }: AuthStatusNotice) {
  const toneStyle =
    tone === 'error'
      ? {
          borderColor: 'var(--theme-donghua-border)',
          background: 'var(--theme-donghua-surface)',
          color: 'var(--theme-donghua-text)',
        }
      : {
          borderColor: 'var(--theme-movie-border)',
          background: 'var(--theme-movie-surface)',
          color: 'var(--theme-movie-text)',
        };

  return (
    <div className="rounded-[var(--radius-md)] border px-4 py-3 text-sm font-medium" style={toneStyle}>
      {message}
    </div>
  );
}

export function AuthPageShell({
  children,
  description,
  discordAction,
  googleAction,
  kicker,
  mode,
  notices,
  primaryFooterHref,
  primaryFooterLabel,
  secondaryFooterHref,
  secondaryFooterLabel,
  title,
}: AuthPageShellProps) {
  const hero = HERO_CONTENT[mode];

  return (
    <main className="app-shell">
      <div className="app-container-wide py-4 sm:py-6 lg:py-8">
        <div className="mb-4 flex justify-end sm:mb-5">
          <ThemeToggle compact />
        </div>

        <section className="surface-panel-elevated grid gap-4 p-3 sm:gap-5 sm:p-4 lg:grid-cols-[minmax(0,1.18fr)_minmax(21rem,25rem)] lg:gap-6 lg:p-6">
          <div className="order-2 relative overflow-hidden rounded-[var(--radius-xl)] border border-white/8 bg-[linear-gradient(160deg,rgba(16,18,24,0.98)_0%,rgba(24,18,14,0.95)_56%,rgba(42,29,18,0.92)_100%)] p-4 text-white shadow-[0_28px_80px_-40px_rgba(0,0,0,0.72)] sm:p-6 lg:order-1 lg:p-7">
            <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_62%)]" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(circle_at_bottom_right,rgba(209,168,111,0.24),transparent_55%)]" />

            <div className="relative z-10 flex h-full flex-col justify-between gap-5 lg:gap-8">
              <div className="space-y-3.5 sm:space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {hero.badges.map((badge) => (
                    <Badge
                      key={badge.label}
                      variant={badge.variant}
                      className={
                        badge.variant === 'solid' ? 'text-[10px]' : 'border-white/18 bg-white/8 text-white'
                      }
                    >
                      {badge.label}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-3">
                  <h1 className="max-w-[10ch] font-[var(--font-heading)] text-[clamp(2rem,10vw,4.8rem)] font-bold leading-[0.94] tracking-[-0.06em] text-white">
                    {hero.heading}
                  </h1>
                  <p className="max-w-xl text-sm leading-6 text-zinc-100 sm:text-base sm:leading-7">{hero.description}</p>
                </div>
              </div>

              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 sm:hidden">
                {hero.cards.map(({ description: cardDescription, Icon, label }) => (
                  <div
                    key={label}
                    className="min-w-[15rem] shrink-0 rounded-[var(--radius-md)] border border-white/12 bg-white/6 p-3 backdrop-blur"
                  >
                    <Icon className="h-5 w-5 text-white" />
                    <p className="mt-3 text-sm font-bold text-white">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-200">{cardDescription}</p>
                  </div>
                ))}
              </div>

              <div className="hidden gap-3 sm:grid sm:grid-cols-3">
                {hero.cards.map(({ description: cardDescription, Icon, label }) => (
                  <div
                    key={label}
                    className="rounded-[var(--radius-md)] border border-white/12 bg-white/6 p-3 backdrop-blur"
                  >
                    <Icon className="h-5 w-5 text-white" />
                    <p className="mt-3 text-sm font-bold text-white">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-200">{cardDescription}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-1 flex flex-col gap-4 lg:order-2">
            <div className="space-y-2">
              <p className="type-kicker">{kicker}</p>
              <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">{title}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{description}</p>
            </div>

            {notices.map((notice) => (
              <StatusNotice key={`${notice.tone}-${notice.message}`} {...notice} />
            ))}

            <div className="grid gap-3">
              <form action={googleAction} className="contents">
                <Button type="submit" variant="primary" className="w-full justify-center gap-2 text-[10px] uppercase tracking-[0.12em] sm:gap-3 sm:text-[11px] sm:tracking-[0.16em]">
                  <Sparkles className="h-4 w-4" />
                  Lanjut dengan Google
                </Button>
              </form>

              <form action={discordAction} className="contents">
                <Button type="submit" variant="secondary" className="w-full justify-center gap-2 text-[10px] uppercase tracking-[0.12em] sm:gap-3 sm:text-[11px] sm:tracking-[0.16em]">
                  <Sparkles className="h-4 w-4" />
                  Lanjut dengan Discord
                </Button>
              </form>
            </div>

            {children}

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <Link href={primaryFooterHref} className="font-semibold text-foreground transition-colors hover:text-zinc-600">
                {primaryFooterLabel}
              </Link>
              <Link href={secondaryFooterHref} className="font-semibold text-foreground transition-colors hover:text-zinc-600">
                {secondaryFooterLabel}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
