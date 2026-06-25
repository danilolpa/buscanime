import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnimeRating } from './anime-rating';

const meta: Meta<typeof AnimeRating> = {
  title: 'Primitives/AnimeRating',
  component: AnimeRating,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AnimeRating>;

export const Low: Story = {
  name: 'Low (< 50) — rose',
  args: { value: 42 },
};

export const Mid: Story = {
  name: 'Mid (50–80) — yellow',
  args: { value: 70 },
};

export const High: Story = {
  name: 'High (> 80) — teal',
  args: { value: 88 },
};
