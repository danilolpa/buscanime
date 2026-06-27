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

// Mock dinâmico: `replace` simula navegação client-side (filtros/busca).
const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/',
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

// Contagens default (tudo 0): qualquer teste que dispare uma busca também aciona
// AnimeFormatCounts; sem este handler base a request fica sem mock (warning do MSW).
// Os testes que checam badges sobrescrevem com `server.use(...)`.
const zeroCounts = Object.fromEntries(
  ['ALL', 'TV', 'MOVIE', 'TV_SHORT', 'SPECIAL', 'OVA', 'ONA', 'MUSIC'].map(
    (k) => [k, { pageInfo: { total: 0 } }],
  ),
);

const server = setupServer(
  graphql.query('AnimeList', ({ variables }) =>
    HttpResponse.json({ data: { Page: variables.page === 1 ? page1 : page2 } }),
  ),
  graphql.query('AnimeFormatCounts', () =>
    HttpResponse.json({ data: zeroCounts }),
  ),
);
beforeAll(() => server.listen());
beforeEach(() => {
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
  it('renderiza serverListing imediatamente (sem skeleton)', () => {
    render(
      <AnimeBrowser
        endpoint={TEST_ENDPOINT}
        serverListing={{
          items: [
            {
              id: 99,
              title: 'Server Anime',
              coverImage: 's.jpg',
              averageScore: 90,
              format: 'TV',
              genres: ['Action'],
            },
          ],
          pageInfo: { currentPage: 1, hasNextPage: false },
        }}
      />,
      { wrapper },
    );
    expect(screen.getByText('Server Anime')).toBeInTheDocument();
    expect(screen.queryByLabelText('Carregando anime')).not.toBeInTheDocument();
  });

  it('mostra skeleton e depois a grade', async () => {
    render(<AnimeBrowser endpoint={TEST_ENDPOINT} />, { wrapper });
    expect(
      screen.getByRole('searchbox', { name: 'Buscar anime' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'TV Show' })).toBeInTheDocument();
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

  it('× limpa a busca e volta pra lista', async () => {
    render(<AnimeBrowser endpoint={TEST_ENDPOINT} />, { wrapper });
    await screen.findByText('Naruto');
    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Buscar anime' }),
      'naruto',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    const clear = await screen.findByRole('link', { name: 'Limpar busca' });
    await userEvent.click(clear);
    await waitFor(() =>
      expect(
        screen.queryByRole('link', { name: 'Limpar busca' }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('searchbox', { name: 'Buscar anime' })).toHaveValue(
      '',
    );
  });

  it('mostra a contagem por formato durante a busca', async () => {
    server.use(
      graphql.query('AnimeList', () =>
        HttpResponse.json({ data: { Page: page1 } }),
      ),
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
    render(<AnimeBrowser endpoint={TEST_ENDPOINT} />, { wrapper });
    await screen.findByText('Naruto');
    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Buscar anime' }),
      'naruto',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(await screen.findByText('9')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
  });

  it('mostra o estado de rate limit (429) com botão "Tentar de novo"', async () => {
    server.use(
      graphql.query('AnimeList', () =>
        HttpResponse.json(
          { errors: [{ message: 'Too Many Requests' }] },
          { status: 429 },
        ),
      ),
    );
    render(<AnimeBrowser endpoint={TEST_ENDPOINT} />, { wrapper });
    expect(await screen.findByText('Muitas buscas')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /tentar de novo/i }),
    ).toBeInTheDocument();
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
