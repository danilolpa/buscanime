import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnimeCardSkeleton, AnimeGridSkeleton } from './anime-card-skeleton';

const meta: Meta<typeof AnimeCardSkeleton> = {
  title: 'Composites/AnimeCardSkeleton',
  component: AnimeCardSkeleton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AnimeCardSkeleton>;

export const Single: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: '200px' }}>
        <Story />
      </div>
    ),
  ],
};

export const LoadingGrid: Story = {
  name: 'Loading Grid (12 items)',
  render: () => <AnimeGridSkeleton count={12} />,
};

export const SmallGrid: Story = {
  name: 'Small Grid (4 items)',
  render: () => <AnimeGridSkeleton count={4} />,
};
