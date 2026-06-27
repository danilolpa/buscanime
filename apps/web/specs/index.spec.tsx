import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import Page from '../src/app/page';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/',
}));

vi.mock('@buscanime/anime-data-access', () => ({
  useAnimeList: () => ({
    data: {
      pages: [{ items: [], pageInfo: { currentPage: 1, hasNextPage: false } }],
    },
    isLoading: false,
    isError: false,
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
  }),
  useAnimeFormatCounts: () => ({ data: undefined }),
  getAnimeListInfiniteQueryOptions: vi.fn(),
}));

vi.mock('../src/app/(home)/home-with-data', () => ({
  HomeWithData: () => <div data-testid="home-with-data" />,
}));

describe('Page', () => {
  it('compõe a estrutura da página (header + footer)', async () => {
    const ui = await Page({ searchParams: Promise.resolve({}) });
    render(
      <QueryClientProvider client={new QueryClient()}>
        {ui}
      </QueryClientProvider>,
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
