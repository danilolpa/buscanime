import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnimeCard } from './anime-card';
import type { Anime } from '@buscanime/shared-types';

const baseAnime: Anime = {
  id: 1,
  title: 'Naruto Shippuden',
  coverImage: 'https://picsum.photos/seed/naruto/300/400',
  averageScore: 88,
  format: 'TV',
  genres: ['Action', 'Adventure', 'Fantasy'],
};

const meta: Meta<typeof AnimeCard> = {
  title: 'Composites/AnimeCard',
  component: AnimeCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '200px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AnimeCard>;

export const Normal: Story = {
  args: { anime: baseAnime },
};

export const NoScore: Story = {
  name: 'Without Score',
  args: {
    anime: { ...baseAnime, averageScore: null },
  },
};

export const LongTitle: Story = {
  name: 'Long Title',
  args: {
    anime: {
      ...baseAnime,
      title: 'Fullmetal Alchemist: Brotherhood, The Complete Series',
    },
  },
};
