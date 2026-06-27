import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

import {
  fetchAnimeListPage,
  getAnimeListInfiniteQueryOptions,
} from '@buscanime/anime-data-access';

import { isSsrListingEnabled } from './ssr-listing';

import { AnimeBrowser } from './anime-browser';

import { toMediaFormat } from './format-options';

export interface HomeWithDataProps {
  initialFormat: string;

  initialQ: string;
}

export async function HomeWithData({
  initialFormat,

  initialQ,
}: HomeWithDataProps) {
  const queryClient = new QueryClient();

  let serverListing = null;

  const mediaFormat = toMediaFormat(initialFormat);

  if (isSsrListingEnabled()) {
    serverListing = await fetchAnimeListPage({
      page: 1,

      search: initialQ,

      format: mediaFormat,

      transport: 'ssr',
    });

    await queryClient.prefetchInfiniteQuery(
      getAnimeListInfiniteQueryOptions({
        search: initialQ,

        format: mediaFormat,
      }),
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AnimeBrowser
        initialFormat={initialFormat}
        initialQ={initialQ}
        serverListing={serverListing}
      />
    </HydrationBoundary>
  );
}
