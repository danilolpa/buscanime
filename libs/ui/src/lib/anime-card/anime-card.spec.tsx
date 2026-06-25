import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { it, expect } from 'vitest';
import { AnimeCard } from './anime-card';
import type { Anime } from '@buscanime/shared-types';

const anime: Anime = {
  id: 1,
  title: 'Naruto',
  coverImage: 'n.jpg',
  averageScore: 88,
  format: 'TV',
  genres: ['Action', 'Drama'],
};

it('renderiza capa, título, gêneros e rating', () => {
  render(<AnimeCard anime={anime} />);
  expect(screen.getByRole('img', { name: 'Naruto' })).toBeInTheDocument();
  expect(screen.getByText('Naruto')).toBeInTheDocument();
  expect(screen.getByText('Action')).toBeInTheDocument();
  expect(screen.getByText('88%')).toBeInTheDocument();
});

it('não renderiza rating quando averageScore é null', () => {
  const animeNoScore: Anime = { ...anime, averageScore: null };
  render(<AnimeCard anime={animeNoScore} />);
  expect(screen.queryByText('%')).not.toBeInTheDocument();
});

it('sem violações de a11y', async () => {
  const { container } = render(<AnimeCard anime={anime} />);
  expect(await axe(container)).toHaveNoViolations();
});
