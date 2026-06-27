import type { MediaFormat } from 'shared-types';
import type { MediaSort } from '../graphql/generated/graphql.js';

/**
 * Deriva o `MediaSort` enviado à AniList conforme o contexto da listagem.
 *
 * - Com termo de busca → `SEARCH_MATCH` (relevância)
 * - Sem busca → `POPULARITY_DESC` (populares)
 *
 * @param search - Termo de busca opcional (não precisa estar trimado)
 */
export function getAnimeListSort(search?: string): MediaSort[] {
  const trimmed = search?.trim() ? search.trim() : undefined;
  return trimmed ? ['SEARCH_MATCH'] : ['POPULARITY_DESC'];
}

/**
 * Normaliza parâmetros de listagem antes de qualquer chamada à API.
 *
 * Garante que SSR, React Query e query key usem os mesmos valores efetivos
 * (trim na busca, sort correto). Sem isso, prefetch no servidor e refetch
 * no client poderiam divergir.
 *
 * @param search - Termo de busca (string vazia vira `undefined` após trim)
 * @param format - Filtro de formato AniList
 * @returns `{ trimmed, format, sort }` prontos para fetch e cache key
 *
 * @see {@link fetchAnimeListPage}
 * @see {@link animeListQueryKey}
 */
export function normalizeAnimeListParams(
  search?: string,
  format?: MediaFormat,
) {
  const trimmed = search?.trim() ? search.trim() : undefined;
  return { trimmed, format, sort: getAnimeListSort(search) };
}
