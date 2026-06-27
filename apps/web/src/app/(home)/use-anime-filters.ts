'use client';
import { useCallback, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { buildAnimeListUrl } from './anime-list-url';

export interface UseAnimeFiltersOptions {
  initialFormat?: string;
  initialQ?: string;
}

export function useAnimeFilters({
  initialFormat = 'ALL',
  initialQ = '',
}: UseAnimeFiltersOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();

  const [format, setFormatState] = useState(initialFormat);
  const [q, setQState] = useState(initialQ);
  const [text, setText] = useState(initialQ);

  const commit = useCallback(
    (next: { format?: string; q?: string }) => {
      const nextFormat = next.format ?? format;
      const nextQ = next.q !== undefined ? next.q : q;

      setFormatState(nextFormat);
      setQState(nextQ);
      if (next.q !== undefined) setText(nextQ);

      router.replace(buildAnimeListUrl(pathname, nextFormat, nextQ), {
        scroll: false,
      });
    },
    [router, pathname, format, q],
  );

  const setFormat = useCallback(
    (value: string) => commit({ format: value }),
    [commit],
  );

  const onChangeText = useCallback((value: string) => setText(value), []);

  const submitSearch = useCallback(() => commit({ q: text }), [commit, text]);

  const clearSearch = useCallback(() => {
    setText('');
    commit({ q: '' });
  }, [commit]);

  return {
    format,
    q,
    text,
    setFormat,
    onChangeText,
    submitSearch,
    clearSearch,
  };
}
