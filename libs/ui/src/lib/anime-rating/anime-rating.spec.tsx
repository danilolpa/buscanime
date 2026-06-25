import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { it, expect } from 'vitest';
import { AnimeRating } from './anime-rating';

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
