import type { Anime, MediaFormat } from '@buscanime/shared-types';

/**
 * Resultado normalizado de uma página da listagem AniList.
 *
 * Retornado por {@link fetchAnimeListPage} e acumulado pelo infinite query.
 */
export type AnimeListPageResult = {
  items: Anime[];
  pageInfo: {
    currentPage: number | null;
    hasNextPage: boolean | null;
  } | null;
};

/**
 * Parâmetros compartilhados entre hook, query options e fetch.
 *
 * Garante que `useAnimeList`, prefetch SSR e testes usem a mesma interface.
 */
export interface AnimeListQueryParams {
  /** Termo de busca (trim aplicado internamente) */
  search?: string;
  /** Filtro por formato AniList (TV, MOVIE, etc.) */
  format?: MediaFormat;
  /**
   * Test-only: endpoint absoluto para MSW.
   * `graphql-request` rejeita URL relativa em jsdom.
   */
  endpoint?: string;
}

/** Alias de {@link AnimeListQueryParams} para o hook `useAnimeList`. */
export type UseAnimeListParams = AnimeListQueryParams;
