'use client';

import * as React from 'react';
import { BadgeAlert, Check, X, LogOut, UserRound } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Link } from '@/components/atoms/Link';
import { ModalClose, ModalContent, ModalRoot, ModalTitle } from '@/components/atoms/Modal';
import { useRedirectTarget } from '@/components/hooks/useRedirectTarget';
import { useUIStore } from '@/store/useUIStore';
import { ACCOUNT_PANEL_META, MOBILE_MENU_GROUPS } from '@/lib/navigation';
import { useAuthSession } from '@/components/hooks/useAuthSession';
import { cn } from '@/lib/utils';
import { buildLoginUrl, buildLogoutRequest } from '@/lib/auth-gateway';

export function MobileMenuPanel() {
  const pathname = usePathname() || '/';
  const { isSidebarOpen, setSidebarOpen } = useUIStore();
  const session = useAuthSession();
  const redirectTarget = useRedirectTarget();
  const logoutRequest = buildLogoutRequest(redirectTarget);
  const returnTo = logoutRequest.body.get('returnTo') ?? '/';
  const origin = logoutRequest.body.get('origin') ?? '';
  const previousPathname = React.useRef(pathname);

  React.useEffect(() => {
    if (previousPathname.current !== pathname && isSidebarOpen) {
      setSidebarOpen(false);
    }

    previousPathname.current = pathname;
  }, [pathname, isSidebarOpen, setSidebarOpen]);

  return (
    <ModalRoot open={isSidebarOpen} onOpenChange={setSidebarOpen}>
        <ModalContent className="inset-y-0 right-0 left-auto flex w-full max-w-sm translate-x-0 -translate-y-0 flex-col border-l border-border-subtle bg-background shadow-2xl" overlayClassName="z-[180] bg-black/70">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-500">Navigate</p>
              <ModalTitle className="mt-1 text-xl font-black uppercase tracking-[0.12em] text-white">
                dwizzyWEEB
              </ModalTitle>
            </div>
            <ModalClose className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 p-2 text-zinc-400 transition-colors hover:bg-surface-elevated hover:text-white">
              <X className="h-5 w-5" />
            </ModalClose>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6">
            <div className="space-y-8">
              {MOBILE_MENU_GROUPS.map((group) => (
                <section key={group.key} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <group.icon className="h-4 w-4 text-zinc-400" />
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">{group.label}</h2>
                  </div>
                  <p className="text-xs text-zinc-500">{group.description}</p>
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const itemActive = Boolean(item.href && group.isActive?.(pathname, item.href));

                      return item.href ? (
                        <ModalClose asChild key={item.label}>
                          <Link
                            href={item.href}
                            className={cn(
                              'block rounded-[var(--radius-sm)] border px-4 py-3 transition-colors',
                              itemActive
                                ? 'border-border-subtle bg-surface-1'
                                : 'border-transparent hover:border-border-subtle hover:bg-surface-1'
                            )}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-black uppercase tracking-[0.16em] text-white">{item.label}</p>
                              {itemActive ? (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-zinc-700 bg-white text-zinc-950">
                                  <Check className="h-3 w-3" />
                                </span>
                              ) : null}
                            </div>
                            <p className={cn('mt-1 text-xs', itemActive ? 'text-zinc-300' : 'text-zinc-500')}>{item.description}</p>
                          </Link>
                        </ModalClose>
                      ) : (
                        <div key={item.label} className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 px-4 py-3 opacity-60">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-black uppercase tracking-[0.16em] text-zinc-200">{item.label}</p>
                            <span className="rounded-full border border-border-subtle px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                              Soon
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-zinc-500">{item.description}</p>
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))}

              {session.authenticated && session.user ? (
                <section className="space-y-3 border-t border-border-subtle pt-6">
                  <div className="flex items-center gap-2">
                    <BadgeAlert className="h-4 w-4 text-zinc-400" />
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">NSFW</h2>
                  </div>
                  <p className="text-xs text-zinc-500">Adult-tagged titles across series, movies, and comics.</p>
                  <ModalClose asChild>
                    <Link
                      href="/nsfw"
                      className="block rounded-[var(--radius-sm)] border border-transparent px-4 py-3 transition-colors hover:border-border-subtle hover:bg-surface-1"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black uppercase tracking-[0.16em] text-white">Open NSFW hub</p>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">Visible only while you are signed in.</p>
                    </Link>
                  </ModalClose>
                </section>
              ) : null}

              <section className="space-y-3 border-t border-border-subtle pt-6">
                <div className="flex items-center gap-2">
                  <ACCOUNT_PANEL_META.icon className="h-4 w-4 text-zinc-400" />
                  <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">{ACCOUNT_PANEL_META.label}</h2>
                </div>
                <p className="text-xs text-zinc-500">{ACCOUNT_PANEL_META.description}</p>

                {session.loading ? (
                  <div className="h-16 animate-pulse rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1" />
                ) : !session.authenticated || !session.user ? (
                  <ModalClose asChild>
                    <Link
                      href={buildLoginUrl(redirectTarget)}
                      className="flex items-center justify-between rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-4 py-4 transition-colors hover:bg-surface-elevated"
                    >
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.16em] text-white">Login</p>
                        <p className="mt-1 text-xs text-zinc-500">Sign in for bookmark and history sync.</p>
                      </div>
                      <UserRound className="h-5 w-5 text-zinc-400" />
                    </Link>
                  </ModalClose>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface-1 px-4 py-4">
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-white">{session.user.displayName}</p>
                      <p className="mt-1 text-xs text-zinc-500">Signed in with {session.user.provider ?? 'discord'}</p>
                    </div>
                    <form action={logoutRequest.url} method={logoutRequest.method}>
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <input type="hidden" name="origin" value={origin} />
                      <button
                        type="submit"
                        className="flex w-full items-center justify-between rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 px-4 py-4 text-left transition-colors hover:bg-surface-1"
                      >
                        <div>
                          <p className="text-sm font-black uppercase tracking-[0.16em] text-white">Logout</p>
                          <p className="mt-1 text-xs text-zinc-500">Return to this app after sign out.</p>
                        </div>
                        <LogOut className="h-5 w-5 text-zinc-400" />
                      </button>
                    </form>
                    <div className="rounded-[var(--radius-sm)] border border-border-subtle bg-surface-2 px-4 py-4 opacity-70">
                      <p className="text-sm font-black uppercase tracking-[0.16em] text-zinc-200">Account settings</p>
                      <p className="mt-1 text-xs text-zinc-500">Coming later at account.dwizzy.my.id.</p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </ModalContent>
    </ModalRoot>
  );
}
