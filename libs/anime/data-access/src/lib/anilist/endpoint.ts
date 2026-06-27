const DEFAULT_ANILIST_ENDPOINT = 'https://graphql.anilist.co';

/**
 * URL upstream da AniList GraphQL API.
 * Usado pelo transporte SSR (`fetch` nativo). Override via `ANILIST_ENDPOINT` em testes.
 */
export function getAnilistEndpoint(): string {
  return process.env['ANILIST_ENDPOINT'] ?? DEFAULT_ANILIST_ENDPOINT;
}
