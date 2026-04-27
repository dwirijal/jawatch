type MediaQueryChangeHandler = (matches: boolean) => void;

type LegacyMediaQueryList = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
};

export function getMediaQueryMatches(query: string): boolean {
  return window.matchMedia(query).matches;
}

export function subscribeToMediaQuery(query: string, onChange: MediaQueryChangeHandler) {
  const mediaQuery = window.matchMedia(query);
  const handleChange = (event: MediaQueryListEvent) => {
    onChange(event.matches);
  };

  onChange(mediaQuery.matches);

  if ('addEventListener' in mediaQuery) {
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }

  const legacyMediaQuery = mediaQuery as LegacyMediaQueryList;
  legacyMediaQuery.addListener?.(handleChange);
  return () => legacyMediaQuery.removeListener?.(handleChange);
}
