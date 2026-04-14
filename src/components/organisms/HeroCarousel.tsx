'use client';

import * as React from 'react';
import Image from 'next/image';
import { animate } from 'animejs';
import { ANIMATION_PRESETS } from '@/lib/animations';
import { Play, Info, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Link } from '@/components/atoms/Link';
import { Typography } from '@/components/atoms/Typography';
import CircularText from '@/components/atoms/CircularText';
import { cn } from '@/lib/utils';

export interface HeroItem {
  id: string;
  title: string;
  image: string;
  banner: string;
  description: string;
  type: 'manga' | 'anime' | 'movie' | 'donghua' | 'series';
  tags: string[];
  rating: string;
}

interface HeroCarouselProps {
  items: HeroItem[];
}

const HERO_ACCENTS: Record<HeroItem['type'], string> = {
  anime: 'from-blue-500/45 via-blue-500/10 to-transparent',
  movie: 'from-indigo-500/45 via-indigo-500/10 to-transparent',
  manga: 'from-orange-500/45 via-orange-500/10 to-transparent',
  donghua: 'from-red-500/45 via-red-500/10 to-transparent',
  series: 'from-rose-500/45 via-rose-500/10 to-transparent',
};

export function HeroCarousel({ items }: HeroCarouselProps) {
  const [index, setIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const titleRef = React.useRef(null);
  const descRef = React.useRef(null);
  const hasMultipleSlides = items.length > 1;

  const next = React.useCallback(() => {
    if (items.length <= 1) return;
    setIndex((currentIndex) => (currentIndex + 1) % items.length);
  }, [items.length]);

  const prev = React.useCallback(() => {
    if (items.length <= 1) return;
    setIndex((currentIndex) => (currentIndex - 1 + items.length) % items.length);
  }, [items.length]);

  const goTo = React.useCallback((targetIndex: number) => {
    if (items.length === 0) return;
    const normalizedIndex = ((targetIndex % items.length) + items.length) % items.length;
    setIndex(normalizedIndex);
  }, [items.length]);

  React.useEffect(() => {
    if (items.length > 0 && titleRef.current && descRef.current) {
      animate([titleRef.current, descRef.current], ANIMATION_PRESETS.textReveal);
    }
  }, [index, items.length, isPaused]);

  React.useEffect(() => {
    setIndex(0);
  }, [items]);

  React.useEffect(() => {
    if (!hasMultipleSlides || isPaused) return;
    const interval = window.setInterval(() => {
      setIndex((currentIndex) => (currentIndex + 1) % items.length);
    }, 6500);
    return () => window.clearInterval(interval);
  }, [hasMultipleSlides, isPaused, items.length]);

  if (items.length === 0) {
    return <div className="h-[85vh] w-full animate-pulse rounded-[var(--radius-2xl)] bg-surface-1" />;
  }

  const active = items[index];
  const detailHref =
    active.type === 'movie'
      ? `/movies/${active.id}`
      : active.type === 'series'
        ? `/series/${active.id}`
        : `/${active.type}/${active.id}`;
  const accentVariant = active.type === 'series' ? 'drama' : active.type;
  const previousSlide = hasMultipleSlides ? items[(index - 1 + items.length) % items.length] : null;
  const nextSlide = hasMultipleSlides ? items[(index + 1) % items.length] : null;

  const stage = (
    <div className="relative flex-1 space-y-5 text-center md:max-w-2xl md:space-y-7 md:text-left">
      <div className={cn('pointer-events-none absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gradient-to-br blur-[100px] opacity-40 md:left-4 md:translate-x-0', HERO_ACCENTS[active.type])} />

      <div className="relative z-10 flex flex-wrap justify-center gap-2 md:justify-start md:gap-3">
        <Badge variant="solid" className="rounded-[var(--radius-sm)] px-3 py-1 text-[10px] text-black font-black tracking-widest">
          EDITORIAL CHOICE
        </Badge>
        <div className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-accent/20 bg-accent/10 backdrop-blur-md px-3 py-1">
          <span className="text-[10px] font-black text-accent tracking-widest">98% MATCH</span>
        </div>
        <Badge variant={accentVariant} className="rounded-[var(--radius-sm)] px-3 py-1 text-[10px] font-black tracking-widest uppercase">
          {active.type}
        </Badge>
        <div className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1/50 backdrop-blur-md px-3 py-1 refractive-border">
          <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
          <span className="text-[10px] font-black">{active.rating}</span>
        </div>
      </div>

      <div className="relative z-10 space-y-4 md:space-y-5">
        <div className="overflow-hidden">
          <Typography
            as="h1"
            ref={titleRef}
            size="6xl"
            uppercase
            className="max-w-[12ch] font-black leading-[0.8] tracking-[-0.08em] text-white"
          >
            {active.title}
          </Typography>
        </div>
        <p
          ref={descRef}
          className="max-w-xl line-clamp-3 text-sm leading-relaxed text-zinc-300/90 sm:text-base md:line-clamp-none md:text-xl font-medium tracking-tight"
        >
          {active.description}
        </p>
      </div>

      <div className="relative z-10 flex flex-wrap justify-center gap-3 md:justify-start md:gap-4">
        <Button variant={accentVariant} size="lg" className="group/btn px-8 sm:px-10 md:px-12 h-14 rounded-[var(--radius-md)] text-base" asChild>
          <Link href={detailHref}>
            <Play className="w-5 h-5 mr-3 fill-current group-hover/btn:scale-110 transition-transform" />
            START NOW
          </Link>
        </Button>
        <Button variant="outline" size="lg" className="px-8 sm:px-10 md:px-12 h-14 rounded-[var(--radius-md)] text-base refractive-border glass-noise" asChild>
          <Link href={detailHref}>
            <Info className="w-5 h-5 mr-3" /> DETAILS
          </Link>
        </Button>
      </div>

      {hasMultipleSlides ? (
        <div className="relative z-10 flex items-center justify-center gap-3 md:justify-start pt-2">
          {items.map((item, itemIndex) => (
            <button
              key={`${item.id}-${itemIndex}`}
              type="button"
              onClick={() => goTo(itemIndex)}
              className={cn(
                'h-1.5 rounded-full transition-all duration-500',
                itemIndex === index ? 'w-12 bg-white' : 'w-1.5 bg-white/20 hover:bg-white/40'
              )}
              aria-label={`Go to slide ${itemIndex + 1}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );

  const gallery = (
    <div className="relative mx-auto w-fit group/poster md:mx-0">
      {/* Background Refraction Card */}
      <div className={cn('absolute -inset-10 -z-10 rounded-[var(--radius-2xl)] bg-gradient-to-br blur-[80px] opacity-30', HERO_ACCENTS[active.type])} />

      <div className="relative z-10 aspect-[2/3] w-48 overflow-hidden rounded-[var(--radius-xl)] refractive-border glass-noise bg-surface-1 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] transition-all duration-700 ease-out group-hover/poster:-translate-y-4 group-hover/poster:scale-[1.02] md:w-80">
        <Image
          src={active.image || '/favicon.ico'}
          alt={active.title}
          fill
          sizes="320px"
          className="object-cover transition-transform duration-1000 group-hover/poster:scale-110"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover/poster:opacity-100" />
      </div>

      {previousSlide ? (
        <button
          type="button"
          onClick={prev}
          className="absolute -left-20 top-12 z-0 hidden aspect-[2/3] w-24 overflow-hidden rounded-[var(--radius-lg)] border border-white/5 opacity-30 transition-all duration-500 hover:opacity-60 hover:-translate-x-2 lg:block"
        >
          <Image src={previousSlide.image || '/favicon.ico'} alt={previousSlide.title} fill className="object-cover grayscale" unoptimized />
        </button>
      ) : null}

      {nextSlide ? (
        <button
          type="button"
          onClick={next}
          className="absolute -right-20 top-12 z-0 hidden aspect-[2/3] w-24 overflow-hidden rounded-[var(--radius-lg)] border border-white/5 opacity-30 transition-all duration-500 hover:opacity-60 hover:translate-x-2 lg:block"
        >
          <Image src={nextSlide.image || '/favicon.ico'} alt={nextSlide.title} fill className="object-cover grayscale" unoptimized />
        </button>
      ) : null}

      <div className="absolute -top-12 -right-12 z-20 scale-90 opacity-90 group-hover/poster:scale-110 group-hover/poster:opacity-100 transition-all duration-700 ease-out">
        <CircularText
          text=" • EDITORIAL • DISCOVERY • PREMIUM • "
          spinDuration={20}
          onHover="goBonkers"
          className="text-white/40 font-black"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-xl">
            <Play className="w-6 h-6 fill-current ml-1" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section
      className="relative group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-[85vh] overflow-hidden rounded-[var(--radius-2xl)] border border-border-subtle bg-background shadow-2xl">
        {/* Editorial Background Layers */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={active.banner || '/favicon.ico'}
            alt={active.title}
            fill
            sizes="100vw"
            className="object-cover opacity-[0.25] scale-110 blur-[2px] transition-transform duration-[10s] ease-linear group-hover:scale-100"
            unoptimized
          />
          <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay" />
        </div>
        
        {/* Ambient Muted Green Overlays */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-accent/20 via-transparent to-transparent opacity-60" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        <div className="app-container-wide relative z-10 h-full py-8 sm:py-10 lg:py-14">
          <div className="grid h-full grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12">
            <section>{stage}</section>
            <aside className="hidden md:block">{gallery}</aside>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-[30] flex gap-4">
        <Button variant="outline" size="icon" onClick={prev} className="focus-tv h-14 w-14 rounded-full border-white/10 bg-black/20 backdrop-blur-xl hover:bg-white hover:text-black transition-all">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Button variant="outline" size="icon" onClick={next} className="focus-tv h-14 w-14 rounded-full border-white/10 bg-black/20 backdrop-blur-xl hover:bg-white hover:text-black transition-all">
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>
    </section>
  );
}
