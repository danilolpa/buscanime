import type { Anime } from 'shared-types';
import type { AnimeListQuery } from '../graphql/generated/graphql.js';
import { toAnime } from './transform.js';
import type { AnimeListPageResult } from './types.js';

/**
 * Mapeia a resposta GraphQL `AnimeList` para o tipo de domínio.
 *
 * Ponto único de transformação GraphQL → domínio após o fetch.
 * Tanto transporte SSR quanto proxy passam por aqui.
 *
 * @param data - Resposta bruta da query `AnimeList`
 * @returns `{ items: Anime[]; pageInfo }` consumível pela UI e React Query
 *
 * @see {@link toAnime} — mapeia cada item individual
 * @see {@link fetchAnimeListPage}
 */
export function mapAnimeListQuery(data: AnimeListQuery): AnimeListPageResult {
  const items: Anime[] = (data.Page?.media ?? [])
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .map(toAnime);
  return { items, pageInfo: data.Page?.pageInfo ?? null };
}
