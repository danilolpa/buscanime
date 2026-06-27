import type { MediaFormat } from '@buscanime/shared-types';
import type { MediaSort } from '../graphql/generated/graphql.js';

/** Sort da AniList: busca ativa usa relevância; listagem popular usa popularidade. */
export function getAnimeListSort(search?: string): MediaSort[] {
  const trimmed = search?.trim() ? search.trim() : undefined;
  return trimmed ? ['SEARCH_MATCH'] : ['POPULARITY_DESC'];
}

/** Normaliza search/format e deriva o sort antes de chamar a API. */
export function normalizeAnimeListParams(
  search?: string,
  format?: MediaFormat,
) {
  const trimmed = search?.trim() ? search.trim() : undefined;
  return { trimmed, format, sort: getAnimeListSort(search) };
}
