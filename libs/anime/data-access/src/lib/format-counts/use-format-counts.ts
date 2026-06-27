import { useQuery } from '@tanstack/react-query';
import { createAnilistSdk } from '../anilist/client.js';

const FORMAT_KEYS = [
  'ALL',
  'TV',
  'MOVIE',
  'TV_SHORT',
  'SPECIAL',
  'OVA',
  'ONA',
  'MUSIC',
] as const;

export type FormatCounts = Record<(typeof FORMAT_KEYS)[number], number>;

export interface UseAnimeFormatCountsParams {
  search?: string;
  /** Test-only: endpoint absoluto pro MSW (graphql-request rejeita URL relativa em jsdom). */
  endpoint?: string;
}

/**
 * Contagens por formato para a busca ativa (badges nos filtros).
 * Só dispara quando há termo de busca (`search` não vazio).
 */
export function useAnimeFormatCounts({
  search,
  endpoint,
}: UseAnimeFormatCountsParams = {}) {
  const trimmed = search?.trim() ? search.trim() : undefined;
  return useQuery({
    queryKey: ['anime-format-counts', trimmed ?? null],
    enabled: Boolean(trimmed),
    queryFn: async (): Promise<FormatCounts> => {
      const sdk = createAnilistSdk(endpoint);
      const data = await sdk.AnimeFormatCounts({ search: trimmed });
      return Object.fromEntries(
        FORMAT_KEYS.map((k) => [k, data[k]?.pageInfo?.total ?? 0]),
      ) as FormatCounts;
    },
  });
}
