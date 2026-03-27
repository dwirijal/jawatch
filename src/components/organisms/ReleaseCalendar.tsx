'use client';

import * as Tabs from "@radix-ui/react-tabs"
import { Calendar, ChevronRight } from "lucide-react"
import type { AnimeSchedule } from "@/lib/types"
import { Paper } from "@/components/atoms/Paper"
import { cn } from "@/lib/utils"
import { Card } from "@/components/atoms/Card"
import { ScrollArea, ScrollBar } from "@/components/atoms/ScrollArea"
import { SectionHeader } from "@/components/molecules/SectionHeader"
import { CardRail } from '@/components/molecules/card';

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
      <SectionHeader
        title="Weekly Schedule"
        icon={Calendar}
        action={
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
            Scroll to view more <ChevronRight className="w-3 h-3" />
          </div>
        }
      />

      <Tabs.Root defaultValue={currentDay} className="flex flex-col">
        <Paper tone="muted" shadow="sm" padded={false} className="overflow-hidden">
          <ScrollArea className="mb-6 w-full">
            <Tabs.List className="flex gap-2 border-b border-border-subtle px-3 pb-2 pt-3">
              {schedule.map((day) => (
                <Tabs.Trigger
                  key={day.day}
                  value={day.day}
                  className={cn(
                    "whitespace-nowrap rounded-[var(--radius-sm)] border border-transparent px-4 py-2 text-xs font-black uppercase tracking-widest text-zinc-500 transition-all",
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
            <Tabs.Content key={day.day} value={day.day} className="animate-in fade-in slide-in-from-left-2 px-3 pb-3 outline-none duration-500">
              <ScrollArea className="w-full">
                <CardRail variant="compact">
                  {day.anime_list.map((item, idx) => (
                    <Card
                      key={`${item.slug}-${idx}`}
                      href={`/anime/${item.slug}`}
                      image={item.thumb}
                      title={item.title}
                      subtitle={item.episode}
                      badgeText={item.status !== "??" ? `Ep ${item.status}` : "TBA"}
                      theme={theme}
                    />
                  ))}
                </CardRail>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </Tabs.Content>
          ))}
        </Paper>
      </Tabs.Root>
    </div>
  );
}
