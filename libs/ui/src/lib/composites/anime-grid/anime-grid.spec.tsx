import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
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

  it('sem violações de a11y', async () => {
    const { container } = render(
      <AnimeGrid>
        <div>Card 1</div>
        <div>Card 2</div>
      </AnimeGrid>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
