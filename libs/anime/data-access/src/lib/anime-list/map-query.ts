import type { Anime } from '@buscanime/shared-types';
import type { AnimeListQuery } from '../graphql/generated/graphql.js';
import { toAnime } from './transform.js';
import type { AnimeListPageResult } from './types.js';

/** Mapeia a resposta GraphQL `AnimeList` para o tipo de domínio. */
export function mapAnimeListQuery(data: AnimeListQuery): AnimeListPageResult {
  const items: Anime[] = (data.Page?.media ?? [])
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .map(toAnime);
  return { items, pageInfo: data.Page?.pageInfo ?? null };
}
