import { GraphQLClient } from 'graphql-request';
import { getSdk } from './generated/graphql.js';

/** O browser fala com o Route Handler, não com a AniList direto. */
export const ANILIST_PROXY_ENDPOINT = '/api/anilist';

export function createAnilistSdk(endpoint: string = ANILIST_PROXY_ENDPOINT) {
  return getSdk(new GraphQLClient(endpoint));
}
