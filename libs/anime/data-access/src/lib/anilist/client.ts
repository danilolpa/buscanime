import { GraphQLClient } from 'graphql-request';
import { getSdk } from '../graphql/generated/graphql.js';

/**
 * Caminho do Route Handler Next.js que faz proxy para a AniList.
 *
 * No browser não chamamos a AniList direto (CORS, rate limit).
 * O SDK aponta para este path relativo, resolvido contra `location.origin`.
 */
export const ANILIST_PROXY_ENDPOINT = '/api/anilist';

/**
 * Converte path relativo em URL absoluta no browser.
 * Em Node/jsdom sem `location`, retorna o path relativo (testes passam URL absoluta).
 */
function resolveEndpoint(endpoint?: string): string {
  if (endpoint) return endpoint;
  const origin = (globalThis as { location?: { origin?: string } }).location
    ?.origin;
  if (origin) {
    return new URL(ANILIST_PROXY_ENDPOINT, origin).toString();
  }
  return ANILIST_PROXY_ENDPOINT;
}

/**
 * Cria o SDK tipado para queries AniList via `graphql-request`.
 *
 * Centraliza a criação do client GraphQL — evita repetir `GraphQLClient` + `getSdk`
 * em cada hook/fetch.
 *
 * @param endpoint - URL absoluta opcional. Default: `/api/anilist` resolvido no browser.
 *   Em testes com MSW, passe URL absoluta (`http://localhost/api/anilist`) porque
 *   jsdom rejeita path relativo.
 *
 * @see {@link fetchAnimeListPage} — usa este SDK no transporte `proxy`
 * @see {@link useAnimeFormatCounts}
 */
export function createAnilistSdk(endpoint?: string) {
  return getSdk(new GraphQLClient(resolveEndpoint(endpoint)));
}
