'use client';

import * as React from 'react';
import Image from 'next/image';
import { animate } from 'animejs';
import { ANIMATION_PRESETS } from '@/lib/animations';
import { Play, Info, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Link } from '@/components/atoms/Link';
import CircularText from '@/components/atoms/CircularText';
import { cn } from '@/lib/utils';

export interface HeroItem {
  id: string;
  title: string;
  image: string;
  banner: string;
  description: string;
  type: 'manga' | 'anime' | 'movie' | 'donghua';
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
    return <div className="h-[64vh] w-full animate-pulse rounded-[var(--radius-2xl)] bg-surface-1 md:h-[78vh]" />;
  }

  const active = items[index];
  const detailHref = active.type === 'movie' ? `/movies/${active.id}` : `/${active.type}/${active.id}`;
  const previousSlide = hasMultipleSlides ? items[(index - 1 + items.length) % items.length] : null;
  const nextSlide = hasMultipleSlides ? items[(index + 1) % items.length] : null;

  const stage = (
    <div className="relative flex-1 space-y-5 text-center md:max-w-2xl md:space-y-6 md:text-left">
      <div className={cn('pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-gradient-to-br blur-3xl md:left-4 md:translate-x-0', HERO_ACCENTS[active.type])} />

      <div className="relative z-10 flex flex-wrap justify-center gap-2 md:justify-start md:gap-2.5">
        <Badge variant="solid" className="rounded-[var(--radius-sm)] px-3 py-1 text-[10px] text-black sm:px-4 sm:text-xs">
          FEATURED
        </Badge>
        <Badge variant={active.type} className="rounded-[var(--radius-sm)] px-3 py-1 text-[10px] sm:px-4 sm:text-xs">
          {active.type}
        </Badge>
        <div className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-3 py-1">
          <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
          <span className="text-[10px] font-black">{active.rating}</span>
        </div>
        {active.tags.map((tag) => (
          <Badge key={tag} variant="outline" className="rounded-[var(--radius-sm)] border-zinc-700 px-2.5 text-[9px] text-zinc-300 sm:px-3 sm:text-[10px]">
            {tag}
          </Badge>
        ))}
        <Badge variant="outline" className="rounded-[var(--radius-sm)] border-white/20 px-2.5 text-[9px] text-zinc-200 sm:px-3 sm:text-[10px]">
          Slide {index + 1} / {items.length}
        </Badge>
      </div>

      <div className="relative z-10 space-y-3 md:space-y-4">
        <h1 ref={titleRef} className="type-display max-w-[12ch] bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
          {active.title}
        </h1>
        <p
          ref={descRef}
          className="max-w-xl line-clamp-3 text-sm leading-relaxed text-zinc-300 sm:text-base md:line-clamp-none md:text-lg"
        >
          {active.description}
        </p>
      </div>

      <div className="relative z-10 flex flex-wrap justify-center gap-3 md:justify-start md:gap-3.5">
        <Button variant={active.type} size="lg" className="group/btn px-6 sm:px-8 md:px-10" asChild>
          <Link href={detailHref}>
            <Play className="w-5 h-5 mr-3 fill-current group-hover/btn:scale-110 transition-transform" />
            START NOW
          </Link>
        </Button>
        <Button variant="outline" size="lg" className="px-6 sm:px-8 md:px-10" asChild>
          <Link href={detailHref}>
            <Info className="w-5 h-5 mr-3" /> DETAILS
          </Link>
        </Button>
      </div>

      {hasMultipleSlides ? (
        <div className="relative z-10 flex items-center justify-center gap-2 md:justify-start">
          {items.map((item, itemIndex) => (
            <button
              key={`${item.id}-${itemIndex}`}
              type="button"
              onClick={() => goTo(itemIndex)}
              className={cn(
                'h-2.5 rounded-full transition-all',
                itemIndex === index ? 'w-8 bg-white' : 'w-2.5 bg-white/35 hover:bg-white/60'
              )}
              aria-label={`Go to slide ${itemIndex + 1}: ${item.title}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );

  const gallery = (
    <div className="relative mx-auto w-fit group/poster md:mx-0">
      <div className={cn('absolute -inset-3 -z-10 rounded-[var(--radius-2xl)] bg-gradient-to-br blur-2xl', HERO_ACCENTS[active.type])} />

      <div className="relative z-10 aspect-[2/3] w-44 overflow-hidden rounded-[var(--radius-xl)] border border-border-subtle bg-surface-1 hard-shadow-md transition-transform duration-500 group-hover/poster:-translate-y-1 md:w-72">
        <Image
          src={active.image || '/favicon.ico'}
          alt={active.title}
          fill
          sizes="288px"
          className="object-cover"
          unoptimized
        />
      </div>

      {previousSlide ? (
        <button
          type="button"
          onClick={prev}
          className="absolute -left-14 top-8 z-0 hidden aspect-[2/3] w-20 overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle opacity-55 transition hover:opacity-85 lg:block"
          aria-label={`Previous slide: ${previousSlide.title}`}
        >
          <Image src={previousSlide.image || '/favicon.ico'} alt={previousSlide.title} fill className="object-cover" unoptimized />
        </button>
      ) : null}

      {nextSlide ? (
        <button
          type="button"
          onClick={next}
          className="absolute -right-14 top-8 z-0 hidden aspect-[2/3] w-20 overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle opacity-55 transition hover:opacity-85 lg:block"
          aria-label={`Next slide: ${nextSlide.title}`}
        >
          <Image src={nextSlide.image || '/favicon.ico'} alt={nextSlide.title} fill className="object-cover" unoptimized />
        </button>
      ) : null}

      <div className="absolute -top-10 -right-10 z-20 scale-75 opacity-80 group-hover/poster:scale-90 group-hover/poster:opacity-100 transition-all duration-500">
        <CircularText
          text=" • TRENDING • DWIZZYWEEB • HOT • "
          spinDuration={15}
          onHover="goBonkers"
          className="text-orange-500"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-600 hard-shadow-sm">
            <Play className="w-5 h-5 text-white fill-current ml-1" />
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
      <div className="relative h-[64vh] overflow-hidden rounded-[var(--radius-2xl)] border border-border-subtle bg-surface-1 hard-shadow-md md:h-[78vh]">
        <div className="absolute inset-0">
          <Image
            src={active.banner || '/favicon.ico'}
            alt={active.title}
            fill
            sizes="100vw"
            className="object-cover opacity-35 scale-105"
            unoptimized
          />
        </div>
        <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-tr', HERO_ACCENTS[active.type])} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/82 via-black/45 to-black/78" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/25" />

        <div className="app-container-wide relative z-10 h-full py-6 sm:py-8 lg:py-10">
          <div className="grid h-full grid-cols-1 items-end gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-8">
            <section>{stage}</section>
            <aside>{gallery}</aside>
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 right-5 z-[30] flex gap-3 sm:bottom-8 sm:right-8">
        <Button variant="outline" size="icon" onClick={prev} className="focus-tv h-14 w-14">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Button variant="outline" size="icon" onClick={next} className="focus-tv h-14 w-14">
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>
    </section>
  );
}
