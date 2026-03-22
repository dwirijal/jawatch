'use client';

import Link from "next/link"
import * as Tabs from "@radix-ui/react-tabs"
import { Calendar, ChevronRight } from "lucide-react"
import { AnimeSchedule } from "@/lib/api"
import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/atoms/ScrollArea"
import { MediaCard } from "@/components/molecules/MediaCard"

interface ReleaseCalendarProps {
  schedule: AnimeSchedule[];
  theme?: "anime" | "donghua";
}

export function ReleaseCalendar({ schedule, theme = "anime" }: ReleaseCalendarProps) {
  const currentDay = new Intl.DateTimeFormat('id-ID', { weekday: 'long' }).format(new Date());
  
  const themeColors = {
    anime: "data-[state=active]:text-blue-500 data-[state=active]:border-blue-500 hover:text-blue-400",
    donghua: "data-[state=active]:text-red-500 data-[state=active]:border-red-500 hover:text-red-400",
  };

  const activeBg = {
    anime: "data-[state=active]:bg-blue-500/10",
    donghua: "data-[state=active]:bg-red-500/10",
  };

  return (
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
        <div className="flex items-center gap-3">
          <Calendar className={cn("w-6 h-6", theme === "anime" ? "text-blue-500" : "text-red-500")} />
          <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase">Weekly Schedule</h2>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
          Scroll to view more <ChevronRight className="w-3 h-3" />
        </div>
      </div>
      
      <Tabs.Root defaultValue={currentDay} className="flex flex-col">
        <ScrollArea className="w-full mb-8">
          <Tabs.List className="flex border-b border-zinc-900 gap-2 pb-2">
            {schedule.map((day) => (
              <Tabs.Trigger
                key={day.day}
                value={day.day}
                className={cn(
                  "px-6 py-3 rounded-t-xl text-xs font-black uppercase tracking-widest transition-all border-b-2 border-transparent text-zinc-500 whitespace-nowrap",
                  themeColors[theme],
                  activeBg[theme]
                )}
              >
                {day.day}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {schedule.map((day) => (
          <Tabs.Content key={day.day} value={day.day} className="outline-none animate-in fade-in slide-in-from-left-2 duration-500">
            <ScrollArea className="w-full">
              <div className="flex gap-6 pb-6">
                {day.anime_list.map((item, idx) => (
                  <div key={`${item.slug}-${idx}`} className="flex-shrink-0 w-40 md:w-48">
                    <MediaCard
                      href={`/anime/${item.slug}`}
                      image={item.thumb}
                      title={item.title}
                      subtitle={item.episode}
                      badgeText={item.status !== "??" ? `Ep ${item.status}` : "TBA"}
                      theme={theme}
                    />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
}
