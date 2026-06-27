import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { graphql, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { useAnimeFormatCounts } from '../use-format-counts.js';

const server = setupServer(
  graphql.query('AnimeFormatCounts', () =>
    HttpResponse.json({
      data: {
        ALL: { pageInfo: { total: 20 } },
        TV: { pageInfo: { total: 9 } },
        MOVIE: { pageInfo: { total: 11 } },
        TV_SHORT: { pageInfo: { total: 0 } },
        SPECIAL: { pageInfo: { total: 0 } },
        OVA: { pageInfo: { total: 0 } },
        ONA: { pageInfo: { total: 0 } },
        MUSIC: { pageInfo: { total: 0 } },
      },
    }),
  ),
);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, notifyOnChangeProps: 'all' } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const TEST_ENDPOINT = 'http://localhost/api/anilist';

it('retorna a contagem por formato', async () => {
  const { result } = renderHook(
    () => useAnimeFormatCounts({ search: 'naruto', endpoint: TEST_ENDPOINT }),
    { wrapper },
  );
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toEqual({
    ALL: 20,
    TV: 9,
    MOVIE: 11,
    TV_SHORT: 0,
    SPECIAL: 0,
    OVA: 0,
    ONA: 0,
    MUSIC: 0,
  });
});

it('não dispara quando não há busca', () => {
  const { result } = renderHook(
    () => useAnimeFormatCounts({ endpoint: TEST_ENDPOINT }),
    { wrapper },
  );
  expect(result.current.fetchStatus).toBe('idle');
  expect(result.current.data).toBeUndefined();
});
