const DEFAULT_ANILIST_ENDPOINT = 'https://graphql.anilist.co';

/**
 * Retorna a URL upstream da API GraphQL da AniList.
 *
 * Usada pelo transporte SSR (`fetchAnimeListPage` com `transport: 'ssr'`),
 * que precisa de um endpoint absoluto no servidor.
 *
 * @returns URL da AniList. Default: `https://graphql.anilist.co`.
 * Override em testes via env `ANILIST_ENDPOINT`.
 *
 * @see {@link fetchAnimeListPage}
 */
export function getAnilistEndpoint(): string {
  return process.env['ANILIST_ENDPOINT'] ?? DEFAULT_ANILIST_ENDPOINT;
}
