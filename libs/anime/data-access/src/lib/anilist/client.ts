import { GraphQLClient } from 'graphql-request';
import { getSdk } from '../graphql/generated/graphql.js';

/** O browser fala com o Route Handler, não com a AniList direto. */
export const ANILIST_PROXY_ENDPOINT = '/api/anilist';

/**
 * Resolve o endpoint do SDK `graphql-request`.
 * URLs relativas são convertidas para absolutas usando `location.origin` no browser.
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
 * SDK tipado para queries AniList via proxy `/api/anilist`.
 * Usar no browser e em testes com MSW (`endpoint` absoluto).
 */
export function createAnilistSdk(endpoint?: string) {
  return getSdk(new GraphQLClient(resolveEndpoint(endpoint)));
}
