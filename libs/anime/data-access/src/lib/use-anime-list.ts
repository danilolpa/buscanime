import { useQuery } from '@tanstack/react-query';
import type { Anime } from '@buscanime/shared-types';
import { createAnilistSdk } from './anilist-client.js';
import { toAnime } from './transform.js';

export function useAnimeList(endpoint?: string) {
  return useQuery({
    queryKey: ['anime-list'],
    queryFn: async (): Promise<Anime[]> => {
      const sdk = createAnilistSdk(endpoint);
      const data = await sdk.AnimeList({ page: 1, perPage: 20 });
      return (data.Page?.media ?? [])
        .filter((m): m is NonNullable<typeof m> => Boolean(m))
        .map(toAnime);
    },
  });
}
