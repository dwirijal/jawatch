"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useUIStore } from "@/store/useUIStore";
import { Search, Play, Shuffle, History, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Editorial Command Bar (⌘/Ctrl + K)
 * 
 * A central action hub for quick navigation and discovery.
 * Uses a "Muted Green" palette:
 * - Forest Surface: #121a12
 * - Sage Mist: #a3b1a3
 */
export const CommandBar = () => {
  const { isCommandBarOpen, setCommandBarOpen } = useUIStore();
  const [search, setSearch] = React.useState("");

  // Handle keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandBarOpen(!isCommandBarOpen);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isCommandBarOpen, setCommandBarOpen]);

  // Reset search when closing
  React.useEffect(() => {
    if (!isCommandBarOpen) {
      setSearch("");
    }
  }, [isCommandBarOpen]);

  return (
    <AnimatePresence>
      {isCommandBarOpen && (
        <Dialog.Root open={isCommandBarOpen} onOpenChange={setCommandBarOpen}>
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className={cn(
                  "fixed left-1/2 top-[15%] z-[101] w-full max-w-2xl -translate-x-1/2 overflow-hidden",
                  "rounded-2xl border border-white/10 shadow-2xl",
                  "bg-[#121a12] text-[#e0e0e0] font-sans" // Forest Surface
                )}
              >
                {/* Search Input Section */}
                <div className="flex items-center border-b border-white/5 px-4 py-4">
                  <Search className="mr-3 h-5 w-5 text-[#a3b1a3]" />
                  <input
                    autoFocus
                    placeholder="Type a command or search..."
                    className="flex-1 bg-transparent text-lg outline-none placeholder:text-[#a3b1a3]/40"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <div className="flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[10px] font-black text-[#a3b1a3]/60">
                    <span>ESC</span>
                  </div>
                </div>

                {/* Content Sections */}
                <div className="max-h-[60vh] overflow-y-auto p-4 scrollbar-hide">
                  {/* Quick Actions */}
                  <section className="mb-8">
                    <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#a3b1a3]/40">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button className="group flex items-center gap-3 rounded-xl bg-white/[0.03] p-3 text-left transition-all hover:bg-white/[0.08] hover:translate-y-[-1px]">
                        <div className="rounded-lg bg-[#a3b1a3]/10 p-2 transition-colors group-hover:bg-[#a3b1a3]/20">
                          <Play className="h-4 w-4 text-[#a3b1a3]" />
                        </div>
                        <div>
                          <div className="text-sm font-bold">Resume Reading</div>
                          <div className="text-[10px] text-[#a3b1a3]/40">Continue your last session</div>
                        </div>
                      </button>
                      <button className="group flex items-center gap-3 rounded-xl bg-white/[0.03] p-3 text-left transition-all hover:bg-white/[0.08] hover:translate-y-[-1px]">
                        <div className="rounded-lg bg-[#a3b1a3]/10 p-2 transition-colors group-hover:bg-[#a3b1a3]/20">
                          <Shuffle className="h-4 w-4 text-[#a3b1a3]" />
                        </div>
                        <div>
                          <div className="text-sm font-bold">Shuffle Shorts</div>
                          <div className="text-[10px] text-[#a3b1a3]/40">Discover something new</div>
                        </div>
                      </button>
                    </div>
                  </section>

                  {/* Recently Viewed */}
                  <section className="mb-8">
                    <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#a3b1a3]/40">
                      Recently Viewed
                    </h3>
                    <div className="space-y-1">
                      {[
                        { title: "Solo Leveling", type: "Anime", date: "2h ago" },
                        { title: "The Beginning After The End", type: "Manga", date: "5h ago" },
                        { title: "Omniscient Reader's Viewpoint", type: "Manhwa", date: "Yesterday" },
                      ].map((item, i) => (
                        <button
                          key={i}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.05]"
                        >
                          <div className="flex items-center gap-3">
                            <History className="h-4 w-4 text-[#a3b1a3]/30" />
                            <span className="text-sm font-medium">{item.title}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#a3b1a3]/30">
                              {item.type}
                            </span>
                            <span className="text-[10px] text-[#a3b1a3]/40">{item.date}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Trending Tags */}
                  <section>
                    <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#a3b1a3]/40">
                      Trending Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {["Action", "Fantasy", "Romance", "Sci-Fi", "Horror", "Comedy", "Drama"].map((tag) => (
                        <button
                          key={tag}
                          className="flex items-center gap-1.5 rounded-full border border-[#a3b1a3]/10 bg-[#a3b1a3]/05 px-3 py-1.5 text-xs font-bold text-[#a3b1a3]/80 transition-all hover:bg-[#a3b1a3]/15 hover:border-[#a3b1a3]/30"
                        >
                          <Tag className="h-3 w-3 text-[#a3b1a3]/60" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Footer / Shortcuts Info */}
                <div className="border-t border-white/5 bg-black/20 px-4 py-3 text-[10px] text-[#a3b1a3]/30">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1.5">
                        <kbd className="rounded bg-white/5 px-1.5 py-0.5 font-sans border border-white/5">↑↓</kbd> Navigate
                      </span>
                      <span className="flex items-center gap-1.5">
                        <kbd className="rounded bg-white/5 px-1.5 py-0.5 font-sans border border-white/5">↵</kbd> Select
                      </span>
                    </div>
                    <span className="font-black uppercase tracking-widest opacity-50">Editorial Command Hub</span>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </AnimatePresence>
  );
};
