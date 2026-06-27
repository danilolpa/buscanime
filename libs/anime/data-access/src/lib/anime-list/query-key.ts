import type { MediaFormat } from '@buscanime/shared-types';

/** Query key estável para TanStack Query (listagem infinita). */
export function animeListQueryKey(
  format?: MediaFormat,
  search?: string,
): ['anime-list', MediaFormat | null, string | null] {
  const trimmed = search?.trim() ? search.trim() : undefined;
  return ['anime-list', format ?? null, trimmed ?? null];
}
