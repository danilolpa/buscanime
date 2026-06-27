import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AnimeGrid } from './anime-grid';

describe('AnimeGrid', () => {
  it('renderiza N filhos', () => {
    render(
      <AnimeGrid>
        <div data-testid="card">Card 1</div>
        <div data-testid="card">Card 2</div>
        <div data-testid="card">Card 3</div>
      </AnimeGrid>,
    );
    expect(screen.getAllByTestId('card')).toHaveLength(3);
  });

  it('renderiza sem filhos', () => {
    const { container } = render(<AnimeGrid />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
