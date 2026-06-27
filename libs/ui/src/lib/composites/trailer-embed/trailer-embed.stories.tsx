import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrailerEmbed } from './trailer-embed';

const meta: Meta<typeof TrailerEmbed> = {
  title: 'Composites/TrailerEmbed',
  component: TrailerEmbed,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TrailerEmbed>;

export const Normal: Story = {
  args: {
    youtubeId: 'dQw4w9WgXcQ',
    thumbnail: 'https://picsum.photos/seed/trailer/640/360',
    title: 'Trailer',
  },
};

export const NoTrailer: Story = {
  args: {
    youtubeId: null,
    thumbnail: null,
  },
};
