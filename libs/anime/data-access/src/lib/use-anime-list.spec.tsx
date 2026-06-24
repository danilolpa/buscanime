import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { graphql, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { useAnimeList } from './use-anime-list.js';

const server = setupServer(
  graphql.query('AnimeList', () =>
    HttpResponse.json({
      data: {
        Page: {
          media: [
            {
              id: 1,
              title: { romaji: 'Naruto', english: null },
              coverImage: { large: 'naruto.jpg' },
              averageScore: 80,
              format: 'TV',
              genres: ['Action'],
            },
          ],
        },
      },
    }),
  ),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// Endpoint ABSOLUTO: graphql-request/undici rejeita URL relativa em node/jsdom.
// O MSW intercepta por nome de operação ('AnimeList'), independente da URL.
const TEST_ENDPOINT = 'http://localhost/api/anilist';

it('retorna a lista de Anime normalizada', async () => {
  const { result } = renderHook(() => useAnimeList(TEST_ENDPOINT), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toEqual([
    {
      id: 1,
      title: 'Naruto',
      coverImage: 'naruto.jpg',
      averageScore: 80,
      format: 'TV',
      genres: ['Action'],
    },
  ]);
});
