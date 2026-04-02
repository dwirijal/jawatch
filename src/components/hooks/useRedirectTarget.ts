'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

export function useRedirectTarget() {
  const pathname = usePathname() || '/';
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    const nextSearch = window.location.search;
    setSearch((current) => (current === nextSearch ? current : nextSearch));
  }, []);

  return React.useMemo(() => {
    return search ? `${pathname}${search}` : pathname;
  }, [pathname, search]);
}
