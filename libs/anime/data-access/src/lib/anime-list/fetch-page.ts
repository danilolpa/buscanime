import { print } from 'graphql';
import type { MediaFormat } from '@buscanime/shared-types';
import {
  AnimeListDocument,
  type AnimeListQuery,
  type MediaSort,
} from '../graphql/generated/graphql.js';
import { createAnilistSdk } from '../anilist/client.js';
import { getAnilistEndpoint } from '../anilist/endpoint.js';
import { ANIME_LIST_PER_PAGE } from './constants.js';
import { mapAnimeListQuery } from './map-query.js';
import { normalizeAnimeListParams } from './normalize.js';
import type { AnimeListPageResult } from './types.js';

/**
 * Modo de transporte HTTP para a listagem.
 *
 * - `ssr`: `fetch` nativo → AniList direto (Server Components, Data Cache Next.js)
 * - `proxy`: SDK → `/api/anilist` (browser, jsdom)
 */
export type AnimeListTransport = 'ssr' | 'proxy';

/**
 * Parâmetros de {@link fetchAnimeListPage}.
 */
export interface FetchAnimeListPageParams {
  /** Número da página (1-based) */
  page: number;
  /** Termo de busca */
  search?: string;
  /** Filtro por formato AniList */
  format?: MediaFormat;
  /**
   * Modo de transporte. Default: `ssr` no Node, `proxy` no browser.
   * @see {@link AnimeListTransport}
   */
  transport?: AnimeListTransport;
  /** Test-only: endpoint absoluto para MSW */
  endpoint?: string;
}

/** Escolhe `proxy` se `window` existe, senão `ssr`. */
function defaultTransport(): AnimeListTransport {
  return typeof (globalThis as { window?: unknown }).window !== 'undefined'
    ? 'proxy'
    : 'ssr';
}

/**
 * Fetch via `fetch` nativo → AniList direto (transporte SSR).
 * Usa Data Cache Next.js com `revalidate: 60`.
 */
async function fetchViaSsr(
  page: number,
  trimmed: string | undefined,
  format: MediaFormat | undefined,
  sort: MediaSort[],
): Promise<AnimeListPageResult> {
  const res = await fetch(getAnilistEndpoint(), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      query: print(AnimeListDocument),
      variables: {
        page,
        perPage: ANIME_LIST_PER_PAGE,
        search: trimmed,
        format,
        sort,
      },
    }),
    ...({ next: { revalidate: 60 } } as RequestInit),
  });

  if (!res.ok) {
    const err = new Error(`AniList request failed: ${res.status}`) as Error & {
      status: number;
    };
    err.status = res.status;
    throw err;
  }

  const json = (await res.json()) as { data?: AnimeListQuery };
  if (!json.data) {
    throw new Error('AniList response missing data');
  }

  return mapAnimeListQuery(json.data);
}

/**
 * Fetch via SDK `graphql-request` → `/api/anilist` (transporte proxy).
 */
async function fetchViaProxy(
  page: number,
  trimmed: string | undefined,
  format: MediaFormat | undefined,
  sort: MediaSort[],
  endpoint?: string,
): Promise<AnimeListPageResult> {
  const sdk = createAnilistSdk(endpoint);
  const data = await sdk.AnimeList({
    page,
    perPage: ANIME_LIST_PER_PAGE,
    search: trimmed,
    format,
    sort,
  });
  return mapAnimeListQuery(data);
}

/**
 * Busca uma página da listagem AniList — ponto único de fetch.
 *
 * Unifica dois caminhos de rede numa API só. A UI e o React Query
 * não precisam saber se estão no servidor ou no client.
 *
 * Fluxo: `normalizeAnimeListParams` → transporte → `mapAnimeListQuery`
 *
 * @param params - Página, filtros e modo de transporte
 * @returns Uma página de animes + `pageInfo` para paginação
 *
 * @see {@link getAnimeListInfiniteQueryOptions} — usa esta função como `queryFn`
 * @see {@link getAnilistEndpoint} — endpoint SSR
 * @see {@link createAnilistSdk} — client proxy
 */
export async function fetchAnimeListPage(
  params: FetchAnimeListPageParams,
): Promise<AnimeListPageResult> {
  const { trimmed, format, sort } = normalizeAnimeListParams(
    params.search,
    params.format,
  );
  const transport = params.transport ?? defaultTransport();

  if (transport === 'proxy') {
    return fetchViaProxy(params.page, trimmed, format, sort, params.endpoint);
  }

  return fetchViaSsr(params.page, trimmed, format, sort);
}
