"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useUIStore } from "@/store/useUIStore";
import { Search, Play, Shuffle, History, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Editorial Command Bar (⌘/Ctrl + K)
 * A central action hub for quick navigation and discovery.
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
                className="fixed inset-0 z-[100] bg-surface-1/60 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                className={cn(
                  "fixed left-1/2 top-[15%] z-[101] w-full max-w-2xl -translate-x-1/2 overflow-hidden",
                  "rounded-2xl border border-border-subtle shadow-2xl",
                  "bg-surface-1 font-sans text-foreground"
                )}
              >
                {/* Search Input Section */}
                <div className="flex items-center border-b border-white/5 px-[var(--space-md)] py-[var(--space-md)]">
                  <Search className="mr-3 h-5 w-5 text-[var(--accent)]" />
                  <input
                    autoFocus
                    placeholder="Type a command or search..."
                    className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <div className="flex items-center gap-[var(--space-2xs)] rounded-md bg-surface-2 px-[var(--space-xs)] py-[var(--space-2xs)] text-[var(--type-size-xs)] font-black text-muted-foreground">
                    <span>ESC</span>
                  </div>
                </div>

                {/* Content Sections */}
                <div className="max-h-[60vh] overflow-y-auto p-[var(--space-md)] scrollbar-hide">
                  {/* Quick Actions */}
                  <section className="mb-8">
                    <h3 className="mb-3 text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 gap-[var(--space-xs)] sm:grid-cols-2">
                      <button className="group flex items-center gap-[var(--space-sm)] rounded-xl bg-surface-2/60 p-[var(--space-sm)] text-left transition-all hover:translate-y-[-1px] hover:bg-surface-elevated">
                        <div className="rounded-lg bg-accent-soft p-[var(--space-xs)] transition-colors group-hover:bg-surface-elevated">
                          <Play className="h-4 w-4 text-[var(--accent)]" />
                        </div>
                        <div>
                          <div className="text-sm font-bold">Resume Reading</div>
                          <div className="text-[var(--type-size-xs)] text-muted-foreground">Continue your last session</div>
                        </div>
                      </button>
                      <button className="group flex items-center gap-[var(--space-sm)] rounded-xl bg-surface-2/60 p-[var(--space-sm)] text-left transition-all hover:translate-y-[-1px] hover:bg-surface-elevated">
                        <div className="rounded-lg bg-accent-soft p-[var(--space-xs)] transition-colors group-hover:bg-surface-elevated">
                          <Shuffle className="h-4 w-4 text-[var(--accent)]" />
                        </div>
                        <div>
                          <div className="text-sm font-bold">Surprise Me</div>
                          <div className="text-[var(--type-size-xs)] text-muted-foreground">Discover something new</div>
                        </div>
                      </button>
                    </div>
                  </section>

                  {/* Recently Viewed */}
                  <section className="mb-8">
                    <h3 className="mb-3 text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">
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
                          className="flex w-full items-center justify-between rounded-xl px-[var(--space-sm)] py-[calc(var(--space-xs)+var(--space-2xs))] transition-colors hover:bg-surface-2"
                        >
                          <div className="flex items-center gap-[var(--space-sm)]">
                            <History className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{item.title}</span>
                          </div>
                          <div className="flex items-center gap-[var(--space-sm)]">
                            <span className="text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">
                              {item.type}
                            </span>
                            <span className="text-[var(--type-size-xs)] text-muted-foreground">{item.date}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Trending Tags */}
                  <section>
                    <h3 className="mb-3 text-[var(--type-size-xs)] font-black uppercase tracking-[var(--type-tracking-kicker)] text-muted-foreground">
                      Trending Tags
                    </h3>
                    <div className="flex flex-wrap gap-[var(--space-xs)]">
                      {["Action", "Fantasy", "Romance", "Sci-Fi", "Horror", "Comedy", "Drama"].map((tag) => (
                        <button
                          key={tag}
                          className="flex items-center gap-[calc(var(--space-2xs)*1.5)] rounded-full border border-border-subtle bg-accent-soft px-[var(--space-sm)] py-[calc(var(--space-2xs)*1.5)] text-[var(--type-size-xs)] font-bold text-foreground transition-all hover:border-border-strong hover:bg-surface-elevated"
                        >
                          <Tag className="h-3 w-3 text-[var(--accent)]" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Footer / Shortcuts Info */}
                <div className="border-t border-border-subtle bg-surface-2/50 px-[var(--space-md)] py-[var(--space-sm)] text-[var(--type-size-xs)] text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-[var(--space-md)]">
                      <span className="flex items-center gap-[calc(var(--space-2xs)*1.5)]">
                        <kbd className="rounded border border-border-subtle bg-surface-1 px-[calc(var(--space-2xs)*1.5)] py-[calc(var(--space-2xs)*0.5)] font-sans">↑↓</kbd> Navigate
                      </span>
                      <span className="flex items-center gap-[calc(var(--space-2xs)*1.5)]">
                        <kbd className="rounded border border-border-subtle bg-surface-1 px-[calc(var(--space-2xs)*1.5)] py-[calc(var(--space-2xs)*0.5)] font-sans">↵</kbd> Select
                      </span>
                    </div>
                    <span className="font-black uppercase tracking-[var(--type-tracking-kicker)] opacity-50">Editorial Command Hub</span>
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
