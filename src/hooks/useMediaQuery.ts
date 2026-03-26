'use client';

import * as React from 'react';

export function useMediaQuery(query: string, defaultValue = false) {
  const getMatches = React.useCallback(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    return window.matchMedia(query).matches;
  }, [defaultValue, query]);

  const [matches, setMatches] = React.useState(getMatches);

  React.useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    setMatches(mediaQueryList.matches);
    mediaQueryList.addEventListener('change', handleChange);

    return () => {
      mediaQueryList.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}
