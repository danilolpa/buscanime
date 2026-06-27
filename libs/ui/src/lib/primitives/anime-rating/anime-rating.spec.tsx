import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { it, expect, describe } from 'vitest';
import { AnimeRating } from './anime-rating';

describe('AnimeRating', () => {
  it.each([42, 70, 88])('renderiza %i%% e a faixa de cor correta', (value) => {
    render(<AnimeRating value={value} />);
    expect(screen.getByText(`${value}%`)).toBeInTheDocument();
  });

  it('sem violações de a11y nas faixas', async () => {
    for (const v of [42, 70, 88]) {
      const { container } = render(<AnimeRating value={v} />);
      expect(await axe(container)).toHaveNoViolations();
    }
  });

  it.each([
    [49, 'bg-score-low'],
    [50, 'bg-score-mid'],
    [80, 'bg-score-mid'],
    [81, 'bg-score-high'],
  ] as const)(
    'value %i recebe a classe de faixa %s',
    (value, expectedClass) => {
      const { container } = render(<AnimeRating value={value} />);
      expect(container.firstChild).toHaveClass(expectedClass);
    },
  );
});
