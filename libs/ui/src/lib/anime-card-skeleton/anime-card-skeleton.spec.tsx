import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AnimeCardSkeleton, AnimeGridSkeleton } from './anime-card-skeleton';

describe('AnimeCardSkeleton', () => {
  it('renderiza com aria-busy="true"', () => {
    const { container } = render(<AnimeCardSkeleton />);
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
  });
});

describe('AnimeGridSkeleton', () => {
  it('renderiza 12 skeletons por padrão', () => {
    render(<AnimeGridSkeleton />);
    const items = screen.getAllByRole('article', { hidden: true });
    expect(items).toHaveLength(12);
  });

  it('renderiza N skeletons quando count é passado', () => {
    render(<AnimeGridSkeleton count={4} />);
    const items = screen.getAllByRole('article', { hidden: true });
    expect(items).toHaveLength(4);
  });

  it('skeletons têm aria-busy="true"', () => {
    render(<AnimeGridSkeleton count={2} />);
    const items = screen.getAllByRole('article', { hidden: true });
    items.forEach((item) => {
      expect(item).toHaveAttribute('aria-busy', 'true');
    });
  });
});
