import { useInfiniteQuery } from '@tanstack/react-query';
import { getAnimeListInfiniteQueryOptions } from './query-options.js';
import type { UseAnimeListParams } from './types.js';

/**
 * Hook de listagem infinita para componentes client.
 *
 * Encapsula paginação "Ver mais" e re-fetch ao mudar filtros/busca.
 * Usa {@link getAnimeListInfiniteQueryOptions} internamente.
 *
 * @param params - Filtros de busca e formato ({@link UseAnimeListParams})
 * @returns Objeto padrão do TanStack Infinite Query (`data.pages`, `fetchNextPage`,
 *   `hasNextPage`, `isLoading`, etc.)
 *
 * @example
 * ```tsx
 * const { data, fetchNextPage, hasNextPage } = useAnimeList({ search, format });
 * const animes = data?.pages.flatMap((p) => p.items) ?? [];
 * ```
 */
export function useAnimeList(params: UseAnimeListParams = {}) {
  return useInfiniteQuery(getAnimeListInfiniteQueryOptions(params));
}
