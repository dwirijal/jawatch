import Image from 'next/image';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Link } from '@/components/atoms/Link';
import type { HeroItem } from '@/features/home/home-page-types';
import {
  HERO_DESC_CLAMP_STYLE,
  HERO_FALLBACK_DESCRIPTION,
  HERO_TITLE_CLAMP_STYLE,
  HOME_LANE_LINKS,
  getHeroAuxiliaryTags,
  getThemeLabel,
  normalizeHeroValue,
  toDetailHref,
} from '@/features/home/home-view-helpers';

type HomeHeroStageProps = {
  item: HeroItem;
  secondaryItems: HeroItem[];
};

export function HomeHeroStage({ item, secondaryItems }: HomeHeroStageProps) {
  const itemVariant = item.type === 'series' ? 'drama' : item.type;
  const heroImage = item.image || item.banner || '/favicon.ico';
  const description = normalizeHeroValue(item.description, HERO_FALLBACK_DESCRIPTION);
  const rating = normalizeHeroValue(item.rating, '');
  const auxiliaryTags = getHeroAuxiliaryTags(item);
  const primaryContext = auxiliaryTags[0] || 'Pilihan buat kamu';
  const secondaryContext = auxiliaryTags[1] || null;

  return (
    <section className="surface-panel-elevated relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(209,168,111,0.16),transparent_68%)]" />

      <div className="relative z-10 grid gap-4 p-3.5 sm:gap-6 sm:p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(17rem,20rem)] lg:items-center lg:gap-8 lg:p-8">
        <div className="order-1 flex min-w-0 flex-col gap-4 lg:justify-between lg:gap-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="solid" className="text-[10px]">
                Pilihan
              </Badge>
              <Badge variant={itemVariant} className="text-[10px]">
                {getThemeLabel(item.type)}
              </Badge>
              {rating ? (
                <Badge variant="outline" className="text-[10px]">
                  ★ {rating}
                </Badge>
              ) : null}
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              <h1
                className="max-w-4xl font-[var(--font-heading)] text-[clamp(2rem,8vw,3.35rem)] font-bold leading-[0.94] tracking-[-0.06em] text-foreground sm:text-[clamp(2.3rem,7vw,4.4rem)]"
                style={HERO_TITLE_CLAMP_STYLE}
              >
                {item.title}
              </h1>

              <p className="max-w-[38rem] text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7" style={HERO_DESC_CLAMP_STYLE}>
                {description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground sm:gap-3 sm:text-[11px] sm:tracking-[0.18em]">
              <span>{primaryContext}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-border-strong" />
              <span>{rating ? `Rating ${rating}` : 'Baru update'}</span>
              {secondaryContext ? (
                <>
                  <span className="hidden h-1.5 w-1.5 rounded-full bg-border-strong sm:inline-flex" />
                  <span className="hidden sm:inline">{secondaryContext}</span>
                </>
              ) : null}
            </div>

            <div className="flex items-center gap-2.5 sm:flex-row sm:flex-wrap">
              <Button variant="primary" asChild className="h-11 min-w-0 flex-1 rounded-full px-4 text-sm font-black sm:h-12 sm:w-auto sm:px-5">
                <Link href={toDetailHref(item)}>{item.type === 'manga' ? 'Mulai baca' : 'Mulai nonton'}</Link>
              </Button>
              <Button variant="quiet" asChild className="h-11 rounded-full px-4 text-sm font-black text-foreground/92 sm:h-12 sm:w-auto sm:px-5">
                <Link href={toDetailHref(item)}>Lihat dulu</Link>
              </Button>
            </div>

            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
              {HOME_LANE_LINKS.map((lane) => (
                <Link
                  key={lane.href}
                  href={lane.href}
                  className="focus-tv inline-flex min-h-10 shrink-0 items-center rounded-full border border-border-subtle bg-surface-1 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 hover:bg-surface-elevated hover:text-foreground hover:shadow-sm active:scale-95 sm:min-h-11 sm:px-4 sm:text-[11px] sm:tracking-[0.16em]"
                >
                  {lane.label}
                </Link>
              ))}
            </div>
          </div>

          {secondaryItems.length > 0 ? (
            <div className="hidden space-y-3 border-t border-border-subtle pt-4 lg:block">
              <p className="type-kicker">Lanjut pilih</p>
              <div className="grid gap-3 md:grid-cols-3">
                {secondaryItems.map((secondary) => {
                  const secondaryVariant = secondary.type === 'series' ? 'drama' : secondary.type;
                  const secondaryRating = normalizeHeroValue(secondary.rating, '');

                  return (
                    <Link
                      key={secondary.id}
                      href={toDetailHref(secondary)}
                      className="group flex min-w-0 items-center gap-3 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-1 p-3 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 hover:bg-surface-elevated hover:shadow-md active:scale-95"
                    >
                      <div className="relative h-[4.75rem] w-[3.4rem] shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-border-subtle bg-surface-2">
                        <Image
                          src={secondary.image || secondary.banner || '/favicon.ico'}
                          alt={secondary.title}
                          fill
                          sizes="108px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={secondaryVariant} className="text-[10px]">
                            {getThemeLabel(secondary.type)}
                          </Badge>
                          {secondaryRating ? (
                            <span className="text-[10px] font-semibold text-muted-foreground">★ {secondaryRating}</span>
                          ) : null}
                        </div>
                        <h3 className="line-clamp-2 text-sm font-black tracking-tight text-foreground">
                          {secondary.title}
                        </h3>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <Link
          href={toDetailHref(item)}
          className="focus-tv group relative order-2 overflow-hidden rounded-[var(--radius-xl)] border border-border-subtle bg-[#0d1015] shadow-[0_24px_54px_-24px_var(--shadow-color)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_32px_64px_-24px_var(--shadow-color-strong)] active:scale-[0.98]"
        >
          <div className="relative aspect-[16/9] w-full sm:aspect-[7/5] lg:aspect-[4/5]">
            <Image
              src={heroImage}
              alt={item.title}
              fill
              sizes="(min-width: 1024px) 336px, (min-width: 640px) 92vw, 100vw"
              priority
              fetchPriority="high"
              quality={72}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/12 to-transparent lg:hidden" />
          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2 lg:hidden">
            <Badge variant="solid" className="text-[10px]">
              Pilihan
            </Badge>
            <Badge variant={itemVariant} className="text-[10px]">
              {getThemeLabel(item.type)}
            </Badge>
          </div>
          <div className="absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 sm:p-5 lg:block">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="solid" className="text-[10px]">
                Pilihan
              </Badge>
              <Badge variant={itemVariant} className="text-[10px]">
                {getThemeLabel(item.type)}
              </Badge>
            </div>
            <p className="mt-3 line-clamp-2 text-lg font-black tracking-tight text-white">{item.title}</p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-300">{primaryContext}</p>
          </div>
        </Link>
      </div>
    </section>
  );
}
