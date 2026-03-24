'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Play, Search, Zap, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';
import { AuthMobileEntry } from './AuthMobileEntry';

export function MobileNav() {
  const pathname = usePathname();
  const { device, setSearchOpen } = useUIStore();

  if (device !== 'mobile') return null;

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Movies", href: "/movies", icon: Film },
    { label: "Search", onClick: () => setSearchOpen(true), icon: Search, isAction: true },
    { label: "Anime", href: "/anime", icon: Play },
    { label: "Donghua", href: "/donghua", icon: Zap },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-black/80 backdrop-blur-xl border-t border-zinc-800 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          if (item.isAction) {
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="flex flex-col items-center justify-center gap-1 text-zinc-500"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
              </button>
            );
          }

          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all",
                isActive ? "text-white scale-110" : "text-zinc-500"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "fill-current")} />
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </Link>
          );
        })}
        <AuthMobileEntry />
      </div>
    </div>
  );
}
