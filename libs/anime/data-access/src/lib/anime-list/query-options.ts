import { infiniteQueryOptions } from '@tanstack/react-query';
import { fetchAnimeListPage } from './fetch-page.js';
import { normalizeAnimeListParams } from './normalize.js';
import { animeListQueryKey } from './query-key.js';
import type { AnimeListQueryParams } from './types.js';

/**
 * Opções TanStack Query para a listagem infinita.
 *
 * Separa configuração do TanStack Query do hook React. Permite prefetch
 * no servidor com as mesmas opções que o client usa na hidratação
 * (`HydrationBoundary`).
 *
 * Configuração:
 * - `queryKey` via {@link animeListQueryKey}
 * - `queryFn` → {@link fetchAnimeListPage} (incrementa `pageParam`)
 * - `getNextPageParam` → próxima página se `hasNextPage`
 * - `staleTime: 60_000` (alinha com revalidate SSR)
 *
 * @param params - Filtros de busca e formato
 *
 * @see {@link useAnimeList} — consome estas opções
 */
export function getAnimeListInfiniteQueryOptions(
  params: AnimeListQueryParams = {},
) {
  const { trimmed, format } = normalizeAnimeListParams(
    params.search,
    params.format,
  );

  return infiniteQueryOptions({
    queryKey: animeListQueryKey(format, trimmed),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchAnimeListPage({
        page: pageParam,
        search: params.search,
        format: params.format,
        endpoint: params.endpoint,
      }),
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.pageInfo?.hasNextPage ? lastPageParam + 1 : undefined,
    staleTime: 60_000,
  });
}
