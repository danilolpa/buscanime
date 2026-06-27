import { useInfiniteQuery } from '@tanstack/react-query';
import { getAnimeListInfiniteQueryOptions } from './query-options.js';
import type { UseAnimeListParams } from './types.js';

/** Hook de listagem infinita (filtro, busca, paginação "Ver mais"). */
export function useAnimeList(params: UseAnimeListParams = {}) {
  return useInfiniteQuery(getAnimeListInfiniteQueryOptions(params));
}
