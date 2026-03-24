'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Play, BookOpen, LibraryBig, Zap, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchModal } from './SearchModal';
import { useUIStore } from '@/store/useUIStore';
import { AuthNavEntry } from './AuthNavEntry';

export function Navbar() {
  const pathname = usePathname();
  const { device } = useUIStore();

  if (device === 'mobile') return null;

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Movies", href: "/movies", icon: Film },
    { label: "Anime", href: "/anime", icon: Play },
    { label: "Manga", href: "/manga", icon: BookOpen },
    { label: "Donghua", href: "/donghua", icon: Zap },
    { label: "Library", href: "/collection", icon: LibraryBig },
  ];

  return (
    <nav className="sticky top-0 z-[100] w-full bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900">
      <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform">
              <span className="text-zinc-950 font-black text-xl italic">D</span>
            </div>
            <span className="text-xl font-black tracking-tighter italic uppercase text-white">dwizzyWEEB</span>
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-5 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2",
                  pathname === item.href 
                    ? "bg-white text-zinc-950 shadow-lg" 
                    : "text-zinc-500 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <SearchModal />
          <AuthNavEntry />
        </div>
      </div>
    </nav>
  );
}
