import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { graphql, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { useAnimeList } from './use-anime-list.js';

const naruto = {
  id: 1,
  title: { romaji: 'Naruto', english: null },
  coverImage: { large: 'naruto.jpg' },
  averageScore: 80,
  format: 'TV',
  genres: ['Action'],
};
const bleach = {
  id: 2,
  title: { romaji: 'Bleach', english: null },
  coverImage: { large: 'bleach.jpg' },
  averageScore: 75,
  format: 'TV',
  genres: ['Action'],
};

const narutoAnime = {
  id: 1,
  title: 'Naruto',
  coverImage: 'naruto.jpg',
  averageScore: 80,
  format: 'TV',
  genres: ['Action'],
};
const bleachAnime = {
  id: 2,
  title: 'Bleach',
  coverImage: 'bleach.jpg',
  averageScore: 75,
  format: 'TV',
  genres: ['Action'],
};

let lastVariables: Record<string, unknown> | undefined;

const server = setupServer(
  graphql.query('AnimeList', ({ variables }) => {
    lastVariables = variables;
    const isFirst = variables.page === 1;
    return HttpResponse.json({
      data: {
        Page: {
          pageInfo: { currentPage: variables.page, hasNextPage: isFirst },
          media: [isFirst ? naruto : bleach],
        },
      },
    });
  }),
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  lastVariables = undefined;
});
afterAll(() => server.close());

function wrapper({ children }: { children: ReactNode }) {
  // notifyOnChangeProps: 'all' desliga o prop-tracking do observer. Sob renderHook o
  // componente de teste não lê props durante o render, então o tracking ficaria vazio
  // e o re-render após fetchNextPage não dispararia. 'all' garante a notificação.
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, notifyOnChangeProps: 'all' } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

// Endpoint ABSOLUTO: graphql-request/undici rejeita URL relativa em node/jsdom.
const TEST_ENDPOINT = 'http://localhost/api/anilist';

it('retorna a 1ª página normalizada (flatten) e indica hasNextPage', async () => {
  const { result } = renderHook(
    () => useAnimeList({ endpoint: TEST_ENDPOINT }),
    { wrapper },
  );
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.pages[0].items).toEqual([narutoAnime]);
  expect(result.current.hasNextPage).toBe(true);
});

it('fetchNextPage acumula as páginas e encerra quando hasNextPage é false', async () => {
  const { result } = renderHook(
    () => useAnimeList({ endpoint: TEST_ENDPOINT }),
    { wrapper },
  );
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  await act(async () => {
    await result.current.fetchNextPage();
  });
  await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
  const all = result.current.data?.pages.flatMap((p) => p.items);
  expect(all).toEqual([narutoAnime, bleachAnime]);
  expect(result.current.hasNextPage).toBe(false);
});

it('usa SEARCH_MATCH quando há busca e passa search/format às variáveis', async () => {
  const { result } = renderHook(
    () =>
      useAnimeList({ search: 'naruto', format: 'TV', endpoint: TEST_ENDPOINT }),
    { wrapper },
  );
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(lastVariables).toMatchObject({
    search: 'naruto',
    format: 'TV',
    sort: ['SEARCH_MATCH'],
    perPage: 12,
  });
});
