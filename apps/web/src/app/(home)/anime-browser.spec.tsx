import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { graphql, HttpResponse } from 'msw';
import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  afterAll,
  vi,
} from 'vitest';
import type { ReactNode } from 'react';

// Mock dinâmico: `replace` reescreve os searchParams (lidos pelo binding vivo), pra que
// clicar "Buscar"/trocar formato reflita na URL como no app real.
let searchParams = new URLSearchParams();
const replace = vi.fn((url: string) => {
  const qs = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
  searchParams = new URLSearchParams(qs);
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/',
  useSearchParams: () => searchParams,
}));

import { AnimeBrowser } from './anime-browser';

const TEST_ENDPOINT = 'http://localhost/api/anilist';

const page1 = {
  pageInfo: { currentPage: 1, hasNextPage: true },
  media: [
    {
      id: 1,
      title: { romaji: 'Naruto', english: null },
      coverImage: { large: 'n.jpg' },
      averageScore: 80,
      format: 'TV',
      genres: ['Action'],
    },
  ],
};
const page2 = {
  pageInfo: { currentPage: 2, hasNextPage: false },
  media: [
    {
      id: 2,
      title: { romaji: 'Bleach', english: null },
      coverImage: { large: 'b.jpg' },
      averageScore: 75,
      format: 'TV',
      genres: ['Action'],
    },
  ],
};

const server = setupServer(
  graphql.query('AnimeList', ({ variables }) =>
    HttpResponse.json({ data: { Page: variables.page === 1 ? page1 : page2 } }),
  ),
);
beforeAll(() => server.listen());
beforeEach(() => {
  searchParams = new URLSearchParams();
  replace.mockClear();
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('AnimeBrowser', () => {
  it('mostra skeleton e depois a grade', async () => {
    render(<AnimeBrowser endpoint={TEST_ENDPOINT} />, { wrapper });
    expect(screen.getAllByLabelText('Carregando anime').length).toBeGreaterThan(
      0,
    );
    expect(await screen.findByText('Naruto')).toBeInTheDocument();
  });

  it('"Ver mais" acumula a próxima página', async () => {
    render(<AnimeBrowser endpoint={TEST_ENDPOINT} />, { wrapper });
    await screen.findByText('Naruto');
    await userEvent.click(screen.getByRole('button', { name: /ver mais/i }));
    expect(await screen.findByText('Bleach')).toBeInTheDocument();
    expect(screen.getByText('Naruto')).toBeInTheDocument();
  });

  it('mostra o estado vazio quando não há resultados', async () => {
    server.use(
      graphql.query('AnimeList', () =>
        HttpResponse.json({
          data: {
            Page: {
              pageInfo: { currentPage: 1, hasNextPage: false },
              media: [],
            },
          },
        }),
      ),
    );
    render(<AnimeBrowser endpoint={TEST_ENDPOINT} />, { wrapper });
    expect(await screen.findByText('Nada encontrado')).toBeInTheDocument();
  });

  it('mostra erro e "Tentar de novo" refaz a query', async () => {
    let calls = 0;
    server.use(
      graphql.query('AnimeList', () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json(
              { errors: [{ message: 'boom' }] },
              { status: 500 },
            )
          : HttpResponse.json({ data: { Page: page1 } });
      }),
    );
    render(<AnimeBrowser endpoint={TEST_ENDPOINT} />, { wrapper });
    expect(await screen.findByText('Erro ao carregar')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: /tentar de novo/i }),
    );
    expect(await screen.findByText('Naruto')).toBeInTheDocument();
  });

  it('digitar não dispara busca; só o botão "Buscar" dispara', async () => {
    const searches: (string | undefined)[] = [];
    server.use(
      graphql.query('AnimeList', ({ variables }) => {
        searches.push(variables.search as string | undefined);
        return HttpResponse.json({ data: { Page: page1 } });
      }),
    );
    render(<AnimeBrowser endpoint={TEST_ENDPOINT} />, { wrapper });
    await screen.findByText('Naruto');

    const input = screen.getByRole('searchbox', { name: 'Buscar anime' });
    const button = screen.getByRole('button', { name: 'Buscar' });

    // input vazio → botão desabilitado
    expect(button).toBeDisabled();

    // digitar NÃO dispara busca (sem debounce), e habilita o botão
    await userEvent.type(input, 'naruto');
    expect(button).toBeEnabled();
    expect(searches.every((s) => s == null)).toBe(true);

    // clicar "Buscar" dispara a busca com o termo digitado
    await userEvent.click(button);
    await waitFor(() => expect(searches).toContain('naruto'));
  });
});
