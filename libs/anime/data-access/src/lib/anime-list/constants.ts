/**
 * Quantidade de animes por página na listagem.
 *
 * Único lugar que define o page size — mantém SSR, infinite query
 * e query GraphQL (`AnimeList`) alinhados.
 */
export const ANIME_LIST_PER_PAGE = 12;
