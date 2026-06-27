import { print } from 'graphql';
import type { AnimeDetail } from '@buscanime/shared-types';
import {
  AnimeDetailDocument,
  type AnimeDetailQuery,
} from '../graphql/generated/graphql.js';
import { getAnilistEndpoint } from '../anilist/endpoint.js';
import { toAnimeDetail } from './transform.js';

/** SSR fetch: goes through Next's `fetch` (Data Cache + dedup with generateMetadata). */
export async function fetchAnimeDetail(
  id: number,
): Promise<AnimeDetail | null> {
  const res = await fetch(getAnilistEndpoint(), {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      query: print(AnimeDetailDocument),
      variables: { id },
    }),
    // cast like fetchViaSsr — the lib's tsconfig (types: ["node"]) lacks Next's fetch augmentation
    ...({ next: { revalidate: 3600 } } as RequestInit), // detail pages rarely change; 1h ISR cache
  });

  // AniList returns 404 for a non-existent Media id — that's "not found", not an error.
  if (res.status === 404) return null;

  if (!res.ok) {
    const err = new Error(`AniList request failed: ${res.status}`) as Error & {
      status: number;
    };
    err.status = res.status;
    throw err;
  }

  const json = (await res.json()) as { data?: AnimeDetailQuery };
  if (!json.data) {
    throw new Error('AniList response missing data'); // mirror fetchViaSsr — surface GraphQL-layer failures
  }
  const media = json.data.Media;
  return media ? toAnimeDetail(media) : null;
}
