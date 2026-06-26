import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import Page from '../src/app/page';

// A página compõe Header + AnimeBrowser (client) + Footer. Mockamos as
// dependências de runtime do AnimeBrowser pra um smoke test offline:
// - next/navigation: o AnimeBrowser usa useRouter/useSearchParams via useAnimeFilters.
// - useAnimeList: evita rede (a página real usa o proxy /api/anilist).
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
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
}));

describe('Page', () => {
  it('compõe a estrutura da página (header + footer)', () => {
    render(<Page />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
