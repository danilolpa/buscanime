import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Primitives/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const TextLine: Story = {
  name: 'Text line',
  args: { width: 240, height: 16 },
};

export const Headline: Story = {
  args: { width: 320, height: 24 },
};

export const Block: Story = {
  args: { width: 320, height: 200 },
};

export const Avatar: Story = {
  name: 'Avatar (rounded)',
  args: { width: 48, height: 48, rounded: true },
};

export const CardGroup: Story = {
  name: 'Card group',
  render: () => (
    <div className="flex flex-col gap-3 w-64">
      <Skeleton height={180} />
      <Skeleton height={16} width="80%" />
      <Skeleton height={12} width="60%" />
    </div>
  ),
};
