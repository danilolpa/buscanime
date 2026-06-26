'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const DEBOUNCE_MS = 300;

export function useAnimeFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const format = searchParams.get('format') ?? 'ALL';
  const q = searchParams.get('q') ?? '';

  // Input com digitação instantânea (local); sincroniza pra URL via debounce.
  const [text, setText] = useState(q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = useCallback(
    (next: { format?: string; q?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.format !== undefined) {
        if (next.format === 'ALL') params.delete('format');
        else params.set('format', next.format);
      }
      if (next.q !== undefined) {
        if (!next.q.trim()) params.delete('q');
        else params.set('q', next.q);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const setFormat = useCallback(
    (value: string) => commit({ format: value }),
    [commit],
  );

  const onChangeText = useCallback(
    (value: string) => {
      setText(value);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => commit({ q: value }), DEBOUNCE_MS);
    },
    [commit],
  );

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    commit({ q: text });
  }, [commit, text]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { format, q, text, setFormat, onChangeText, flush };
}
