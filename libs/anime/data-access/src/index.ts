/**
 * anime-data-access
 *
 * Camada de acesso a dados da AniList: transporte HTTP, mapeamento GraphQL → domínio
 * e hooks React Query. Documentação completa em `libs/anime/data-access/README.md`.
 *
 * @packageDocumentation
 */

// --- AniList transport ---
export {
  getAnilistEndpoint,
  createAnilistSdk,
  ANILIST_PROXY_ENDPOINT,
  isRateLimitError,
  ANILIST_JSON_HEADERS,
  ANILIST_REVALIDATE_SECONDS,
  anilistSsrFetchInit,
} from './lib/anilist/index.js';

// --- Anime list ---
export {
  useAnimeList,
  fetchAnimeListPage,
  getAnimeListInfiniteQueryOptions,
  animeListQueryKey,
  mapAnimeListQuery,
  normalizeAnimeListParams,
  getAnimeListSort,
  toAnime,
  ANIME_LIST_PER_PAGE,
  type AnimeListPageResult,
  type AnimeListQueryParams,
  type UseAnimeListParams,
  type FetchAnimeListPageParams,
  type AnimeListTransport,
} from './lib/anime-list/index.js';

// --- Format counts ---
export {
  useAnimeFormatCounts,
  type FormatCounts,
  type UseAnimeFormatCountsParams,
} from './lib/format-counts/index.js';

// --- Anime detail ---
export { fetchAnimeDetail, toAnimeDetail } from './lib/anime-detail/index.js';
