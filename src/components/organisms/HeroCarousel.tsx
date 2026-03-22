'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { animate, utils } from 'animejs';
import { Play, Info, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { cn } from '@/lib/utils';
import CircularText from '@/components/atoms/CircularText';

interface HeroItem {
  id: string;
  title: string;
  image: string;
  banner: string;
  description: string;
  type: 'manga' | 'anime' | 'donghua';
  tags: string[];
  rating: string;
}

const MOCK_HERO: HeroItem[] = [
  {
    id: 'borot-sub-indo',
    title: 'Boruto: Two Blue Vortex',
    image: 'https://otakudesu.blog/wp-content/uploads/2020/05/Boruto-Sub-Indo.jpg',
    banner: 'https://otakudesu.blog/wp-content/uploads/2020/05/Boruto-Sub-Indo.jpg',
    description: 'The continuation of the Naruto saga as Boruto Uzumaki faces new threats in a world that has turned against him.',
    type: 'anime',
    tags: ['Action', 'Ninja', 'Shounen'],
    rating: '8.5'
  },
  {
    id: 'komik-one-piece-indo',
    title: 'One Piece',
    image: 'https://thumbnail.komiku.org/uploads/manga/komik-one-piece-indo/manga_thumbnail-Komik-One-Piece.jpg',
    banner: 'https://thumbnail.komiku.org/uploads/manga/komik-one-piece-indo/manga_thumbnail-Komik-One-Piece.jpg',
    description: 'Gol D. Roger was known as the Pirate King, the strongest and most infamous being to have sailed the Grand Line.',
    type: 'manga',
    tags: ['Pirates', 'Adventure', 'Epic'],
    rating: '9.2'
  }
];

export function HeroCarousel() {
  const [index, setIndex] = React.useState(0);
  const active = MOCK_HERO[index];
  const titleRef = React.useRef(null);
  const descRef = React.useRef(null);

  React.useEffect(() => {
    if (titleRef.current && descRef.current) {
      animate([titleRef.current, descRef.current], {
        opacity: [0, 1],
        translateX: [-50, 0],
        delay: utils.stagger(100),
        duration: 1000,
        ease: 'outExpo'
      });
    }
  }, [index]);

  const next = () => setIndex((i) => (i + 1) % MOCK_HERO.length);
  const prev = () => setIndex((i) => (i - 1 + MOCK_HERO.length) % MOCK_HERO.length);

  return (
    <section className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden group">
      <div className="absolute inset-0 transition-all duration-1000">
        <Image 
          src={active.banner} 
          alt="" 
          fill 
          className="object-cover scale-105 blur-3xl opacity-30" 
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/20 to-transparent" />
      </div>

      <div className="relative h-full max-w-7xl mx-auto px-8 flex flex-col justify-center">
        <div className="flex flex-col md:flex-row gap-12 items-center md:items-end">
          {/* Large Poster with Circular Text Decoration */}
          <div className="hidden md:block relative group/poster">
            <div className="w-72 aspect-[2/3] rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/5 animate-in zoom-in-95 duration-700 relative z-10">
              <img src={active.image} alt={active.title} className="w-full h-full object-cover" />
            </div>
            
            {/* The Circular Text Stamp */}
            <div className="absolute -top-10 -right-10 z-20 scale-75 opacity-80 group-hover/poster:scale-90 group-hover/poster:opacity-100 transition-all duration-500">
               <CircularText 
                 text=" • TRENDING • DWIZZYWEEB • HOT • " 
                 spinDuration={15}
                 onHover="goBonkers"
                 className="text-orange-500"
               />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-600/40">
                     <Play className="w-5 h-5 text-white fill-current ml-1" />
                  </div>
               </div>
            </div>
          </div>

          <div className="flex-1 space-y-8 max-w-2xl text-center md:text-left">
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <Badge variant={active.type} className="px-4 py-1 rounded-xl text-xs">{active.type}</Badge>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                <span className="text-[10px] font-black">{active.rating}</span>
              </div>
              {active.tags.map(tag => (
                <Badge key={tag} variant="outline" className="rounded-xl px-3 border-zinc-800 text-zinc-400">{tag}</Badge>
              ))}
            </div>

            <div className="space-y-4">
              <h1 
                ref={titleRef}
                className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic text-white drop-shadow-2xl leading-none"
              >
                {active.title}
              </h1>
              <p 
                ref={descRef}
                className="text-base md:text-lg text-zinc-400 font-medium leading-relaxed line-clamp-3 md:line-clamp-none max-w-xl"
              >
                {active.description}
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <Button variant={active.type} size="lg" className="rounded-2xl px-10 shadow-2xl group/btn" asChild>
                <Link href={`/${active.type}/${active.id}`}>
                  <Play className="w-5 h-5 mr-3 fill-current group-hover/btn:scale-110 transition-transform" />
                  START NOW
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="rounded-2xl border-zinc-800 bg-white/5 backdrop-blur-md px-10" asChild>
                <Link href={`/${active.type}/${active.id}`}>
                  <Info className="w-5 h-5 mr-3" /> DETAILS
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 right-12 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="outline" size="icon" onClick={prev} className="rounded-2xl border-zinc-800 hover:bg-white/10 h-14 w-14">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <Button variant="outline" size="icon" onClick={next} className="rounded-2xl border-zinc-800 hover:bg-white/10 h-14 w-14">
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent" />
    </section>
  );
}
