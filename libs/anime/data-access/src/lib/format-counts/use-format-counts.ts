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

/**
 * Totais de resultados por formato para o termo de busca atual.
 *
 * Chaves: `ALL`, `TV`, `MOVIE`, `TV_SHORT`, `SPECIAL`, `OVA`, `ONA`, `MUSIC`.
 * Usado pelos badges nos chips de filtro durante a busca.
 */
export type FormatCounts = Record<(typeof FORMAT_KEYS)[number], number>;

/** Parâmetros de {@link useAnimeFormatCounts}. */
export interface UseAnimeFormatCountsParams {
  /** Termo de busca — query só dispara quando não vazio após trim */
  search?: string;
  /** Test-only: endpoint absoluto para MSW */
  endpoint?: string;
}

/**
 * Hook que busca contagens por formato para a busca ativa.
 *
 * Dispara a query `AnimeFormatCounts` (8 sub-queries com `pageInfo.total`).
 * Só executa quando há termo de busca — na listagem popular os badges
 * não são necessários.
 *
 * @param params - Termo de busca e endpoint opcional para testes
 * @returns Resultado padrão do TanStack Query com `data: FormatCounts`
 *
 * @see {@link createAnilistSdk}
 */
export function useAnimeFormatCounts({
  search,
  endpoint,
}: UseAnimeFormatCountsParams = {}) {
  const trimmed = search?.trim() ? search.trim() : undefined;
  return useQuery({
    queryKey: ['anime-format-counts', trimmed ?? null],
    enabled: Boolean(trimmed),
    // 8 sub-queries (perPage 50) por busca — evita refazer no remount do mesmo termo.
    staleTime: 60_000,
    queryFn: async (): Promise<FormatCounts> => {
      const sdk = createAnilistSdk(endpoint);
      const data = await sdk.AnimeFormatCounts({ search: trimmed });
      return Object.fromEntries(
        FORMAT_KEYS.map((k) => [k, data[k]?.pageInfo?.total ?? 0]),
      ) as FormatCounts;
    },
  });
}
