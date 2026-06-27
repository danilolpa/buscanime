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

export type AnimeListTransport = 'ssr' | 'proxy';

export interface FetchAnimeListPageParams {
  page: number;
  search?: string;
  format?: MediaFormat;
  /**
   * `ssr`: `fetch` nativo → AniList direto (Server Components / prefetch).
   * `proxy`: SDK → `/api/anilist` (browser / jsdom).
   * Default: `ssr` no server, `proxy` no browser.
   */
  transport?: AnimeListTransport;
  /** Test-only: endpoint absoluto para MSW. */
  endpoint?: string;
}

function defaultTransport(): AnimeListTransport {
  return typeof (globalThis as { window?: unknown }).window !== 'undefined'
    ? 'proxy'
    : 'ssr';
}

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
 * Busca uma página da listagem AniList.
 * Ponto único de transporte — SSR e browser convergem aqui.
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
