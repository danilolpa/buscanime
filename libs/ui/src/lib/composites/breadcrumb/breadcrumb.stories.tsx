import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumb } from './breadcrumb';

const meta: Meta<typeof Breadcrumb> = {
  title: 'Composites/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

export const HomeAnime: Story = {
  name: 'Home / Anime',
  args: {
    items: [{ label: 'Home', href: '/' }, { label: 'Anime' }],
  },
};

export const ThreeLevels: Story = {
  name: 'Three levels',
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Buscar', href: '/search' },
      { label: 'Naruto' },
    ],
  },
};
