'use client';

import * as React from 'react';
import { ExternalLink, Heart, MessageSquare, Reply } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Paper } from '@/components/atoms/Paper';
import { AuthGateNotice } from '@/components/molecules/AuthGateNotice';
import { useAuthSession } from '@/hooks/useAuthSession';
import { createCommunityCommentId } from '@/lib/community';
import {
  loadRemoteUnitCommunity,
  saveRemoteUnitComment,
  toggleRemoteUnitLike,
} from '@/lib/personalization-sync';
import {
  getUnitCommentCount,
  getUnitComments,
  getUnitLikeCount,
  isUnitLiked,
  saveUnitComment,
  toggleUnitLike,
  type CommunityComment,
} from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  buildLoginHref,
  CommentThread,
  formatActivityTime,
  formatCount,
  PanelFrame,
  type UnitCommunityPanelProps,
} from './community-panel-shared';

export function UnitCommunityPanel({
  titleId,
  titleLabel,
  unitId,
  unitLabel,
  unitHref,
  mediaType,
  theme,
  className,
}: UnitCommunityPanelProps) {
  const authSession = useAuthSession();
  const [liked, setLiked] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(0);
  const [comments, setComments] = React.useState<CommunityComment[]>([]);
  const [draft, setDraft] = React.useState('');
  const [replyTarget, setReplyTarget] = React.useState<CommunityComment | null>(null);
  const [replyDraft, setReplyDraft] = React.useState('');

  const reloadLocal = React.useEffectEvent(() => {
    setLiked(isUnitLiked(titleId, unitId));
    setLikeCount(getUnitLikeCount(titleId, unitId));
    setComments(getUnitComments(titleId, unitId));
  });

  const reloadRemote = React.useEffectEvent(async () => {
    const snapshot = await loadRemoteUnitCommunity(titleId, unitId);
    setLiked(snapshot.liked);
    setLikeCount(snapshot.likeCount);
    setComments(snapshot.comments);
  });

  React.useEffect(() => {
    if (authSession.loading) {
      return;
    }

    if (authSession.authenticated) {
      void reloadRemote().catch(() => {
        reloadLocal();
      });
      return;
    }

    reloadLocal();
  }, [authSession.authenticated, authSession.loading, titleId, unitId]);

  const submitComment = async (content: string, parentId?: string | null) => {
    const normalizedParentId = parentId
      ? comments.find((comment) => comment.id === parentId)?.parentId ?? parentId
      : null;

    if (authSession.authenticated) {
      const trimmedContent = content.trim();
      if (!trimmedContent) {
        return;
      }

      try {
        const snapshot = await saveRemoteUnitComment({
          id: createCommunityCommentId(),
          titleId,
          titleLabel,
          unitId,
          unitLabel,
          unitHref,
          mediaType,
          authorName: authSession.user?.displayName || 'Pengguna',
          content: trimmedContent,
          parentId: normalizedParentId,
          timestamp: Date.now(),
        });

        setLiked(snapshot.liked);
        setLikeCount(snapshot.likeCount);
        setComments(snapshot.comments);
      } catch {
        await reloadRemote().catch(() => {
          reloadLocal();
        });
      }

      return;
    }

    const saved = saveUnitComment({
      titleId,
      titleLabel,
      unitId,
      unitLabel,
      unitHref,
      mediaType,
      authorName: authSession.user?.displayName || 'Tamu',
      content,
      parentId: normalizedParentId,
    });

    if (!saved) {
      return;
    }

    reloadLocal();
  };

  return (
    <PanelFrame
      title={`Bahas ${unitLabel}`}
      subtitle="Suka dan komentar tersimpan dulu di browser ini, lalu ikut ke akun saat kamu masuk."
      theme={theme}
      className={className}
      stats={[
        { label: 'Suka', value: formatCount(likeCount, 'suka') },
        { label: 'Komentar', value: formatCount(getUnitCommentCount(titleId, unitId), 'komentar') },
        { label: 'Terbaru', value: formatActivityTime(comments[0]?.timestamp ?? null) },
      ]}
    >
      {!authSession.authenticated ? (
        <AuthGateNotice
          loginHref={buildLoginHref(unitHref)}
          title="Komentar tersimpan lokal dulu"
          description="Tinggalkan suka dan komentar sekarang. Masuk nanti supaya obrolan ini ikut tersimpan ke akun."
          actionLabel="Masuk nanti"
          compact
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant={liked ? theme : 'outline'}
          size="sm"
          onClick={async () => {
            if (authSession.authenticated) {
              try {
                const snapshot = await toggleRemoteUnitLike({
                  titleId,
                  titleLabel,
                  unitId,
                  unitLabel,
                  unitHref,
                  mediaType,
                });
                setLiked(snapshot.liked);
                setLikeCount(snapshot.likeCount);
                setComments(snapshot.comments);
              } catch {
                await reloadRemote().catch(() => {
                  reloadLocal();
                });
              }
              return;
            }

            toggleUnitLike({
              titleId,
              titleLabel,
              unitId,
              unitLabel,
              unitHref,
              mediaType,
            });
            reloadLocal();
          }}
        >
          <Heart className={cn('h-4 w-4', liked ? 'fill-current' : '')} />
          {liked ? 'Disukai' : 'Suka'}
        </Button>

        <a
          href="https://discord.gg/gu5bgTXxhQ"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          Lanjut di Discord <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="space-y-3">
        <label className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Komentar</span>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={4}
            placeholder={`Tulis komentar soal ${unitLabel.toLowerCase()}...`}
            className="min-h-28 w-full rounded-[var(--radius-md)] border border-border-subtle bg-surface-elevated px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-border-strong"
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs leading-5 text-muted-foreground">
            Balasan dibuat satu tingkat supaya obrolan tetap mudah dibaca.
          </p>
          <Button
            type="button"
            variant={theme}
            size="sm"
            onClick={async () => {
              await submitComment(draft);
              setDraft('');
            }}
          >
            <MessageSquare className="h-4 w-4" /> Kirim komentar
          </Button>
        </div>
      </div>

      {replyTarget ? (
        <Paper tone="outline" className="space-y-3 border-border-subtle bg-transparent p-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Membalas {replyTarget.authorName}</p>
            <p className="line-clamp-2 text-sm text-muted-foreground">{replyTarget.content}</p>
          </div>
          <textarea
            value={replyDraft}
            onChange={(event) => setReplyDraft(event.target.value)}
            rows={3}
            placeholder="Tulis balasan..."
            className="min-h-24 w-full rounded-[var(--radius-md)] border border-border-subtle bg-surface-elevated px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-border-strong"
          />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setReplyTarget(null);
                setReplyDraft('');
              }}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant={theme}
              size="sm"
              onClick={async () => {
                await submitComment(replyDraft, replyTarget.id);
                setReplyDraft('');
                setReplyTarget(null);
              }}
            >
              <Reply className="h-4 w-4" /> Kirim balasan
            </Button>
          </div>
        </Paper>
      ) : null}

      {comments.length > 0 ? (
        <CommentThread comments={comments} onReply={(comment) => setReplyTarget(comment)} />
      ) : (
        <Paper tone="outline" className="border-dashed border-border-subtle bg-transparent px-5 py-5 text-sm leading-6 text-muted-foreground">
          {authSession.authenticated
            ? 'Belum ada komentar tersinkron. Jadi yang pertama kasih reaksi singkat.'
            : 'Belum ada komentar lokal. Jadi yang pertama kasih reaksi singkat.'}
        </Paper>
      )}
    </PanelFrame>
  );
}
