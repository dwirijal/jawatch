'use client';

import * as React from 'react';
import { ExternalLink, Heart, Sparkles } from 'lucide-react';
import { Link } from '@/components/atoms/Link';
import { Paper } from '@/components/atoms/Paper';
import { AuthGateNotice } from '@/components/molecules/AuthGateNotice';
import { useAuthSession } from '@/hooks/useAuthSession';
import { loadRemoteTitleCommunity } from '@/lib/personalization-sync';
import {
  getTitleCommunityComments,
  getTitleCommunityLikes,
  getTitleCommunitySummary,
} from '@/lib/store';
import {
  buildLoginHref,
  CommentThread,
  formatActivityTime,
  formatCount,
  PanelFrame,
  type TitleCommunityPanelProps,
} from './community-panel-shared';

export function TitleCommunityPanel({
  titleId,
  titleLabel,
  titleHref,
  theme,
  units,
  className,
}: TitleCommunityPanelProps) {
  const authSession = useAuthSession();
  const [likes, setLikes] = React.useState(() => getTitleCommunityLikes(titleId, units.map((unit) => unit.id)));
  const [comments, setComments] = React.useState(() => getTitleCommunityComments(titleId, units.map((unit) => unit.id)));
  const [summary, setSummary] = React.useState(() => getTitleCommunitySummary(titleId, units.map((unit) => unit.id)));

  React.useEffect(() => {
    if (authSession.loading) {
      return;
    }

    const unitIds = units.map((unit) => unit.id);
    if (authSession.authenticated) {
      void loadRemoteTitleCommunity(titleId, unitIds)
        .then((snapshot) => {
          setLikes(snapshot.likes);
          setComments(snapshot.comments);
          setSummary(snapshot.summary);
        })
        .catch(() => {
          setLikes(getTitleCommunityLikes(titleId, unitIds));
          setComments(getTitleCommunityComments(titleId, unitIds));
          setSummary(getTitleCommunitySummary(titleId, unitIds));
        });
      return;
    }

    setLikes(getTitleCommunityLikes(titleId, unitIds));
    setComments(getTitleCommunityComments(titleId, unitIds));
    setSummary(getTitleCommunitySummary(titleId, unitIds));
  }, [authSession.authenticated, authSession.loading, titleId, units]);

  const activeUnits = units
    .map((unit) => {
      const unitComments = comments.filter((comment) => comment.unitId === unit.id);
      const unitLikes = likes.filter((like) => like.unitId === unit.id);
      const latestActivityAt = Math.max(unitComments[0]?.timestamp ?? 0, unitLikes[0]?.timestamp ?? 0) || null;

      return {
        ...unit,
        comments: unitComments,
        likeCount: unitLikes.length,
        latestActivityAt,
      };
    })
    .filter((unit) => unit.comments.length > 0 || unit.likeCount > 0)
    .sort((left, right) => (right.latestActivityAt ?? 0) - (left.latestActivityAt ?? 0));

  return (
    <PanelFrame
      title={`Obrolan seputar ${titleLabel}`}
      subtitle="Suka dan komentar dari episode atau chapter dikumpulkan di sini supaya halaman utama tetap enak dibaca."
      theme={theme}
      className={className}
      stats={[
        { label: 'Suka', value: formatCount(summary.likeCount, 'suka') },
        { label: 'Komentar', value: formatCount(summary.commentCount, 'komentar') },
        { label: 'Unit aktif', value: formatCount(summary.activeUnitCount, 'unit') },
      ]}
    >
      {!authSession.authenticated ? (
        <AuthGateNotice
          loginHref={buildLoginHref(titleHref)}
          title="Komentar bisa ikut ke koleksi kamu"
          description="Aktivitas sudah tersimpan lokal di browser ini. Masuk kapan saja supaya suka dan komentar ikut tersimpan ke akun."
          actionLabel="Masuk nanti"
          compact
        />
      ) : null}

      {activeUnits.length > 0 ? (
        <div className="space-y-3">
          {activeUnits.map((unit) => (
            <details
              key={unit.id}
              className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-elevated open:bg-surface-1"
            >
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-4">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">{unit.label}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                    {formatCount(unit.likeCount, 'suka')} • {formatCount(unit.comments.length, 'komentar')} • {formatActivityTime(unit.latestActivityAt)}
                  </p>
                </div>
                <Link href={unit.href} className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">
                  Buka
                </Link>
              </summary>
              <div className="space-y-4 border-t border-border-subtle px-4 py-4">
                {unit.likeCount > 0 ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Heart className="h-4 w-4 fill-current text-rose-400" />
                    {formatCount(unit.likeCount, authSession.authenticated ? 'suka tersinkron' : 'suka lokal')}
                  </div>
                ) : null}
                <CommentThread comments={unit.comments} />
              </div>
            </details>
          ))}
        </div>
      ) : (
        <Paper tone="outline" className="border-dashed border-border-subtle bg-transparent px-5 py-5 text-sm leading-6 text-muted-foreground">
          {authSession.authenticated
            ? 'Belum ada suka atau komentar tersinkron untuk judul ini. Buka episode, chapter, atau halaman film untuk mulai ngobrol.'
            : 'Belum ada suka atau komentar lokal untuk judul ini. Buka episode, chapter, atau halaman film untuk mulai ngobrol.'}
        </Paper>
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        <span>Mau diskusi lebih ramai? Simpan obrolan lokal di sini, lalu lanjut ke Discord.</span>
        <a
          href="https://discord.gg/gu5bgTXxhQ"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-semibold text-foreground transition-colors hover:text-muted-foreground"
        >
          Gabung Discord <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </PanelFrame>
  );
}
