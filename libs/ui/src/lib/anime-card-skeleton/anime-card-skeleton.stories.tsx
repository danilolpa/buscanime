import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnimeCardSkeleton, AnimeGridSkeleton } from './anime-card-skeleton';
import { Container } from '../container/container';

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
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
};

export const LoadingGrid: Story = {
  name: 'Loading Grid (12 items)',
  render: () => (
    <Container>
      <AnimeGridSkeleton count={12} />
    </Container>
  ),
};

export const SmallGrid: Story = {
  name: 'Small Grid (4 items)',
  render: () => (
    <Container>
      <AnimeGridSkeleton count={4} />
    </Container>
  ),
};
