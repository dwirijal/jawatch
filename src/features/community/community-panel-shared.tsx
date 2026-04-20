'use client';

import * as React from 'react';
import { Reply } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Paper } from '@/components/atoms/Paper';
import { buildCommentTree } from '@/lib/community';
import { type CommunityComment, type CommunityUnitReference } from '@/lib/store';
import { cn, type ThemeType } from '@/lib/utils';

export type TitleCommunityUnit = {
  id: string;
  label: string;
  href: string;
};

export interface UnitCommunityPanelProps extends CommunityUnitReference {
  theme: ThemeType;
  className?: string;
}

export interface TitleCommunityPanelProps {
  titleId: string;
  titleLabel: string;
  titleHref: string;
  theme: ThemeType;
  units: TitleCommunityUnit[];
  className?: string;
}

export interface VaultCommunitySummaryProps {
  className?: string;
}

export function formatActivityTime(timestamp: number | null): string {
  if (!timestamp) {
    return 'Belum ada aktivitas';
  }

  const deltaMs = Date.now() - timestamp;
  const deltaMinutes = Math.max(1, Math.floor(deltaMs / 60000));

  if (deltaMinutes < 60) {
    return `${deltaMinutes} menit lalu`;
  }

  const deltaHours = Math.floor(deltaMinutes / 60);
  if (deltaHours < 24) {
    return `${deltaHours} jam lalu`;
  }

  const deltaDays = Math.floor(deltaHours / 24);
  if (deltaDays < 7) {
    return `${deltaDays} hari lalu`;
  }

  return new Intl.DateTimeFormat('id-ID', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(timestamp);
}

export function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function buildLoginHref(nextPath: string): string {
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export function CommentThread({
  comments,
  onReply,
}: {
  comments: CommunityComment[];
  onReply?: (comment: CommunityComment) => void;
}) {
  const tree = React.useMemo(() => buildCommentTree(comments), [comments]);

  if (tree.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {tree.map((comment) => (
        <Paper key={comment.id} tone="muted" shadow="sm" className="space-y-4 border-border-subtle bg-surface-1 p-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              <span>{comment.authorName}</span>
              <span className="h-1 w-1 rounded-full bg-border-strong" />
              <span>{formatActivityTime(comment.timestamp)}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">{comment.content}</p>
            {onReply ? (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto px-0 py-0 text-xs text-muted-foreground"
                onClick={() => onReply(comment)}
              >
                <Reply className="h-3.5 w-3.5" /> Balas
              </Button>
            ) : null}
          </div>

          {comment.replies.length > 0 ? (
            <div className="space-y-3 border-l border-border-subtle pl-4">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                    <span>{reply.authorName}</span>
                    <span className="h-1 w-1 rounded-full bg-border-strong" />
                    <span>{formatActivityTime(reply.timestamp)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{reply.content}</p>
                </div>
              ))}
            </div>
          ) : null}
        </Paper>
      ))}
    </div>
  );
}

export function PanelFrame({
  title,
  subtitle,
  stats,
  theme,
  className,
  children,
}: {
  title: string;
  subtitle: string;
  stats: Array<{ label: string; value: string }>;
  theme: ThemeType;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('space-y-5', className)} data-theme={theme}>
      <Paper tone="muted" shadow="sm" className="space-y-5 border-border-subtle bg-surface-1 p-5 md:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">Komunitas</p>
            <div className="space-y-1">
              <h2 className="font-[var(--font-heading)] text-2xl font-bold tracking-[-0.05em] text-foreground">{title}</h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-elevated px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-sm font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {children}
      </Paper>
    </section>
  );
}
