import { useInfiniteQuery } from '@tanstack/react-query';
import type { Anime, MediaFormat } from '@buscanime/shared-types';
import type { MediaSort } from './generated/graphql.js';
import { createAnilistSdk } from './anilist-client.js';
import { toAnime } from './transform.js';

const PER_PAGE = 12;

export interface UseAnimeListParams {
  search?: string;
  format?: MediaFormat;
  /** Test-only: endpoint absoluto pro MSW (graphql-request rejeita URL relativa em jsdom). */
  endpoint?: string;
}

export function useAnimeList({
  search,
  format,
  endpoint,
}: UseAnimeListParams = {}) {
  const trimmed = search?.trim() ? search.trim() : undefined;
  const sort: MediaSort[] = trimmed ? ['SEARCH_MATCH'] : ['POPULARITY_DESC'];

  return useInfiniteQuery({
    queryKey: ['anime-list', format ?? null, trimmed ?? null],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const sdk = createAnilistSdk(endpoint);
      const data = await sdk.AnimeList({
        page: pageParam,
        perPage: PER_PAGE,
        search: trimmed,
        format,
        sort,
      });
      const items: Anime[] = (data.Page?.media ?? [])
        .filter((m): m is NonNullable<typeof m> => Boolean(m))
        .map(toAnime);
      return { items, pageInfo: data.Page?.pageInfo ?? null };
    },
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      lastPage.pageInfo?.hasNextPage ? lastPageParam + 1 : undefined,
  });
}
