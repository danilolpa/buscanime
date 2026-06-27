import type { Anime, MediaFormat } from '@buscanime/shared-types';

/** Resultado normalizado de uma página da listagem. */
export type AnimeListPageResult = {
  items: Anime[];
  pageInfo: {
    currentPage: number | null;
    hasNextPage: boolean | null;
  } | null;
};

/** Parâmetros compartilhados entre hook, query options e fetch. */
export interface AnimeListQueryParams {
  search?: string;
  format?: MediaFormat;
  /** Test-only: endpoint absoluto pro MSW (graphql-request rejeita URL relativa em jsdom). */
  endpoint?: string;
}

export type UseAnimeListParams = AnimeListQueryParams;
