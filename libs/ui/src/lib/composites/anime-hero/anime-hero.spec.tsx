import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { it, expect } from 'vitest';
import { AnimeHero } from './anime-hero';

it('renderiza título como h1, capa e nota', () => {
  render(
    <AnimeHero
      title="Attack on Titan"
      coverImage="https://s4.anilist.co/c.jpg"
      bannerImage="https://s4.anilist.co/b.jpg"
      score={85}
      meta={['TV', '25 eps']}
    />,
  );
  expect(
    screen.getByRole('heading', { level: 1, name: 'Attack on Titan' }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole('img', { name: 'Attack on Titan' }),
  ).toBeInTheDocument();
  expect(screen.getByText('85%')).toBeInTheDocument();
  expect(screen.getByText('TV')).toBeInTheDocument();
});
it('sem violações de a11y', async () => {
  const { container } = render(
    <AnimeHero
      title="X"
      coverImage="https://s4.anilist.co/c.jpg"
      bannerImage={null}
      score={null}
    />,
  );
  expect(await axe(container)).toHaveNoViolations();
});
