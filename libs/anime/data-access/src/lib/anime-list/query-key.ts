import type { MediaFormat } from '@buscanime/shared-types';

/**
 * Query key estável para TanStack Query (listagem infinita).
 *
 * Chaves previsíveis permitem prefetch SSR e invalidação correta ao mudar
 * filtro/busca. Usa o mesmo trim que {@link normalizeAnimeListParams}.
 *
 * @param format - Filtro de formato (null = todos)
 * @param search - Termo de busca (null = listagem popular)
 * @returns `['anime-list', format, trimmedSearch]`
 *
 * @see {@link getAnimeListInfiniteQueryOptions}
 */
export function animeListQueryKey(
  format?: MediaFormat,
  search?: string,
): ['anime-list', MediaFormat | null, string | null] {
  const trimmed = search?.trim() ? search.trim() : undefined;
  return ['anime-list', format ?? null, trimmed ?? null];
}
