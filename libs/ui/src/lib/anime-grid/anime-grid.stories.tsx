import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnimeGrid } from './anime-grid';
import { AnimeCard } from '../anime-card/anime-card';
import type { Anime } from '@buscanime/shared-types';

const makeAnime = (id: number, title: string): Anime => ({
  id,
  title,
  coverImage: `https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx${id}-CXtrrkq96Hiy.jpg`,
  averageScore: 75 + id,
  format: 'TV',
  genres: ['Action', 'Adventure'],
});

const animes: Anime[] = [
  makeAnime(1, 'Naruto'),
  makeAnime(2, 'One Piece'),
  makeAnime(3, 'Bleach'),
  makeAnime(4, 'Dragon Ball Z'),
  makeAnime(5, 'Attack on Titan'),
  makeAnime(6, 'Demon Slayer'),
  makeAnime(7, 'Jujutsu Kaisen'),
  makeAnime(8, 'My Hero Academia'),
];

const meta: Meta<typeof AnimeGrid> = {
  title: 'Composites/AnimeGrid',
  component: AnimeGrid,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AnimeGrid>;

export const Default: Story = {
  render: () => (
    <AnimeGrid>
      {animes.map((anime) => (
        <AnimeCard key={anime.id} anime={anime} />
      ))}
    </AnimeGrid>
  ),
};
