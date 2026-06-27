import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';

import { getAnimeListInfiniteQueryOptions } from 'anime-data-access';

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

  // 1ª página vem do servidor via prefetch + hidratação do React Query: o HTML
  // já chega populado (crawler/LCP) e o client continua o infinite query sem
  // refetch. Um único fetch por render — sem duplicar a página 1.
  if (isSsrListingEnabled()) {
    await queryClient.prefetchInfiniteQuery(
      getAnimeListInfiniteQueryOptions({
        search: initialQ,

        format: toMediaFormat(initialFormat),
      }),
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AnimeBrowser initialFormat={initialFormat} initialQ={initialQ} />
    </HydrationBoundary>
  );
}
