// --- AniList transport ---
export {
  getAnilistEndpoint,
  createAnilistSdk,
  ANILIST_PROXY_ENDPOINT,
  isRateLimitError,
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
