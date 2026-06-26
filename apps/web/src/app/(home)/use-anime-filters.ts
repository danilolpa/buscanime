'use client';
import { useCallback, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function useAnimeFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const format = searchParams.get('format') ?? 'ALL';
  const q = searchParams.get('q') ?? '';

  // O input guarda o texto localmente; só vira busca (grava `q` na URL) quando o
  // usuário clica "Buscar"/Enter (submitSearch). Não há busca automática ao digitar.
  const [text, setText] = useState(q);

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

  const onChangeText = useCallback((value: string) => setText(value), []);

  const submitSearch = useCallback(() => commit({ q: text }), [commit, text]);

  return { format, q, text, setFormat, onChangeText, submitSearch };
}
