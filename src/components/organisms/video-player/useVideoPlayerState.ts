'use client';

import * as React from 'react';
import { readStoredString, writeStoredString } from '@/lib/browser-storage';
import { getDeadMirrors, reportDeadMirror } from '@/lib/store';

interface MirrorOption {
  label: string;
  embed_url: string;
}

interface UseVideoPlayerStateProps {
  mirrors: MirrorOption[];
  defaultUrl: string;
}

const PREFERRED_MIRROR_STORAGE_KEY = 'dwizzy_preferred_mirror';

function readPreferredMirrorLabel(): string | null {
  return readStoredString(PREFERRED_MIRROR_STORAGE_KEY);
}

function writePreferredMirrorLabel(label: string) {
  writeStoredString(PREFERRED_MIRROR_STORAGE_KEY, label);
}

export function useVideoPlayerState({
  mirrors,
  defaultUrl,
}: UseVideoPlayerStateProps) {
  const [internalUrl, setInternalUrl] = React.useState(defaultUrl);
  const [playerKey, setPlayerKey] = React.useState(0);
  const [deadMirrors, setDeadMirrors] = React.useState<string[]>([]);
  const [reportedThisSession, setReportedThisSession] = React.useState<string[]>([]);
  const [autoPlay, setAutoPlay] = React.useState(true);
  const activeUrl = internalUrl;

  React.useEffect(() => {
    const nextDeadMirrors = getDeadMirrors();
    setDeadMirrors(nextDeadMirrors);

    const preferredLabel = readPreferredMirrorLabel();
    if (preferredLabel) {
      const matchingMirror = mirrors.find((mirror) => mirror.label === preferredLabel);
      if (matchingMirror && !nextDeadMirrors.includes(matchingMirror.embed_url)) {
        setInternalUrl(matchingMirror.embed_url);
        return;
      }
    }

    setInternalUrl(defaultUrl);
  }, [defaultUrl, mirrors]);

  const refreshPlayer = React.useCallback(() => {
    setPlayerKey((previous) => previous + 1);
  }, []);

  const handleMirrorChange = React.useCallback(
    (url: string, label: string) => {
      setInternalUrl(url);
      refreshPlayer();
      writePreferredMirrorLabel(label);
    },
    [refreshPlayer],
  );

  const handleReportCurrentMirror = React.useCallback(() => {
    if (!activeUrl) {
      return;
    }

    if (!confirm('Report this mirror as broken/expired?')) {
      return;
    }

    reportDeadMirror(activeUrl);

    setDeadMirrors((previous) => {
      if (previous.includes(activeUrl)) {
        return previous;
      }

      return [...previous, activeUrl];
    });

    setReportedThisSession((previous) => {
      if (previous.includes(activeUrl)) {
        return previous;
      }

      return [...previous, activeUrl];
    });

    const nextDeadMirrors = new Set([...getDeadMirrors(), activeUrl]);
    const nextMirror = mirrors.find(
      (mirror) => !nextDeadMirrors.has(mirror.embed_url) && mirror.embed_url !== activeUrl,
    );

    if (nextMirror) {
      handleMirrorChange(nextMirror.embed_url, nextMirror.label);
    }
  }, [activeUrl, handleMirrorChange, mirrors]);

  const hasReportedCurrentMirror = React.useMemo(
    () => reportedThisSession.includes(activeUrl || ''),
    [activeUrl, reportedThisSession],
  );

  return {
    activeUrl,
    autoPlay,
    deadMirrors,
    hasReportedCurrentMirror,
    playerKey,
    setAutoPlay,
    handleMirrorChange,
    handleReportCurrentMirror,
    refreshPlayer,
  };
}
