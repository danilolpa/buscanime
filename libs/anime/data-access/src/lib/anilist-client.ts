import { GraphQLClient } from 'graphql-request';
import { getSdk } from './generated/graphql.js';

/** O browser fala com o Route Handler, não com a AniList direto. */
export const ANILIST_PROXY_ENDPOINT = '/api/anilist';

/**
 * graphql-request faz `new URL(endpoint)` internamente, que rejeita URL relativa
 * (tanto no browser quanto em node/jsdom). Quando nenhum endpoint absoluto é passado,
 * resolvemos o proxy relativo contra a origin atual pra produzir uma URL absoluta.
 *
 * Acessamos a origin via `globalThis` (e não `window`) porque a lib é tipada só com
 * `types: ["node"]` — sem o lib DOM, `window` não existe no typecheck.
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

export function createAnilistSdk(endpoint?: string) {
  return getSdk(new GraphQLClient(resolveEndpoint(endpoint)));
}
